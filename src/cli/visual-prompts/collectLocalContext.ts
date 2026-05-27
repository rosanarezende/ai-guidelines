import { execFileSync } from "node:child_process";
import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";
import { ContextTarget } from "./ContextTarget.js";

/**
 * Sempre execFileSync com args array — nunca string interpolada via shell.
 * Refnames vindos de `gh pr view` (controlados pelo upstream do PR) entram
 * como dados em argv, não como tokens de shell. Fecha CWE-78 (command
 * injection) mesmo no caminho aparentemente "controlado" — refspec como
 * `; rm -rf .` numa branch maliciosa não é interpretado.
 */

export interface CollectContextOptions {
  readonly repoRoot: string;
  readonly fs: WorkflowFileSystem;
}

/**
 * Coleta determinística de evidência bruta de contexto local com base no alvo.
 * Sem IA, sem parsing de AST ou heurísticas semânticas — puramente best-effort.
 */
export function collectLocalContext(target: ContextTarget, options: CollectContextOptions): string {
  try {
    if (target.kind === "unknown") {
      return "";
    }

    if (target.kind === "pr") {
      return collectPrContext(target.number, options);
    }

    if (target.kind === "spec") {
      return collectSpecContext(target.identifier, options);
    }
  } catch {
    // Fail-graceful: se tudo falhar, retorna string vazia
    return "";
  }
  return "";
}

function collectPrContext(prNumber: number, options: CollectContextOptions): string {
  const lines: string[] = [];
  lines.push(`### PR #${prNumber} Evidence (Deterministic)`);

  let prData: { title: string; body: string; headRefName: string; baseRefName: string } | null =
    null;

  try {
    // Executa gh pr view com timeout de 3 segundos para evitar travamentos
    const stdout = execFileSync(
      "gh",
      ["pr", "view", String(prNumber), "--json", "title,body,headRefName,baseRefName"],
      {
        cwd: options.repoRoot,
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 3000,
      }
    ).toString("utf-8");

    prData = JSON.parse(stdout);
  } catch {
    // Silencia se gh falhar
  }

  if (prData) {
    lines.push(`**Title**: ${prData.title}`);
    lines.push(`**Branches**: ${prData.headRefName} -> ${prData.baseRefName}`);
    lines.push("");
    lines.push("**PR Body**:");
    lines.push(prData.body || "(Empty body)");
    lines.push("");

    // Tenta coletar logs do Git usando as branches do PR
    if (prData.headRefName && prData.baseRefName) {
      try {
        const gitLog = execFileSync(
          "git",
          [
            "log",
            `origin/${prData.baseRefName}..origin/${prData.headRefName}`,
            "--oneline",
            "-n",
            "10",
          ],
          {
            cwd: options.repoRoot,
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 2000,
          }
        ).toString("utf-8");
        if (gitLog.trim()) {
          lines.push("**Git Log (PR commits)**:");
          lines.push(gitLog.trim());
          lines.push("");
        }
      } catch {
        // Tenta localmente sem origin/ se falhar (ex. offline)
        try {
          const gitLogLocal = execFileSync(
            "git",
            ["log", `${prData.baseRefName}..${prData.headRefName}`, "--oneline", "-n", "10"],
            {
              cwd: options.repoRoot,
              stdio: ["ignore", "pipe", "ignore"],
              timeout: 2000,
            }
          ).toString("utf-8");
          if (gitLogLocal.trim()) {
            lines.push("**Git Log (PR commits local)**:");
            lines.push(gitLogLocal.trim());
            lines.push("");
          }
        } catch {
          // Ignora falhas de git log
        }
      }

      try {
        const gitDiff = execFileSync(
          "git",
          ["diff", `origin/${prData.baseRefName}...origin/${prData.headRefName}`, "--stat"],
          {
            cwd: options.repoRoot,
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 2000,
          }
        ).toString("utf-8");
        if (gitDiff.trim()) {
          lines.push("**Diff Stat (PR changes)**:");
          lines.push(gitDiff.trim());
          lines.push("");
        }
      } catch {
        try {
          const gitDiffLocal = execFileSync(
            "git",
            ["diff", `${prData.baseRefName}...${prData.headRefName}`, "--stat"],
            {
              cwd: options.repoRoot,
              stdio: ["ignore", "pipe", "ignore"],
              timeout: 2000,
            }
          ).toString("utf-8");
          if (gitDiffLocal.trim()) {
            lines.push("**Diff Stat (PR changes local)**:");
            lines.push(gitDiffLocal.trim());
            lines.push("");
          }
        } catch {
          // Ignora falhas de git diff
        }
      }
    }
  } else {
    // Se o gh falhar por completo, tentamos coletar dados locais do HEAD atual como fallback best-effort
    lines.push("(Note: GitHub CLI evidence not available or offline)");
    try {
      const gitLog = execFileSync("git", ["log", "-n", "5", "--oneline"], {
        cwd: options.repoRoot,
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 2000,
      }).toString("utf-8");
      if (gitLog.trim()) {
        lines.push("**Recent Git Log (Fallback)**:");
        lines.push(gitLog.trim());
        lines.push("");
      }
    } catch {}

    try {
      const gitDiff = execFileSync("git", ["diff", "HEAD~1", "--stat"], {
        cwd: options.repoRoot,
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 2000,
      }).toString("utf-8");
      if (gitDiff.trim()) {
        lines.push("**Diff Stat HEAD~1 (Fallback)**:");
        lines.push(gitDiff.trim());
        lines.push("");
      }
    } catch {}
  }

  return lines.join("\n").trim();
}

function collectSpecContext(identifier: string, options: CollectContextOptions): string {
  const fs = options.fs;
  let specDir: string | null = null;
  let slug = "";

  if (fs.directoryExists(".governance/specs")) {
    const dirs = fs.listDirectory(".governance/specs");
    const found = dirs.find((d) => d === identifier || d.startsWith(`${identifier}-`));
    if (found) {
      specDir = `.governance/specs/${found}`;
      slug = found;
    }
  }

  if (!specDir && fs.directoryExists(".specify/specs")) {
    const dirs = fs.listDirectory(".specify/specs");
    const found = dirs.find((d) => d === identifier || d.startsWith(`${identifier}-`));
    if (found) {
      specDir = `.specify/specs/${found}`;
      slug = found;
    }
  }

  if (!specDir) {
    return "";
  }

  const lines: string[] = [];
  lines.push(`### Spec ${slug} Evidence (Deterministic)`);
  lines.push("");

  // 1. state.yml — pequeno; contextualiza stage/gate atual
  const statePath = `${specDir}/state.yml`;
  if (fs.fileExists(statePath)) {
    try {
      const stateContent = fs.readTextFile(statePath).trim();
      if (stateContent) {
        lines.push("#### state.yml");
        lines.push("```yaml");
        lines.push(stateContent);
        lines.push("```");
        lines.push("");
      }
    } catch {}
  }

  // 2. spec.md — objetivo e resultado esperado (narrativa curada, ~40-80 linhas)
  // Para até a primeira seção de escopo/critérios: concentra o "porquê" da spec.
  // tasks.md é execução; spec.md é o contrato de valor — muito mais útil para before/after.
  const specMdPath = `${specDir}/spec.md`;
  if (fs.fileExists(specMdPath)) {
    try {
      const specMdLines = fs.readTextFile(specMdPath).split(/\r?\n/);
      // Para antes da primeira seção que não é objetivo/resultado
      // Para na primeira seção de escopo/critérios — não usar `---` como stop
      // porque spec.md tem `---` como separador entre metadados e objetivo,
      // antes da seção de escopo (que é o stop real desejado).
      const stopPatterns = [/^## 📦/, /^## ✅ Crit/, /^## 🗺/, /^## Rollout/];
      let endIdx = Math.min(specMdLines.length, 120);
      for (let i = 5; i < specMdLines.length && i < 140; i++) {
        if (stopPatterns.some((p) => p.test(specMdLines[i]))) {
          endIdx = i;
          break;
        }
      }
      const excerpt = specMdLines.slice(0, endIdx).join("\n").trim();
      if (excerpt) {
        lines.push("#### spec.md (objetivo e resultado esperado)");
        lines.push("```markdown");
        lines.push(excerpt);
        lines.push("```");
        lines.push("");
      }
    } catch {}
  }

  // 3. decision-brief.md — apenas seções "✅ Gate fechado" (resumos curados por bloco)
  // O decision-brief completo tem milhares de linhas de prosa de governança.
  // As seções Gate fechado são os resumos concisos do que foi entregue — a fonte certa
  // para extrair sintomas/capacidades antes/depois.
  const dbPath = `${specDir}/decision-brief.md`;
  if (fs.fileExists(dbPath)) {
    try {
      const dbLines = fs.readTextFile(dbPath).split(/\r?\n/);
      // Encontra a primeira seção "✅ Gate fechado"
      let gateStart = -1;
      for (let i = 0; i < dbLines.length; i++) {
        if (dbLines[i].startsWith("## ✅ Gate fechado")) {
          gateStart = i;
          break;
        }
      }
      if (gateStart >= 0) {
        const gateSummary = dbLines
          .slice(gateStart, gateStart + 250)
          .join("\n")
          .trim();
        if (gateSummary) {
          lines.push(
            "#### decision-brief.md (seções ✅ Gate fechado — resumos de entrega por bloco)"
          );
          lines.push("```markdown");
          lines.push(gateSummary);
          lines.push("```");
          lines.push("");
        }
      }
    } catch {}
  }

  // 4. CHANGELOG.md — seção de versão completa que menciona esta spec
  // Em vez de linha a linha, extrai o bloco inteiro da versão relevante
  // para dar contexto das entregas agrupadas.
  const changelogPath = "CHANGELOG.md";
  if (fs.fileExists(changelogPath)) {
    try {
      const changelogLines = fs.readTextFile(changelogPath).split(/\r?\n/);
      // Mapeia seções de versão [start, end)
      const sections: Array<{ start: number; end: number }> = [];
      for (let i = 0; i < changelogLines.length; i++) {
        if (changelogLines[i].startsWith("## [")) {
          if (sections.length > 0) sections[sections.length - 1].end = i;
          sections.push({ start: i, end: changelogLines.length });
        }
      }
      // Encontra a primeira seção que menciona o identifier ou slug
      const idLower = identifier.toLowerCase();
      const slugLower = slug.toLowerCase();
      for (const sec of sections) {
        const sectionText = changelogLines.slice(sec.start, sec.end).join("\n").toLowerCase();
        if (sectionText.includes(idLower) || (slugLower && sectionText.includes(slugLower))) {
          const excerpt = changelogLines.slice(sec.start, Math.min(sec.end, sec.start + 80));
          const excerptText = excerpt.join("\n").trim();
          if (excerptText) {
            lines.push("#### CHANGELOG.md (seção da versão que entrega esta spec)");
            lines.push("```markdown");
            lines.push(excerptText);
            if (sec.end - sec.start > 80) lines.push("...");
            lines.push("```");
            lines.push("");
          }
          break;
        }
      }
    } catch {}
  }

  // tasks.md e NEXT.md intencionalmente excluídos:
  // tasks.md = checklist de execução (não é value story)
  // NEXT.md = trabalho diferido (irrelevante para before/after de valor entregue)

  return lines.join("\n").trim();
}

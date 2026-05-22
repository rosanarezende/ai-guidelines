import { execSync } from "node:child_process";
import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";
import { ContextTarget } from "./ContextTarget.js";

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
    const stdout = execSync(`gh pr view ${prNumber} --json title,body,headRefName,baseRefName`, {
      cwd: options.repoRoot,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 3000,
    }).toString("utf-8");

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
        const gitLog = execSync(
          `git log origin/${prData.baseRefName}..origin/${prData.headRefName} --oneline -n 10`,
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
          const gitLogLocal = execSync(
            `git log ${prData.baseRefName}..${prData.headRefName} --oneline -n 10`,
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
        const gitDiff = execSync(
          `git diff origin/${prData.baseRefName}...origin/${prData.headRefName} --stat`,
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
          const gitDiffLocal = execSync(
            `git diff ${prData.baseRefName}...${prData.headRefName} --stat`,
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
      const gitLog = execSync(`git log -n 5 --oneline`, {
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
      const gitDiff = execSync(`git diff HEAD~1 --stat`, {
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

  // Leitura linear de state.yml
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

  // Leitura linear de tasks.md
  const tasksPath = `${specDir}/tasks.md`;
  if (fs.fileExists(tasksPath)) {
    try {
      const tasksContent = fs.readTextFile(tasksPath).trim();
      if (tasksContent) {
        lines.push("#### tasks.md");
        lines.push("```markdown");
        lines.push(tasksContent);
        lines.push("```");
        lines.push("");
      }
    } catch {}
  }

  // Leitura linear de NEXT.md
  const nextPath = `${specDir}/NEXT.md`;
  if (fs.fileExists(nextPath)) {
    try {
      const nextContent = fs.readTextFile(nextPath).trim();
      if (nextContent) {
        lines.push("#### NEXT.md");
        lines.push("```markdown");
        lines.push(nextContent);
        lines.push("```");
        lines.push("");
      }
    } catch {}
  }

  // Leitura linear de decision-brief.md (Bruta, linear e direta)
  const dbPath = `${specDir}/decision-brief.md`;
  if (fs.fileExists(dbPath)) {
    try {
      const dbContent = fs.readTextFile(dbPath).trim();
      if (dbContent) {
        lines.push("#### decision-brief.md");
        lines.push("```markdown");
        lines.push(dbContent);
        lines.push("```");
        lines.push("");
      }
    } catch {}
  }

  // Slicing simples de CHANGELOG.md na raiz do repositório
  const changelogPath = "CHANGELOG.md";
  if (fs.fileExists(changelogPath)) {
    try {
      const changelogContent = fs.readTextFile(changelogPath);
      const changelogLines = changelogContent.split(/\r?\n/);
      // Filtra linhas que contenham o identifier ou slug da spec
      const matched = changelogLines.filter((l) => {
        const lower = l.toLowerCase();
        return lower.includes(identifier) || (slug && lower.includes(slug.toLowerCase()));
      });
      if (matched.length > 0) {
        lines.push("#### CHANGELOG.md Relevant Excerpts");
        lines.push("```markdown");
        for (const ml of matched.slice(0, 15)) {
          lines.push(ml);
        }
        if (matched.length > 15) {
          lines.push("...");
        }
        lines.push("```");
        lines.push("");
      }
    } catch {}
  }

  return lines.join("\n").trim();
}

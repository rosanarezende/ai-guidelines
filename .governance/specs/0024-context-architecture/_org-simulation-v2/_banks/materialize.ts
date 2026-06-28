// Materializa as projeções em arquivos Markdown (boards visualizáveis) — o "snapshot derivado".
// É DERIVADO (regenerável da fonte), não autoridade: cada arquivo carrega o aviso GERADO.
import fs from "node:fs";
import path from "node:path";
import { SIM_ROOT } from "./io.ts";
import type { RepoProjection, GovernanceProjection } from "./types.ts";

const OUT_DIR = path.join(SIM_ROOT, "_banks", "_out");
const GEN_NOTE =
  "> **GERADO pelo banco** (`node _banks/run.ts`) — NÃO EDITAR. Projeção DERIVADA, regenerável da fonte.";

function write(name: string, lines: string[]): string {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, name);
  fs.writeFileSync(file, lines.join("\n") + "\n");
  return path.relative(SIM_ROOT, file).replaceAll(path.sep, "/");
}

/** Board do banco de um REPO. */
export function materializeRepoBank(p: RepoProjection): string {
  const lines = [`# Banco do repo (GERADO) — ${p.repo}`, "", GEN_NOTE, "", "## Explorations", ""];
  if (p.explorations.length === 0) lines.push("- (sem explorations)");
  for (const w of p.explorations) {
    const facts = [
      w.status,
      w.fate ? `fate ${w.fate}` : null,
      w.answers ? `answers \`${w.answers}\`` : null,
    ]
      .filter((x): x is string => x !== null)
      .join(" · ");
    lines.push(`- **${w.ref}** — ${facts}`);
    if (w.verdict) lines.push(`  - verdict: "${w.verdict}"`);
    if (w.promotedOutput) lines.push(`  - promovido → \`${w.promotedOutput}\` (POC durável)`);
  }
  return write(`repo.${p.repo}.md`, lines);
}

/** Board do banco de GOVERNANÇA (o dashboard da intent). */
export function materializeGovernanceBank(g: GovernanceProjection, repos: string[]): string {
  const lines = [
    `# Board (GERADO) — ${g.intent}: ${g.title}`,
    "",
    GEN_NOTE,
    "",
    `Consome as projeções dos repos: ${repos.join(", ")} (banco→banco).`,
    "",
    "## Open-questions (respondida ≠ resolvida)",
    "",
  ];
  for (const q of g.questions) {
    const state = q.resolved
      ? "RESOLVED ✅"
      : q.answered
        ? `answered · decisão ${q.decision}`
        : "open";
    lines.push(`- **${q.id}** — ${state}${q.answeredBy ? ` · ← \`${q.answeredBy}\`` : ""}`);
    if (q.verdict) lines.push(`  - verdict: "${q.verdict}"`);
  }
  lines.push("", "## Contracts", "");
  for (const c of g.contracts) {
    lines.push(
      `- **${c.name}**: ${c.known ? "KNOWN ✅" : "pending"} (${c.awaits ? `awaits ${c.awaits}` : "t0"})`
    );
  }
  lines.push("", "## Breaks-into (plano por status — DERIVADO)", "");
  for (const [status, refs] of Object.entries(g.breaksInto)) {
    lines.push(`- **${status}**: ${refs.length > 0 ? refs.join(", ") : "(nenhum)"}`);
  }
  return write(`governance.${g.intent}.md`, lines);
}

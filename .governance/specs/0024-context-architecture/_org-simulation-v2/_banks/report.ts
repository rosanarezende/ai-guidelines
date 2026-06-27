// Renderização (separada da lógica). Só formata e imprime — não deriva nada.
import type { RepoProjection, GovernanceProjection } from "./types.ts";

function header(title: string): void {
  console.log(`\n══ ${title} ══`);
}

export function reportRepoBank(p: RepoProjection): void {
  header(`BANCO DO REPO · ${p.repo}   (deriva só os arquivos DELE)`);
  if (p.explorations.length === 0) {
    console.log("  (sem explorations)");
    return;
  }
  for (const w of p.explorations) {
    const facts = [
      w.status,
      w.fate ? `fate ${w.fate}` : null,
      w.answers ? `answers ${w.answers}` : null,
    ]
      .filter((x): x is string => x !== null)
      .join(" · ");
    console.log(`  ${w.ref}: ${facts}`);
    if (w.verdict) console.log(`      ↳ verdict (DERIVADO do answer): "${w.verdict}"`);
  }
}

export function reportGovernanceBank(g: GovernanceProjection, repos: string[]): void {
  header(`BANCO DE GOVERNANÇA · ${g.intent}: ${g.title}`);
  console.log(
    `  consome as projeções dos repos [${repos.join(", ")}] — banco→banco, sem ler arquivo de repo`
  );

  console.log("\n  open-questions:");
  for (const q of g.questions) {
    console.log(
      `    ${q.id}: ${q.resolved ? "RESOLVED" : "open"}${q.answeredBy ? `  ← ${q.answeredBy}` : ""}`
    );
    if (q.verdict) console.log(`        ↳ verdict: "${q.verdict}"`);
  }

  console.log("\n  contracts:");
  for (const c of g.contracts) {
    console.log(
      `    ${c.name}: ${c.known ? "KNOWN ✅" : "pending"}  (${c.awaits ? `awaits ${c.awaits}` : "t0"})`
    );
  }

  const destravados = g.contracts.filter((c) => c.known && c.awaits).map((c) => c.name);
  console.log(
    `\n  → destravados por resolução: ${destravados.length ? destravados.join(", ") : "(nenhum)"}`
  );
}

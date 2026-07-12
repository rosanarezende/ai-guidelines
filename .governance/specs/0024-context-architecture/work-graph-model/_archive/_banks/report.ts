// Renderização (separada da lógica). Só formata e imprime — não deriva nada.
import type {
  RepoProjection,
  GovernanceProjection,
  WorkProjection,
  DeliberationProjection,
} from "./types.ts";

function header(title: string): void {
  console.log(`\n══ ${title} ══`);
}

function printWork(w: WorkProjection): void {
  const facts = [
    w.kind,
    w.status,
    `dono ${w.assignee ?? "(ninguém)"}`,
    w.weight ? `peso ${w.weight}` : null,
    w.fate ? `fate ${w.fate}` : null,
    w.blockedBy?.length ? `blocked-by ${w.blockedBy.join("/")}` : null,
    w.coordinatesWith?.length ? `coordinates-with ${w.coordinatesWith.join("/")}` : null,
    w.answers ? `answers ${w.answers}` : null,
    w.updatedAt ? `upd ${w.updatedAt}` : null,
  ]
    .filter((x): x is string => x !== null)
    .join(" · ");
  console.log(`  ${w.ref}: ${facts}`);
  if (w.verdict) console.log(`      ↳ verdict (DERIVADO do answer): "${w.verdict}"`);
  if (w.promotedOutput)
    console.log(
      `      ↳ promovido → ${w.promotedOutput} (POC durável p/ absorver via derives-from)`
    );
}

export function reportRepoBank(p: RepoProjection): void {
  header(`BANCO DO REPO · ${p.repo}   (deriva só os arquivos DELE)`);
  if (p.works.length === 0 && p.explorations.length === 0) {
    console.log("  (sem trabalhos nem explorations)");
    return;
  }
  if (p.works.length) {
    console.log("  — trabalho —");
    for (const w of p.works) printWork(w);
  }
  if (p.explorations.length) {
    console.log("  — explorations (ferramenta) —");
    for (const w of p.explorations) printWork(w);
  }
}

export function reportDeliberation(d: DeliberationProjection): void {
  header(`DELIBERAÇÃO · camada INTERNA · ${d.work}   [stage DERIVADO: ${d.stage}]`);
  for (const q of d.questions) {
    const state = q.resolved
      ? `RESOLVED${q.reopened ? " (reaberta → re-resolvida)" : ""}`
      : q.reopened
        ? "REABERTA (sem decisão viva)"
        : q.answered
          ? `answered · ${q.decision} (respondida ≠ resolvida)`
          : "open (sem research)";
    console.log(
      `    ${q.id} [${q.mode ?? "?"}]: ${state}  ← research: ${q.researches.join(", ") || "(nenhuma)"}`
    );
  }
  console.log(`  cursor (STATE derivado do deliberation): ${d.cursor}`);
}

export function reportGovernanceBank(g: GovernanceProjection, repos: string[]): void {
  header(`BANCO DE GOVERNANÇA · ${g.intent}: ${g.title}`);
  console.log(`  dona da iniciativa: ${g.owner ?? "(sem dona)"}`);
  console.log(
    `  consome as projeções dos repos [${repos.join(", ")}] — banco→banco, sem ler arquivo de repo`
  );

  console.log("\n  open-questions (RESPONDIDA pela exploration ≠ RESOLVIDA pelo aceite humano):");
  for (const q of g.questions) {
    const state = q.resolved
      ? "RESOLVED"
      : q.answered
        ? `answered · decisão ${q.decision}`
        : "open";
    console.log(`    ${q.id}: ${state}${q.answeredBy ? `  ← ${q.answeredBy}` : ""}`);
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

  console.log(
    "\n  breaks-into (o PLANO — só as ENTREGAS por status; explorations = na investigação acima):"
  );
  for (const [status, refs] of Object.entries(g.breaksInto)) {
    if (refs.length > 0) console.log(`    ${status}: ${refs.join(", ")}`);
  }
}

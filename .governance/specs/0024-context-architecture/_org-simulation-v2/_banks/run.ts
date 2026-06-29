// Orquestra os bancos que se comunicam (Lente 5). Rode:  node _banks/run.ts
import type { Intent, Deliberation, DeliberationProjection } from "./types.ts";
import { readYaml, listRepos, listIntents, workDeliberationPath } from "./io.ts";
import { deriveRepo } from "./derive-repo.ts";
import { deriveGovernance } from "./derive-governance.ts";
import { deriveDeliberation } from "./derive-deliberation.ts";
import { reportRepoBank, reportGovernanceBank, reportDeliberation } from "./report.ts";
import { materialize } from "./materialize.ts";
import { materializeRepoDashboard, materializeMainDashboard } from "./dashboard.ts";
import { writeRepoDb, writeGovernanceDb } from "./db.ts";

const repos = listRepos();

// 1) cada repo deriva o SEU banco (local) e "publica" a projeção (todos os kinds de work)
const repoProjections = repos.map(deriveRepo);
repoProjections.forEach(reportRepoBank);

// 1b) a CAMADA INTERNA de cada work que delibera (questions/ · research/ + deliberation.yml) — Lente 5
//     o banco lê os folders e deriva o GATE + o STATE (stage/cursor); privada, não sobe pro dashboard
const deliberations: DeliberationProjection[] = [];
for (const p of repoProjections) {
  for (const w of p.works) {
    if (!workDeliberationPath(w.ref)) continue;
    const d = deriveDeliberation(w.ref);
    reportDeliberation(d);
    deliberations.push(d);
  }
}

// 2) a governança deriva CONSUMINDO as projeções dos repos + o mapa de deliberação (o gate humano).
//    Descobre as intents (não hard-coded) — uma projeção de governança por intent.
const governances = listIntents().map((dir) => {
  const intent = readYaml<Intent>(`acme-governance/intents/${dir}/intent.yml`);
  const deliberation = readYaml<Deliberation>(`acme-governance/intents/${dir}/deliberation.yml`);
  const governance = deriveGovernance(intent, deliberation, repoProjections);
  reportGovernanceBank(governance, repos);
  return governance;
});

// 3) MATERIALIZA o snapshot JSON em _viewer/public/ (o app consome) — além do console
const written = materialize(repoProjections, governances);
console.log(`\n📁 snapshot: ${written} — rode o viewer:  cd _viewer && npm install && npm run dev`);

// 4) DADO por repo (fake-api): cada repo escreve o SEU db.json auto-contido; a governança escreve a dela (host)
console.log("");
for (const rp of repoProjections) {
  console.log(`🗃️  db · ${rp.repo}: ${writeRepoDb(rp, deliberations)}`);
}
console.log(`🗃️  db · governança: ${writeGovernanceDb(governances, repos)}`);

// 5) VIEW: dashboards self-contained (por repo + principal) — fase 3 fará a view LER o db.json acima
for (const rp of repoProjections) {
  console.log(`📊 local · ${rp.repo}: ${materializeRepoDashboard(rp, deliberations)}`);
}
console.log(`📊 principal: ${materializeMainDashboard(governances)}`);

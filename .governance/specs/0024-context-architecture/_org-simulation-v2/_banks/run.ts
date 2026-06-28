// Orquestra os bancos que se comunicam (Lente 5). Rode:  node _banks/run.ts
import type { Intent, Deliberation } from "./types.ts";
import { readYaml, listRepos } from "./io.ts";
import { deriveRepo } from "./derive-repo.ts";
import { deriveGovernance } from "./derive-governance.ts";
import { reportRepoBank, reportGovernanceBank } from "./report.ts";
import { materialize } from "./materialize.ts";

const repos = listRepos();

// 1) cada repo deriva o SEU banco (local) e "publica" a projeção
const repoProjections = repos.map(deriveRepo);
repoProjections.forEach(reportRepoBank);

// 2) a governança deriva CONSUMINDO as projeções dos repos + o mapa de deliberação (o gate humano)
const intent = readYaml<Intent>("acme-governance/intents/intent-0001/intent.yml");
const deliberation = readYaml<Deliberation>("acme-governance/intents/intent-0001/deliberation.yml");
const governance = deriveGovernance(intent, deliberation, repoProjections);
reportGovernanceBank(governance, repos);

// 3) MATERIALIZA o snapshot JSON em _banks/_out/ (o app _viewer/ consome) — além do console
const written = materialize(repoProjections, governance);
console.log(`\n📁 snapshot: ${written} — rode o viewer:  cd _viewer && npm install && npm run dev`);

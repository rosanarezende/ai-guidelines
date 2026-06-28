// Orquestra os bancos que se comunicam (Lente 5). Rode:  node _banks/run.ts
import type { Intent, Deliberation } from "./types.ts";
import { readYaml, listRepos } from "./io.ts";
import { deriveRepo } from "./derive-repo.ts";
import { deriveGovernance } from "./derive-governance.ts";
import { reportRepoBank, reportGovernanceBank } from "./report.ts";
import { materializeRepoBank, materializeGovernanceBank } from "./materialize.ts";

const repos = listRepos();

// 1) cada repo deriva o SEU banco (local) e "publica" a projeção
const repoProjections = repos.map(deriveRepo);
repoProjections.forEach(reportRepoBank);

// 2) a governança deriva CONSUMINDO as projeções dos repos + o mapa de deliberação (o gate humano)
const intent = readYaml<Intent>("acme-governance/intents/intent-0001/intent.yml");
const deliberation = readYaml<Deliberation>("acme-governance/intents/intent-0001/deliberation.yml");
const governance = deriveGovernance(intent, deliberation, repoProjections);
reportGovernanceBank(governance, repos);

// 3) MATERIALIZA as projeções em _banks/_out/ (boards visualizáveis) — além do console
const written = [
  ...repoProjections.map(materializeRepoBank),
  materializeGovernanceBank(governance, repos),
];
console.log(`\n📁 materializado: ${written.join(" · ")}`);

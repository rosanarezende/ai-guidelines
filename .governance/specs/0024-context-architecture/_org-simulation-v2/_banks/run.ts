// Orquestra os bancos que se comunicam (Lente 5). Rode:  node _banks/run.ts
import type { Intent } from "./types.ts";
import { readYaml, listRepos } from "./io.ts";
import { deriveRepo } from "./derive-repo.ts";
import { deriveGovernance } from "./derive-governance.ts";
import { reportRepoBank, reportGovernanceBank } from "./report.ts";

const repos = listRepos();

// 1) cada repo deriva o SEU banco (local) e "publica" a projeção
const repoProjections = repos.map(deriveRepo);
repoProjections.forEach(reportRepoBank);

// 2) a governança deriva CONSUMINDO as projeções dos repos (comunicação banco→banco)
const intent = readYaml<Intent>("acme-governance/intents/intent-0001/intent.yml");
const governance = deriveGovernance(intent, repoProjections);
reportGovernanceBank(governance, repos);

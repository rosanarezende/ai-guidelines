// publish-repo-contracts.mjs — gera registry/contracts nos owner repos.
import { loadOrg } from "./org.mjs";
import { publishRepoContracts } from "./repo-contracts.mjs";

const contracts = publishRepoContracts(loadOrg());
console.log(`✓ ${contracts.length} repo-contract registry file(s) publicado(s) em owner repos`);

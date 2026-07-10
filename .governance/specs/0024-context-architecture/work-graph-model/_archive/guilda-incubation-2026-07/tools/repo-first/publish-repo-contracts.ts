// publish-repo-contracts.ts — gera registry/contracts nos owner repos.
import { loadOrg } from "./org.ts";
import { publishRepoContracts } from "./repo-contracts.ts";

const contracts = publishRepoContracts(loadOrg());
console.log(`✓ ${contracts.length} repo-contract registry file(s) publicado(s) em owner repos`);

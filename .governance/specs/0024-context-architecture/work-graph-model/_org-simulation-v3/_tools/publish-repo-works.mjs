// publish-repo-works.mjs — gera acknowledgements repo-local para as peças das intents.
import { loadOrg } from "./org.mjs";
import { publishRepoWorks } from "./repo-works.mjs";

const claims = publishRepoWorks(loadOrg());
console.log(
  `✓ ${claims.length} repo-work acknowledgement(s) publicado(s) em repos/*/.governance/works`
);

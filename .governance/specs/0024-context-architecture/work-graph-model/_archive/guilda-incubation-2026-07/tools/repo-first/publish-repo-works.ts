// publish-repo-works.ts — gera acknowledgements repo-local para as peças das intents.
import { loadOrg } from "./org.ts";
import { publishRepoWorks } from "./repo-works.ts";

const claims = publishRepoWorks(loadOrg());
console.log(
  `✓ ${claims.length} repo-work acknowledgement(s) publicado(s) em acme/repos/*/.governance/works`
);

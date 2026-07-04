// publish-contexts.mjs — regenera os context.json publicados pelos repos da sim v3.
import { publishRepoContexts } from "./repo-contexts.mjs";

const contexts = await publishRepoContexts();
console.log(
  `✓ ${contexts.length} context.json publicado(s) a partir dos manifestos + codigo dos repos`
);

// publish-contexts.ts — regenera os context.json publicados pelos repos da sim v3.
import { publishRepoContexts } from "./repo-contexts.ts";

const contexts = await publishRepoContexts();
console.log(
  `✓ ${contexts.length} context.json publicado(s) a partir dos manifestos + codigo dos repos`
);

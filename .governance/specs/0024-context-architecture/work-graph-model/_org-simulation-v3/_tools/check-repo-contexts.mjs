// check-repo-contexts.mjs — falha se manifestos/context.json/repos.yml divergirem.
import { loadOrg } from "./org.mjs";
import { validateRepoContexts } from "./repo-contexts.mjs";

const issues = await validateRepoContexts(loadOrg());
const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");

for (const i of issues)
  console.log(`${i.level === "error" ? "✗" : "⚠"} [${i.rule}] ${i.node} — ${i.msg}`);

console.log(
  issues.length === 0
    ? "✓ repo-contexts validos — manifestos/contextos batem com repos.yml"
    : `— ${errors.length} erro(s) · ${warns.length} aviso(s)`
);
process.exit(errors.length > 0 ? 1 : 0);

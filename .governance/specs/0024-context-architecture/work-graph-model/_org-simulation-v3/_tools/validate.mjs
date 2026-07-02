// validate.mjs — CLI dos lints da org (exit 1 se houver ERRO). Uso: node _tools/validate.mjs
import { loadOrg, validateOrg } from "./org.mjs";
import { validateRepoContexts } from "./repo-contexts.mjs";

const org = loadOrg();
const issues = [...validateOrg(org), ...(await validateRepoContexts(org))];
const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");

for (const i of issues)
  console.log(`${i.level === "error" ? "✗" : "⚠"} [${i.rule}] ${i.node} — ${i.msg}`);

console.log(
  issues.length === 0
    ? "✓ org válida — nenhum issue"
    : `— ${errors.length} erro(s) · ${warns.length} aviso(s)`
);
process.exit(errors.length > 0 ? 1 : 0);

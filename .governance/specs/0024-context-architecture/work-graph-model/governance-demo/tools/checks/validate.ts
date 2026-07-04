// validate.ts — CLI dos lints da org (exit 1 se houver ERRO). Uso: node tools/checks/validate.ts
import { loadOrg, validateOrg, validateRuntimeState } from "../repo-first/org.ts";
import { validateRepoContracts } from "../repo-first/repo-contracts.ts";
import { validateRepoContexts } from "../repo-first/repo-contexts.ts";
import { validateRepoWorks } from "../repo-first/repo-works.ts";

const org = loadOrg();
const issues = [
  ...validateRuntimeState(),
  ...validateOrg(org),
  ...(await validateRepoContexts(org)),
  ...validateRepoWorks(org),
  ...validateRepoContracts(org),
];
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

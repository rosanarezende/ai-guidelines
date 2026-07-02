// check-repo-contracts.mjs — falha se contracts.yml e registry local dos owners divergirem.
import { loadOrg } from "./org.mjs";
import { validateRepoContracts } from "./repo-contracts.mjs";

const issues = validateRepoContracts(loadOrg());
const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");

for (const i of issues)
  console.log(`${i.level === "error" ? "✗" : "⚠"} [${i.rule}] ${i.node} — ${i.msg}`);

console.log(
  issues.length === 0
    ? "✓ repo-contracts validos — owners publicam os contratos centrais"
    : `— ${errors.length} erro(s) · ${warns.length} aviso(s)`
);
process.exit(errors.length > 0 ? 1 : 0);

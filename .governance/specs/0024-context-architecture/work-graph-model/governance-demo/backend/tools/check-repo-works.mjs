// check-repo-works.mjs — falha se o breakdown central e os acks repo-local divergirem.
import { loadOrg } from "./org.mjs";
import { validateRepoWorks } from "./repo-works.mjs";

const issues = validateRepoWorks(loadOrg());
const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");

for (const i of issues)
  console.log(`${i.level === "error" ? "✗" : "⚠"} [${i.rule}] ${i.node} — ${i.msg}`);

console.log(
  issues.length === 0
    ? "✓ repo-works validos — breakdown central reconhecido pelos repos"
    : `— ${errors.length} erro(s) · ${warns.length} aviso(s)`
);
process.exit(errors.length > 0 ? 1 : 0);

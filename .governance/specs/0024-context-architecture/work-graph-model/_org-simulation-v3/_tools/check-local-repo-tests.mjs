// check-local-repo-tests.mjs — executa testes locais dos repos críticos.
// Objetivo: capability não pode se apoiar só em texto do manifesto; pelo menos os repos
// críticos precisam provar comportamento local.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const repos = ["acme-core-api", "acme-checkout", "acme-analytics"];

let failed = 0;
for (const repo of repos) {
  const cwd = path.join(root, "repos", repo);
  const result = spawnSync(process.execPath, ["test.mjs"], {
    cwd,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`local repo test failed: ${repo}`);
    failed++;
  }
}

if (failed) process.exit(1);
console.log(`local repo tests: ok (${repos.length} repos criticos)`);

// check-governance-app.mjs — prova que o app Next/MUI consome a runtime v3.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGovernanceSnapshot } from "../_apps/governance-next/lib/governance-server.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const appDir = path.join(root, "_apps", "governance-next");
const repoRoot = path.resolve(root, "../../../../..");

function fail(message) {
  console.error(`✗ governance app — ${message}`);
  process.exit(1);
}

const snapshot = await loadGovernanceSnapshot();
if (!snapshot.revision) fail("snapshot sem revision");
if (!snapshot.graph?.nodes?.length) fail("snapshot sem grafo");
if (!snapshot.portfolio?.objectives?.length) fail("snapshot sem planning tier");
if (!snapshot.targets?.length) fail("snapshot sem targets/dashboard");

const nextBin = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: appDir,
  stdio: "inherit",
  shell: false,
});
if (result.status !== 0) fail("next build falhou");

console.log(
  `✓ governance app — Next/MUI build + snapshot (${snapshot.graph.nodes.length} nós · ${snapshot.graph.edges.length} arestas · rev ${snapshot.revision})`
);

// export-backend-examples.mjs — gera/checa exemplos de backends derivados.
// Uso:
//   node _tools/export-backend-examples.mjs
//   node _tools/export-backend-examples.mjs --check
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import prettier from "prettier";
import { fileURLToPath } from "node:url";
import {
  buildBackendExampleArtifacts,
  buildGraphReadModel,
  openFileGovernanceRuntime,
} from "../_lib/index.mjs";
import { loadPublishedRepoContracts, validateRepoContracts } from "./repo-contracts.mjs";
import { loadPublishedContexts, validateRepoContexts } from "./repo-contexts.mjs";
import { loadPublishedRepoWorks, validateRepoWorks } from "./repo-works.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const outRoot = path.join(root, "_examples", "backends");
const check = process.argv.includes("--check");
const prettierConfig = (await prettier.resolveConfig(root)) ?? {};

const runtime = openFileGovernanceRuntime();
const org = runtime.loadOrg();
const issues = [
  ...runtime.validateOrg(org),
  ...(await validateRepoContexts(org)),
  ...validateRepoWorks(org),
  ...validateRepoContracts(org),
];
const graph = buildGraphReadModel({
  org,
  issues,
  repoContexts: loadPublishedContexts(),
  repoWorks: loadPublishedRepoWorks(),
  repoContracts: loadPublishedRepoContracts(),
});
const rawArtifacts = buildBackendExampleArtifacts(graph);
const artifacts = Object.fromEntries(
  await Promise.all(
    Object.entries(rawArtifacts).map(async ([relativePath, content]) => [
      relativePath,
      await formatArtifact(relativePath, content),
    ])
  )
);

async function formatArtifact(relativePath, content) {
  if (relativePath.endsWith(".md")) {
    return prettier.format(content, { ...prettierConfig, parser: "markdown" });
  }
  if (relativePath.endsWith(".json")) {
    return prettier.format(content, { ...prettierConfig, parser: "json" });
  }
  return content;
}

const stale = [];
for (const [relativePath, content] of Object.entries(artifacts)) {
  const file = path.join(outRoot, relativePath);
  if (check) {
    const current = existsSync(file) ? readFileSync(file, "utf8") : null;
    if (current !== content) stale.push(relativePath);
    continue;
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

if (check && stale.length) {
  console.error("✗ backend examples stale:");
  for (const file of stale) console.error(`  - ${file}`);
  console.error("Rode: node _tools/export-backend-examples.mjs");
  process.exit(1);
}

console.log(
  check
    ? `✓ backend examples frescos (${Object.keys(artifacts).length} arquivo(s))`
    : `✓ backend examples gerados em ${path.relative(root, outRoot)} (${Object.keys(artifacts).length} arquivo(s))`
);

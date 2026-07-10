// export-backend-examples.ts — gera/checa exemplos de backends derivados.
// Uso:
//   node tools/read-models/export-backend-examples.ts
//   node tools/read-models/export-backend-examples.ts --check
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import prettier from "prettier";
import { fileURLToPath } from "node:url";
import {
  buildBackendExampleArtifacts,
  buildGraphReadModel,
  openFileGovernanceRuntime,
} from "../../backend/src/index.ts";
import { loadPublishedRepoContracts, validateRepoContracts } from "../repo-first/repo-contracts.ts";
import { loadPublishedContexts, validateRepoContexts } from "../repo-first/repo-contexts.ts";
import { loadPublishedRepoWorks, validateRepoWorks } from "../repo-first/repo-works.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.join(here, "..", "..");
const outRoot = path.join(demoRoot, "backend", "examples", "read-models");
const check = process.argv.includes("--check");
const prettierConfig = (await prettier.resolveConfig(demoRoot)) ?? {};

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
const rawArtifacts = buildBackendExampleArtifacts(graph as any);
const artifacts = Object.fromEntries(
  await Promise.all(
    Object.entries(rawArtifacts).map(async ([relativePath, content]) => [
      relativePath,
      await formatArtifact(relativePath, content),
    ])
  )
);

async function formatArtifact(relativePath: string, content: string) {
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
  writeFileSync(file, String(content));
}

if (check && stale.length) {
  console.error("✗ read-model examples stale:");
  for (const file of stale) console.error(`  - ${file}`);
  console.error("Rode: node tools/read-models/export-backend-examples.ts");
  process.exit(1);
}

console.log(
  check
    ? `✓ read-model examples frescos (${Object.keys(artifacts).length} arquivo(s))`
    : `✓ read-model examples gerados em ${path.relative(demoRoot, outRoot)} (${Object.keys(artifacts).length} arquivo(s))`
);

// build-graph.mjs — escreve _apps/graph.js a partir do read-model derivado pela _lib.
// Uso: node _tools/build-graph.mjs
// F14 (revisão F5): sem timestamp — a versão é HASH do conteúdo (rodar sem mudança não suja o repo).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import { parse } from "yaml";
import { buildGraphReadModel, openFileGovernanceRuntime } from "../_lib/index.mjs";
import { loadPublishedRepoContracts, validateRepoContracts } from "./repo-contracts.mjs";
import { loadPublishedContexts, validateRepoContexts } from "./repo-contexts.mjs";
import { loadPublishedRepoWorks, validateRepoWorks } from "./repo-works.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const APPS = path.join(here, "..", "_apps");
const MODEL = path.join(here, "..", "..", "model.yml");

const runtime = openFileGovernanceRuntime();
const org = runtime.loadOrg();
const repoContextIssues = await validateRepoContexts(org);
const repoWorkIssues = validateRepoWorks(org);
const repoContractIssues = validateRepoContracts(org);
const issues = [
  ...runtime.validateOrg(org),
  ...repoContextIssues,
  ...repoWorkIssues,
  ...repoContractIssues,
];

const model = parse(readFileSync(MODEL, "utf8"));
const graph = buildGraphReadModel({
  org,
  issues,
  profiles: model["governance-profiles"] || null,
  repoContexts: loadPublishedContexts(),
  repoWorks: loadPublishedRepoWorks(),
  repoContracts: loadPublishedRepoContracts(),
});

const body = {
  company: graph.company,
  nodes: graph.nodes,
  edges: graph.edges,
  issues: graph.issues,
  profiles: graph.profiles,
};
const contentHash = createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 12);

const GRAPH = { contentHash, ...graph };

mkdirSync(APPS, { recursive: true });
const graphSource =
  "// graph.js — GERADO por _tools/build-graph.mjs a partir de acme-governance/ + repos/ + model.yml — NÃO editar à mão.\n" +
  "window.GRAPH = " +
  JSON.stringify(GRAPH, null, 2) +
  ";\n";
const graphPath = path.join(APPS, "graph.js");
const prettierOptions = (await prettier.resolveConfig(graphPath)) || {};
writeFileSync(
  graphPath,
  await prettier.format(graphSource, { ...prettierOptions, parser: "babel" })
);
console.log(
  `✓ graph.js gerado — ${graph.nodes.length} nós · ${graph.edges.length} arestas · ${graph.issues.length} issue(s) do validador`
);

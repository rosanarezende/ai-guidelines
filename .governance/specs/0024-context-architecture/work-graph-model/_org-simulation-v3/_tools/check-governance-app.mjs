// check-governance-app.mjs — prova que o app Next/MUI consome a runtime v3.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGraphReadModel, openFileGovernanceRuntime } from "../_lib/index.mjs";
import { loadPublishedRepoContracts, validateRepoContracts } from "./repo-contracts.mjs";
import { loadPublishedContexts, validateRepoContexts } from "./repo-contexts.mjs";
import { loadPublishedRepoWorks, validateRepoWorks } from "./repo-works.mjs";
import { parse } from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const appDir = path.join(root, "_apps", "governance-next");
const repoRoot = path.resolve(root, "../../../../..");
const integrationCatalogFile = path.join(root, "..", "integration-catalog.yml");
const appPackageFile = path.join(appDir, "package.json");
const rootPackageFile = path.join(repoRoot, "package.json");

function fail(message) {
  console.error(`✗ governance app — ${message}`);
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

function readRelativeFiles() {
  return walk(appDir).filter((file) => {
    const relative = path.relative(appDir, file).replaceAll("\\", "/");
    if (relative.startsWith(".next/")) return false;
    if (relative.startsWith("node_modules/")) return false;
    return /\.(ts|tsx|js|jsx|mjs|css|json)$/.test(relative);
  });
}

function packageName(specifier) {
  if (
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    specifier.startsWith("node:") ||
    specifier.startsWith("@/")
  ) {
    return null;
  }
  const parts = specifier.split("/");
  if (specifier.startsWith("@")) return `${parts[0]}/${parts[1]}`;
  return parts[0];
}

function importedPackages(files) {
  const packages = new Set();
  const importRegex =
    /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\(["']([^"']+)["']\)/g;
  for (const file of files.filter((item) => /\.(ts|tsx)$/.test(item))) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(importRegex)) {
      const name = packageName(match[1] || match[2] || "");
      if (name) packages.add(name);
    }
  }
  return [...packages].sort();
}

function assertWorkspaceDependencyContract(files) {
  const rootPackage = JSON.parse(fs.readFileSync(rootPackageFile, "utf8"));
  const appPackage = JSON.parse(fs.readFileSync(appPackageFile, "utf8"));
  const appWorkspacePath = path.relative(repoRoot, appDir).replaceAll("\\", "/");
  if (!rootPackage.workspaces?.includes(appWorkspacePath)) {
    fail(`governance-next nao esta declarado como npm workspace: ${appWorkspacePath}`);
  }

  const declared = new Set([
    ...Object.keys(appPackage.dependencies || {}),
    ...Object.keys(appPackage.devDependencies || {}),
    ...Object.keys(appPackage.peerDependencies || {}),
  ]);
  const missing = importedPackages(files).filter((name) => !declared.has(name));
  if (missing.length > 0) {
    fail(`imports sem dependencia declarada no app package.json: ${missing.join(", ")}`);
  }
}

const sourceFiles = readRelativeFiles();
assertWorkspaceDependencyContract(sourceFiles);
if (sourceFiles.some((file) => /\.(js|jsx|mjs)$/.test(file))) {
  fail("app v2 ainda contem arquivo JS/JSX/MJS");
}
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  const relative = path.relative(appDir, file).replaceAll("\\", "/");
  const importsMuiGridOrStack = text.split(/\r?\n/).some((line) => {
    return /from "@mui\/material"/.test(line) && /\b(Grid|Stack)\b/.test(line);
  });
  if (/<Grid[\s>]|<Stack[\s>]/.test(text) || importsMuiGridOrStack) {
    fail(`uso de Grid/Stack banido por warnings de DOM: ${relative}`);
  }
  if (/Date\.now\(|Math\.random\(/.test(text)) {
    fail(`input nao deterministico no app: ${relative}`);
  }
}

const runtime = openFileGovernanceRuntime();
const org = runtime.loadOrg();
const repoContexts = loadPublishedContexts();
const repoWorks = loadPublishedRepoWorks();
const repoContracts = loadPublishedRepoContracts();
const issues = [
  ...runtime.validateOrg(org),
  ...(await validateRepoContexts(org, { publishedContexts: repoContexts })),
  ...validateRepoWorks(org, { publishedClaims: repoWorks }),
  ...validateRepoContracts(org, { publishedContracts: repoContracts }),
];
const graph = buildGraphReadModel({ org, issues, repoContexts, repoWorks, repoContracts });
const revision = runtime.currentRevision();
const integrationCatalog = parse(fs.readFileSync(integrationCatalogFile, "utf8"));
const integrations = integrationCatalog?.integrations || [];
const assistantRuntime = integrations.find((item) => item.id === "assistant-runtime-local-cloud");

if (!revision) fail("snapshot sem revision");
if (!graph?.nodes?.length) fail("snapshot sem grafo");
if (!Array.isArray(org.objectives) || !org.objectives.length) fail("snapshot sem planning tier");
if (!Array.isArray(org.targets) || !org.targets.length) fail("snapshot sem targets/dashboard");
if (!assistantRuntime?.systems?.includes("ollama"))
  fail("catalogo sem assistant runtime local Ollama");

const nextBin = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextBin, "build", "--webpack"], {
  cwd: appDir,
  stdio: "inherit",
  shell: false,
});
if (result.status !== 0) fail("next build falhou");

console.log(
  `✓ governance app — TypeScript/MUI build + snapshot (${graph.nodes.length} nós · ${graph.edges.length} arestas · ${integrations.length} integrações · rev ${revision})`
);

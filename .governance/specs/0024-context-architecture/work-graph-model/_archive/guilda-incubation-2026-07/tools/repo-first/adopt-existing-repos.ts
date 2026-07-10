// adopt-existing-repos.ts — idempotent scaffold for an existing company adopting the framework.
// It creates the minimum repo-local governance sidecar without claiming semantic truth.
// Capability extraction here is deterministic and weak by design; an AI channel can enrich it,
// but a human must review before it becomes manifest truth.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import { GOVERNANCE_ROOT, REPOS_ROOT, SIM_ROOT } from "./org.ts";
import { inspectRepoCode } from "./repo-contexts.ts";

const ROOT = SIM_ROOT;
const REPOS = REPOS_ROOT;
const args = new Set(process.argv.slice(2));
const check = args.has("--check");

const readYaml = (file) => parse(readFileSync(file, "utf8"));
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const ensureDir = (dir) => mkdirSync(dir, { recursive: true });
const writeIfMissing = (file, content) => {
  if (existsSync(file)) return false;
  ensureDir(path.dirname(file));
  writeFileSync(file, content);
  return true;
};

function repoDirs() {
  return readdirSync(REPOS)
    .map((name) => path.join(REPOS, name))
    .filter((full) => statSync(full).isDirectory() && existsSync(path.join(full, "package.json")))
    .sort();
}

function centralRepos() {
  const file = path.join(GOVERNANCE_ROOT, "repos.yml");
  if (!existsSync(file)) return new Map();
  const doc = readYaml(file);
  return new Map((doc.repos || []).map((repo) => [repo.id, repo]));
}

function inferRole(repoId) {
  if (repoId.includes("design-system")) return "platform-library";
  if (repoId.includes("web-host")) return "platform-shell";
  if (repoId.includes("analytics")) return "event-platform";
  if (repoId.includes("data-pipeline")) return "data-pipeline";
  if (repoId.includes("obs-stack")) return "observability-platform";
  if (repoId.includes("core-api")) return "legacy-monolith";
  if (repoId.includes("help-center")) return "support-application";
  if (repoId.includes("mfe") || repoId === "acme-checkout") return "microfrontend";
  if (repoId.includes("api") || repoId.includes("identity")) return "backend-service";
  return "application";
}

function inferDomain(repoId) {
  return repoId.replace(/^acme-/, "").replaceAll("-", " ");
}

function inferStack(pkg, code) {
  const stack = new Set(["node", "javascript"]);
  if ((code.exports || []).some((x) => /render|Button|Card|Banner|Step|Summary/.test(x)))
    stack.add("html");
  for (const dep of Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) })) {
    if (dep.includes("react")) stack.add("react");
    if (dep.includes("vite")) stack.add("vite");
  }
  return [...stack];
}

function manifestDraft(repoId, repoDir, central) {
  const pkg = readJson(path.join(repoDir, "package.json"));
  const code = inspectRepoCode(repoDir);
  const tags = central?.caps || code.exports.map((x) => x.replace(/[A-Z]/g, "-$&").toLowerCase());
  return {
    repo: repoId,
    role: inferRole(repoId),
    owner: central?.owner || "TODO-owner",
    domain: inferDomain(repoId),
    provides: [],
    consumes: [],
    capabilities: [
      {
        text: `TODO: revisar capabilities extraidas de ${pkg.name || repoId}; exports observados: ${code.exports.join(", ") || "nenhum"}.`,
        tags,
      },
    ],
    architecture: {
      stack: inferStack(pkg, code),
      patterns: [],
      boundaries: [],
    },
  };
}

function capabilityCandidate(repoId, repoDir) {
  const pkg = readJson(path.join(repoDir, "package.json"));
  const code = inspectRepoCode(repoDir);
  return {
    repo: repoId,
    status: "draft-review-required",
    generatedBy: "adopt-existing-repos.ts",
    note: "Weak deterministic extraction. Use as input for human/AI assisted authoring; do not treat as attested truth.",
    evidence: {
      package: pkg.name,
      dependencies: Object.keys({
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      }).sort(),
      exports: code.exports,
      sourceHash: code.sourceHash,
    },
  };
}

let missing = 0;
let created = 0;
const central = centralRepos();

for (const repoDir of repoDirs()) {
  const repoId = path.basename(repoDir);
  const gov = path.join(repoDir, ".governance");
  const manifest = path.join(gov, "manifest.yml");
  const candidate = path.join(gov, "capability-candidates.yml");
  const registryKeep = path.join(gov, "registry", ".gitkeep");
  const worksKeep = path.join(gov, "works", ".gitkeep");

  if (check) {
    if (!existsSync(manifest)) {
      console.error(`missing manifest: ${path.relative(ROOT, manifest)}`);
      missing++;
    }
    if (!existsSync(candidate)) {
      console.error(`missing capability candidates: ${path.relative(ROOT, candidate)}`);
      missing++;
    }
    continue;
  }

  ensureDir(gov);
  ensureDir(path.join(gov, "registry"));
  ensureDir(path.join(gov, "works"));
  if (writeIfMissing(registryKeep, "")) created++;
  if (writeIfMissing(worksKeep, "")) created++;
  if (writeIfMissing(manifest, stringify(manifestDraft(repoId, repoDir, central.get(repoId)))))
    created++;
  if (writeIfMissing(candidate, stringify(capabilityCandidate(repoId, repoDir)))) created++;
}

if (check && missing > 0) {
  console.error(`adoption scaffold incomplete: ${missing} missing file(s)`);
  process.exit(1);
}

console.log(
  check
    ? "adoption scaffold: ok"
    : `adoption scaffold: ok (${created} file(s) created; existing manifests preserved)`
);

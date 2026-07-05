// check-governance-app.ts — prova que o app Next/MUI consome a runtime da demo.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGraphReadModel, openFileGovernanceRuntime } from "../../backend/src/index.ts";
import { loadPublishedRepoContracts, validateRepoContracts } from "../repo-first/repo-contracts.ts";
import { loadPublishedContexts, validateRepoContexts } from "../repo-first/repo-contexts.ts";
import { loadPublishedRepoWorks, validateRepoWorks } from "../repo-first/repo-works.ts";
import { parse } from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..");
const backendRoot = path.join(root, "backend");
const workGraphRoot = path.resolve(root, "..");
const appDir = path.join(root, "frontend");
const repoRoot = path.resolve(root, "../../../../..");
const integrationCatalogFile = path.join(root, "..", "integration-catalog.yml");
const appPackageFile = path.join(appDir, "package.json");
const rootPackageFile = path.join(repoRoot, "package.json");
const backendTsconfigFile = path.join(backendRoot, "tsconfig.json");
const legacyLocaleDir = path.join(appDir, "locales");
const legacyFeaturesDir = path.join(appDir, "app", "features");
const legacyUiDir = path.join(appDir, "app", "ui");
const legacyViewsDir = path.join(appDir, "app", "_ui", "views");
const legacySharedComponentsFile = path.join(appDir, "app", "_ui", "shared", "components.tsx");
const legacyOnboardingComponentsFile = path.join(
  appDir,
  "app",
  "onboarding",
  "_components",
  "index.tsx"
);
const legacyPortugueseRouteDirs = [path.join(appDir, "app", "configuracoes")];
const obsoleteLocaleDirs = [
  path.join(appDir, "app", "(home)", "locales"),
  path.join(appDir, "app", "onboarding", "locales"),
  path.join(appDir, "app", "settings", "locales"),
  path.join(appDir, "app", "_ui", "locales"),
  path.join(appDir, "app", "_domain", "adoption", "locales"),
];
const requiredLocaleFiles = [
  {
    file: path.join(appDir, "app", "_ui", "shell", "_locales", "pt-br.json"),
    key: "app.brand.name",
  },
  {
    file: path.join(appDir, "app", "_ui", "shared", "_locales", "pt-br.json"),
    key: "common.continue",
  },
  {
    file: path.join(appDir, "app", "_domain", "adoption", "assistant", "_locales", "pt-br.json"),
    key: "assistant.ollama.health.ok",
  },
  {
    file: path.join(appDir, "app", "(home)", "_view", "HomeView", "_locales", "pt-br.json"),
    key: "home.title",
  },
  {
    file: path.join(
      appDir,
      "app",
      "onboarding",
      "_view",
      "OnboardingView",
      "_locales",
      "pt-br.json"
    ),
    key: "onboarding.profile.title",
  },
  {
    file: path.join(appDir, "app", "settings", "_view", "SettingsView", "_locales", "pt-br.json"),
    key: "settings.title",
  },
];
const requiredColocatedLocaleFiles = [
  "app/_domain/adoption/assistant/_locales/pt-br.json",
  "app/_domain/adoption/confidence/_locales/pt-br.json",
  "app/_domain/adoption/profiles/_locales/pt-br.json",
  "app/_domain/adoption/roles/_locales/pt-br.json",
  "app/_domain/adoption/sources/_locales/pt-br.json",
  "app/_domain/adoption/summary/_locales/pt-br.json",
  "app/(home)/_view/HomeView/_locales/pt-br.json",
  "app/_ui/adoption/components/attention-list/_locales/pt-br.json",
  "app/_ui/adoption/components/cards/_locales/pt-br.json",
  "app/_ui/adoption/components/role-contract-list/_locales/pt-br.json",
  "app/_ui/adoption/components/source-list/_locales/pt-br.json",
  "app/_ui/adoption/components/status/_locales/pt-br.json",
  "app/_ui/shared/_locales/pt-br.json",
  "app/_ui/shell/_locales/pt-br.json",
  "app/onboarding/_components/_locales/pt-br.json",
  "app/onboarding/_model/diagnosis/_locales/pt-br.json",
  "app/onboarding/_steps/AssistantStep/_locales/pt-br.json",
  "app/onboarding/_steps/IntegrationsStep/_locales/pt-br.json",
  "app/onboarding/_steps/PeopleStep/_locales/pt-br.json",
  "app/onboarding/_steps/ProfileDiagnosisStep/_locales/pt-br.json",
  "app/onboarding/_steps/ReviewStep/_locales/pt-br.json",
  "app/onboarding/_steps/SourcesStep/_locales/pt-br.json",
  "app/onboarding/_steps/WelcomeStep/_locales/pt-br.json",
  "app/onboarding/_view/OnboardingView/_locales/pt-br.json",
  "app/settings/_model/_locales/pt-br.json",
  "app/settings/_sections/AdvancedSection/_locales/pt-br.json",
  "app/settings/_sections/AssistantSection/_locales/pt-br.json",
  "app/settings/_sections/IntegrationsSection/_locales/pt-br.json",
  "app/settings/_sections/OrganizationSection/_locales/pt-br.json",
  "app/settings/_sections/RolesSection/_locales/pt-br.json",
  "app/settings/_sections/SourcesSection/_locales/pt-br.json",
  "app/settings/_view/SettingsView/_locales/pt-br.json",
  "app/signup/_view/SignupView/_locales/pt-br.json",
  "app/organizations/_view/OrganizationsView/_locales/pt-br.json",
  "app/(home)/_view/WorkspaceHome/_locales/pt-br.json",
  "app/settings/_view/WorkspaceSettingsView/_locales/pt-br.json",
  "app/console/_view/ConsoleUnavailable/_locales/pt-br.json",
];
const ollamaHealthRouteFile = path.join(
  appDir,
  "app",
  "api",
  "integrations",
  "assistant",
  "ollama",
  "health",
  "route.ts"
);
const legacyActiveArtifacts = [
  path.join(workGraphRoot, "_org-simulation-v2"),
  path.join(workGraphRoot, "_org-simulation-v3"),
  path.join(root, "_apps"),
  path.join(root, "_lib"),
  path.join(root, "_tools"),
  path.join(root, "acme-governance"),
  path.join(root, "repos"),
  path.join(root, "tsconfig.domain.json"),
  path.join(backendRoot, "tools", "build-graph.mjs"),
  path.join(backendRoot, "tools", "check-app-security.mjs"),
  // runtime .mjs migrada para backend/src (TypeScript); a volta é regressão
  path.join(backendRoot, "domain"),
  path.join(backendRoot, "read-model"),
  path.join(backendRoot, "adapters"),
  path.join(backendRoot, "runtime.mjs"),
  path.join(backendRoot, "ports.mjs"),
];

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
    if (relative.startsWith(".local-state/")) return false;
    return /\.(ts|tsx|js|jsx|mjs|css|json)$/.test(relative);
  });
}

function packageName(specifier) {
  if (
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    specifier.startsWith("node:") ||
    specifier.startsWith("@/") ||
    specifier.startsWith("@demo/")
  ) {
    return null;
  }
  const parts = specifier.split("/");
  if (specifier.startsWith("@")) return `${parts[0]}/${parts[1]}`;
  return parts[0];
}

function importedPackages(files: string[]) {
  const packages = new Set<string>();
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

function assertWorkspaceDependencyContract(files: string[]) {
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
for (const artifact of legacyActiveArtifacts) {
  if (fs.existsSync(artifact)) {
    fail(
      `artefato legado ainda na superficie ativa; arquive ou remova: ${path
        .relative(workGraphRoot, artifact)
        .replaceAll("\\", "/")}`
    );
  }
}
if (!fs.existsSync(backendTsconfigFile)) {
  fail("tsconfig do backend ausente: backend/tsconfig.json");
}
if (!fs.existsSync(path.join(backendRoot, "package.json"))) {
  fail("package.json do backend ausente: backend/package.json");
}
if (fs.existsSync(legacyLocaleDir)) {
  fail("locale centralizado legado proibido: frontend/locales");
}
if (fs.existsSync(legacyFeaturesDir)) {
  fail(
    "features globais proibidas no App Router; use rotas + pastas privadas _view/_steps/_sections"
  );
}
if (fs.existsSync(legacyUiDir)) {
  fail("app/ui legado proibido; use app/_ui para infraestrutura compartilhada privada");
}
if (fs.existsSync(legacyViewsDir)) {
  fail("views humanas nao devem viver em _ui/views; use a pasta privada da rota");
}
if (fs.existsSync(legacySharedComponentsFile)) {
  fail("componentes compartilhados devem viver em arquivos proprios sob app/_ui/shared");
}
if (fs.existsSync(legacyOnboardingComponentsFile)) {
  fail(
    "componentes do onboarding devem viver em arquivos proprios; index.ts deve ser apenas barrel"
  );
}
for (const dir of legacyPortugueseRouteDirs) {
  if (fs.existsSync(dir)) {
    fail(`rota fisica deve usar nome canonico em ingles: ${path.relative(appDir, dir)}`);
  }
}
for (const dir of obsoleteLocaleDirs) {
  if (fs.existsSync(dir)) {
    fail(
      `locale em nivel amplo demais; colocalize no componente/view/section: ${path.relative(appDir, dir).replaceAll("\\", "/")}`
    );
  }
}
for (const relativeFile of requiredColocatedLocaleFiles) {
  const file = path.join(appDir, ...relativeFile.split("/"));
  if (!fs.existsSync(file)) {
    fail(`locale colocalizado ausente: ${relativeFile}`);
  }
}
for (const { file, key } of requiredLocaleFiles) {
  if (!fs.existsSync(file)) {
    fail(`locale colocalizado ausente: ${path.relative(appDir, file).replaceAll("\\", "/")}`);
  }
  const locale = JSON.parse(fs.readFileSync(file, "utf8"));
  if (locale.locale !== "pt-br" || !locale.messages?.[key]) {
    fail(
      `locale colocalizado sem contrato minimo (${key}): ${path
        .relative(appDir, file)
        .replaceAll("\\", "/")}`
    );
  }
}
// ── fronteira backend: app consome apenas o SDK (@demo/backend[/domain]) ────
// Import solto de módulo interno (.mjs, backend/src/..., tools/...)
// quebra o contrato de gateway estável para web/native futuros.
for (const file of sourceFiles.filter((item) => /\.(ts|tsx)$/.test(item))) {
  const text = fs.readFileSync(file, "utf8");
  const relative = path.relative(appDir, file).replaceAll("\\", "/");
  const importRegex = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
  for (const match of text.matchAll(importRegex)) {
    const specifier = match[1] || "";
    const isSdkEntry = specifier === "@demo/backend" || specifier === "@demo/backend/domain";
    if (!isSdkEntry && /backend\//.test(specifier)) {
      fail(`import interno do backend fora do SDK (@demo/backend): ${relative} -> ${specifier}`);
    }
    if (specifier.endsWith(".mjs")) {
      fail(
        `import de .mjs proibido no app (backend ativo é TypeScript): ${relative} -> ${specifier}`
      );
    }
  }
}
// ── API local: toda rota declarada no contrato precisa existir como handler ─
const requiredApiRoutes = [
  "app/api/snapshot/route.ts",
  "app/api/commands/dry-run/route.ts",
  "app/api/commands/execute/route.ts",
  "app/api/graph/route.ts",
  "app/api/graph/node/route.ts",
  "app/api/graph/adjacency/route.ts",
  "app/api/graph/path/route.ts",
  "app/api/graph/contract-impact/route.ts",
  "app/api/graph/intent-deps/route.ts",
  "app/api/graph/conflicts/route.ts",
  "app/api/integrations/route.ts",
  "app/api/integrations/[id]/test/route.ts",
  "app/api/integrations/assistant/advisory/route.ts",
  "app/api/contract/route.ts",
];
for (const relativeFile of requiredApiRoutes) {
  if (!fs.existsSync(path.join(appDir, ...relativeFile.split("/")))) {
    fail(`rota da API local declarada no contrato ausente: ${relativeFile}`);
  }
}
// ── fluxo inicial signup → organizações → onboarding → home ────────────────
const requiredFlowRoutes = [
  "app/signup/page.tsx",
  "app/organizations/page.tsx",
  "app/onboarding/page.tsx",
  "app/settings/page.tsx",
  "app/console/page.tsx",
];
for (const relativeFile of requiredFlowRoutes) {
  if (!fs.existsSync(path.join(appDir, ...relativeFile.split("/")))) {
    fail(`rota obrigatoria do fluxo inicial ausente: ${relativeFile}`);
  }
}
// A rota raiz e as rotas de contexto precisam resolver o estado inicial
// (principal/organização/onboarding) no servidor antes de renderizar.
const gatedPages = [
  "app/(home)/page.tsx",
  "app/signup/page.tsx",
  "app/onboarding/page.tsx",
  "app/settings/page.tsx",
  "app/console/page.tsx",
  "app/organizations/page.tsx",
];
for (const relativeFile of gatedPages) {
  const text = fs.readFileSync(path.join(appDir, ...relativeFile.split("/")), "utf8");
  if (!text.includes("resolveAdoptionGate")) {
    fail(`pagina sem gate de estado inicial (resolveAdoptionGate): ${relativeFile}`);
  }
}
// A UI não pode assumir a acme como realidade do usuário: snapshot governado
// só entra em página que distingue a organização demo.
for (const relativeFile of gatedPages) {
  const text = fs.readFileSync(path.join(appDir, ...relativeFile.split("/")), "utf8");
  if (text.includes("loadGovernanceSnapshot") && !text.includes("isDemo")) {
    fail(`pagina carrega snapshot da demo sem distinguir organização demo: ${relativeFile}`);
  }
}
// Sessão/estado local: sem localStorage na UI (gateway é fetch + cookie httpOnly
// + arquivo no servidor local); o dominio compartilhado fica livre de framework.
for (const file of readRelativeFiles()) {
  const relative = path.relative(appDir, file).replaceAll("\\", "/");
  if (!/\.(ts|tsx)$/.test(relative)) continue;
  const text = fs.readFileSync(file, "utf8");
  if (/localStorage/.test(text)) {
    fail(`localStorage proibido (use o shell local via /api/local/*): ${relative}`);
  }
}
const domainDir = path.join(backendRoot, "src", "domain");
for (const file of walk(domainDir).filter((item) => /\.ts$/.test(item))) {
  const text = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file).replaceAll("\\", "/");
  if (/from "(next|react|@mui|node:fs|node:path|node:child_process|yaml)/.test(text)) {
    fail(`dominio compartilhado deve ser puro (sem framework/fs/yaml): ${relative}`);
  }
}
// backend ativo é TypeScript: .mjs só sobrevive como shim técnico ou fixture fora de src
for (const file of walk(path.join(backendRoot, "src"))) {
  if (/\.(mjs|jsx|js)$/.test(file)) {
    fail(
      `backend/src deve ser TypeScript puro: ${path.relative(root, file).replaceAll("\\", "/")}`
    );
  }
}

if (!fs.existsSync(ollamaHealthRouteFile)) {
  fail("rota de health-check do Ollama ausente");
}
const ollamaHealthRoute = fs.readFileSync(ollamaHealthRouteFile, "utf8");
if (!ollamaHealthRoute.includes('const CHECKED_PATH = "/api/tags"')) {
  fail("health-check do Ollama deve consultar somente /api/tags");
}
if (/\/api\/(chat|generate|embeddings)/.test(ollamaHealthRoute)) {
  fail("health-check do Ollama nao pode chamar endpoints que enviam prompt/contexto");
}
if (!ollamaHealthRoute.includes("isAllowedLocalEndpoint")) {
  fail("health-check do Ollama deve bloquear endpoint nao-local por padrao");
}
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
  if (/\.(ts|tsx)$/.test(relative)) {
    const lineCount = text.split(/\r?\n/).length;
    if (lineCount > 320) {
      fail(`arquivo de app grande demais (${lineCount} linhas): ${relative}`);
    }
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

const tscBin = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");
const backendTsc = spawnSync(process.execPath, [tscBin, "-p", backendTsconfigFile], {
  cwd: backendRoot,
  stdio: "inherit",
  shell: false,
});
if (backendTsc.status !== 0) fail("typecheck strict do backend falhou");

const backendShellTests = spawnSync(process.execPath, ["--test", "tests/**/*.test.ts"], {
  cwd: backendRoot,
  stdio: "inherit",
  shell: false,
});
if (backendShellTests.status !== 0) fail("testes do shell de adoção falharam");

// Camada de API in-memory (mock-api Hono via app.request) faz parte do caminho
// oficial de verificação: typecheck strict + node:test, sem servidor/browser.
const mockApiRoot = path.join(root, "mock-api");
const mockApiTsc = spawnSync(
  process.execPath,
  [tscBin, "-p", path.join(mockApiRoot, "tsconfig.json")],
  { cwd: mockApiRoot, stdio: "inherit", shell: false }
);
if (mockApiTsc.status !== 0) fail("typecheck strict da mock-api falhou");

const mockApiTests = spawnSync(process.execPath, ["--test", "tests/**/*.test.ts"], {
  cwd: mockApiRoot,
  stdio: "inherit",
  shell: false,
});
if (mockApiTests.status !== 0) fail("testes de API in-memory da mock-api falharam");

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

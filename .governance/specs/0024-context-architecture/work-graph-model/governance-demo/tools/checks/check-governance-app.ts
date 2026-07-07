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
const packagesRoot = path.join(root, "packages");
const domainPackageRoot = path.join(packagesRoot, "domain");
const contractsPackageRoot = path.join(packagesRoot, "contracts");
const testFixturesPackageRoot = path.join(packagesRoot, "test-fixtures");
const acmeRoot = path.join(root, "acme");
const acmeGovernanceRoot = path.join(acmeRoot, "governance");
const acmeReposRoot = path.join(acmeRoot, "repos");
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
const requiredAcmeGovernanceDirs = [
  "business",
  "contracts",
  "decisions",
  "events",
  "incidents",
  "intake",
  "intents",
  "outcomes",
];
const requiredAcmeGovernanceFiles = ["authorities.yml", "org.yml", "repos.yml", "trust-policy.yml"];
const forbiddenAcmeGovernanceDirs = [
  "standalone",
  "registers",
  "repos",
  "works",
  "_apps",
  "_lib",
  "_tools",
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

function assertAcmeFixtureLayout() {
  if (!fs.existsSync(acmeGovernanceRoot)) {
    fail("fixture acme sem host central: acme/governance");
  }
  if (!fs.existsSync(acmeReposRoot)) {
    fail("fixture acme sem repos adotados: acme/repos");
  }

  const acmeTopLevelDirs = fs
    .readdirSync(acmeRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const unexpectedTopLevel = acmeTopLevelDirs.filter(
    (name) => !["governance", "repos"].includes(name)
  );
  if (unexpectedTopLevel.length > 0) {
    fail(`fixture acme com diretorio de topo inesperado: ${unexpectedTopLevel.join(", ")}`);
  }

  for (const dir of requiredAcmeGovernanceDirs) {
    if (!fs.existsSync(path.join(acmeGovernanceRoot, dir))) {
      fail(`host acme/governance sem diretorio obrigatorio: ${dir}`);
    }
  }
  for (const file of requiredAcmeGovernanceFiles) {
    if (!fs.existsSync(path.join(acmeGovernanceRoot, file))) {
      fail(`host acme/governance sem arquivo obrigatorio: ${file}`);
    }
  }
  for (const dir of forbiddenAcmeGovernanceDirs) {
    if (fs.existsSync(path.join(acmeGovernanceRoot, dir))) {
      fail(`diretorio legado/proibido dentro do host acme/governance: ${dir}`);
    }
  }

  const reposDoc = parse(fs.readFileSync(path.join(acmeGovernanceRoot, "repos.yml"), "utf8"));
  const expectedRepoIds = (reposDoc.repos || []).map((repo) => repo.id).sort();
  const repoDirs = fs
    .readdirSync(acmeReposRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const missingRepoDirs = expectedRepoIds.filter((id) => !repoDirs.includes(id));
  const extraRepoDirs = repoDirs.filter((id) => !expectedRepoIds.includes(id));
  if (missingRepoDirs.length > 0) {
    fail(`repos.yml referencia repo sem pasta em acme/repos: ${missingRepoDirs.join(", ")}`);
  }
  if (extraRepoDirs.length > 0) {
    fail(`acme/repos tem pasta nao declarada em repos.yml: ${extraRepoDirs.join(", ")}`);
  }

  for (const repoId of expectedRepoIds) {
    const repoRoot = path.join(acmeReposRoot, repoId);
    const sidecar = path.join(repoRoot, ".governance");
    if (!fs.existsSync(sidecar)) {
      fail(`repo adotado sem sidecar .governance: acme/repos/${repoId}`);
    }
    for (const file of ["manifest.yml", "context.json"]) {
      if (!fs.existsSync(path.join(sidecar, file))) {
        fail(`repo adotado sem ${file}: acme/repos/${repoId}/.governance`);
      }
    }
    if (!fs.existsSync(path.join(sidecar, "works"))) {
      fail(`repo adotado sem diretorio works: acme/repos/${repoId}/.governance`);
    }
    if (fs.existsSync(path.join(repoRoot, ".governance-host"))) {
      fail(`fixture acme usa host central; .governance-host embutido inesperado em ${repoId}`);
    }
  }
}

function assertWorkspaceDependencyContract(files: string[]) {
  const rootPackage = JSON.parse(fs.readFileSync(rootPackageFile, "utf8"));
  const appPackage = JSON.parse(fs.readFileSync(appPackageFile, "utf8"));
  const appWorkspacePath = path.relative(repoRoot, appDir).replaceAll("\\", "/");
  const requiredWorkspaces = [
    domainPackageRoot,
    contractsPackageRoot,
    testFixturesPackageRoot,
    backendRoot,
    appDir,
    path.join(root, "mock-api"),
    path.join(root, "test"),
  ].map((item) => path.relative(repoRoot, item).replaceAll("\\", "/"));
  for (const workspacePath of requiredWorkspaces) {
    if (!rootPackage.workspaces?.includes(workspacePath)) {
      fail(`workspace da governance-demo ausente no package.json raiz: ${workspacePath}`);
    }
  }
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
assertAcmeFixtureLayout();
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
// ── fronteira de pacotes: app consome SDK de aplicação + contratos compartilhados ─
// Import solto de módulo interno (.mjs, backend/src/..., tools/...)
// quebra o contrato de gateway estável para web/native futuros.
const legacyTypeBarrel = path.join(appDir, "lib", "types.ts");
if (fs.existsSync(legacyTypeBarrel)) {
  fail("frontend/lib/types.ts e barrel decorativo; use @demo/contracts para tipos compartilhados");
}
const legacyBackendFacade = path.join(appDir, "lib", "governance-server.ts");
if (fs.existsSync(legacyBackendFacade)) {
  fail(
    "frontend/lib/governance-server.ts e facade decorativo; importe @demo/backend diretamente em server routes/pages"
  );
}
for (const file of sourceFiles.filter((item) => /\.(ts|tsx)$/.test(item))) {
  const text = fs.readFileSync(file, "utf8");
  const relative = path.relative(appDir, file).replaceAll("\\", "/");
  const importRegex = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
  for (const match of text.matchAll(importRegex)) {
    const specifier = match[1] || "";
    if (specifier === "@/lib/types") {
      fail(`import legado de tipos no frontend; use @demo/contracts: ${relative}`);
    }
    if (specifier === "@/lib/governance-server") {
      fail(`facade server-side decorativo no frontend; use @demo/backend: ${relative}`);
    }
    const isSdkEntry =
      specifier === "@demo/backend" ||
      specifier === "@demo/domain" ||
      specifier === "@demo/domain/browser" ||
      specifier === "@demo/contracts";
    if (specifier === "@demo/domain/server") {
      fail(
        `entrypoint server-only do dominio proibido no app; use @demo/domain ou @demo/contracts: ${relative} -> ${specifier}`
      );
    }
    // Qualquer subpath do dominio alem de @demo/domain/browser expoe modulo
    // server-only (node:crypto/validadores) no bundle do app; so o entry raiz
    // (browser-safe) e o alias ./browser sao permitidos.
    if (specifier.startsWith("@demo/domain/") && specifier !== "@demo/domain/browser") {
      fail(
        `subpath do dominio proibido no app (server-only fora do SDK); use @demo/domain ou @demo/contracts: ${relative} -> ${specifier}`
      );
    }
    if (specifier === "@demo/backend/domain") {
      fail(
        `contrato de dominio nao deve sair do backend; use @demo/domain: ${relative} -> ${specifier}`
      );
    }
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
// APP-45: Better Auth é integração Next.js do portal; TanStack Query é cache
// de dados governados, não runtime de auth.
const authRouteFile = path.join(appDir, "app", "api", "auth", "[...all]", "route.ts");
const authServerFile = path.join(appDir, "server", "auth", "portal-auth.ts");
const authClientFile = path.join(appDir, "app", "_domain", "auth", "auth-client.ts");
const sensitiveCacheFile = path.join(appDir, "app", "_domain", "cache", "sensitive-query-cache.ts");
for (const file of [authRouteFile, authServerFile, authClientFile, sensitiveCacheFile]) {
  if (!fs.existsSync(file)) {
    fail(`APP-45 sem artefato obrigatorio: ${path.relative(appDir, file).replaceAll("\\", "/")}`);
  }
}
const authRouteText = fs.readFileSync(authRouteFile, "utf8");
if (!authRouteText.includes("better-auth/next-js") || !authRouteText.includes("toNextJsHandler")) {
  fail("APP-45 exige Better Auth pela integracao Next.js: app/api/auth/[...all]/route.ts");
}
if (authRouteText.includes("tanstack-start")) {
  fail("APP-45 proibe integrar auth via TanStack Start no app Next");
}
const authClientText = fs.readFileSync(authClientFile, "utf8");
if (!authClientText.includes("better-auth/react") || !authClientText.includes("createAuthClient")) {
  fail("APP-45 exige auth-client React oficial do Better Auth");
}
if (
  !authClientText.includes("better-auth/client/plugins") ||
  !authClientText.includes("organizationClient")
) {
  fail("APP-45 exige client de organizacao do Better Auth para convites/memberships de portal");
}
const sensitiveCacheText = fs.readFileSync(sensitiveCacheFile, "utf8");
if (
  !sensitiveCacheText.includes("SensitiveCacheEventSchema") ||
  !sensitiveCacheText.includes("sensitiveQueryCacheDirective") ||
  !sensitiveCacheText.includes("QueryClient")
) {
  fail("APP-45 exige helper TanStack Query usando o contrato Zod de eventos sensiveis");
}
if (!sensitiveCacheText.includes("workspace") || !sensitiveCacheText.includes("governance-demo")) {
  fail("APP-45 exige limpar/invalidate tanto query key escopada quanto legado workspace");
}
// Rotas ja migradas para contrato runtime Zod. O guard evita regressao para
// validacao manual/ad hoc nos pontos que viraram schema compartilhado.
const zodContractRoutes = [
  {
    file: "app/api/local/signup/route.ts",
    schema: "SignupRequestSchema",
  },
  {
    file: "app/api/local/organizations/route.ts",
    schema: "OrganizationRequestSchema",
  },
  {
    file: "app/api/local/organizations/select/route.ts",
    schema: "SelectOrganizationRequestSchema",
  },
  {
    file: "app/api/local/onboarding/status/route.ts",
    schema: "OnboardingStatusRequestSchema",
  },
  {
    file: "app/api/local/onboarding/path/route.ts",
    schema: "OnboardingPathRequestSchema",
  },
  {
    file: "app/api/local/onboarding/profile/route.ts",
    schema: "ProfileDeclarationRequestSchema",
  },
  {
    file: "app/api/local/onboarding/workspace-mode/route.ts",
    schema: "WorkspaceModeRequestSchema",
  },
  {
    file: "app/api/local/onboarding/stack/route.ts",
    schema: "WorkspaceStackRequestSchema",
  },
  {
    file: "app/api/local/members/route.ts",
    schema: "InvitePersonRequestSchema",
  },
  {
    file: "app/api/local/members/groups/route.ts",
    schema: "CreateGroupRequestSchema",
  },
  {
    file: "app/api/local/members/invites/[id]/route.ts",
    schema: "InviteDecisionRequestSchema",
  },
  {
    file: "app/api/local/roles/route.ts",
    schema: "AssignRoleRequestSchema",
  },
  {
    file: "app/api/local/roles/[id]/route.ts",
    schema: "RoleDecisionRequestSchema",
  },
  {
    file: "app/api/local/governance-host/route.ts",
    schema: "GovernanceHostRequestSchema",
  },
  {
    file: "app/api/local/work-sources/route.ts",
    schema: "AddWorkSourceRequestSchema",
  },
  {
    file: "app/api/local/work-sources/[id]/scan/route.ts",
    schema: "WorkSourceScanRequestSchema",
  },
  {
    file: "app/api/local/work-sources/[id]/browser-scan/route.ts",
    schema: "BrowserWorkSourceScanRequestSchema",
  },
  {
    file: "app/api/local/assistant/route.ts",
    schema: "SaveAssistantProviderRequestSchema",
  },
  {
    file: "app/api/local/assistant/defaults/route.ts",
    schema: "AssistantDefaultRequestSchema",
  },
  {
    file: "app/api/local/assistant/test/route.ts",
    schema: "AssistantProviderTestRequestSchema",
  },
  {
    file: "app/api/local/integrations/[id]/route.ts",
    schema: "IntegrationStatusRequestSchema",
  },
];
for (const route of zodContractRoutes) {
  const file = path.join(appDir, ...route.file.split("/"));
  if (!fs.existsSync(file)) {
    fail(`rota com contrato Zod ausente: ${route.file}`);
  }
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes(route.schema)) {
    fail(`rota sem schema Zod esperado (${route.schema}): ${route.file}`);
  }
  if (!text.includes("parseZodJson")) {
    fail(`rota sem parser Zod compartilhado: ${route.file}`);
  }
  if (!text.includes("@demo/contracts")) {
    fail(`rota deve importar schemas de @demo/contracts: ${route.file}`);
  }
}
for (const relativeFile of walk(path.join(appDir, "app", "api", "local")).filter((file) =>
  file.endsWith("route.ts")
)) {
  const normalized = path.relative(appDir, relativeFile).replace(/\\/g, "/");
  if (normalized === "app/api/local/_shared/parse-zod-request.ts") continue;
  const text = fs.readFileSync(relativeFile, "utf8");
  if (text.includes("request.json(")) {
    fail(`rota /api/local com parsing JSON manual em vez de parseZodJson: ${normalized}`);
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
  const isQueryProvider = relative === "app/_providers/QueryProvider.tsx";
  const isVisualSpike = relative.startsWith("app/spikes/visual-stack/");
  if (!isQueryProvider && !isVisualSpike && /QueryClientProvider|new QueryClient/.test(text)) {
    fail(
      `QueryClient local proibido em tela de produto; use app/_providers/QueryProvider.tsx: ${relative}`
    );
  }
}
if (fs.existsSync(path.join(backendRoot, "src", "domain"))) {
  fail("shared kernel nao deve morar em backend/src/domain; use packages/domain/src");
}
if (fs.existsSync(path.join(backendRoot, "src", "shared"))) {
  fail("backend/src/shared cria caixa generica; use application, ports, adapters ou api");
}
const domainDir = path.join(domainPackageRoot, "src");
for (const file of walk(domainDir).filter((item) => /\.ts$/.test(item))) {
  const text = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file).replaceAll("\\", "/");
  if (
    /from "(next|react|@mui|hono|lowdb|@playwright|node:fs|node:path|node:child_process|yaml)/.test(
      text
    )
  ) {
    fail(`dominio compartilhado deve ser puro (sem framework/fs/yaml): ${relative}`);
  }
  if (/(backend\/|frontend\/|mock-api\/|test\/|tools\/)/.test(text)) {
    fail(`dominio compartilhado nao pode importar camadas da demo: ${relative}`);
  }
}
for (const packageRoot of [contractsPackageRoot, testFixturesPackageRoot]) {
  const packageName = path.basename(packageRoot);
  for (const file of walk(path.join(packageRoot, "src")).filter((item) => /\.ts$/.test(item))) {
    const text = fs.readFileSync(file, "utf8");
    const relative = path.relative(root, file).replaceAll("\\", "/");
    if (/(backend\/src|frontend\/|mock-api\/src|test\/journeys|tools\/)/.test(text)) {
      fail(`package ${packageName} nao pode importar camada concreta da demo: ${relative}`);
    }
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
for (const [label, packageRoot] of [
  ["@demo/domain", domainPackageRoot],
  ["@demo/contracts", contractsPackageRoot],
  ["@demo/test-fixtures", testFixturesPackageRoot],
] as const) {
  const packageTsc = spawnSync(
    process.execPath,
    [tscBin, "-p", path.join(packageRoot, "tsconfig.json")],
    {
      cwd: packageRoot,
      stdio: "inherit",
      shell: false,
    }
  );
  if (packageTsc.status !== 0) fail(`typecheck strict de ${label} falhou`);
}
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

const sharedPortalComposeCheck = spawnSync(
  process.execPath,
  [path.join(root, "tools", "checks", "check-shared-portal-compose.ts")],
  {
    cwd: root,
    stdio: "inherit",
    shell: false,
  }
);
if (sharedPortalComposeCheck.status !== 0) {
  fail("check do Docker Compose do portal compartilhado falhou");
}

const environmentContractCheck = spawnSync(
  process.execPath,
  [path.join(root, "tools", "checks", "check-environment-contract.ts")],
  {
    cwd: root,
    stdio: "inherit",
    shell: false,
  }
);
if (environmentContractCheck.status !== 0) {
  fail("check do contrato de ambientes dev/test/prod falhou");
}

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

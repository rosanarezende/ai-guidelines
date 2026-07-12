// check-environment-contract.ts — keeps dev/test/prod modes explicit.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.resolve(here, "..", "..");
const frontendRoot = path.join(demoRoot, "frontend");
const backendRoot = path.join(demoRoot, "backend");
const mockApiRoot = path.join(demoRoot, "mock-api");
const e2eRoot = path.join(demoRoot, "test");

function fail(message: string): never {
  console.error(`✗ environment contract — ${message}`);
  process.exit(1);
}

function readText(relativePath: string): string {
  const file = path.join(demoRoot, ...relativePath.split("/"));
  if (!fs.existsSync(file)) fail(`arquivo obrigatorio ausente: ${relativePath}`);
  return fs.readFileSync(file, "utf8");
}

function readPackage(root: string): { scripts?: Record<string, string> } {
  return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
}

function assertScript(
  packageLabel: string,
  scripts: Record<string, string> | undefined,
  name: string,
  requiredFragment?: string
) {
  const value = scripts?.[name];
  if (!value) fail(`${packageLabel} sem script obrigatorio: ${name}`);
  if (requiredFragment && !value.includes(requiredFragment)) {
    fail(`${packageLabel} script ${name} deve conter: ${requiredFragment}`);
  }
}

const frontendPackage = readPackage(frontendRoot);
const backendPackage = readPackage(backendRoot);
const mockApiPackage = readPackage(mockApiRoot);
const e2ePackage = readPackage(e2eRoot);

for (const [name, fragment] of [
  ["dev", "next dev"],
  ["dev:real", "next dev"],
  ["dev:mock", "../mock-api/src/dev-app.ts"],
  ["build", "next build"],
  ["start", "next start"],
] as const) {
  assertScript("frontend", frontendPackage.scripts, name, fragment);
}

assertScript("backend", backendPackage.scripts, "typecheck", "tsc -p");
assertScript("backend", backendPackage.scripts, "test:shell", "node --test");

for (const [name, fragment] of [
  ["dev", "src/server.ts"],
  ["reset", "src/reset.ts"],
  ["typecheck", "tsc -p"],
  ["test:api", "node --test"],
] as const) {
  assertScript("mock-api", mockApiPackage.scripts, name, fragment);
}

for (const [name, fragment] of [
  ["contracts:check", "check-app-contracts.ts"],
  ["typecheck", "tsc -p"],
  ["test:e2e", "playwright test"],
  ["test:e2e:ui", "playwright test --ui"],
  ["test:e2e:report", "playwright show-report"],
] as const) {
  assertScript("e2e", e2ePackage.scripts, name, fragment);
}

const dataSource = readText("frontend/server/adoption/data-source.ts");
for (const expected of [
  'export type GovernanceDataSource = "real-runtime" | "mock-api" | "demo-acme"',
  'export type GovernanceAppEnv = "development" | "test" | "production"',
  "GOVERNANCE_DATA_SOURCE=mock-api é proibida em produção",
  'GOVERNANCE_API_BASE_URL || "http://127.0.0.1:3025"',
] as const) {
  if (!dataSource.includes(expected)) fail(`data-source.ts sem contrato esperado: ${expected}`);
}

const portalAuth = readText("frontend/server/auth/portal-auth.ts");
for (const expected of [
  'resolveAppEnv() === "production"',
  "BETTER_AUTH_SECRET is required for the governance portal in production-like runtime",
] as const) {
  if (!portalAuth.includes(expected)) fail(`portal-auth.ts sem contrato de segredo: ${expected}`);
}

const devApp = readText("mock-api/src/dev-app.ts");
for (const expected of [
  'GOVERNANCE_DATA_SOURCE: "mock-api"',
  "GOVERNANCE_API_BASE_URL",
  'GOVERNANCE_APP_ENV: "development"',
] as const) {
  if (!devApp.includes(expected)) fail(`dev-app.ts sem env mock explicita: ${expected}`);
}

const playwright = readText("test/playwright.config.ts");
for (const expected of [
  'GOVERNANCE_DATA_SOURCE: "mock-api"',
  'GOVERNANCE_APP_ENV: "test"',
  "PLAYWRIGHT_REUSE_EXISTING_SERVER",
] as const) {
  if (!playwright.includes(expected)) fail(`playwright.config.ts sem contrato: ${expected}`);
}

const envDoc = readText("ENVIRONMENTS.md");
for (const expected of [
  "development:real-runtime",
  "development:mock-api",
  "development:shared-db",
  "test:e2e",
  "production-like",
  "SQLite/local-solo does **not** need Docker.",
  "mock-api` is prohibited",
] as const) {
  if (!envDoc.includes(expected)) fail(`ENVIRONMENTS.md sem secao/frase: ${expected}`);
}

const frontendReadme = readText("frontend/README.md");
for (const expected of [
  "GOVERNANCE_DATA_SOURCE=real-runtime | mock-api | demo-acme",
  "npm --workspace acme-governance-next-app run dev:mock",
  "mock proibida em produção",
] as const) {
  if (!frontendReadme.includes(expected)) fail(`frontend/README.md sem contrato: ${expected}`);
}

const mockReadme = readText("mock-api/README.md");
if (!mockReadme.includes("Em produção, `mock-api` é proibida.")) {
  fail("mock-api/README.md deve declarar proibicao em producao");
}

const e2eReadme = readText("test/README.md");
if (!e2eReadme.includes("GOVERNANCE_DATA_SOURCE=mock-api")) {
  fail("test/README.md deve declarar modo mock do e2e");
}

const composeReadme = readText("deploy/shared-portal/README.md");
for (const expected of [
  "PostgreSQL only",
  "SQLite does not need Docker",
  "not decide the final hosting provider",
] as const) {
  if (!composeReadme.includes(expected)) {
    fail(`deploy/shared-portal/README.md sem contrato: ${expected}`);
  }
}

console.log("✓ environment contract — dev/test/prod modes and scripts are documented");

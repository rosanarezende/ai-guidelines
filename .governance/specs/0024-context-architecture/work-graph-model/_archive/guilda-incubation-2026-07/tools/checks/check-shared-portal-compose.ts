// check-shared-portal-compose.ts — keeps the shared-portal compose path honest.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.resolve(here, "..", "..");
const deployDir = path.join(demoRoot, "deploy", "shared-portal");
const composeFile = path.join(deployDir, "docker-compose.yml");
const envExampleFile = path.join(deployDir, ".env.example");
const readmeFile = path.join(deployDir, "README.md");

function fail(message: string): never {
  console.error(`✗ shared portal compose — ${message}`);
  process.exit(1);
}

function readRequired(file: string): string {
  if (!fs.existsSync(file)) {
    fail(`arquivo obrigatorio ausente: ${path.relative(demoRoot, file).replaceAll("\\", "/")}`);
  }
  return fs.readFileSync(file, "utf8");
}

function assertIncludes(text: string, expected: string, label: string) {
  if (!text.includes(expected)) {
    fail(`${label} deve conter ${expected}`);
  }
}

const compose = readRequired(composeFile);
const envExample = readRequired(envExampleFile);
const readme = readRequired(readmeFile);

for (const [expected, label] of [
  ["postgres:16-alpine", "compose"],
  ["POSTGRES_DB", "compose"],
  ["POSTGRES_USER", "compose"],
  ["POSTGRES_PASSWORD", "compose"],
  ["GOVERNANCE_PORTAL_POSTGRES_PORT", "compose"],
  ["pg_isready", "compose"],
  ["governance-portal-postgres-data", "compose"],
  ["/var/lib/postgresql/data", "compose"],
] as const) {
  assertIncludes(compose, expected, label);
}

for (const [expected, label] of [
  ["GOVERNANCE_PORTAL_POSTGRES_PORT=55432", ".env.example"],
  ["POSTGRES_DB=governance_portal", ".env.example"],
  ["POSTGRES_USER=governance", ".env.example"],
  ["POSTGRES_PASSWORD=change-me-local", ".env.example"],
] as const) {
  assertIncludes(envExample, expected, label);
}

for (const [expected, label] of [
  ["SQLite does not need Docker", "README"],
  ["docker compose up -d postgres", "README"],
  ["GOVERNANCE_PORTAL_POSTGRES_URL", "README"],
  ["docker compose down -v", "README"],
  ["not decide the final hosting provider", "README"],
] as const) {
  assertIncludes(readme, expected, label);
}

if (/GOVERNANCE_PORTAL_POSTGRES_URL\s*=/.test(envExample)) {
  fail(".env.example nao deve guardar connection string completa com senha");
}

if (/neo4j/i.test(compose)) {
  fail("compose do portal compartilhado nao deve subir read-model Neo4j");
}

if (!compose.includes("$${POSTGRES_USER}") || !compose.includes("$${POSTGRES_DB}")) {
  fail("healthcheck deve escapar variaveis do container com $$");
}

console.log("✓ shared portal compose — postgres dev profile is documented and checked");

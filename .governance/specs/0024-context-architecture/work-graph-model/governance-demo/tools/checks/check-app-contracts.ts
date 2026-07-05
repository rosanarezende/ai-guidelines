// check-app-contracts.ts — lint da suíte de contratos funcionais da governance-demo.
//
// Objetivo: impedir que o contrato de produto vire documentação solta.
// Cruza app-contracts.yml com specs Playwright, seeds da mock-api e rotas reais
// do Next. Contratos em rotas existentes devem rodar como expected-fail; rotas
// ainda inexistentes podem ficar fixme.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { seedNames } from "../../mock-api/src/seeds/index.ts";

type ContractStatus = "active" | "expected-fail" | "fixme" | "skip" | "manual";

type ContractDoc = {
  seed_matrix?: Record<string, string>;
  contracts?: Contract[];
};

type Contract = {
  id: string;
  status: ContractStatus;
  spec: string;
  seed: string;
  surfaces?: string[];
};

const here = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.resolve(here, "..", "..");
const appRoot = path.join(demoRoot, "frontend", "app");
const contractsFile = path.join(demoRoot, "test", "contracts", "app-contracts.yml");
const journeysRoot = path.join(demoRoot, "test", "journeys");

const knownNonRoutes = new Set(["shell", "Cup"]);
const allowedStatuses = new Set<ContractStatus>([
  "active",
  "expected-fail",
  "fixme",
  "skip",
  "manual",
]);

function fail(message: string): never {
  console.error(`✗ app-contracts: ${message}`);
  process.exit(1);
}

function readText(file: string): string {
  return fs.readFileSync(file, "utf8");
}

function walkFiles(dir: string, predicate: (file: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(full, predicate);
    return entry.isFile() && predicate(full) ? [full] : [];
  });
}

function routeForPage(file: string): string {
  const relative = path.relative(appRoot, path.dirname(file));
  if (!relative) return "/";
  const segments = relative
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !segment.startsWith("_"))
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));
  return `/${segments.join("/")}`.replace(/\/+$/, "") || "/";
}

function listAppRoutes(): Set<string> {
  return new Set(
    walkFiles(appRoot, (file) => path.basename(file) === "page.tsx").map((file) =>
      routeForPage(file)
    )
  );
}

function routeSurfaces(contract: Contract): string[] {
  return (contract.surfaces || []).filter(
    (surface) => surface.startsWith("/") && !knownNonRoutes.has(surface)
  );
}

function loadContracts(): ContractDoc {
  return parse(readText(contractsFile)) as ContractDoc;
}

function assertUniqueIds(contracts: Contract[]): void {
  const seen = new Set<string>();
  for (const contract of contracts) {
    if (seen.has(contract.id)) fail(`ID duplicado: ${contract.id}`);
    seen.add(contract.id);
  }
}

function assertSeeds(doc: ContractDoc, contracts: Contract[]): void {
  const matrix = new Set(Object.keys(doc.seed_matrix || {}));
  const availableSeeds = new Set(seedNames());

  for (const seed of matrix) {
    if (!availableSeeds.has(seed)) fail(`seed_matrix referencia seed inexistente: ${seed}`);
  }
  for (const seed of availableSeeds) {
    if (!matrix.has(seed)) fail(`mock-api expoe seed sem seed_matrix: ${seed}`);
  }
  for (const contract of contracts) {
    if (!matrix.has(contract.seed)) {
      fail(`${contract.id} usa seed fora da seed_matrix: ${contract.seed}`);
    }
  }
}

function assertSpecs(contracts: Contract[]): void {
  const contractIds = new Set(contracts.map((contract) => contract.id));
  const specFiles = walkFiles(journeysRoot, (file) => file.endsWith(".spec.ts"));
  const specTextByRelative = new Map(
    specFiles.map((file) => [
      path.relative(path.join(demoRoot, "test"), file).replace(/\\/g, "/"),
      readText(file),
    ])
  );

  for (const contract of contracts) {
    const text = specTextByRelative.get(contract.spec);
    if (!text) fail(`${contract.id} aponta para spec inexistente: ${contract.spec}`);
    if (!text.includes(contract.id)) fail(`${contract.id} nao aparece no spec ${contract.spec}`);

    const pendingCall = new RegExp(
      `pendingContract\\("${contract.id}",\\s*"${contract.status}"\\)`
    );
    if (contract.status === "fixme" || contract.status === "expected-fail") {
      if (!pendingCall.test(text)) {
        fail(
          `${contract.id} precisa chamar pendingContract("${contract.id}", "${contract.status}")`
        );
      }
    }
    if (contract.status === "active" && pendingCall.test(text)) {
      fail(`${contract.id} esta active mas ainda chama pendingContract`);
    }
  }

  const declaredInSpecs = new Set<string>();
  for (const text of specTextByRelative.values()) {
    for (const match of text.matchAll(/\b(APP|INT|SEC|CUP|CONS)-\d+\b/g)) {
      declaredInSpecs.add(match[0]);
    }
  }
  for (const id of declaredInSpecs) {
    if (!contractIds.has(id)) fail(`spec referencia ID sem contrato YAML: ${id}`);
  }
}

function assertRoutePolicy(contracts: Contract[]): void {
  const routes = listAppRoutes();
  for (const contract of contracts) {
    const routeSurfs = routeSurfaces(contract);
    const existing = routeSurfs.filter((surface) => routes.has(surface));
    const missing = routeSurfs.filter((surface) => !routes.has(surface));

    if (contract.status === "expected-fail" && existing.length === 0) {
      fail(
        `${contract.id} esta expected-fail mas nenhuma superficie existe (${routeSurfs.join(", ")})`
      );
    }
    if (contract.status === "fixme" && routeSurfs.length > 0 && missing.length === 0) {
      fail(`${contract.id} esta fixme mas todas as rotas existem; use expected-fail`);
    }
    if (contract.status === "active" && missing.length > 0) {
      fail(`${contract.id} esta active mas cita rota inexistente: ${missing.join(", ")}`);
    }
  }
}

const doc = loadContracts();
const contracts = doc.contracts || [];
if (contracts.length === 0) fail("nenhum contrato encontrado");

for (const contract of contracts) {
  if (!allowedStatuses.has(contract.status)) {
    fail(`${contract.id} usa status invalido: ${contract.status}`);
  }
}

assertUniqueIds(contracts);
assertSeeds(doc, contracts);
assertSpecs(contracts);
assertRoutePolicy(contracts);

const statusCounts = contracts.reduce<Record<string, number>>((acc, contract) => {
  acc[contract.status] = (acc[contract.status] || 0) + 1;
  return acc;
}, {});

console.log(
  `✓ app-contracts — ${contracts.length} contratos, ${seedNames().length} seeds, ${listAppRoutes().size} rotas, status ${JSON.stringify(statusCounts)}`
);

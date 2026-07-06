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
import { seedNames } from "@demo/test-fixtures";

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
  deny?: boolean;
};

const here = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.resolve(here, "..", "..");
const appRoot = path.join(demoRoot, "frontend", "app");
const contractsFile = path.join(demoRoot, "test", "contracts", "app-contracts.yml");
const iterationMapFile = path.join(demoRoot, "APP-ITERATION-MAP.md");
const journeysRoot = path.join(demoRoot, "test", "journeys");
const seedCoverageRegressionFile = path.join(demoRoot, "backend", "tests", "seed-coverage.test.ts");

// "state" marca contrato de mecanismo/estado derivado (sem tela); é ignorado
// pela política de rota, como "shell"/"Cup".
const knownNonRoutes = new Set(["shell", "Cup", "state"]);
const infraSurfaceGates = new Set(["Cup"]);

function isDenyContract(contract: Contract): boolean {
  return contract.deny === true;
}
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

// Casa uma superfície de contrato contra as rotas reais, tratando segmentos
// dinâmicos do Next (`[id]`) como coringa: `/integrations/[id]` cobre
// `/integrations/123`. Sem isso, uma rota dinâmica futura passaria como ausente.
function routeExists(surface: string, routes: Set<string>): boolean {
  if (routes.has(surface)) return true;
  const surfaceSegments = surface.split("/").filter(Boolean);
  for (const route of routes) {
    const routeSegments = route.split("/").filter(Boolean);
    if (routeSegments.length !== surfaceSegments.length) continue;
    const matches = routeSegments.every((segment, index) => {
      if (segment.startsWith("[") && segment.endsWith("]")) return true;
      return segment === surfaceSegments[index];
    });
    if (matches) return true;
  }
  return false;
}

function routeSurfaces(contract: Contract): string[] {
  return (contract.surfaces || []).filter(
    (surface) => surface.startsWith("/") && !knownNonRoutes.has(surface)
  );
}

function hasInfraSurfaceGate(contract: Contract): boolean {
  return (contract.surfaces || []).some((surface) => infraSurfaceGates.has(surface));
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

  // Warn (não-fatal): seed declarada e coberta por regressão de domínio, mas sem
  // contrato funcional de produto que exerça a experiência/tela/fluxo. Isso não
  // sinaliza falta de cobertura total; sinaliza falta de contrato funcional.
  const usedByContract = new Set(contracts.map((contract) => contract.seed));
  const unusedSeeds = [...matrix].filter((seed) => !usedByContract.has(seed)).sort();
  if (unusedSeeds.length > 0) {
    const domainCoverageNote = fs.existsSync(seedCoverageRegressionFile)
      ? "cobertas por regressao de dominio em backend/tests/seed-coverage.test.ts"
      : "sem regressao de dominio detectada";
    console.warn(
      `⚠ app-contracts: ${unusedSeeds.length} seed(s) no matrix sem contrato funcional de produto (${domainCoverageNote}): ${unusedSeeds.join(", ")}`
    );
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

    const titleCall = new RegExp(`test\\(\\s*"[^"]*${contract.id}\\b`);
    if (!titleCall.test(text)) {
      fail(`${contract.id} precisa aparecer no titulo de um test() real`);
    }

    const pendingCall = new RegExp(
      `pendingContract\\("${contract.id}",\\s*"${contract.status}"\\)`
    );
    if (contract.status === "fixme" || contract.status === "expected-fail") {
      if (!pendingCall.test(text)) {
        fail(
          `${contract.id} precisa chamar pendingContract("${contract.id}", "${contract.status}")`
        );
      }
      if (contract.status === "expected-fail") {
        const pendingIndex = text.indexOf(`pendingContract("${contract.id}", "expected-fail")`);
        const nextTestIndex = text.indexOf("\n  test(", pendingIndex + 1);
        const testBlock = text.slice(
          pendingIndex,
          nextTestIndex === -1 ? text.length : nextTestIndex
        );
        if (!/openWorkspace(?:As)?\(|armExpectedFailAfterArrival\(/.test(testBlock)) {
          fail(`${contract.id} expected-fail precisa de sentinela antes de test.fail`);
        }
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
    const primaryRoute = routeSurfs[0];
    const existing = routeSurfs.filter((surface) => routeExists(surface, routes));
    const missing = routeSurfs.filter((surface) => !routeExists(surface, routes));
    const infraGated = hasInfraSurfaceGate(contract);
    const denyContract = isDenyContract(contract);

    if (contract.status === "expected-fail" && denyContract) {
      fail(`${contract.id} e contrato de bloqueio; nunca use expected-fail`);
    }
    if (contract.status === "expected-fail" && infraGated) {
      fail(`${contract.id} depende de infra/overlay ausente; use fixme`);
    }
    if (contract.status === "expected-fail" && !primaryRoute) {
      fail(`${contract.id} esta expected-fail mas nao declara rota primaria`);
    }
    if (contract.status === "expected-fail" && primaryRoute && !routeExists(primaryRoute, routes)) {
      fail(`${contract.id} esta expected-fail mas rota primaria nao existe: ${primaryRoute}`);
    }
    if (contract.status === "expected-fail" && existing.length === 0) {
      fail(
        `${contract.id} esta expected-fail mas nenhuma superficie existe (${routeSurfs.join(", ")})`
      );
    }
    if (
      contract.status === "fixme" &&
      routeSurfs.length > 0 &&
      missing.length === 0 &&
      !infraGated &&
      !denyContract
    ) {
      fail(`${contract.id} esta fixme mas todas as rotas existem; use expected-fail`);
    }
    if (contract.status === "active" && missing.length > 0) {
      fail(`${contract.id} esta active mas cita rota inexistente: ${missing.join(", ")}`);
    }
  }
}

function markdownSection(text: string, heading: string): string {
  const start = text.indexOf(heading);
  if (start === -1) fail(`APP-ITERATION-MAP sem secao esperada: ${heading}`);
  const afterStart = start + heading.length;
  const next = text.indexOf("\n## ", afterStart);
  return text.slice(afterStart, next === -1 ? text.length : next);
}

function parseMarkdownTable(section: string): string[][] {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"))
    .filter((line) => !/^\|\s*-+/.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim())
    )
    .filter((cells) => cells.length > 0 && !/^Ordem$|^Contrato$/.test(cells[0] || ""));
}

function splitCoveredMapLines(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function assertIterationMapSync(contracts: Contract[]): void {
  const text = readText(iterationMapFile);
  const mapRows = parseMarkdownTable(markdownSection(text, "## 3. Mapa de telas e fluxos"));
  const contractRows = parseMarkdownTable(markdownSection(text, "## 3.1 Contratos automatizados"));
  const contractById = new Map(contracts.map((contract) => [contract.id, contract]));
  const mapLines = new Set(
    mapRows.map((row) => row[0]).filter((line) => /^\d+[A-Z]?$/.test(line || ""))
  );
  const coveredLines = new Set<string>();
  const mappedContractIds = new Set<string>();
  const intentionallyUncoveredMapLines = new Set(["33"]); // spike interno, nao tela de produto.

  for (const row of contractRows) {
    const [id, covers, status] = row;
    const contract = contractById.get(id);
    if (!contract) fail(`APP-ITERATION-MAP referencia contrato inexistente: ${id}`);
    mappedContractIds.add(id);
    if (contract.status !== status) {
      fail(`APP-ITERATION-MAP status stale para ${id}: tabela=${status}, YAML=${contract.status}`);
    }
    for (const line of splitCoveredMapLines(covers)) {
      if (!mapLines.has(line)) {
        fail(`APP-ITERATION-MAP ${id} cobre linha inexistente: ${line}`);
      }
      coveredLines.add(line);
    }
  }

  for (const line of mapLines) {
    if (intentionallyUncoveredMapLines.has(line)) continue;
    if (!coveredLines.has(line)) {
      fail(`APP-ITERATION-MAP linha ${line} nao tem contrato automatizado associado`);
    }
  }

  for (const contract of contracts) {
    if (!mappedContractIds.has(contract.id)) {
      fail(`APP-ITERATION-MAP nao lista contrato YAML: ${contract.id}`);
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
assertIterationMapSync(contracts);

const statusCounts = contracts.reduce<Record<string, number>>((acc, contract) => {
  acc[contract.status] = (acc[contract.status] || 0) + 1;
  return acc;
}, {});
const denyCount = contracts.filter(isDenyContract).length;

console.log(
  `✓ app-contracts — ${contracts.length} contratos (${denyCount} deny), ${seedNames().length} seeds, ${listAppRoutes().size} rotas, status ${JSON.stringify(statusCounts)}`
);

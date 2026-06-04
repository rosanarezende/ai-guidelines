import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { InsightLedger } from "../domain/insight/InsightLedger.js";
import { stringifyInsightsLedger } from "../infrastructure/yaml/insightsLedgerSerializer.js";
import { main } from "./insightsCheck.js";

/** YAML canônico (forma que o serializer produz) — o que a CLI grava. */
function canonicalLedgerYaml(): string {
  const ledger = InsightLedger.empty();
  ledger.capture(
    { text: "percepção canônica suficientemente longa", origin: { spec: "0024", cursor: null } },
    "2026-06-03T10:00:00.000Z"
  );
  return stringifyInsightsLedger(ledger);
}

/** Canônico, porém com aresta de graduação MALFORMADA (ref não casa o estágio). */
function malformedGraduationYaml(): string {
  const ledger = InsightLedger.empty();
  const insight = ledger.capture(
    { text: "percepção promovida com ref ruim", origin: { spec: "0024", cursor: null } },
    "2026-06-03T10:00:00.000Z"
  );
  ledger.promote(insight.id, { kind: "guardrail", ref: "garbage" }, "2026-06-04T10:00:00.000Z");
  return stringifyInsightsLedger(ledger);
}

// 'promoted' sem alvo viola uma invariante DE DOMÍNIO — o check não tem regra
// própria; ele apenas força o parse, que delega a assertInsightInvariants.
const INVALID_INVARIANT = `version: 1
insights:
  - id: PIT-0001
    text: percepção válida suficientemente longa
    status: promoted
    captured_at: 2026-06-03T10:00:00.000Z
    occurrences:
      - { at: 2026-06-03T10:00:00.000Z, spec: "0024" }
`;

function tmpRepo(): string {
  return mkdtempSync(join(tmpdir(), "insights-check-"));
}

function writeLedger(root: string, yaml: string): void {
  const dir = join(root, ".governance/runtime");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "insights.yml"), yaml, "utf-8");
}

function withRepo(yaml: string | null, run: (root: string) => void): void {
  const root = tmpRepo();
  try {
    if (yaml !== null) writeLedger(root, yaml);
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("insights:check (gate)", () => {
  let outSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;
  beforeEach(() => {
    outSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    errSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });
  afterEach(() => {
    outSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("retorna 0 quando o ledger está ausente (vazio é válido)", () => {
    withRepo(null, (root) => expect(main(root)).toBe(0));
  });

  it("retorna 0 para um ledger canônico e conforme", () => {
    withRepo(canonicalLedgerYaml(), (root) => expect(main(root)).toBe(0));
  });

  it("retorna 1 quando uma invariante de domínio é violada no YAML", () => {
    withRepo(INVALID_INVARIANT, (root) => expect(main(root)).toBe(1));
  });

  it("retorna 1 para YAML parseável mas NÃO canônico (edição manual)", () => {
    // Mesma percepção, forma perturbada (linha em branco extra ao fim).
    withRepo(canonicalLedgerYaml() + "\n", (root) => expect(main(root)).toBe(1));
  });

  it("retorna 1 quando a aresta de graduação tem ref malformada para o estágio", () => {
    withRepo(malformedGraduationYaml(), (root) => expect(main(root)).toBe(1));
  });
});

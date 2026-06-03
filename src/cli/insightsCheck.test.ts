import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "./insightsCheck.js";

const VALID = `version: 1
insights:
  - id: PIT-0001
    text: percepção válida suficientemente longa
    status: open
    captured_at: 2026-06-03T10:00:00.000Z
    occurrences:
      - { at: 2026-06-03T10:00:00.000Z, spec: "0024" }
`;

// 'promoted' sem alvo viola uma invariante DE DOMÍNIO — o check não tem regra
// própria; ele apenas força o parse, que delega a assertInsightInvariants.
const INVALID = `version: 1
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
    const root = tmpRepo();
    try {
      expect(main(root)).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("retorna 0 para um ledger conforme as invariantes", () => {
    const root = tmpRepo();
    try {
      writeLedger(root, VALID);
      expect(main(root)).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("retorna 1 quando uma invariante de domínio é violada no YAML", () => {
    const root = tmpRepo();
    try {
      writeLedger(root, INVALID);
      expect(main(root)).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

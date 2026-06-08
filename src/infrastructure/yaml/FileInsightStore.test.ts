import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";
import { InsightLedger } from "../../domain/insight/InsightLedger.js";
import {
  FileInsightStore,
  INSIGHTS_DISCARDED_PATH,
  INSIGHTS_OPEN_PATH,
  INSIGHTS_PROMOTED_PATH,
  LEGACY_INSIGHTS_LEDGER_PATH,
} from "./FileInsightStore.js";
import { stringifyInsightsLedger } from "./insightsLedgerSerializer.js";

class FakeFs implements WorkflowFileSystem {
  readonly files = new Map<string, string>();

  fileExists(path: string): boolean {
    return this.files.has(path);
  }
  directoryExists(): boolean {
    return false;
  }
  readTextFile(path: string): string {
    const text = this.files.get(path);
    if (text === undefined) throw new Error(`missing file: ${path}`);
    return text;
  }
  writeTextFile(path: string, contents: string): void {
    this.files.set(path, contents);
  }
  listDirectory(): ReadonlyArray<string> {
    return [];
  }
  currentBranch(): string | null {
    return null;
  }
  resolveAbsolute(path: string): string {
    return `/repo/${path}`;
  }
}

describe("FileInsightStore — ledger particionado por status", () => {
  it("DADO ledger com open/promoted/discarded QUANDO save ENTÃO escreve cada status na sua partição", () => {
    const fs = new FakeFs();
    const ledger = InsightLedger.empty();
    const open = ledger.capture(
      { text: "percepção aberta suficientemente longa", origin: { spec: "0024", cursor: null } },
      "2026-06-03T10:00:00.000Z"
    );
    const promoted = ledger.capture(
      { text: "percepção promovida suficientemente longa", origin: { spec: "0024", cursor: null } },
      "2026-06-04T10:00:00.000Z"
    );
    ledger.promote(promoted.id, { kind: "adr", ref: "ADR-0026" }, "2026-06-05T10:00:00.000Z");
    const discarded = ledger.capture(
      {
        text: "percepção descartada suficientemente longa",
        origin: { spec: "0024", cursor: null },
      },
      "2026-06-06T10:00:00.000Z"
    );
    ledger.discard(discarded.id, "ruído", "2026-06-07T10:00:00.000Z");

    new FileInsightStore(fs).save(ledger);

    expect(fs.files.get(INSIGHTS_OPEN_PATH)).toContain(open.id);
    expect(fs.files.get(INSIGHTS_PROMOTED_PATH)).toContain(promoted.id);
    expect(fs.files.get(INSIGHTS_DISCARDED_PATH)).toContain(discarded.id);
  });

  it("DADO partições existentes QUANDO load ENTÃO recompõe o ledger lógico único", () => {
    const fs = new FakeFs();
    const ledger = InsightLedger.empty();
    const insight = ledger.capture(
      { text: "percepção aberta suficientemente longa", origin: { spec: "0024", cursor: null } },
      "2026-06-03T10:00:00.000Z"
    );
    fs.files.set(INSIGHTS_OPEN_PATH, stringifyInsightsLedger(ledger));
    fs.files.set(INSIGHTS_PROMOTED_PATH, "version: 1\ninsights: []\n");
    fs.files.set(INSIGHTS_DISCARDED_PATH, "version: 1\ninsights: []\n");

    const loaded = new FileInsightStore(fs).load();

    expect(loaded.find(insight.id)?.text).toBe(insight.text);
  });

  it("DADO apenas ledger legado QUANDO load ENTÃO aceita fallback de leitura para migração", () => {
    const fs = new FakeFs();
    const ledger = InsightLedger.empty();
    const insight = ledger.capture(
      { text: "percepção legada suficientemente longa", origin: { spec: "0024", cursor: null } },
      "2026-06-03T10:00:00.000Z"
    );
    fs.files.set(LEGACY_INSIGHTS_LEDGER_PATH, stringifyInsightsLedger(ledger));

    const loaded = new FileInsightStore(fs).load();

    expect(loaded.find(insight.id)?.text).toBe(insight.text);
  });
});

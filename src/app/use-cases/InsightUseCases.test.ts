import { OriginContext } from "../../domain/insight/Insight.js";
import { InsightLedger } from "../../domain/insight/InsightLedger.js";
import {
  parseInsightsLedger,
  stringifyInsightsLedger,
} from "../../infrastructure/yaml/insightsLedgerSerializer.js";
import { Clock } from "../ports/Clock.js";
import { InsightStore } from "../ports/InsightStore.js";
import { CaptureInsight } from "./CaptureInsight.js";
import { ListOpenInsights } from "./ListOpenInsights.js";
import { RecordRecurrence } from "./RecordRecurrence.js";

/** Store em memória que usa o serializer REAL (simula persistência fiel). */
class InMemoryInsightStore implements InsightStore {
  private yaml = "";
  load(): InsightLedger {
    return this.yaml === "" ? InsightLedger.empty() : parseInsightsLedger(this.yaml);
  }
  save(ledger: InsightLedger): void {
    this.yaml = stringifyInsightsLedger(ledger);
  }
}

class StubClock implements Clock {
  constructor(public now: string) {}
  nowIso(): string {
    return this.now;
  }
}

const ORIGIN: OriginContext = { spec: "0024", cursor: "checkpoint-2.4d" };

describe("CaptureInsight (use case)", () => {
  it("persiste uma percepção recuperável em sessão futura", () => {
    const store = new InMemoryInsightStore();
    const clock = new StubClock("2026-06-03T10:00:00.000Z");
    const captured = new CaptureInsight({ store, clock }).execute({
      text: "drift SSOT→projeção é o padrão recorrente nº1",
      origin: ORIGIN,
    });
    expect(captured.id).toBe("PIT-0001");

    // "sessão futura": novo load do store reflete o que foi persistido.
    const recalled = store.load().find("PIT-0001");
    expect(recalled?.text).toBe("drift SSOT→projeção é o padrão recorrente nº1");
    expect(recalled?.status).toBe("open");
  });
});

describe("RecordRecurrence (use case)", () => {
  it("acumula observação cross-spec e persiste a recorrência", () => {
    const store = new InMemoryInsightStore();
    const clock = new StubClock("2026-06-03T10:00:00.000Z");
    const captured = new CaptureInsight({ store, clock }).execute({
      text: "projeção que ignora invariantes do consolidate",
      origin: ORIGIN,
    });

    clock.now = "2026-06-20T09:00:00.000Z";
    new RecordRecurrence({ store, clock }).execute({
      id: captured.id,
      origin: { spec: "0025", cursor: null },
      note: "reapareceu no provenance render",
    });

    const recalled = store.load().find(captured.id);
    expect(recalled?.occurrences).toHaveLength(2);
    expect(recalled?.occurrences[1].origin.spec).toBe("0025");
  });
});

describe("ListOpenInsights (use case)", () => {
  it("retorna apenas as vivas (promovidas/descartadas saem da fila)", () => {
    const store = new InMemoryInsightStore();
    const ledger = InsightLedger.empty();
    ledger.capture(
      { text: "percepção que segue aberta", origin: ORIGIN },
      "2026-06-03T10:00:00.000Z"
    );
    const b = ledger.capture(
      { text: "percepção que vai graduar", origin: ORIGIN },
      "2026-06-03T10:00:00.000Z"
    );
    ledger.promote(b.id, { kind: "guardrail", ref: "GG-0004" }, "2026-06-04T10:00:00.000Z");
    store.save(ledger);

    const open = new ListOpenInsights({ store }).execute();
    expect(open.map((i) => i.id)).toEqual(["PIT-0001"]);
  });
});

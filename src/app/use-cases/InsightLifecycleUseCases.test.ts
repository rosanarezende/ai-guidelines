import { OriginContext } from "../../domain/insight/Insight.js";
import { InsightLedger } from "../../domain/insight/InsightLedger.js";
import {
  parseInsightsLedger,
  stringifyInsightsLedger,
} from "../../infrastructure/yaml/insightsLedgerSerializer.js";
import { InsightStore } from "../ports/InsightStore.js";
import { DiscardInsight } from "./DiscardInsight.js";
import { PromoteInsight } from "./PromoteInsight.js";

class InMemoryInsightStore implements InsightStore {
  private yaml = "";
  load(): InsightLedger {
    return this.yaml === "" ? InsightLedger.empty() : parseInsightsLedger(this.yaml);
  }
  save(ledger: InsightLedger): void {
    this.yaml = stringifyInsightsLedger(ledger);
  }
}

const ORIGIN: OriginContext = { spec: "0024", cursor: "checkpoint-2.4d" };

function storeSeededWith(text: string): { store: InsightStore; id: string } {
  const store = new InMemoryInsightStore();
  const ledger = InsightLedger.empty();
  const insight = ledger.capture({ text, origin: ORIGIN }, "2026-06-03T10:00:00.000Z");
  store.save(ledger);
  return { store, id: insight.id };
}

describe("PromoteInsight (use case — fachada sobre o domínio)", () => {
  it("gradua a percepção e a retira da fila viva, persistindo o alvo", () => {
    const { store, id } = storeSeededWith("percepção que vai graduar a guardrail");
    const promoted = new PromoteInsight({ store }).execute({
      id,
      target: { kind: "guardrail", ref: "GG-0004" },
    });
    expect(promoted.status).toBe("promoted");
    expect(store.load().find(id)?.promotion).toEqual({ kind: "guardrail", ref: "GG-0004" });
    expect(store.load().open()).toHaveLength(0);
  });

  it("propaga erro de domínio para id inexistente", () => {
    const { store } = storeSeededWith("percepção qualquer longa");
    expect(() =>
      new PromoteInsight({ store }).execute({
        id: "PIT-9999",
        target: { kind: "adr", ref: "ADR-1" },
      })
    ).toThrow(/não existe/);
  });
});

describe("DiscardInsight (use case — fachada sobre o domínio)", () => {
  it("descarta com motivo e a retira da fila viva", () => {
    const { store, id } = storeSeededWith("percepção que vai ser descartada");
    const discarded = new DiscardInsight({ store }).execute({ id, reason: "não se sustentou" });
    expect(discarded.status).toBe("discarded");
    expect(store.load().find(id)?.discardReason).toBe("não se sustentou");
    expect(store.load().open()).toHaveLength(0);
  });

  it("propaga erro de domínio ao descartar sem motivo", () => {
    const { store, id } = storeSeededWith("percepção qualquer longa");
    expect(() => new DiscardInsight({ store }).execute({ id, reason: "   " })).toThrow(/motivo/);
  });
});

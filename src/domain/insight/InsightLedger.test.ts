import { OriginContext } from "./Insight.js";
import { InsightLedger } from "./InsightLedger.js";
import { captureInsight } from "./InsightTransitions.js";

const ORIGIN: OriginContext = { spec: "0024", cursor: "checkpoint-2.4d" };
const T1 = "2026-06-03T10:00:00Z";
const T2 = "2026-06-04T10:00:00Z";

describe("InsightLedger (coleção-agregado)", () => {
  it("captura aloca ids sequenciais e preserva ordem determinística", () => {
    const ledger = InsightLedger.empty();
    const a = ledger.capture({ text: "primeira percepção longa", origin: ORIGIN }, T1);
    const b = ledger.capture({ text: "segunda percepção longa", origin: ORIGIN }, T2);
    expect(a.id).toBe("PIT-0001");
    expect(b.id).toBe("PIT-0002");
    expect(ledger.all().map((i) => i.id)).toEqual(["PIT-0001", "PIT-0002"]);
    expect(ledger.size()).toBe(2);
  });

  it("registra recorrência por id e cresce a observação", () => {
    const ledger = InsightLedger.empty();
    const a = ledger.capture({ text: "percepção recorrente longa", origin: ORIGIN }, T1);
    const updated = ledger.recordOccurrence(a.id, { spec: "0025", cursor: null }, T2);
    expect(updated.occurrences).toHaveLength(2);
    expect(ledger.find(a.id)?.occurrences).toHaveLength(2);
  });

  it("open() projeta apenas as vivas; promover remove da fila viva", () => {
    const ledger = InsightLedger.empty();
    const a = ledger.capture({ text: "percepção que vai graduar", origin: ORIGIN }, T1);
    ledger.capture({ text: "percepção que segue aberta", origin: ORIGIN }, T2);
    ledger.promote(a.id, { kind: "guardrail", ref: "GG-0004" });
    expect(ledger.open().map((i) => i.id)).toEqual(["PIT-0002"]);
    expect(ledger.all()).toHaveLength(2); // histórico preservado
  });

  it("lança em recorrência/promoção de id inexistente", () => {
    const ledger = InsightLedger.empty();
    expect(() => ledger.recordOccurrence("PIT-9999", ORIGIN, T1)).toThrow(/não existe/);
    expect(() => ledger.promote("PIT-9999", { kind: "adr", ref: "ADR-1" })).toThrow(/não existe/);
  });

  it("fromArray revalida e rejeita ids duplicados", () => {
    const i = captureInsight(
      { text: "percepção reconstruída longa", origin: ORIGIN },
      "PIT-0001",
      T1
    );
    expect(() => InsightLedger.fromArray([i, i])).toThrow(/já existe/);
    const ledger = InsightLedger.fromArray([i]);
    expect(ledger.size()).toBe(1);
  });
});

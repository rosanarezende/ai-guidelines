import { OriginContext } from "../../domain/insight/Insight.js";
import { InsightLedger } from "../../domain/insight/InsightLedger.js";
import { buildInsightsProjection, renderResumptionInsights } from "./InsightsProjection.js";

const ORIGIN: OriginContext = { spec: "0024", cursor: "checkpoint-2.4d" };
const T1 = "2026-06-03T10:00:00.000Z";
const T2 = "2026-06-20T09:00:00.000Z";

function seededOpen() {
  const ledger = InsightLedger.empty();
  // PIT-0001: 1 ocorrência.
  ledger.capture({ text: "percepção pouco vista", origin: ORIGIN }, T1);
  // PIT-0002: 2 ocorrências cross-spec ⇒ deve vir primeiro (mais saliente).
  const b = ledger.capture({ text: "drift SSOT→projeção recorrente", origin: ORIGIN }, T1);
  ledger.recordOccurrence(b.id, { spec: "0025", cursor: null }, T2);
  return ledger.open();
}

describe("InsightsProjection", () => {
  it("ordena por saliência: recorrência desc, depois id", () => {
    const projection = buildInsightsProjection(seededOpen());
    expect(projection.items.map((i) => i.id)).toEqual(["PIT-0002", "PIT-0001"]);
    expect(projection.items[0].recurrence).toBe(2);
    expect(projection.items[0].specs).toEqual(["0024", "0025"]);
  });

  it("renderiza o bloco 'Em trânsito' com a marca de recorrência", () => {
    const text = renderResumptionInsights(buildInsightsProjection(seededOpen()));
    expect(text).toContain("Em trânsito (percepções vivas):");
    expect(text).toContain("PIT-0002");
    expect(text).toContain("visto 2× [0024,0025]");
  });

  it("retorna bloco vazio quando não há percepções vivas", () => {
    expect(renderResumptionInsights(buildInsightsProjection([]))).toBe("");
  });
});

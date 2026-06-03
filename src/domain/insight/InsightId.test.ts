import {
  compareInsightId,
  formatInsightId,
  insightIdSeq,
  isInsightId,
  nextInsightId,
} from "./InsightId.js";

describe("InsightId (VO PIT-NNNN)", () => {
  it("formata sequência como PIT-NNNN zero-padded", () => {
    expect(formatInsightId(1)).toBe("PIT-0001");
    expect(formatInsightId(42)).toBe("PIT-0042");
    expect(formatInsightId(12345)).toBe("PIT-12345");
  });

  it("reconhece ids válidos e rejeita malformados", () => {
    expect(isInsightId("PIT-0001")).toBe(true);
    expect(isInsightId("PIT-1")).toBe(false); // < 4 dígitos
    expect(isInsightId("DEC-0001")).toBe(false);
    expect(isInsightId(42)).toBe(false);
  });

  it("extrai a sequência e lança em id malformado", () => {
    expect(insightIdSeq("PIT-0007")).toBe(7);
    expect(() => insightIdSeq("PIT-x")).toThrow(/malformado/);
  });

  it("rejeita sequência inválida na formatação", () => {
    expect(() => formatInsightId(0)).toThrow(/>= 1/);
    expect(() => formatInsightId(1.5)).toThrow();
  });

  it("aloca o próximo id como max+1 (vazio ⇒ PIT-0001)", () => {
    expect(nextInsightId([])).toBe("PIT-0001");
    expect(nextInsightId(["PIT-0001", "PIT-0003"])).toBe("PIT-0004");
  });

  it("ordena por sequência", () => {
    expect(compareInsightId("PIT-0002", "PIT-0010")).toBeLessThan(0);
    expect(["PIT-0010", "PIT-0002"].sort(compareInsightId)).toEqual(["PIT-0002", "PIT-0010"]);
  });
});

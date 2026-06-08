import {
  formatGovernedRef,
  GovernedRef,
  isWellFormedGovernedRef,
  parseGovernedRef,
} from "./GovernedRef.js";

describe("GovernedRef · alvo governado constrangível [BR-CO-KNOWLEDGE-GOVREF]", () => {
  it("knowledge: format/parse round-trip de um KnowledgeRef", () => {
    const g: GovernedRef = { space: "knowledge", ref: { stage: "decision", id: "DEC-0024-G07" } };
    expect(formatGovernedRef(g)).toBe("knowledge:decision:DEC-0024-G07");
    expect(parseGovernedRef("knowledge:decision:DEC-0024-G07")).toEqual(g);
  });

  it("work: format/parse round-trip de um WorkItem (não nó-pipeline)", () => {
    const g: GovernedRef = { space: "work", id: "spec-0024" };
    expect(formatGovernedRef(g)).toBe("work:spec-0024");
    expect(parseGovernedRef("work:spec-0024")).toEqual(g);
  });

  it("isWellFormed: knowledge válido vs id que não casa o estágio", () => {
    expect(
      isWellFormedGovernedRef({ space: "knowledge", ref: { stage: "doctrine", id: "ADR-0026" } })
    ).toBe(true);
    expect(
      isWellFormedGovernedRef({ space: "knowledge", ref: { stage: "doctrine", id: "garbage" } })
    ).toBe(false);
  });

  it("isWellFormed: work não-vazio vs vazio", () => {
    expect(isWellFormedGovernedRef({ space: "work", id: "fix-012" })).toBe(true);
    expect(isWellFormedGovernedRef({ space: "work", id: "   " })).toBe(false);
  });

  it("parse: espaço desconhecido (KnowledgeRef cru, sem prefixo de space) lança", () => {
    expect(() => parseGovernedRef("doctrine:ADR-0026")).toThrow(/desconhecido|malformado/i);
  });

  it("parse: sem separador lança", () => {
    expect(() => parseGovernedRef("semseparador")).toThrow();
  });
});

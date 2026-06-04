import { GovernanceError } from "../shared/errors.js";
import { formatRef, isWellFormedRef, knowledgeRef, parseRef } from "./KnowledgeRef.js";

describe("KnowledgeRef (aresta navegável do grafo)", () => {
  it("aceita ids bem-formados por estágio", () => {
    expect(isWellFormedRef({ stage: "doctrine", id: "ADR-0023" })).toBe(true);
    expect(isWellFormedRef({ stage: "guardrail", id: "GG-0003" })).toBe(true);
    expect(isWellFormedRef({ stage: "decision", id: "DEC-0024-G07" })).toBe(true);
    expect(isWellFormedRef({ stage: "rule", id: "GR-0101" })).toBe(true);
    expect(isWellFormedRef({ stage: "insight", id: "PIT-0001" })).toBe(true);
  });

  it("rejeita ids malformados para o estágio", () => {
    expect(isWellFormedRef({ stage: "doctrine", id: "GG-0003" })).toBe(false);
    expect(isWellFormedRef({ stage: "guardrail", id: "garbage" })).toBe(false);
  });

  it("knowledgeRef valida (e normaliza) ou lança", () => {
    expect(knowledgeRef("doctrine", " ADR-0023 ")).toEqual({ stage: "doctrine", id: "ADR-0023" });
    expect(() => knowledgeRef("guardrail", "garbage")).toThrow(GovernanceError);
  });

  it("round-trip format ⇄ parse", () => {
    const ref = { stage: "doctrine" as const, id: "ADR-0023" };
    expect(formatRef(ref)).toBe("doctrine:ADR-0023");
    expect(parseRef("doctrine:ADR-0023")).toEqual(ref);
    expect(() => parseRef("bogus:ADR-0023")).toThrow(/Estágio desconhecido/);
    expect(() => parseRef("semseparador")).toThrow();
  });
});

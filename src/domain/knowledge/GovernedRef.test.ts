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

  // CO-3: espaço `surface` — alvo de uma Constraint (sem entidade persistida).
  it("surface: format/parse round-trip preservando os `:` internos do namespace", () => {
    const g: GovernedRef = { space: "surface", id: "npm-script:gate-decidability:check" };
    expect(formatGovernedRef(g)).toBe("surface:npm-script:gate-decidability:check");
    expect(parseGovernedRef("surface:npm-script:gate-decidability:check")).toEqual(g);
  });

  it("surface: registry-command round-trip", () => {
    const g: GovernedRef = { space: "surface", id: "registry-command:workflow/publish-state" };
    expect(formatGovernedRef(g)).toBe("surface:registry-command:workflow/publish-state");
    expect(parseGovernedRef("surface:registry-command:workflow/publish-state")).toEqual(g);
  });

  it("isWellFormed: surface namespaced vs sem nome vs sem namespace", () => {
    expect(isWellFormedGovernedRef({ space: "surface", id: "npm-script:x" })).toBe(true);
    expect(isWellFormedGovernedRef({ space: "surface", id: "npm-script:" })).toBe(false);
    expect(isWellFormedGovernedRef({ space: "surface", id: "semnamespace" })).toBe(false);
  });

  it("parse: surface sem nome após o namespace lança", () => {
    expect(() => parseGovernedRef("surface:npm-script:")).toThrow(/malformado/i);
  });
});

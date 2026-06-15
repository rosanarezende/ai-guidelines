import path from "node:path";

import { getOptInRuleRelativePath } from "./OptInRulePaths.js";

/**
 * Paridade (Spec 0024 · CO-3.3) com o mapa do antigo
 * `cli/governance/monolith/rules-loader.mjs`.
 */
describe("getOptInRuleRelativePath", () => {
  it("DADO bdd com lang QUANDO resolve ENTÃO honra o idioma", () => {
    expect(getOptInRuleRelativePath("bdd", "en")).toBe(
      path.join("opt-in", "methodologies", "bdd-en.md")
    );
    expect(getOptInRuleRelativePath("bdd", "pt")).toBe(
      path.join("opt-in", "methodologies", "bdd-pt.md")
    );
  });

  it("DADO tdd sem lang QUANDO resolve ENTÃO usa PT por default", () => {
    expect(getOptInRuleRelativePath("tdd")).toBe(path.join("opt-in", "methodologies", "tdd-pt.md"));
  });

  it("DADO lang desconhecido em feature i18n QUANDO resolve ENTÃO faz fallback para PT", () => {
    expect(getOptInRuleRelativePath("bdd", "fr")).toBe(
      path.join("opt-in", "methodologies", "bdd-pt.md")
    );
  });

  it("DADO quality-gates QUANDO resolve ENTÃO usa o arquivo único (lang ignorado)", () => {
    expect(getOptInRuleRelativePath("quality-gates")).toBe(
      path.join("opt-in", "quality", "quality-gates.md")
    );
    expect(getOptInRuleRelativePath("quality-gates", "en")).toBe(
      path.join("opt-in", "quality", "quality-gates.md")
    );
  });

  it("DADO feature desconhecida QUANDO resolve ENTÃO retorna null", () => {
    expect(getOptInRuleRelativePath("inexistente")).toBeNull();
  });
});

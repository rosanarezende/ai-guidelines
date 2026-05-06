import { describe, it, before, after } from "node:test";
import { applyBdd } from "./bdd.mjs";
import { createOptInRuleTestSuite } from "./test-helpers.mjs";

/**
 * [BR-OPT-BDD] Suite de Validação da Feature BDD
 *
 * Usa o utilitário genérico createOptInRuleTestSuite para gerar
 * os cenários BDD padrão (ativar PT, ativar EN, skip, prune, dry-run).
 */
createOptInRuleTestSuite({
  featureName: "bdd",
  applyFn: applyBdd,
  outputFileName: "bdd.md",
  suiteLabel: "[BR-OPT-BDD]",
  syncActionPattern: "sync .ai-guidelines/rules/bdd.md",
  pruneActionPattern: "prune .ai-guidelines/rules/bdd.md",
  usesI18n: true,
  sourceFileNamePt: "methodologies/bdd-pt.md",
  sourceFileNameEn: "methodologies/bdd-en.md",
  mockContentPt: "# BDD PT",
  mockContentEn: "# BDD EN",
  describe,
  it,
  before,
  after,
});

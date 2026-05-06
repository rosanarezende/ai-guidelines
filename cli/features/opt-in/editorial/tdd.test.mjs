import { describe, it, before, after } from "node:test";
import { applyTdd } from "./tdd.mjs";
import { createOptInRuleTestSuite } from "./test-helpers.mjs";

/**
 * [BR-OPT-TDD] Suite de Validação da Feature TDD
 *
 * Usa o utilitário genérico createOptInRuleTestSuite para gerar
 * os cenários BDD padrão (ativar PT, ativar EN, skip, prune, dry-run).
 */
createOptInRuleTestSuite({
  featureName: "tdd",
  applyFn: applyTdd,
  outputFileName: "tdd.md",
  suiteLabel: "[BR-OPT-TDD]",
  syncActionPattern: "sync .ai-guidelines/rules/tdd.md",
  pruneActionPattern: "prune .ai-guidelines/rules/tdd.md",
  usesI18n: true,
  sourceFileNamePt: "methodologies/tdd-pt.md",
  sourceFileNameEn: "methodologies/tdd-en.md",
  mockContentPt: "# TDD PT",
  mockContentEn: "# TDD EN",
  describe,
  it,
  before,
  after,
});

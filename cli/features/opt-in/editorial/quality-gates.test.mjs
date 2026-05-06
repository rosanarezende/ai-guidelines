import { describe, it, before, after } from "node:test";
import { applyQualityGates } from "./quality-gates.mjs";
import { createOptInRuleTestSuite } from "./test-helpers.mjs";

/**
 * [BR-OPT-QG] Suite de Validação da Feature Quality Gates
 *
 * Usa o utilitário genérico createOptInRuleTestSuite para gerar
 * os cenários BDD padrão (ativar, skip, prune, dry-run).
 */
createOptInRuleTestSuite({
  featureName: "quality-gates",
  applyFn: applyQualityGates,
  outputFileName: "quality-gates.md",
  suiteLabel: "[BR-OPT-QG]",
  syncActionPattern: "sync .ai-guidelines/rules/quality-gates.md",
  pruneActionPattern: "prune .ai-guidelines/rules/quality-gates.md",
  usesI18n: false,
  sourceFileNamePt: "quality/quality-gates.md",
  mockContentPt: "# Quality Gates",
  describe,
  it,
  before,
  after,
});

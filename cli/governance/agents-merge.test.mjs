import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertValidAiGuidelinesBlock,
  mergeAgentsContent,
  wrapAiGuidelinesBlock,
} from "./agents-merge.mjs";

describe("agents-merge", () => {
  it("[BR-CLI-MERGE-20] DADO conteúdo vazio QUANDO mergeAgentsContent ENTÃO cria apenas bloco AI_GUIDELINES", () => {
    const merged = mergeAgentsContent("", "baseline");

    assert.match(merged, /<AI_GUIDELINES>/);
    assert.match(merged, /baseline/);
    assert.match(merged, /<\/AI_GUIDELINES>/);
  });

  it("[BR-CLI-MERGE-21] DADO AGENTS sem AI_GUIDELINES QUANDO mergeAgentsContent ENTÃO anexa bloco e preserva conteúdo", () => {
    const merged = mergeAgentsContent("# Projeto\n\nRegra local.\n", "baseline");

    assert.match(merged, /# Projeto/);
    assert.match(merged, /Regra local/);
    assert.match(merged, /<AI_GUIDELINES>/);
    assert.match(merged, /baseline/);
  });

  it("[BR-CLI-MERGE-22] DADO AGENTS governado QUANDO mergeAgentsContent ENTÃO substitui somente AI_GUIDELINES", () => {
    const existing = [
      "# Projeto",
      "",
      "<AI_GUIDELINES>",
      "",
      "baseline antigo",
      "",
      "</AI_GUIDELINES>",
      "",
      "Regra depois.",
      "",
    ].join("\n");

    const merged = mergeAgentsContent(existing, "baseline novo");

    assert.match(merged, /# Projeto/);
    assert.match(merged, /Regra depois/);
    assert.match(merged, /baseline novo/);
    assert.doesNotMatch(merged, /baseline antigo/);
  });

  it("[BR-CLI-MERGE-23] DADO bloco AI_GUIDELINES malformado QUANDO validar ENTÃO aborta", () => {
    assert.throws(
      () => assertValidAiGuidelinesBlock("<AI_GUIDELINES>\nsem fechamento"),
      /AI_GUIDELINES/
    );
  });

  it("[BR-CLI-MERGE-24] DADO múltiplos blocos AI_GUIDELINES QUANDO validar ENTÃO aborta", () => {
    const malformed = [
      "<AI_GUIDELINES>",
      "a",
      "</AI_GUIDELINES>",
      "",
      "<AI_GUIDELINES>",
      "b",
      "</AI_GUIDELINES>",
    ].join("\n");

    assert.throws(() => assertValidAiGuidelinesBlock(malformed), /múltiplos/);
  });

  it("[BR-CLI-MERGE-25] DADO wrapAiGuidelinesBlock QUANDO envolver ENTÃO produz tag mãe com espaçamento consistente", () => {
    assert.equal(
      wrapAiGuidelinesBlock("baseline"),
      ["<AI_GUIDELINES>", "baseline", "</AI_GUIDELINES>"].join("\n\n")
    );
  });

  it("[BR-CLI-MERGE-26] DADO merge aplicado duas vezes QUANDO reexecutar ENTÃO é idempotente", () => {
    const once = mergeAgentsContent("# Projeto\n\nRegra local.\n", "baseline");
    const twice = mergeAgentsContent(once, "baseline");

    assert.equal(twice, once);
  });
});

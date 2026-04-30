import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractCoreBlock,
  buildFeatureTag,
  compileMonolithicAgentsContent,
  mergeAgentsContent,
  normalizePointerForMonolith,
  wrapAiGuidelinesBlock,
  wrapFeatureModule,
} from "#core/content-merge";

describe("content-merge (wrapper)", () => {
  describe("extractCoreBlock", () => {
    it("[BR-CLI-MERGE-01] DADO markdown com marcadores QUANDO extrair core ENTÃO retorna conteúdo limpo", () => {
      const content = [
        "# Header",
        "<!-- BEGIN:ai-guidelines-core -->",
        "  regra canônica  ",
        "<!-- END:ai-guidelines-core -->",
        "# Footer",
      ].join("\n");

      const expected = [
        "<!-- BEGIN:ai-guidelines-core -->",
        "  regra canônica  ",
        "<!-- END:ai-guidelines-core -->",
      ].join("\n");

      assert.equal(extractCoreBlock(content), expected);
    });

    it("[BR-CLI-MERGE-02] DADO markdown sem marcadores QUANDO extrair core ENTÃO lança erro explícito", () => {
      assert.throws(() => extractCoreBlock("# No markers"), /Bloco canônico/);
    });
  });

  describe("compileMonolithicAgentsContent", () => {
    it("[BR-CLI-COMPILER-01] DADO buffers topologicos QUANDO compilar ENTÃO preserva ordem topo centro base", () => {
      const compiled = compileMonolithicAgentsContent({
        coreTemplate: "AGENTS core",
        globalRules: "global rules",
        providerRules: [{ name: "codex", content: "codex rules" }],
        optInRules: [{ name: "quality-gates.md", content: "quality rules" }],
        pointerTemplate: "pointer",
      });

      assert.ok(compiled.indexOf("AGENTS core") < compiled.indexOf("<FEATURE_QUALITY_GATES>"));
      assert.ok(compiled.indexOf("<FEATURE_QUALITY_GATES>") < compiled.indexOf("pointer"));
      assert.match(compiled, /Regras do Provedor: codex/);
      assert.ok(compiled.endsWith("\n"), "o compilador deve sempre terminar com newline");
    });

    it("[BR-CLI-COMPILER-02] DADO feature opt-in QUANDO envelopar ENTÃO usa tags XML relacionais", () => {
      assert.equal(buildFeatureTag("quality-gates.md"), "FEATURE_QUALITY_GATES");
      assert.equal(
        wrapFeatureModule("tdd.md", "regra"),
        ["<FEATURE_TDD>", "regra", "</FEATURE_TDD>"]
          .join("\n\n")
      );
    });

    it("[BR-CLI-COMPILER-03] DADO pointer bruto QUANDO normalizar ENTÃO remove link recursivo", () => {
      const pointer = [
        "Para ler a Prime Directive, acesse:",
        "[.ai-guidelines/AGENTS.md](.ai-guidelines/AGENTS.md)",
        "<!-- END:ai-guidelines-core -->",
      ].join("\n");

      const normalized = normalizePointerForMonolith(pointer);

      assert.doesNotMatch(normalized, /\.ai-guidelines\/AGENTS\.md/);
      assert.match(normalized, /ponteiro tático/);
    });
  });

  describe("mergeAgentsContent", () => {
    it("[BR-CLI-MERGE-03] DADO AGENTS com regras próprias QUANDO mergeAgentsContent ENTÃO preserva fora de AI_GUIDELINES", () => {
      const merged = mergeAgentsContent("# Projeto\n\nRegra local.\n", "baseline", false);

      assert.match(merged, /# Projeto/);
      assert.match(merged, /Regra local/);
      assert.match(merged, /<AI_GUIDELINES>/);
      assert.match(merged, /baseline/);
      assert.match(merged, /<\/AI_GUIDELINES>/);
    });

    it("[BR-CLI-MERGE-04] DADO AGENTS ja governado QUANDO mergeAgentsContent ENTÃO substitui somente AI_GUIDELINES", () => {
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

      const merged = mergeAgentsContent(existing, "baseline novo", false);

      assert.match(merged, /# Projeto/);
      assert.match(merged, /Regra depois/);
      assert.match(merged, /baseline novo/);
      assert.doesNotMatch(merged, /baseline antigo/);
    });

    it("[BR-CLI-MERGE-05] DADO bloco AI_GUIDELINES malformado QUANDO mergeAgentsContent ENTÃO aborta", () => {
      assert.throws(
        () => mergeAgentsContent("# Projeto\n\n<AI_GUIDELINES>\nsem fechamento\n", "novo", false),
        /AI_GUIDELINES/
      );
    });

    it("[BR-CLI-MERGE-10] DADO AGENTS vazio QUANDO mergeAgentsContent ENTÃO cria apenas bloco AI_GUIDELINES", () => {
      const merged = mergeAgentsContent("", "baseline", false);

      assert.match(merged, /<AI_GUIDELINES>/);
      assert.match(merged, /baseline/);
      assert.match(merged, /<\/AI_GUIDELINES>/);
    });

    it("[BR-CLI-MERGE-11] DADO merge executado duas vezes QUANDO mergeAgentsContent ENTÃO resultado é idempotente", () => {
      const once = mergeAgentsContent("# Projeto\n\nRegra local.\n", "baseline", false);
      const twice = mergeAgentsContent(once, "baseline", false);

      assert.equal(twice, once);
    });

    it("[BR-CLI-MERGE-07] DADO conteudo compilado QUANDO wrapAiGuidelinesBlock ENTÃO envolve com tag mae", () => {
      assert.equal(
        wrapAiGuidelinesBlock("baseline"),
        ["<AI_GUIDELINES>", "baseline", "</AI_GUIDELINES>"]
          .join("\n\n")
      );
    });
  });
});

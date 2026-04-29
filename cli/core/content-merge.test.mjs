import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractCoreBlock,
  buildFeatureTag,
  compileMonolithicAgentsContent,
  mergeAgentsContent,
  mergeGitattributesContent,
  mergeHookContent,
  mergePrettierIgnoreContent,
  normalizePointerForMonolith,
  wrapFeatureModule,
} from "./content-merge.mjs";

describe("content-merge", () => {
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
    });

    it("[BR-CLI-COMPILER-02] DADO feature opt-in QUANDO envelopar ENTÃO usa tags XML relacionais", () => {
      assert.equal(buildFeatureTag("quality-gates.md"), "FEATURE_QUALITY_GATES");
      assert.equal(
        wrapFeatureModule("tdd.md", "regra"),
        ["<FEATURE_TDD>", "regra", "</FEATURE_TDD>"].join("\n\n")
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
    it("[BR-CLI-MERGE-03] DADO AGENTS sem marcadores QUANDO mergeAgentsContent ENTÃO anexa bloco canônico", () => {
      const template = [
        "# AGENTS",
        "",
        "<!-- BEGIN:ai-guidelines-core -->",
        "core",
        "<!-- END:ai-guidelines-core -->",
      ].join("\n");

      const merged = mergeAgentsContent("# AGENTS\n\n## Local\n", template, false);

      assert.match(merged, /## Local/);
      assert.match(merged, /BEGIN:ai-guidelines-core/);
    });
  });

  it("DADO gitattributes incompleto QUANDO mergeGitattributesContent ENTÃO anexa baseline", () => {
    const existing = "*.png binary\n";
    const baseline = "* text=auto eol=lf\n*.png binary\n";

    const merged = mergeGitattributesContent(existing, baseline);

    assert.match(merged, /\* text=auto eol=lf/);
    assert.match(merged, /ai-guidelines baseline/);
  });

  it("DADO hook com shape incompatível QUANDO mergeHookContent ENTÃO lança erro de merge", () => {
    assert.throws(
      () =>
        mergeHookContent(
          '#!/bin/sh\nif [ -n "$CI" ]; then\nfi\n',
          "npm run check",
          false,
          "pre-push"
        ),
      /shape não suportado/
    );
  });

  it("DADO prettierignore incompleto QUANDO mergePrettierIgnoreContent ENTÃO anexa baseline", () => {
    const merged = mergePrettierIgnoreContent("node_modules/\n", "dist/\nnode_modules/\n");

    assert.match(merged, /dist\//);
    assert.match(merged, /ai-guidelines prettier baseline/);
  });
});

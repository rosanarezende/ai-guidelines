import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractCoreBlock,
  mergeAgentsContent,
  mergeGitattributesContent,
  mergeHookContent,
  mergePrettierIgnoreContent,
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

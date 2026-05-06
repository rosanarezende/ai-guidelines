import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import {
  getOptInRuleRelativePath,
  normalizeProviderSelection,
  readOptInRules,
} from "./rules-loader.mjs";

describe("monolith/rules-loader", () => {
  it("[BR-CLI-RULES-01] DADO provider vazio QUANDO normalizar ENTÃO inclui todos", () => {
    assert.deepEqual(normalizeProviderSelection(undefined), ["claude.md", "codex.md", "gemini.md"]);
  });

  it("[BR-CLI-RULES-02] DADO provider=all QUANDO normalizar ENTÃO inclui todos", () => {
    assert.deepEqual(normalizeProviderSelection("all"), ["claude.md", "codex.md", "gemini.md"]);
  });

  it("[BR-CLI-RULES-03] DADO provider=claude,codex QUANDO normalizar ENTÃO filtra corretamente", () => {
    assert.deepEqual(normalizeProviderSelection("claude,codex"), ["claude.md", "codex.md"]);
  });

  it("[BR-CLI-RULES-04] DADO provider inválido QUANDO normalizar ENTÃO retorna lista vazia", () => {
    assert.deepEqual(normalizeProviderSelection("foo"), []);
  });

  it("[BR-CLI-RULES-05] DADO feature opt-in com idioma QUANDO resolver path ENTÃO usa a nova hierarquia mínima", () => {
    assert.equal(
      getOptInRuleRelativePath("bdd", "en"),
      path.join("opt-in", "methodologies", "bdd-en.md")
    );
    assert.equal(
      getOptInRuleRelativePath("quality-gates"),
      path.join("opt-in", "quality", "quality-gates.md")
    );
  });

  it("[BR-CLI-RULES-06] DADO layout hierárquico de opt-in QUANDO ler regras ENTÃO carrega arquivos dos subdiretórios corretos", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "rules-loader-"));
    const sourceRulesDir = path.join(tempDir, ".core", "rules");
    await fs.mkdir(path.join(sourceRulesDir, "opt-in", "methodologies"), { recursive: true });
    await fs.mkdir(path.join(sourceRulesDir, "opt-in", "quality"), { recursive: true });
    await fs.writeFile(
      path.join(sourceRulesDir, "opt-in", "methodologies", "bdd-en.md"),
      "# BDD EN"
    );
    await fs.writeFile(
      path.join(sourceRulesDir, "opt-in", "quality", "quality-gates.md"),
      "# Quality Gates"
    );

    try {
      const rules = await readOptInRules({
        sourceRulesDir,
        editorialFeatures: ["bdd", "quality-gates"],
        features: ["bdd", "quality-gates"],
        lang: "en",
      });

      assert.deepEqual(
        rules.map((rule) => rule.name),
        ["bdd.md", "quality-gates.md"]
      );
      assert.equal(rules[0].content, "# BDD EN");
      assert.equal(rules[1].content, "# Quality Gates");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeProviderSelection } from "./rules-loader.mjs";

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
});

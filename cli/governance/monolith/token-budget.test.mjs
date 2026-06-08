import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LIMITS,
  SOFT_CEILING_RATIO,
  analyzeAgentsMdBudget,
  analyzeBudget,
  analyzePerAdapterBudgets,
  analyzeScopeBudgets,
  calculateTokH,
} from "./token-budget.mjs";

describe("Token Budget", () => {
  it("DADO um texto QUANDO calculateTokH é chamado ENTÃO divide por 3.5 e arredonda para cima", () => {
    assert.equal(calculateTokH("123"), Math.ceil(3 / 3.5)); // 1
    assert.equal(calculateTokH("1234"), Math.ceil(4 / 3.5)); // 2
    assert.equal(calculateTokH(""), 0);
    assert.equal(calculateTokH(null), 0);
  });

  it("DADO LIMITS QUANDO inspecionados ENTÃO refletem decisões de [DEC-0018-B03] + Spec 0019", () => {
    assert.equal(LIMITS.universal, 1500);
    assert.equal(LIMITS["opt-in"], 1200);
    assert.equal(LIMITS.agentsMd, 2700);
    assert.equal(LIMITS.perAdapter, 800);
    assert.equal(SOFT_CEILING_RATIO, 0.75);
  });

  describe("analyzeScopeBudgets", () => {
    it("DADO catálogo com regras de cada escopo QUANDO mede ENTÃO totaliza por escopo", () => {
      const longText = "a".repeat(1400); // 400 tokens (1400 / 3.5)
      const catalog = {
        rules: [
          { scope: "universal", instruction_en: longText },
          { scope: "opt-in", instruction_en: longText },
          { scope: "adapter", adapter: "claude", instruction_en: longText },
        ],
      };
      const result = analyzeScopeBudgets(catalog);
      assert.equal(result.universal.tokens, 400);
      assert.equal(result["opt-in"].tokens, 400);
      // adapter NÃO entra em scope budget — é coberto por per-adapter
      assert.equal(result.warnings.length, 0);
    });

    it("DADO escopo acima do soft ceiling QUANDO mede ENTÃO emite warning com 75%", () => {
      // 75% de 1500 = 1125 tokens. 4000 chars / 3.5 = 1143 tokens.
      const text = "a".repeat(4000);
      const catalog = { rules: [{ scope: "universal", instruction_en: text }] };
      const result = analyzeScopeBudgets(catalog);
      assert.equal(result.warnings.length, 1);
      assert.match(result.warnings[0], /Escopo 'universal'/);
      assert.match(result.warnings[0], /soft ceiling em 75%/);
    });
  });

  describe("analyzeAgentsMdBudget", () => {
    it("DADO catálogo QUANDO mede AGENTS.md ENTÃO mede o stub (sem universal/opt-in)", () => {
      const universalText = "a".repeat(3500); // 1000 tokens
      const optInText = "b".repeat(2800); // 800 tokens
      const adapterText = "c".repeat(1400); // 400 tokens (não conta)
      const catalog = {
        rules: [
          { scope: "universal", instruction_en: universalText },
          { scope: "opt-in", instruction_en: optInText },
          { scope: "adapter", adapter: "claude", instruction_en: adapterText },
        ],
      };
      const result = analyzeAgentsMdBudget(catalog);
      assert.ok(result.tokens > 0);
      assert.ok(result.tokens < 500);
      assert.equal(result.limit, 2700);
      assert.equal(result.warnings.length, 0);
    });

    it("DADO regras enormes QUANDO mede AGENTS.md ENTÃO não emite warning do stub", () => {
      const catalog = {
        rules: [
          { scope: "universal", instruction_en: "a".repeat(7000) },
          { scope: "opt-in", instruction_en: "b".repeat(1500) },
        ],
      };
      const result = analyzeAgentsMdBudget(catalog);
      assert.ok(result.tokens < LIMITS.agentsMd * SOFT_CEILING_RATIO);
      assert.equal(result.warnings.length, 0);
    });
  });

  describe("analyzePerAdapterBudgets", () => {
    it("DADO catálogo com adapters QUANDO mede ENTÃO inclui hard-redirect e ordena por id", () => {
      const ruleText = "a".repeat(1750); // 500 tokens
      const catalog = {
        rules: [
          { scope: "adapter", adapter: "gemini", instruction_en: ruleText },
          { scope: "adapter", adapter: "claude", instruction_en: ruleText },
        ],
      };
      const result = analyzePerAdapterBudgets(catalog);
      assert.deepEqual(
        result.adapters.map((a) => a.adapter),
        ["claude", "gemini"]
      );
      // 500 (rules) + 95 (hard-redirect base) = 595
      assert.equal(result.adapters[0].tokens, 595);
      assert.equal(result.adapters[0].ruleTokens, 500);
      assert.equal(result.adapters[0].hardRedirectTokens, 95);
      assert.equal(result.adapters[0].limit, 800);
      assert.equal(result.warnings.length, 0);
    });

    it("DADO adapter pesado QUANDO mede ENTÃO emite warning específico", () => {
      // 75% de 800 = 600. Hard-redirect = 95. Precisamos > 505 tokens em rules.
      // 1900 chars / 3.5 = 543 tokens. Total 638.
      const catalog = {
        rules: [
          {
            scope: "adapter",
            adapter: "claude",
            instruction_en: "a".repeat(1900),
          },
        ],
      };
      const result = analyzePerAdapterBudgets(catalog);
      assert.ok(result.adapters[0].tokens >= LIMITS.perAdapter * SOFT_CEILING_RATIO);
      assert.equal(result.warnings.length, 1);
      assert.match(result.warnings[0], /Entrypoint do adapter 'claude'/);
    });

    it("DADO catálogo sem adapters QUANDO mede ENTÃO retorna lista vazia", () => {
      const result = analyzePerAdapterBudgets({ rules: [] });
      assert.deepEqual(result.adapters, []);
      assert.deepEqual(result.warnings, []);
    });
  });

  describe("analyzeBudget (consolidado)", () => {
    it("DADO catálogo completo QUANDO mede ENTÃO retorna scopes + agentsMd + perAdapter + warnings agregados", () => {
      const catalog = {
        rules: [
          { scope: "universal", instruction_en: "a".repeat(1400) }, // 400 tok
          { scope: "opt-in", instruction_en: "b".repeat(700) }, // 200 tok
          { scope: "adapter", adapter: "claude", instruction_en: "c".repeat(700) }, // 200 + 95
          { scope: "adapter", adapter: "codex", instruction_en: "d".repeat(700) }, // 200 + 95
        ],
      };
      const result = analyzeBudget(catalog);
      assert.equal(result.scopes.universal.tokens, 400);
      assert.equal(result.scopes["opt-in"].tokens, 200);
      assert.ok(result.agentsMd.tokens > 0);
      assert.ok(result.agentsMd.tokens < 500);
      assert.equal(result.perAdapter.length, 2);
      assert.deepEqual(result.warnings, []);
    });
  });
});

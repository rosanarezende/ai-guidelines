import { buildAgentsRuntimeStub } from "./AgentsRuntimeBootstrap.js";
import {
  LIMITS,
  SOFT_CEILING_RATIO,
  analyzeAgentsMdBudget,
  analyzeBudget,
  analyzePerAdapterBudgets,
  analyzeScopeBudgets,
  calculateTokH,
} from "./TokenBudget.js";

/**
 * Teste de PARIDADE (Spec 0024 · CO-3.3).
 *
 * Os valores golden abaixo são portados verbatim de
 * `token-budget.test.mjs` (removido junto do substrato legacy):
 * a aritmética do orçamento (Tok-H, somas por escopo, hard-redirect, limites)
 * é preservada bit-a-bit. A única diferença consciente é o stub do AGENTS.md —
 * injetado nos casos abaixo para fixar a math sem depender do tamanho do stub
 * real, já que o monólito media uma cópia stale enquanto a migração passa a
 * medir o stub canônico em TypeScript.
 */
describe("Token Budget (paridade com o monólito legacy)", () => {
  it("DADO um texto QUANDO calculateTokH é chamado ENTÃO divide por 3.5 e arredonda para cima", () => {
    expect(calculateTokH("123")).toBe(Math.ceil(3 / 3.5)); // 1
    expect(calculateTokH("1234")).toBe(Math.ceil(4 / 3.5)); // 2
    expect(calculateTokH("")).toBe(0);
    expect(calculateTokH(null)).toBe(0);
  });

  it("DADO LIMITS QUANDO inspecionados ENTÃO refletem decisões de [DEC-0018-B03] + Spec 0019", () => {
    expect(LIMITS.universal).toBe(1500);
    expect(LIMITS["opt-in"]).toBe(1200);
    expect(LIMITS.agentsMd).toBe(2700);
    expect(LIMITS.perAdapter).toBe(800);
    expect(SOFT_CEILING_RATIO).toBe(0.75);
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
      expect(result.universal.tokens).toBe(400);
      expect(result["opt-in"].tokens).toBe(400);
      // adapter NÃO entra em scope budget — é coberto por per-adapter
      expect(result.warnings).toHaveLength(0);
    });

    it("DADO escopo acima do soft ceiling QUANDO mede ENTÃO emite warning com 75%", () => {
      // 75% de 1500 = 1125 tokens. 4000 chars / 3.5 = 1143 tokens.
      const text = "a".repeat(4000);
      const catalog = { rules: [{ scope: "universal", instruction_en: text }] };
      const result = analyzeScopeBudgets(catalog);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatch(/Escopo 'universal'/);
      expect(result.warnings[0]).toMatch(/soft ceiling em 75%/);
    });
  });

  describe("analyzeAgentsMdBudget", () => {
    it("DADO catálogo QUANDO mede AGENTS.md ENTÃO mede o stub injetado (sem universal/opt-in)", () => {
      const stub = "a".repeat(1400); // 400 tokens
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
      const result = analyzeAgentsMdBudget(catalog, stub);
      expect(result.tokens).toBe(400);
      expect(result.limit).toBe(2700);
      expect(result.warnings).toHaveLength(0);
    });

    it("DADO regras enormes QUANDO mede AGENTS.md ENTÃO não emite warning do stub", () => {
      const stub = "a".repeat(1400); // 400 tokens, bem abaixo do soft ceiling
      const catalog = {
        rules: [
          { scope: "universal", instruction_en: "a".repeat(7000) },
          { scope: "opt-in", instruction_en: "b".repeat(1500) },
        ],
      };
      const result = analyzeAgentsMdBudget(catalog, stub);
      expect(result.tokens).toBeLessThan(LIMITS.agentsMd * SOFT_CEILING_RATIO);
      expect(result.warnings).toHaveLength(0);
    });

    it("DADO o stub canônico (default) QUANDO mede ENTÃO permanece dentro do orçamento sem warning", () => {
      const result = analyzeAgentsMdBudget({ rules: [] });
      expect(result.tokens).toBe(calculateTokH(buildAgentsRuntimeStub()));
      expect(result.tokens).toBeLessThan(LIMITS.agentsMd);
      expect(result.warnings).toHaveLength(0);
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
      expect(result.adapters.map((a) => a.adapter)).toEqual(["claude", "gemini"]);
      // 500 (rules) + 95 (hard-redirect base) = 595
      expect(result.adapters[0].tokens).toBe(595);
      expect(result.adapters[0].ruleTokens).toBe(500);
      expect(result.adapters[0].hardRedirectTokens).toBe(95);
      expect(result.adapters[0].limit).toBe(800);
      expect(result.warnings).toHaveLength(0);
    });

    it("DADO adapter pesado QUANDO mede ENTÃO emite warning específico", () => {
      // 75% de 800 = 600. Hard-redirect = 95. Precisamos > 505 tokens em rules.
      // 1900 chars / 3.5 = 543 tokens. Total 638.
      const catalog = {
        rules: [{ scope: "adapter", adapter: "claude", instruction_en: "a".repeat(1900) }],
      };
      const result = analyzePerAdapterBudgets(catalog);
      expect(result.adapters[0].tokens).toBeGreaterThanOrEqual(
        LIMITS.perAdapter * SOFT_CEILING_RATIO
      );
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatch(/Entrypoint do adapter 'claude'/);
    });

    it("DADO catálogo sem adapters QUANDO mede ENTÃO retorna lista vazia", () => {
      const result = analyzePerAdapterBudgets({ rules: [] });
      expect(result.adapters).toEqual([]);
      expect(result.warnings).toEqual([]);
    });
  });

  describe("analyzeBudget (consolidado)", () => {
    it("DADO catálogo completo QUANDO mede ENTÃO retorna scopes + agentsMd + perAdapter + warnings agregados", () => {
      const stub = "a".repeat(1400); // 400 tokens
      const catalog = {
        rules: [
          { scope: "universal", instruction_en: "a".repeat(1400) }, // 400 tok
          { scope: "opt-in", instruction_en: "b".repeat(700) }, // 200 tok
          { scope: "adapter", adapter: "claude", instruction_en: "c".repeat(700) }, // 200 + 95
          { scope: "adapter", adapter: "codex", instruction_en: "d".repeat(700) }, // 200 + 95
        ],
      };
      const result = analyzeBudget(catalog, stub);
      expect(result.scopes.universal.tokens).toBe(400);
      expect(result.scopes["opt-in"].tokens).toBe(200);
      expect(result.agentsMd.tokens).toBe(400);
      expect(result.perAdapter).toHaveLength(2);
      expect(result.warnings).toEqual([]);
    });
  });
});

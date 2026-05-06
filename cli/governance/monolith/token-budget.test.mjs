import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateTokH, analyzeBudget, LIMITS } from "./token-budget.mjs";

describe("Token Budget", () => {
  it("DADO um texto QUANDO calculateTokH é chamado ENTÃO divide o tamanho por 3.5 e arredonda para cima", () => {
    assert.equal(calculateTokH("123"), Math.ceil(3 / 3.5)); // 1
    assert.equal(calculateTokH("1234"), Math.ceil(4 / 3.5)); // 2
  });

  it("DADO um catálogo QUANDO analyzeBudget é executado ENTÃO calcula os totais corretamente por escopo", () => {
    const longText = "a".repeat(1400); // 400 tokens

    const catalog = {
      rules: [
        { scope: "universal", instruction_en: longText },
        { scope: "adapter", instruction_en: longText },
        { scope: "opt-in", instruction_en: longText },
      ],
    };

    const result = analyzeBudget(catalog);

    assert.equal(result.aggregate.tokens, 1200);
    assert.equal(result.universal.tokens, 400);
    assert.equal(result.adapter.tokens, 400);
    assert.equal(result["opt-in"].tokens, 400);
  });

  it("DADO um consumo maior que 70% QUANDO analyzeBudget é executado ENTÃO emite warning (soft ceiling) e NÃO falha", () => {
    // 70% de 600 (adapter) = 420 tokens. Precisamos de > 420 * 3.5 chars = 1470 chars
    const textOverAdapter = "a".repeat(1500); // ~429 tokens

    const catalog = {
      rules: [{ scope: "adapter", instruction_en: textOverAdapter }],
    };

    const result = analyzeBudget(catalog);

    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0], /\[TOKEN_WARN\] Escopo 'adapter'/);
  });
});

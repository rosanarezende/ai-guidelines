const TOK_H_RATIO = 3.5;

export const LIMITS = {
  aggregate: 6000,
  universal: 1500,
  adapter: 600,
  "opt-in": 1200,
};

export const SOFT_CEILING_RATIO = 0.7;

/**
 * Calcula o orçamento de tokens usando a heurística Tok-H
 * @param {string} text O texto a ser medido
 * @returns {number} Número estimado de tokens
 */
export function calculateTokH(text) {
  if (!text) return 0;
  return Math.ceil(text.length / TOK_H_RATIO);
}

/**
 * Analisa o catálogo inteiro e retorna o uso por escopo e warnings de soft ceiling
 * @param {Object} catalog Objeto do rules.json
 * @returns {Object} Relatório de budget
 */
export function analyzeBudget(catalog) {
  const result = {
    aggregate: { tokens: 0, limit: LIMITS.aggregate },
    universal: { tokens: 0, limit: LIMITS.universal },
    adapter: { tokens: 0, limit: LIMITS.adapter },
    "opt-in": { tokens: 0, limit: LIMITS["opt-in"] },
    warnings: [],
  };

  if (!catalog || !Array.isArray(catalog.rules)) return result;

  for (const rule of catalog.rules) {
    if (!rule.instruction_en) continue;
    const tokens = calculateTokH(rule.instruction_en);

    result.aggregate.tokens += tokens;

    if (rule.scope === "universal") {
      result.universal.tokens += tokens;
    } else if (rule.scope === "adapter") {
      result.adapter.tokens += tokens;
    } else if (rule.scope === "opt-in") {
      result["opt-in"].tokens += tokens;
    }
  }

  for (const scope of ["aggregate", "universal", "adapter", "opt-in"]) {
    const data = result[scope];
    if (data.tokens >= data.limit * SOFT_CEILING_RATIO) {
      result.warnings.push(
        `[TOKEN_WARN] Escopo '${scope}' atingiu soft ceiling: ${data.tokens} / ${data.limit} tokens (>= 70%)`
      );
    }
  }

  return result;
}

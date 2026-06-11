/**
 * ⚠️ LEGACY / TRANSITÓRIO (Spec 0024 · bootstrap-compiler) — superfície de
 * COMPATIBILIDADE, NÃO SSOT operacional. Consumido apenas por `check-budget`
 * (`cli/features/core/budget-report.mjs`); ainda sem equivalente TypeScript em
 * `src/` (migração plena = nó futuro CO-3). NÃO adicionar novos consumidores.
 */
import { buildAgentsRuntimeStub } from "./compiler.mjs";

const TOK_H_RATIO = 3.5;

/**
 * Tokens estimados do hard-redirect base presente em todo provider entrypoint
 * (CLAUDE.md, GEMINI.md, .openai/instructions.md, .cursor/rules/ai-guidelines.mdc, ...).
 * Calculado uma vez e reusado para projetar a carga total do entrypoint.
 *
 * Texto medido (em tokens Tok-H ≈ chars/3.5):
 *   "# SYSTEM DIRECTIVE: HARD REDIRECT\n\nYou are operating inside the <X>
 *   integration for this workspace.\n\nDo not rely on your default behavioral
 *   assumptions.\n\nYou must read and strictly follow the canonical AGENTS.md
 *   file at the repository root.\n\nProject-specific rules belong in
 *   AGENTS.md, not in this native provider file.\n\nConsumer-local
 *   ai-guidelines assets live under `.ai-guidelines/`."
 */
const HARD_REDIRECT_BASE_TOKENS = 95;

export const LIMITS = {
  // Por scope no rules.json — protege o catálogo (fonte).
  universal: 1500,
  "opt-in": 1200,
  // Por payload distribuído — protege o que cada IA realmente carrega.
  agentsMd: 2700, // carga do AGENTS.md stub (canal bootstrap)
  perAdapter: 800, // hard-redirect + adapter rules (carga do entrypoint nativo do provider)
};

export const SOFT_CEILING_RATIO = 0.75;

/**
 * Calcula o orçamento de tokens usando a heurística Tok-H (chars / 3.5).
 * @param {string} text
 * @returns {number}
 */
export function calculateTokH(text) {
  if (!text) return 0;
  return Math.ceil(text.length / TOK_H_RATIO);
}

function buildScopeBucket(limit) {
  return { tokens: 0, limit };
}

function buildWarning(label, tokens, limit) {
  const percent = Math.round((tokens / limit) * 100);
  return `[TOKEN_WARN] ${label}: ${tokens} / ${limit} tokens (${percent}% — soft ceiling em ${Math.round(
    SOFT_CEILING_RATIO * 100
  )}%)`;
}

function emitWarningIfOverSoftCeiling(label, bucket, warnings) {
  if (bucket.tokens >= bucket.limit * SOFT_CEILING_RATIO) {
    warnings.push(buildWarning(label, bucket.tokens, bucket.limit));
  }
}

/**
 * Mede tokens das regras agrupadas por escopo no catálogo.
 * Usado para validar que ninguém está inflando o source.
 */
export function analyzeScopeBudgets(catalog) {
  const result = {
    universal: buildScopeBucket(LIMITS.universal),
    "opt-in": buildScopeBucket(LIMITS["opt-in"]),
    warnings: [],
  };

  if (!catalog || !Array.isArray(catalog.rules)) {
    return result;
  }

  for (const rule of catalog.rules) {
    if (!rule.instruction_en) continue;
    const tokens = calculateTokH(rule.instruction_en);
    if (rule.scope === "universal") {
      result.universal.tokens += tokens;
    } else if (rule.scope === "opt-in") {
      result["opt-in"].tokens += tokens;
    }
  }

  emitWarningIfOverSoftCeiling("Escopo 'universal'", result.universal, result.warnings);
  emitWarningIfOverSoftCeiling("Escopo 'opt-in'", result["opt-in"], result.warnings);

  return result;
}

/**
 * Mede a carga estimada do AGENTS.md stub.
 *
 * Desde `checkpoint-runtime-bootstrap-readiness`, regras completas vivem no
 * catalogo/ledger/KnowledgeGraph. AGENTS.md carrega apenas o bootstrap situado.
 */
export function analyzeAgentsMdBudget(catalog) {
  const scopes = analyzeScopeBudgets(catalog);
  const tokens = calculateTokH(buildAgentsRuntimeStub());
  const bucket = { tokens, limit: LIMITS.agentsMd };
  const warnings = [];
  emitWarningIfOverSoftCeiling("AGENTS.md stub", bucket, warnings);
  return { ...bucket, warnings, breakdown: scopes };
}

/**
 * Mede a carga estimada de cada provider entrypoint (CLAUDE.md, GEMINI.md,
 * .openai/instructions.md, etc.) somando hard-redirect + adapter rules.
 *
 * Retorna um array com uma entrada por adapter, ordenado por id.
 */
export function analyzePerAdapterBudgets(catalog) {
  const byAdapter = new Map();

  if (!catalog || !Array.isArray(catalog.rules)) {
    return { adapters: [], warnings: [] };
  }

  for (const rule of catalog.rules) {
    if (rule.scope !== "adapter" || !rule.adapter || !rule.instruction_en) continue;
    const tokens = calculateTokH(rule.instruction_en);
    byAdapter.set(rule.adapter, (byAdapter.get(rule.adapter) ?? 0) + tokens);
  }

  const adapters = [];
  const warnings = [];

  const sortedIds = [...byAdapter.keys()].sort();
  for (const adapterId of sortedIds) {
    const ruleTokens = byAdapter.get(adapterId);
    const totalTokens = ruleTokens + HARD_REDIRECT_BASE_TOKENS;
    const bucket = { tokens: totalTokens, limit: LIMITS.perAdapter };
    const adapterWarnings = [];
    emitWarningIfOverSoftCeiling(`Entrypoint do adapter '${adapterId}'`, bucket, adapterWarnings);
    warnings.push(...adapterWarnings);
    adapters.push({
      adapter: adapterId,
      tokens: totalTokens,
      ruleTokens,
      hardRedirectTokens: HARD_REDIRECT_BASE_TOKENS,
      limit: LIMITS.perAdapter,
      warnings: adapterWarnings,
    });
  }

  return { adapters, warnings };
}

/**
 * Análise completa do orçamento de tokens — usada por `npm run build:rules` e
 * pelo comando `check-budget`. Combina escopos do catálogo, AGENTS.md stub e
 * cada provider entrypoint.
 */
export function analyzeBudget(catalog) {
  const scopes = analyzeScopeBudgets(catalog);
  const agentsMd = analyzeAgentsMdBudget(catalog);
  const perAdapter = analyzePerAdapterBudgets(catalog);

  return {
    scopes: {
      universal: scopes.universal,
      "opt-in": scopes["opt-in"],
    },
    agentsMd: {
      tokens: agentsMd.tokens,
      limit: agentsMd.limit,
    },
    perAdapter: perAdapter.adapters,
    warnings: [...scopes.warnings, ...agentsMd.warnings, ...perAdapter.warnings],
  };
}

/**
 * Orçamento de tokens do catálogo de regras e dos artefatos distribuídos.
 *
 * Migrado de `cli/governance/monolith/token-budget.mjs` (Spec 0024 · CO-3.3) —
 * o substrato legacy do monólito foi removido e a lógica passou a viver aqui,
 * no compilador TypeScript, ao lado de {@link RulesCatalogBuilder},
 * {@link RulesRuntimeCompiler} e {@link AgentsRuntimeBootstrap}.
 *
 * Camada: app/services — lógica pura sobre o catálogo. O único IO indireto é o
 * texto do stub de runtime, injetável (default = stub canônico em TS) para que
 * o teste de paridade fixe a aritmética sem depender do tamanho do stub real.
 */
import { buildAgentsRuntimeStub } from "./AgentsRuntimeBootstrap.js";

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
} as const;

export const SOFT_CEILING_RATIO = 0.75;

/** Entrada mínima estrutural: o catálogo serializado em `rules.json`. */
export interface BudgetCatalogRule {
  readonly scope?: string;
  readonly adapter?: string;
  readonly instruction_en?: string;
}

export interface BudgetCatalog {
  readonly rules?: ReadonlyArray<BudgetCatalogRule>;
}

export interface ScopeBucket {
  tokens: number;
  readonly limit: number;
}

export interface ScopeBudgets {
  readonly universal: ScopeBucket;
  readonly "opt-in": ScopeBucket;
  readonly warnings: string[];
}

export interface AgentsMdBudget extends ScopeBucket {
  readonly warnings: string[];
  readonly breakdown: ScopeBudgets;
}

export interface AdapterBudget {
  readonly adapter: string;
  readonly tokens: number;
  readonly ruleTokens: number;
  readonly hardRedirectTokens: number;
  readonly limit: number;
  readonly warnings: string[];
}

export interface PerAdapterBudgets {
  readonly adapters: AdapterBudget[];
  readonly warnings: string[];
}

export interface BudgetReport {
  readonly scopes: {
    readonly universal: ScopeBucket;
    readonly "opt-in": ScopeBucket;
  };
  readonly agentsMd: { readonly tokens: number; readonly limit: number };
  readonly perAdapter: readonly AdapterBudget[];
  readonly warnings: string[];
}

/**
 * Calcula o orçamento de tokens usando a heurística Tok-H (chars / 3.5).
 */
export function calculateTokH(text: string | null | undefined): number {
  if (!text) return 0;
  return Math.ceil(text.length / TOK_H_RATIO);
}

function buildScopeBucket(limit: number): ScopeBucket {
  return { tokens: 0, limit };
}

function buildWarning(label: string, tokens: number, limit: number): string {
  const percent = Math.round((tokens / limit) * 100);
  return `[TOKEN_WARN] ${label}: ${tokens} / ${limit} tokens (${percent}% — soft ceiling em ${Math.round(
    SOFT_CEILING_RATIO * 100
  )}%)`;
}

function emitWarningIfOverSoftCeiling(
  label: string,
  bucket: { tokens: number; limit: number },
  warnings: string[]
): void {
  if (bucket.tokens >= bucket.limit * SOFT_CEILING_RATIO) {
    warnings.push(buildWarning(label, bucket.tokens, bucket.limit));
  }
}

/**
 * Mede tokens das regras agrupadas por escopo no catálogo.
 * Usado para validar que ninguém está inflando o source.
 */
export function analyzeScopeBudgets(catalog: BudgetCatalog | null | undefined): ScopeBudgets {
  const result: ScopeBudgets = {
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
 * catálogo/ledger/KnowledgeGraph. AGENTS.md carrega apenas o bootstrap situado.
 * O texto do stub é injetável (default = stub canônico) — a CO-3.3 corrigiu a
 * medição, que no monólito legacy apontava para uma cópia stale do stub.
 */
export function analyzeAgentsMdBudget(
  catalog: BudgetCatalog | null | undefined,
  stub: string = buildAgentsRuntimeStub()
): AgentsMdBudget {
  const scopes = analyzeScopeBudgets(catalog);
  const tokens = calculateTokH(stub);
  const bucket = { tokens, limit: LIMITS.agentsMd };
  const warnings: string[] = [];
  emitWarningIfOverSoftCeiling("AGENTS.md stub", bucket, warnings);
  return { ...bucket, warnings, breakdown: scopes };
}

/**
 * Mede a carga estimada de cada provider entrypoint (CLAUDE.md, GEMINI.md,
 * .openai/instructions.md, etc.) somando hard-redirect + adapter rules.
 *
 * Retorna um array com uma entrada por adapter, ordenado por id.
 */
export function analyzePerAdapterBudgets(
  catalog: BudgetCatalog | null | undefined
): PerAdapterBudgets {
  const byAdapter = new Map<string, number>();

  if (!catalog || !Array.isArray(catalog.rules)) {
    return { adapters: [], warnings: [] };
  }

  for (const rule of catalog.rules) {
    if (rule.scope !== "adapter" || !rule.adapter || !rule.instruction_en) continue;
    const tokens = calculateTokH(rule.instruction_en);
    byAdapter.set(rule.adapter, (byAdapter.get(rule.adapter) ?? 0) + tokens);
  }

  const adapters: AdapterBudget[] = [];
  const warnings: string[] = [];

  const sortedIds = [...byAdapter.keys()].sort();
  for (const adapterId of sortedIds) {
    const ruleTokens = byAdapter.get(adapterId) ?? 0;
    const totalTokens = ruleTokens + HARD_REDIRECT_BASE_TOKENS;
    const bucket = { tokens: totalTokens, limit: LIMITS.perAdapter };
    const adapterWarnings: string[] = [];
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
export function analyzeBudget(
  catalog: BudgetCatalog | null | undefined,
  stub: string = buildAgentsRuntimeStub()
): BudgetReport {
  const scopes = analyzeScopeBudgets(catalog);
  const agentsMd = analyzeAgentsMdBudget(catalog, stub);
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

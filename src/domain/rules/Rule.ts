/**
 * Modelo do domínio de regras (Rules) — espelho tipado de `rules.json` produzido
 * pelo builder mjs. Não importa filesystem nem libs externas; é puramente o
 * shape canônico que a Application pode consumir.
 *
 * Camada: domain — sem IO, sem yaml, sem fs.
 */

export const RULE_SCOPES = ["universal", "adapter", "opt-in"] as const;
export type RuleScope = (typeof RULE_SCOPES)[number];

export const RULE_CATEGORIES = [
  "correctness",
  "security",
  "maintainability",
  "process",
  "editorial",
] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];

export const RULE_EVIDENCE_STRENGTHS = [
  "strong",
  "medium",
  "emerging",
  "declared_heuristic",
] as const;
export type RuleEvidenceStrength = (typeof RULE_EVIDENCE_STRENGTHS)[number];

export const RULE_ADAPTERS = ["claude", "codex", "gemini"] as const;
export type RuleAdapter = (typeof RULE_ADAPTERS)[number];

/**
 * Zona de runtime do AGENTS.md compilado.
 * - `top`     — diretivas universais sempre injetadas
 * - `center`  — metodologias opcionais (TDD/BDD)
 * - `base`    — contexto tático (quality gates etc.)
 * - `adapter` — bloco específico do provider
 *
 * [DEC-0021-B05] zonas formalizam o runtime de composição do AGENTS.md.
 */
export const RULE_ZONES = ["top", "center", "base", "adapter"] as const;
export type RuleZone = (typeof RULE_ZONES)[number];

export interface Rule {
  readonly id: string;
  readonly scope: RuleScope;
  readonly category: RuleCategory;
  readonly evidence_strength: RuleEvidenceStrength;
  readonly sources: readonly string[];
  readonly applicable_languages: readonly string[];
  readonly tags: readonly string[];
  readonly title: string;
  readonly file: string;
  readonly instruction_en: string;
  readonly documentation_pt?: string;
  readonly adapter?: RuleAdapter;
  readonly opt_in_feature?: string;
  readonly validated_by_benchmark?: boolean;
}

export interface RulesCatalogJson {
  readonly rules: ReadonlyArray<Rule>;
  readonly by_scope: Readonly<Record<RuleScope, ReadonlyArray<string>>>;
  readonly by_feature: Readonly<Record<string, ReadonlyArray<string>>>;
  readonly generated_at: string;
  readonly schema_version: string;
}

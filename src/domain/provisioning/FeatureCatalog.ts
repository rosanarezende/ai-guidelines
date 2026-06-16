/**
 * Taxonomia das features opt-in do baseline.
 *
 * Migrado da parte PURA de `cli/cli/args.mjs` + `cli/features/core/config.mjs`
 * (Spec 0024 · CO-3.5).
 *
 *   - Editoriais     → compiladas no bloco `<AI_GUIDELINES>` do AGENTS.md.
 *   - Infraestrutura → modificam package.json, hooks e CI/CD do consumidor.
 *
 * `FEATURE_OPTIONS` é derivado por composição; as listas tipadas
 * (`EDITORIAL_FEATURES` / `INFRASTRUCTURE_FEATURES`) são a fonte de verdade.
 */

export type EditorialFeature = "quality-gates" | "tdd" | "bdd";
export type InfrastructureFeature = "prettier" | "husky" | "ci";
export type Feature = InfrastructureFeature | EditorialFeature;

export const EDITORIAL_FEATURES: readonly EditorialFeature[] = ["quality-gates", "tdd", "bdd"];
export const INFRASTRUCTURE_FEATURES: readonly InfrastructureFeature[] = [
  "prettier",
  "husky",
  "ci",
];
export const FEATURE_OPTIONS: readonly Feature[] = [
  ...INFRASTRUCTURE_FEATURES,
  ...EDITORIAL_FEATURES,
];

/**
 * Nomes dos arquivos `.md` gerados pelas features opt-in editoriais. Derivado de
 * `EDITORIAL_FEATURES`; o motor de prune usa esta lista para proteger arquivos
 * opt-in ativos durante a limpeza global.
 */
export const OPT_IN_RULE_FILES: readonly string[] = EDITORIAL_FEATURES.map((f) => `${f}.md`);

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function normalizeSelectedFeatures(input: unknown): string[] {
  if (input === undefined || input === null) {
    return [];
  }

  const features = Array.isArray(input) ? input : String(input).split(",");
  return unique(features.map((item) => String(item).trim()).filter(Boolean));
}

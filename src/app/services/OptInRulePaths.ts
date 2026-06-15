/**
 * Resolução de caminho relativo das regras editoriais opt-in
 * (`bdd`/`tdd`/`quality-gates`) dentro de `.core/rules/`.
 *
 * Migrado de `rules-loader.mjs` (Spec 0024 · CO-3.3) —
 * último resíduo ativo do monólito, consumido pelas features editoriais ao
 * sincronizar `.ai-guidelines/rules/<feature>.md` no consumidor. As demais
 * exportações do antigo rules-loader já viviam no compilador TS
 * ({@link RulesRuntimeCompiler}); este módulo cobre o que faltava.
 *
 * Camada: app/services — mapa puro, sem IO.
 */
import path from "node:path";

type LangPaths = { readonly en: string; readonly pt: string };
type DefaultPath = { readonly default: string };

const OPT_IN_RULE_RELATIVE_PATHS: Readonly<Record<string, LangPaths | DefaultPath>> = {
  bdd: {
    en: path.join("opt-in", "methodologies", "bdd-en.md"),
    pt: path.join("opt-in", "methodologies", "bdd-pt.md"),
  },
  tdd: {
    en: path.join("opt-in", "methodologies", "tdd-en.md"),
    pt: path.join("opt-in", "methodologies", "tdd-pt.md"),
  },
  "quality-gates": {
    default: path.join("opt-in", "quality", "quality-gates.md"),
  },
};

/**
 * Caminho relativo (a `.core/rules/`) do arquivo de regra de uma feature opt-in.
 * Features i18n (`bdd`/`tdd`) honram `lang` com fallback para PT; as demais
 * usam um único arquivo. Retorna `null` para features desconhecidas.
 */
export function getOptInRuleRelativePath(feature: string, lang: string = "pt"): string | null {
  const rulePath = OPT_IN_RULE_RELATIVE_PATHS[feature];
  if (!rulePath) {
    return null;
  }

  if (feature === "bdd" || feature === "tdd") {
    const langPaths = rulePath as LangPaths;
    return (langPaths as Record<string, string>)[lang] ?? langPaths.pt;
  }

  return (rulePath as DefaultPath).default;
}

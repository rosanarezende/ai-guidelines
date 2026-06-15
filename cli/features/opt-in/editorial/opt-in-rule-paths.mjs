import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT_DIR } from "#fs/file-system";

/**
 * Ponte cross-OS para o resolvedor de caminhos das regras opt-in, que vive no
 * compilador TypeScript (`src/app/services/OptInRulePaths.ts`) e é consumido a
 * partir de `dist/` após `npm run build` — mesmo padrão de `pointers.mjs`.
 * Centraliza o bridge para as features editoriais (`bdd`/`tdd`/`quality-gates`).
 */
export async function getOptInRuleRelativePath(feature, lang = "pt") {
  const url = pathToFileURL(
    path.join(ROOT_DIR, "dist", "app", "services", "OptInRulePaths.js")
  ).href;
  const mod = await import(url);
  return mod.getOptInRuleRelativePath(feature, lang);
}

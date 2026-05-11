/**
 * Mapeamento puro escopo→zona e classificação de topologia física.
 *
 * Top/Center/Base são zonas de runtime do AGENTS.md compilado; a topologia
 * física `.core/rules/{top,center,base,adapters}/` reflete a mesma taxonomia
 * para alinhar repo-fonte, builder e runtime [DEC-0021-B05].
 *
 * Camada: domain — pura, sem IO.
 */

import { GovernanceError } from "../shared/errors.js";
import { Rule, RuleScope, RuleZone } from "./Rule.js";

/**
 * Diretório de primeiro nível esperado em `.core/rules/` por zona.
 * Posix-style sempre (compatibilidade cross-OS via normalização).
 */
export const RULE_ZONE_DIRECTORIES: Readonly<Record<RuleZone, string>> = {
  top: "top",
  center: "center",
  base: "base",
  adapter: "adapters",
};

/**
 * `opt-in/` legado é aceito como projeção de `center`/`base` até reorg
 * concluído. Após reorg, paths sob `opt-in/` viram violação topológica.
 */
export const RULE_VALID_TOP_LEVEL_DIRS: readonly string[] = [
  "top",
  "center",
  "base",
  "adapters",
  "_meta",
];

/**
 * Sub-pasta canônica esperada dentro de center/base por `opt_in_feature`.
 * Mantida estável para permitir lookup determinístico sem regex.
 */
export const OPT_IN_FEATURE_LAYOUT: Readonly<Record<string, RuleZone>> = {
  tdd: "center",
  bdd: "center",
  "quality-gates": "base",
};

export function scopeToZone(rule: Pick<Rule, "scope" | "opt_in_feature">): RuleZone {
  if (rule.scope === "universal") return "top";
  if (rule.scope === "adapter") return "adapter";

  const feature = rule.opt_in_feature;
  if (!feature) {
    throw new GovernanceError(
      "RULE_OPT_IN_MISSING_FEATURE",
      `Regra com scope=opt-in exige opt_in_feature; recebido: ${JSON.stringify(rule)}`
    );
  }

  const zone = OPT_IN_FEATURE_LAYOUT[feature];
  if (!zone) {
    throw new GovernanceError(
      "RULE_OPT_IN_UNKNOWN_FEATURE",
      `opt_in_feature desconhecida "${feature}" — adicionar em OPT_IN_FEATURE_LAYOUT antes do build`
    );
  }
  return zone;
}

/**
 * Classifica um path relativo a `.core/rules/` (posix) na zona esperada.
 * Retorna `null` se o path estiver fora da topologia formalizada (ex.: arquivo solto na raiz).
 */
export function pathToZone(relativePosixPath: string): RuleZone | null {
  const segments = relativePosixPath.split("/").filter((seg) => seg.length > 0);
  if (segments.length === 0) return null;
  const head = segments[0];
  if (head === "top") return "top";
  if (head === "center") return "center";
  if (head === "base") return "base";
  if (head === "adapters") return "adapter";
  return null;
}

/**
 * Operações puras sobre uma coleção de regras já parseada.
 *
 * Camada: domain — sem IO, sem libs externas.
 */

import { GovernanceError } from "../shared/errors.js";
import { Rule, RuleScope, RuleZone, RULE_SCOPES } from "./Rule.js";
import { scopeToZone } from "./ruleZone.js";

export type RulesByScope = Readonly<Record<RuleScope, ReadonlyArray<string>>>;
export type RulesByZone = Readonly<Record<RuleZone, ReadonlyArray<string>>>;
export type RulesByFeature = Readonly<Record<string, ReadonlyArray<string>>>;

export interface BuiltCatalog {
  readonly rules: ReadonlyArray<Rule>;
  readonly by_scope: RulesByScope;
  readonly by_zone: RulesByZone;
  readonly by_feature: RulesByFeature;
}

function sortById(rules: ReadonlyArray<Rule>): Rule[] {
  return [...rules].sort((a, b) => a.id.localeCompare(b.id));
}

export function assertUniqueIds(rules: ReadonlyArray<Rule>): void {
  const seen = new Set<string>();
  for (const rule of rules) {
    if (seen.has(rule.id)) {
      throw new GovernanceError(
        "RULES_DUPLICATE_ID",
        `ID duplicado em catálogo de regras: ${rule.id}`
      );
    }
    seen.add(rule.id);
  }
}

export function indexByScope(rules: ReadonlyArray<Rule>): RulesByScope {
  const seed: Record<RuleScope, string[]> = {
    universal: [],
    adapter: [],
    "opt-in": [],
  };
  for (const rule of sortById(rules)) {
    if (!RULE_SCOPES.includes(rule.scope)) continue;
    seed[rule.scope].push(rule.id);
  }
  return seed;
}

export function indexByZone(rules: ReadonlyArray<Rule>): RulesByZone {
  const seed: Record<RuleZone, string[]> = {
    top: [],
    center: [],
    base: [],
    adapter: [],
  };
  for (const rule of sortById(rules)) {
    const zone = scopeToZone(rule);
    seed[zone].push(rule.id);
  }
  return seed;
}

export function indexByFeature(rules: ReadonlyArray<Rule>): RulesByFeature {
  const acc: Record<string, string[]> = {};
  for (const rule of sortById(rules)) {
    if (rule.scope !== "opt-in" || !rule.opt_in_feature) continue;
    if (!acc[rule.opt_in_feature]) acc[rule.opt_in_feature] = [];
    acc[rule.opt_in_feature].push(rule.id);
  }
  return acc;
}

export function buildCatalog(rules: ReadonlyArray<Rule>): BuiltCatalog {
  assertUniqueIds(rules);
  return {
    rules: sortById(rules),
    by_scope: indexByScope(rules),
    by_zone: indexByZone(rules),
    by_feature: indexByFeature(rules),
  };
}

export function findById(rules: ReadonlyArray<Rule>, id: string): Rule | undefined {
  return rules.find((r) => r.id === id);
}

export function filterByZone(rules: ReadonlyArray<Rule>, zone: RuleZone): Rule[] {
  return sortById(rules.filter((r) => scopeToZone(r) === zone));
}

export function filterByScope(rules: ReadonlyArray<Rule>, scope: RuleScope): Rule[] {
  return sortById(rules.filter((r) => r.scope === scope));
}

export function filterByTag(rules: ReadonlyArray<Rule>, tag: string): Rule[] {
  return sortById(rules.filter((r) => r.tags.includes(tag)));
}

/**
 * Renderiza o catálogo determinístico em markdown legível (projection pipeline).
 * Não depende de IO; quem persistir tem responsabilidade de write atômico.
 */
export function projectCatalogMarkdown(
  rules: ReadonlyArray<Rule>,
  options: { baseRelativePath: (filePath: string) => string }
): string {
  const sorted = sortById(rules);
  let md =
    "# Rules Catalog\n\n" +
    "> Índice navegável gerado automaticamente.\n" +
    "> **NÃO EDITE ESTE ARQUIVO** — ele é reconstruído via `npm run build:rules`.\n\n" +
    "| ID | Title | Scope | Zone | Category | Link |\n" +
    "|----|-------|-------|------|----------|------|\n";

  for (const rule of sorted) {
    const id = rule.id;
    const title = (rule.title || "—").replace(/\|/g, "\\|");
    const scope = rule.scope;
    const zone = scopeToZone(rule);
    const category = rule.category;
    const rel = options.baseRelativePath(rule.file).replace(/\\/g, "/");
    const anchor = id.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const link = `[Ver](${rel}#${anchor})`;
    md += `| **${id}** | ${title} | \`${scope}\` | \`${zone}\` | \`${category}\` | ${link} |\n`;
  }

  return md;
}

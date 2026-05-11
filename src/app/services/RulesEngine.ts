/**
 * RulesEngine — bounded context que aliena topologia física (`.core/rules/`),
 * builder (mjs) e runtime (compiler).
 *
 * Pipelines:
 *  1. parse       — `RulesCatalogSource.load()` + validação estrutural mínima
 *  2. build       — aggregação determinística (by_scope/by_zone/by_feature)
 *  3. projection  — markdown legível (catálogo humano, ledger de core rules)
 *  4. lookup      — consultas por id/zone/scope/tag
 *
 * Camada: app — depende de domain + ports; nunca importa infrastructure.
 */

import {
  Rule,
  RuleScope,
  RuleZone,
  RulesCatalogJson,
  RULE_SCOPES,
} from "../../domain/rules/Rule.js";
import {
  BuiltCatalog,
  buildCatalog,
  filterByScope,
  filterByTag,
  filterByZone,
  findById,
  projectCatalogMarkdown,
} from "../../domain/rules/RulesCatalog.js";
import { GovernanceError } from "../../domain/shared/errors.js";
import { RulesCatalogSource } from "../ports/RulesCatalogSource.js";

export class RulesEngine {
  constructor(private readonly source: RulesCatalogSource) {}

  /** Pipeline 1 — parse: lê o catálogo serializado e valida shape mínimo. */
  parse(): RulesCatalogJson {
    const catalog = this.source.load();
    if (!Array.isArray(catalog?.rules)) {
      throw new GovernanceError(
        "RULES_CATALOG_INVALID",
        "Catálogo serializado inválido: `rules` ausente ou não-array"
      );
    }
    return catalog;
  }

  /** Pipeline 2 — build: agrega índices determinísticos. */
  build(): BuiltCatalog {
    const json = this.parse();
    return buildCatalog(json.rules);
  }

  /** Pipeline 3 — projection: renderiza catálogo legível. */
  projectCatalogMarkdown(opts: { baseRelativePath: (filePath: string) => string }): string {
    return projectCatalogMarkdown(this.build().rules, opts);
  }

  // --- Pipeline 4 — lookup ---

  findById(id: string): Rule | undefined {
    return findById(this.build().rules, id);
  }

  listByScope(scope: RuleScope): Rule[] {
    if (!RULE_SCOPES.includes(scope)) {
      throw new GovernanceError("RULES_INVALID_SCOPE", `Escopo desconhecido: ${scope}`);
    }
    return filterByScope(this.build().rules, scope);
  }

  listByZone(zone: RuleZone): Rule[] {
    return filterByZone(this.build().rules, zone);
  }

  listByTag(tag: string): Rule[] {
    return filterByTag(this.build().rules, tag);
  }
}

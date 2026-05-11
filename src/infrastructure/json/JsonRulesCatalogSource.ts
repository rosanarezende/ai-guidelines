/**
 * Adapter concreto: lê `rules.json` (artefato do builder mjs) do filesystem.
 *
 * Boundary: única importação de `node:fs` para catálogo. A Application
 * recebe-o por DI atrás do port {@link RulesCatalogSource}.
 */
import { readFileSync } from "node:fs";

import { RulesCatalogJson } from "../../domain/rules/Rule.js";
import { GovernanceError } from "../../domain/shared/errors.js";
import { RulesCatalogSource } from "../../app/ports/RulesCatalogSource.js";

export class JsonRulesCatalogSource implements RulesCatalogSource {
  constructor(private readonly path: string) {}

  load(): RulesCatalogJson {
    let raw: string;
    try {
      raw = readFileSync(this.path, "utf-8");
    } catch (err) {
      throw new GovernanceError(
        "RULES_CATALOG_NOT_FOUND",
        `rules.json não encontrado em ${this.path}: ${(err as Error).message}`
      );
    }
    try {
      return JSON.parse(raw) as RulesCatalogJson;
    } catch (err) {
      throw new GovernanceError(
        "RULES_CATALOG_PARSE_ERROR",
        `rules.json inválido (${this.path}): ${(err as Error).message}`
      );
    }
  }
}

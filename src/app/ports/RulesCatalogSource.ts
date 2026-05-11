/**
 * Port: fonte serializada do catálogo de regras (`rules.json` produzido pelo
 * builder mjs). Mantém a Application desacoplada do filesystem.
 */
import { RulesCatalogJson } from "../../domain/rules/Rule.js";

export interface RulesCatalogSource {
  /** Carrega o catálogo serializado. Determinístico — chamada repetida devolve o mesmo objeto. */
  load(): RulesCatalogJson;
}

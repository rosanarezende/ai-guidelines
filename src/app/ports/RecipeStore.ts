/**
 * Port: acesso a Recipes e Partials.
 *
 * Mantém o boundary `app → infra` via interface: a Application **não**
 * importa `infrastructure/yaml/` direto; injeta esta interface.
 * Implementação concreta (`NodeRecipeStore`) vive em
 * `src/infrastructure/yaml/NodeRecipeStore.ts` (único lugar com yaml@2 e fs).
 *
 * Aplica ADR 0005: Recipe é o contrato de validação — o store carrega
 * a recipe tal qual declarada no YAML; validação fica no domain
 * (`assertValidRecipe`).
 */
import type { Recipe } from "../../domain/templates/Recipe.js";

export interface RecipeStore {
  /**
   * Carrega uma recipe pelo nome do arquivo (sem extensão `.recipe.yml`).
   * Ex.: `loadRecipe("tasks-evidence-driven")`.
   *
   * @throws GovernanceError RECIPE_NOT_FOUND se recipe não existir.
   */
  loadRecipe(name: string): Recipe;

  /**
   * Carrega o conteúdo Markdown de um partial.
   *
   * @param ref Caminho relativo a `.core/governance/templates/partials/`
   *            (ex.: `tasks/fase-0-setup.md`).
   * @throws GovernanceError RECIPE_PARTIAL_NOT_FOUND se partial não existir.
   */
  loadPartial(ref: string): string;
}

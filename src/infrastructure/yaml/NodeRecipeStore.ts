/**
 * Adapter: carrega Recipes (YAML) e Partials (Markdown) do filesystem.
 *
 * Convenções de caminho:
 *  - Recipes: `.core/governance/recipes/<name>.recipe.yml`
 *  - Partials: `.core/governance/templates/partials/<ref>`
 *
 * Anti-path-traversal mínimo: rejeita nomes com `/`, `\`, `..`
 * e refs absolutas ou com `..`. Quando inválido, lança o mesmo
 * erro "not found" (sem expor detalhes do filesystem ao caller).
 *
 * Nota: não faz `assertValidRecipe` — o **use case** (`AssembleArtifact`)
 * já chama `assertValidRecipe(recipe)` após o load.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import YAML from "yaml";

import { GovernanceError } from "../../domain/shared/errors.js";
import type { Recipe } from "../../domain/templates/Recipe.js";
import type { RecipeStore } from "../../app/ports/RecipeStore.js";

function isSafeName(name: string): boolean {
  return name.length > 0 && !name.includes("/") && !name.includes("\\") && !name.includes("..");
}

function isSafeRef(ref: string): boolean {
  if (ref.length === 0) return false;
  if (path.isAbsolute(ref)) return false;
  if (ref.includes("..")) return false;
  return true;
}

export class NodeRecipeStore implements RecipeStore {
  private readonly recipesDir: string;
  private readonly partialsDir: string;

  constructor(repoRoot: string) {
    this.recipesDir = path.join(repoRoot, ".core", "governance", "recipes");
    this.partialsDir = path.join(repoRoot, ".core", "governance", "templates", "partials");
  }

  loadRecipe(name: string): Recipe {
    if (!isSafeName(name)) {
      throw new GovernanceError("RECIPE_NOT_FOUND", `Recipe '${name}' não encontrada.`);
    }
    const filePath = path.join(this.recipesDir, `${name}.recipe.yml`);
    if (!fs.existsSync(filePath)) {
      throw new GovernanceError("RECIPE_NOT_FOUND", `Recipe '${name}' não encontrada.`);
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const pojo = YAML.parse(raw);
    return pojo as Recipe; // domain valida depois no use case
  }

  loadPartial(ref: string): string {
    if (!isSafeRef(ref)) {
      throw new GovernanceError("RECIPE_PARTIAL_NOT_FOUND", `Partial '${ref}' não encontrado.`);
    }
    const filePath = path.join(this.partialsDir, ref);
    if (!fs.existsSync(filePath)) {
      throw new GovernanceError("RECIPE_PARTIAL_NOT_FOUND", `Partial '${ref}' não encontrado.`);
    }
    return fs.readFileSync(filePath, "utf-8");
  }
}

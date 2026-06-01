/**
 * Use case: compõe um artefato de governança a partir de uma Recipe.
 *
 * Orquestra:
 *  1. `store.loadRecipe(name)` → POJO já parseado.
 *  2. `assertValidRecipe(recipe)` → schema guard (domain).
 *  3. Para cada slot, `store.loadPartial(ref)` → conteúdo Markdown.
 *  4. `assertValidPartialMarkdown(content, ref)` → contrato de partial.
 *  5. Concatena na ordem canônica dos slots (`invariants.canonicalOrder`).
 *  6. Retorna `ComposedArtifact` com conteúdo + metadata.
 *
 * Determinismo (ADR 0013): mesma recipe + mesmos partials → mesmo output
 * byte-a-byte. Separador entre slots é `\n\n` (sem padding extra).
 *
 * Camada: `app/`. Conhece domain + ports; não toca infra direto.
 * Persistência (escrita em disco) NÃO é responsabilidade deste use case.
 */
import { assertValidRecipe } from "../../domain/templates/Recipe.js";
import { assertValidPartialMarkdown } from "../../domain/templates/Partial.js";
import type {
  ComposedArtifact,
  ComposedArtifactMetadata,
} from "../../domain/templates/ComposedArtifact.js";
import type { RecipeStore } from "../ports/RecipeStore.js";

export interface AssembleArtifactDeps {
  readonly store: RecipeStore;
}

export interface AssembleArtifactInput {
  /** Nome da recipe (ex.: "tasks-evidence-driven"). */
  readonly recipeName: string;
}

/**
 * Separador determinístico entre blocos de slots.
 * Sem trailing newline extra — output é trim-stable.
 */
const SLOT_SEPARATOR = "\n\n";

export class AssembleArtifact {
  constructor(private readonly deps: AssembleArtifactDeps) {}

  execute(input: AssembleArtifactInput): ComposedArtifact {
    const recipe = this.deps.store.loadRecipe(input.recipeName);
    assertValidRecipe(recipe);

    const blocks: string[] = [];
    const composedSlots: string[] = [];

    for (const slot of recipe.slots) {
      // Q2 cravada: resolver sempre o primeiro partial (first-wins em v0).
      const ref = slot.partials[0];
      const content = this.deps.store.loadPartial(ref);
      assertValidPartialMarkdown(content, ref);

      blocks.push(content.trimEnd());
      composedSlots.push(slot.id);
    }

    const finalContent = blocks.join(SLOT_SEPARATOR) + "\n";

    const metadata: ComposedArtifactMetadata = {
      artifactKind: recipe.artifactKind,
      language: recipe.language,
      composedSlots,
    };

    return { content: finalContent, metadata };
  }
}

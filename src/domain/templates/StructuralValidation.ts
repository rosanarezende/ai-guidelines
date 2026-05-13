/**
 * Validação estrutural de artefatos compostos.
 *
 * Consome a Recipe como contrato de validação (ADR 0005 §3):
 * a mesma recipe que descreve **como montar** o artefato declara
 * **quais invariantes** ele precisa cumprir.
 *
 * Retorna **lista** de erros (não lança no primeiro): permite ao caller
 * reportar todas as violações de uma vez.
 *
 * Invariantes validadas:
 *  1. `forbiddenHeadings` — headings no output que coincidem (case-sensitive)
 *     com a lista proibida da recipe.
 *  2. Slot completeness — todos os slots `required: true` devem estar
 *     presentes em `composedSlots` do artefato.
 *  3. Self-consistency — metadata do artefato (artifactKind, workflowType,
 *     language) deve coincidir com a recipe que o gerou.
 *
 * Códigos estáveis (ADR 0002):
 *  - STRUCT_FORBIDDEN_SECTION
 *  - STRUCT_MISSING_SLOT
 *  - STRUCT_RECIPE_SELF_INCONSISTENT
 */
import { GovernanceError } from "../shared/errors.js";
import type { Recipe } from "./Recipe.js";
import type { ComposedArtifact } from "./ComposedArtifact.js";

// ---------------------------------------------------------------------------
// Heading extraction — regex leve (sem parser Markdown externo)
// ---------------------------------------------------------------------------

/** Captura headings ATX: `# Texto`, `## Texto`, etc. */
const HEADING_PATTERN = /^#{1,6}\s+(.+)$/;

const FENCE = /^(`{3,}|~{3,})/;

function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  let inCodeBlock = false;
  let openerChar: string | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    const fence = trimmed.match(FENCE);
    if (fence) {
      const ch = fence[1][0];
      if (!inCodeBlock) {
        inCodeBlock = true;
        openerChar = ch;
      } else if (openerChar === ch) {
        inCodeBlock = false;
        openerChar = null;
      }
      continue;
    }

    if (inCodeBlock) continue;

    const match = line.match(HEADING_PATTERN);
    if (match) {
      headings.push(match[1].trim());
    }
  }
  return headings;
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

/**
 * Valida um `ComposedArtifact` contra a `Recipe` que o gerou.
 *
 * @returns Lista de erros (vazia se válido).
 */
export function validateComposedArtifact(
  artifact: ComposedArtifact,
  recipe: Recipe
): GovernanceError[] {
  const errors: GovernanceError[] = [];

  // --- 1. Forbidden headings (case-sensitive, audit Q3) ---
  checkForbiddenHeadings(artifact, recipe, errors);

  // --- 2. Slot completeness ---
  checkSlotCompleteness(artifact, recipe, errors);

  // --- 3. Self-consistency recipe ↔ artifact metadata ---
  checkSelfConsistency(artifact, recipe, errors);

  return errors;
}

function checkForbiddenHeadings(
  artifact: ComposedArtifact,
  recipe: Recipe,
  errors: GovernanceError[]
): void {
  if (recipe.invariants.forbiddenHeadings.length === 0) return;

  const headings = extractHeadings(artifact.content);
  const forbidden = new Set(recipe.invariants.forbiddenHeadings);

  for (const heading of headings) {
    if (forbidden.has(heading)) {
      errors.push(
        new GovernanceError(
          "STRUCT_FORBIDDEN_SECTION",
          `Artefato '${recipe.artifactKind}': heading '${heading}' é proibido pela recipe (invariants.forbiddenHeadings).`
        )
      );
    }
  }
}

function checkSlotCompleteness(
  artifact: ComposedArtifact,
  recipe: Recipe,
  errors: GovernanceError[]
): void {
  const composedSet = new Set(artifact.metadata.composedSlots);

  for (const slot of recipe.slots) {
    if (slot.required && !composedSet.has(slot.id)) {
      errors.push(
        new GovernanceError(
          "STRUCT_MISSING_SLOT",
          `Artefato '${recipe.artifactKind}': slot required '${slot.id}' ausente da composição.`
        )
      );
    }
  }
}

function checkSelfConsistency(
  artifact: ComposedArtifact,
  recipe: Recipe,
  errors: GovernanceError[]
): void {
  const checks: Array<{ field: string; recipeVal: string; artifactVal: string }> = [
    {
      field: "artifactKind",
      recipeVal: recipe.artifactKind,
      artifactVal: artifact.metadata.artifactKind,
    },
    {
      field: "workflowType",
      recipeVal: recipe.workflowType,
      artifactVal: artifact.metadata.workflowType,
    },
    {
      field: "language",
      recipeVal: recipe.language,
      artifactVal: artifact.metadata.language,
    },
  ];

  for (const { field, recipeVal, artifactVal } of checks) {
    if (recipeVal !== artifactVal) {
      errors.push(
        new GovernanceError(
          "STRUCT_RECIPE_SELF_INCONSISTENT",
          `Artefato '${recipe.artifactKind}': '${field}' diverge entre recipe ('${recipeVal}') e artefato composto ('${artifactVal}').`
        )
      );
    }
  }
}

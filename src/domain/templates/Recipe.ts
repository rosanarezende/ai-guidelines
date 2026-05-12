/**
 * Domain puro do TemplateEngine — Recipe.
 *
 * Tipos, enums fechados e assertion de validação para composição atômica
 * de artefatos de governança. Domain recebe POJO já parseado; sem IO,
 * sem YAML, sem filesystem.
 *
 * Princípios canônicos aplicados:
 *  - ADR 0002 (.core/governance/adrs/0002-coverage-state-enum.md):
 *    enums são literal unions fechadas; mensagens nomeiam o conjunto válido.
 *  - ADR 0004 (.core/governance/adrs/0004-ast-only-extraction.md):
 *    determinismo como contrato — mesma recipe → mesmo output byte-a-byte.
 *  - ADR 0005 (.core/governance/adrs/0005-structural-validation.md):
 *    Recipe é o contrato de validação (slots ricos inline + invariants
 *    global mínimo). Opção (B) cravada no audit pré-3.D.
 *
 * Schema version: v0 (frozen set; bump exige ADR de extensão).
 */
import { GovernanceError } from "../shared/errors.js";

// ---------------------------------------------------------------------------
// Enums fechados (ADR 0002)
// ---------------------------------------------------------------------------

export const TEMPLATE_SCHEMA_VERSIONS = Object.freeze(["v0"] as const);
export type TemplateSchemaVersion = (typeof TEMPLATE_SCHEMA_VERSIONS)[number];

export const ARTIFACT_KINDS = Object.freeze([
  "spec",
  "plan",
  "tasks",
  "decision-brief",
  "next",
  "research-index",
  "roadmap",
] as const);
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

export const WORKFLOW_TYPES = Object.freeze([
  "evidence-driven",
  "deterministic",
  "mixed",
  "n/a",
] as const);
export type WorkflowType = (typeof WORKFLOW_TYPES)[number];

export const LANGUAGES = Object.freeze(["pt-BR", "en-US"] as const);
export type Language = (typeof LANGUAGES)[number];

export const CANONICAL_ORDERS = Object.freeze(["slots"] as const);
export type CanonicalOrder = (typeof CANONICAL_ORDERS)[number];

// ---------------------------------------------------------------------------
// Tipos de domínio
// ---------------------------------------------------------------------------

/** Caminho relativo a `.core/governance/templates/partials/`. */
export type PartialRef = string;

export interface RecipeSlot {
  readonly id: string;
  readonly required: boolean;
  readonly minOccurrences?: number;
  readonly maxOccurrences?: number;
  readonly partials: readonly PartialRef[];
}

export interface RecipeInvariants {
  readonly canonicalOrder: CanonicalOrder;
  readonly forbiddenHeadings: readonly string[];
}

export interface Recipe {
  readonly schemaVersion: TemplateSchemaVersion;
  readonly artifactKind: ArtifactKind;
  readonly workflowType: WorkflowType;
  readonly language: Language;
  readonly slots: readonly RecipeSlot[];
  readonly invariants: RecipeInvariants;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function includes<T>(arr: readonly T[], value: unknown): value is T {
  return (arr as readonly unknown[]).includes(value);
}

// ---------------------------------------------------------------------------
// Assertion — família de erros RECIPE_*
// ---------------------------------------------------------------------------

/**
 * Valida shape de POJO parseado como Recipe.
 *
 * Erros estáveis (ADR 0002):
 *  - RECIPE_MISSING_FIELD
 *  - RECIPE_INVALID_SCHEMA_VERSION
 *  - RECIPE_INVALID_ARTIFACT_KIND
 *  - RECIPE_INVALID_WORKFLOW_TYPE
 *  - RECIPE_INVALID_LANGUAGE
 *  - RECIPE_EMPTY_SLOTS
 *  - RECIPE_DUPLICATE_SLOT_ID
 *  - RECIPE_SLOT_NO_PARTIAL
 *  - RECIPE_INVALID_CARDINALITY
 *  - RECIPE_REQUIRED_INCONSISTENT
 *  - RECIPE_INVALID_CANONICAL_ORDER
 */
export function assertValidRecipe(input: unknown): asserts input is Recipe {
  if (!isPlainObject(input)) {
    throw new GovernanceError(
      "RECIPE_MISSING_FIELD",
      "Recipe: entrada deve ser objeto com { schemaVersion, artifactKind, workflowType, language, slots, invariants }."
    );
  }

  const rec = input as Record<string, unknown>;

  // --- Campos obrigatórios de topo ---
  const requiredTopFields = [
    "schemaVersion",
    "artifactKind",
    "workflowType",
    "language",
    "slots",
    "invariants",
  ] as const;

  for (const field of requiredTopFields) {
    if (rec[field] === undefined) {
      throw new GovernanceError(
        "RECIPE_MISSING_FIELD",
        `Recipe: campo obrigatório '${field}' ausente.`
      );
    }
  }

  // --- Enums de topo ---
  if (!includes(TEMPLATE_SCHEMA_VERSIONS, rec.schemaVersion)) {
    throw new GovernanceError(
      "RECIPE_INVALID_SCHEMA_VERSION",
      `Recipe: 'schemaVersion' deve ser um de [${TEMPLATE_SCHEMA_VERSIONS.join(", ")}]; recebido '${String(rec.schemaVersion)}'.`
    );
  }

  if (!includes(ARTIFACT_KINDS, rec.artifactKind)) {
    throw new GovernanceError(
      "RECIPE_INVALID_ARTIFACT_KIND",
      `Recipe: 'artifactKind' deve ser um de [${ARTIFACT_KINDS.join(", ")}]; recebido '${String(rec.artifactKind)}'.`
    );
  }

  if (!includes(WORKFLOW_TYPES, rec.workflowType)) {
    throw new GovernanceError(
      "RECIPE_INVALID_WORKFLOW_TYPE",
      `Recipe: 'workflowType' deve ser um de [${WORKFLOW_TYPES.join(", ")}]; recebido '${String(rec.workflowType)}'.`
    );
  }

  if (!includes(LANGUAGES, rec.language)) {
    throw new GovernanceError(
      "RECIPE_INVALID_LANGUAGE",
      `Recipe: 'language' deve ser um de [${LANGUAGES.join(", ")}]; recebido '${String(rec.language)}'.`
    );
  }

  // --- Slots ---
  if (!Array.isArray(rec.slots) || rec.slots.length === 0) {
    throw new GovernanceError("RECIPE_EMPTY_SLOTS", "Recipe: 'slots' deve ser array não-vazio.");
  }

  const seenIds = new Set<string>();
  for (const slot of rec.slots as unknown[]) {
    assertValidSlot(slot, seenIds);
  }

  // --- Invariants ---
  assertValidInvariants(rec.invariants);
}

function assertValidSlot(input: unknown, seenIds: Set<string>): void {
  if (!isPlainObject(input)) {
    throw new GovernanceError(
      "RECIPE_MISSING_FIELD",
      "Recipe: cada slot deve ser objeto com { id, required, partials }."
    );
  }

  const slot = input as Record<string, unknown>;

  if (typeof slot.id !== "string" || slot.id.length === 0) {
    throw new GovernanceError(
      "RECIPE_MISSING_FIELD",
      "Recipe: slot sem campo 'id' válido (string não-vazia)."
    );
  }

  if (typeof slot.required !== "boolean") {
    throw new GovernanceError(
      "RECIPE_MISSING_FIELD",
      `Recipe: slot '${slot.id}' sem campo 'required' (boolean).`
    );
  }

  if (seenIds.has(slot.id)) {
    throw new GovernanceError(
      "RECIPE_DUPLICATE_SLOT_ID",
      `Recipe: slot id '${slot.id}' duplicado. Cada slot deve ter id único na recipe.`
    );
  }
  seenIds.add(slot.id);

  // --- Partials ---
  if (!Array.isArray(slot.partials) || slot.partials.length === 0) {
    throw new GovernanceError(
      "RECIPE_SLOT_NO_PARTIAL",
      `Recipe: slot '${slot.id}' deve ter 'partials' como array não-vazio (≥ 1 partial válido).`
    );
  }

  // --- Cardinalidade ---
  const required = slot.required as boolean;
  const minDefault = required ? 1 : 0;
  const min = typeof slot.minOccurrences === "number" ? slot.minOccurrences : minDefault;
  const max = typeof slot.maxOccurrences === "number" ? slot.maxOccurrences : 1;

  // Consistência required ↔ minOccurrences primeiro (erro de intent);
  // min vs max depois (erro aritmético).
  if (required && min === 0) {
    throw new GovernanceError(
      "RECIPE_REQUIRED_INCONSISTENT",
      `Recipe: slot '${slot.id}' é required=true mas minOccurrences=0. Slot required exige minOccurrences ≥ 1.`
    );
  }

  if (!required && min > 0) {
    throw new GovernanceError(
      "RECIPE_REQUIRED_INCONSISTENT",
      `Recipe: slot '${slot.id}' é required=false mas minOccurrences=${min}. Slot opcional exige minOccurrences=0.`
    );
  }

  if (min > max) {
    throw new GovernanceError(
      "RECIPE_INVALID_CARDINALITY",
      `Recipe: slot '${slot.id}' tem minOccurrences (${min}) > maxOccurrences (${max}).`
    );
  }
}

function assertValidInvariants(input: unknown): void {
  if (!isPlainObject(input)) {
    throw new GovernanceError(
      "RECIPE_MISSING_FIELD",
      "Recipe: 'invariants' deve ser objeto com { canonicalOrder, forbiddenHeadings }."
    );
  }

  const inv = input as Record<string, unknown>;

  if (!includes(CANONICAL_ORDERS, inv.canonicalOrder)) {
    throw new GovernanceError(
      "RECIPE_INVALID_CANONICAL_ORDER",
      `Recipe: 'invariants.canonicalOrder' deve ser um de [${CANONICAL_ORDERS.join(", ")}]; recebido '${String(inv.canonicalOrder)}'.`
    );
  }

  if (!Array.isArray(inv.forbiddenHeadings)) {
    throw new GovernanceError(
      "RECIPE_MISSING_FIELD",
      "Recipe: 'invariants.forbiddenHeadings' deve ser array (pode ser vazio)."
    );
  }
}

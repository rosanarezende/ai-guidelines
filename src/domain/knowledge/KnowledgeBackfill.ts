import { FALSIFICATION_ID_PATTERN } from "./Falsification.js";
import { KnowledgeArtifact } from "./KnowledgeArtifact.js";
import { formatRef, isWellFormedRef, KnowledgeRef, parseRef } from "./KnowledgeRef.js";
import { KnowledgeStage, KNOWLEDGE_STAGES } from "./KnowledgeStage.js";

export type KnowledgeBackfillKind = KnowledgeStage | "falsification";
export type KnowledgeBackfillStatus = "done" | "planned" | "needs_decision" | "not_applicable";
export type KnowledgeBackfillPriority = "P0" | "P1" | "P2";

export interface KnowledgeBackfillEntry {
  readonly id: string;
  readonly kind: KnowledgeBackfillKind;
  readonly ref: string;
  readonly status: KnowledgeBackfillStatus;
  readonly priority: KnowledgeBackfillPriority;
  readonly source: string;
  readonly rationale: string;
  readonly deadline?: string;
}

export const KNOWLEDGE_BACKFILL_KINDS: readonly KnowledgeBackfillKind[] = [
  ...KNOWLEDGE_STAGES,
  "falsification",
];

export const KNOWLEDGE_BACKFILL_STATUSES: readonly KnowledgeBackfillStatus[] = [
  "done",
  "planned",
  "needs_decision",
  "not_applicable",
];

export const KNOWLEDGE_BACKFILL_PRIORITIES: readonly KnowledgeBackfillPriority[] = [
  "P0",
  "P1",
  "P2",
];

const ENTRY_ID_PATTERN = /^KB-\d{4,}$/;

export interface KnowledgeBackfillViolation {
  readonly code: string;
  readonly entryId?: string;
  readonly message: string;
}

function isKnowledgeBackfillKind(value: string): value is KnowledgeBackfillKind {
  return (KNOWLEDGE_BACKFILL_KINDS as readonly string[]).includes(value);
}

function isStatus(value: string): value is KnowledgeBackfillStatus {
  return (KNOWLEDGE_BACKFILL_STATUSES as readonly string[]).includes(value);
}

function isPriority(value: string): value is KnowledgeBackfillPriority {
  return (KNOWLEDGE_BACKFILL_PRIORITIES as readonly string[]).includes(value);
}

export function isFalsificationBackfillRef(value: string): boolean {
  if (!value.startsWith("falsification:")) return false;
  return FALSIFICATION_ID_PATTERN.test(value.slice("falsification:".length));
}

export function parseBackfillKnowledgeRef(entry: KnowledgeBackfillEntry): KnowledgeRef | null {
  if (entry.kind === "falsification") return null;
  return parseRef(entry.ref);
}

export function validateKnowledgeBackfillEntry(
  entry: KnowledgeBackfillEntry
): KnowledgeBackfillViolation[] {
  const violations: KnowledgeBackfillViolation[] = [];
  const entryId = entry.id;

  if (!ENTRY_ID_PATTERN.test(entry.id)) {
    violations.push({
      code: "KB_ID_MALFORMED",
      entryId,
      message: `id "${entry.id}" não casa o padrão KB-NNNN.`,
    });
  }
  if (!isKnowledgeBackfillKind(entry.kind)) {
    violations.push({
      code: "KB_KIND_INVALID",
      entryId,
      message: `kind "${entry.kind}" inválido.`,
    });
  }
  if (!isStatus(entry.status)) {
    violations.push({
      code: "KB_STATUS_INVALID",
      entryId,
      message: `status "${entry.status}" inválido.`,
    });
  }
  if (!isPriority(entry.priority)) {
    violations.push({
      code: "KB_PRIORITY_INVALID",
      entryId,
      message: `priority "${entry.priority}" inválida.`,
    });
  }
  if (entry.source.trim().length === 0) {
    violations.push({ code: "KB_SOURCE_EMPTY", entryId, message: "source é obrigatório." });
  }
  if (entry.rationale.trim().length === 0) {
    violations.push({ code: "KB_RATIONALE_EMPTY", entryId, message: "rationale é obrigatório." });
  }
  if (entry.status === "planned" && !entry.deadline) {
    violations.push({
      code: "KB_PLANNED_WITHOUT_DEADLINE",
      entryId,
      message: "entrada planned precisa de deadline explícito dentro da Spec 0024.",
    });
  }

  if (entry.kind === "falsification") {
    if (!isFalsificationBackfillRef(entry.ref)) {
      violations.push({
        code: "KB_REF_MALFORMED",
        entryId,
        message: `ref "${entry.ref}" inválida; esperado falsification:FAL-NNNN.`,
      });
    }
    return violations;
  }

  let ref: KnowledgeRef;
  try {
    ref = parseRef(entry.ref);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    violations.push({ code: "KB_REF_MALFORMED", entryId, message });
    return violations;
  }

  if (!isWellFormedRef(ref)) {
    violations.push({
      code: "KB_REF_MALFORMED",
      entryId,
      message: `ref "${entry.ref}" malformada.`,
    });
  }
  if (ref.stage !== entry.kind) {
    violations.push({
      code: "KB_KIND_REF_MISMATCH",
      entryId,
      message: `kind "${entry.kind}" diverge de ref "${formatRef(ref)}".`,
    });
  }

  return violations;
}

export function validateKnowledgeBackfill(
  entries: ReadonlyArray<KnowledgeBackfillEntry>
): KnowledgeBackfillViolation[] {
  const violations = entries.flatMap(validateKnowledgeBackfillEntry);
  const byKind = new Map<KnowledgeBackfillKind, number>();
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.id)) {
      violations.push({
        code: "KB_ID_DUPLICATE",
        entryId: entry.id,
        message: `id duplicado "${entry.id}".`,
      });
    }
    seen.add(entry.id);
    byKind.set(entry.kind, (byKind.get(entry.kind) ?? 0) + 1);
  }

  for (const kind of KNOWLEDGE_BACKFILL_KINDS) {
    const count = byKind.get(kind) ?? 0;
    if (count < 2) {
      violations.push({
        code: "KB_KIND_UNDERREPRESENTED",
        message: `kind "${kind}" tem ${count} exemplo(s); mínimo CO-2.1 = 2.`,
      });
    }
  }

  return violations;
}

export function knowledgeArtifactsFromBackfill(
  entries: ReadonlyArray<KnowledgeBackfillEntry>
): KnowledgeArtifact[] {
  return entries
    .filter((entry) => entry.kind !== "falsification" && entry.status === "done")
    .map((entry) => {
      const ref = parseBackfillKnowledgeRef(entry);
      if (!ref) throw new Error(`entrada ${entry.id} não é KnowledgeRef`);
      return { id: ref.id, stage: ref.stage };
    });
}

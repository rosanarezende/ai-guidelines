import { GovernanceError } from "../shared/errors.js";
import { isInsightId } from "./InsightId.js";
import { CaptureDraft, Insight, isPromotionKind } from "./Insight.js";

/**
 * Invariantes da Percepção em Trânsito — funções puras (sem IO, sem relógio,
 * sem registry). Cada falha lança {@link GovernanceError} com `code`
 * determinístico, reutilizado por testes e mensagens de UI.
 *
 * Espelha o papel de `WorkItemPolicy` no agregado `WorkItem`.
 */

export const INSIGHT_INVARIANTS = {
  /** Texto mínimo de uma percepção: deve ser uma afirmação, não um rótulo. */
  TEXT_MIN: 8,
} as const;

// ISO-8601 estrita: data+hora+segundos+timezone (Z ou ±HH:MM); fração opcional.
const ISO_8601_STRICT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export function assertValidText(text: unknown): void {
  if (typeof text !== "string" || text.trim().length < INSIGHT_INVARIANTS.TEXT_MIN) {
    throw new GovernanceError(
      "INSIGHT_TEXT_TOO_SHORT",
      `O texto de uma percepção deve ter no mínimo ${INSIGHT_INVARIANTS.TEXT_MIN} caracteres ` +
        `(uma afirmação, não um rótulo).`
    );
  }
}

export function assertValidIso(at: unknown, where: string): void {
  if (typeof at !== "string" || !ISO_8601_STRICT.test(at)) {
    throw new GovernanceError(
      "INSIGHT_TIMESTAMP_INVALID",
      `${where} deve ser ISO-8601 estrito (ex.: "2026-06-03T12:00:00Z"); recebido: ${JSON.stringify(at)}.`
    );
  }
}

export function assertValidOrigin(origin: unknown, where: string): void {
  if (origin === null || typeof origin !== "object") {
    throw new GovernanceError("INSIGHT_ORIGIN_INVALID", `${where}.origin deve ser um objeto.`);
  }
  const o = origin as Record<string, unknown>;
  if (typeof o.spec !== "string" || o.spec.trim() === "") {
    throw new GovernanceError(
      "INSIGHT_ORIGIN_SPEC_REQUIRED",
      `${where}.origin.spec é obrigatório e deve ser uma string não-vazia.`
    );
  }
  if (!(o.cursor === null || typeof o.cursor === "string")) {
    throw new GovernanceError(
      "INSIGHT_ORIGIN_CURSOR_INVALID",
      `${where}.origin.cursor deve ser uma string ou null.`
    );
  }
}

export function assertOccurrence(occ: unknown, where: string): void {
  if (occ === null || typeof occ !== "object") {
    throw new GovernanceError("INSIGHT_OCCURRENCE_INVALID", `${where} deve ser um objeto.`);
  }
  const o = occ as Record<string, unknown>;
  assertValidIso(o.at, `${where}.at`);
  assertValidOrigin(o.origin, where);
  if (o.note !== undefined && (typeof o.note !== "string" || o.note.trim() === "")) {
    throw new GovernanceError(
      "INSIGHT_OCCURRENCE_NOTE_INVALID",
      `${where}.note, quando presente, deve ser uma string não-vazia (omita a chave).`
    );
  }
}

/** Valida o DTO de captura ANTES de qualquer alocação/persistência. */
export function assertCaptureDraft(draft: CaptureDraft): void {
  assertValidText(draft.text);
  assertValidOrigin(draft.origin, "captura");
  if (draft.links) assertValidLinks(draft.links, null);
}

function assertValidLinks(links: ReadonlyArray<unknown>, selfId: string | null): void {
  const seen = new Set<string>();
  for (const link of links) {
    if (!isInsightId(link)) {
      throw new GovernanceError(
        "INSIGHT_LINK_MALFORMED",
        `Link "${String(link)}" não é um InsightId válido (esperado PIT-NNNN).`
      );
    }
    if (selfId !== null && link === selfId) {
      throw new GovernanceError(
        "INSIGHT_LINK_SELF_REFERENCE",
        `A percepção ${selfId} não pode referenciar a si mesma em links.`
      );
    }
    if (seen.has(link)) {
      throw new GovernanceError("INSIGHT_LINK_DUPLICATE", `Link duplicado: "${link}".`);
    }
    seen.add(link);
  }
}

/**
 * Invariante completa do agregado. Reaplicada após cada transição e na
 * fronteira de persistência (defesa contra YAML corrompido editado à mão).
 */
export function assertInsightInvariants(insight: Insight): void {
  if (!isInsightId(insight.id)) {
    throw new GovernanceError(
      "INSIGHT_ID_MALFORMED",
      `InsightId malformado: "${insight.id}" (esperado PIT-NNNN).`
    );
  }
  assertValidText(insight.text);

  if (!Array.isArray(insight.occurrences) || insight.occurrences.length === 0) {
    throw new GovernanceError(
      "INSIGHT_OCCURRENCES_EMPTY",
      `A percepção ${insight.id} deve ter ao menos uma ocorrência (o nascimento).`
    );
  }
  insight.occurrences.forEach((occ, i) => assertOccurrence(occ, `${insight.id}.occurrences[${i}]`));

  // Cronologia não-decrescente.
  for (let i = 1; i < insight.occurrences.length; i++) {
    const prev = Date.parse(insight.occurrences[i - 1].at);
    const cur = Date.parse(insight.occurrences[i].at);
    if (cur < prev) {
      throw new GovernanceError(
        "INSIGHT_OCCURRENCE_OUT_OF_ORDER",
        `Ocorrências da percepção ${insight.id} devem ser cronologicamente não-decrescentes ` +
          `(${insight.occurrences[i].at} < ${insight.occurrences[i - 1].at}).`
      );
    }
  }

  if (insight.capturedAt !== insight.occurrences[0].at) {
    throw new GovernanceError(
      "INSIGHT_CAPTURED_AT_MISMATCH",
      `capturedAt (${insight.capturedAt}) deve ser igual ao instante da primeira ocorrência ` +
        `(${insight.occurrences[0].at}).`
    );
  }

  assertValidLinks(insight.links, insight.id);
  assertStatusFields(insight);
}

/** Coerência entre `status` e os campos de resolução (anti-estado inválido). */
export function assertStatusFields(insight: Insight): void {
  switch (insight.status) {
    case "open":
      if (insight.promotion !== undefined || insight.discardReason !== undefined) {
        throw new GovernanceError(
          "INSIGHT_OPEN_WITH_RESOLUTION",
          `A percepção ${insight.id} está 'open' mas carrega resolução — estado inválido.`
        );
      }
      return;
    case "promoted":
      if (insight.discardReason !== undefined) {
        throw new GovernanceError(
          "INSIGHT_PROMOTED_WITH_DISCARD",
          `A percepção ${insight.id} está 'promoted' mas carrega discardReason.`
        );
      }
      if (
        insight.promotion === undefined ||
        !isPromotionKind(insight.promotion.kind) ||
        typeof insight.promotion.ref !== "string" ||
        insight.promotion.ref.trim() === ""
      ) {
        throw new GovernanceError(
          "INSIGHT_PROMOTED_REQUIRES_TARGET",
          `A percepção ${insight.id} está 'promoted' mas falta um alvo válido (kind + ref).`
        );
      }
      return;
    case "discarded":
      if (insight.promotion !== undefined) {
        throw new GovernanceError(
          "INSIGHT_DISCARDED_WITH_PROMOTION",
          `A percepção ${insight.id} está 'discarded' mas carrega promotion.`
        );
      }
      if (typeof insight.discardReason !== "string" || insight.discardReason.trim() === "") {
        throw new GovernanceError(
          "INSIGHT_DISCARDED_REQUIRES_REASON",
          `A percepção ${insight.id} está 'discarded' mas falta um motivo (discardReason).`
        );
      }
      return;
    default:
      throw new GovernanceError(
        "INSIGHT_STATUS_UNKNOWN",
        `Status desconhecido para a percepção ${insight.id}: ${JSON.stringify(insight.status)}.`
      );
  }
}

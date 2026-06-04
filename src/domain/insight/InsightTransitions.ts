import { GovernanceError } from "../shared/errors.js";
import { InsightId } from "./InsightId.js";
import {
  CaptureDraft,
  Insight,
  isTerminal,
  Occurrence,
  OriginContext,
  PromotionTarget,
} from "./Insight.js";
import {
  assertCaptureDraft,
  assertInsightInvariants,
  assertValidIso,
  assertValidOrigin,
} from "./InsightPolicy.js";

/**
 * Serviço de domínio: transições do agregado {@link Insight}.
 *
 * Todas são puras e imutáveis (retornam nova instância) e reaplicam a
 * invariante completa após construir o próximo estado. Estados terminais
 * (`promoted`/`discarded`) são imutáveis — a história sobrevive por construção.
 */

function buildOccurrence(at: string, origin: OriginContext, note?: string): Occurrence {
  const trimmed = note?.trim();
  return {
    at,
    origin,
    ...(trimmed ? { note: trimmed } : {}),
  };
}

function ensureOpen(insight: Insight, code: string, action: string): void {
  if (isTerminal(insight)) {
    throw new GovernanceError(
      code,
      `Não é possível ${action} a percepção ${insight.id}: status '${insight.status}' é terminal (imutável).`
    );
  }
}

/** Captura uma nova percepção `open` com a observação de nascimento. */
export function captureInsight(draft: CaptureDraft, id: InsightId, at: string): Insight {
  assertCaptureDraft(draft);
  assertValidIso(at, "capturedAt");
  const insight: Insight = {
    id,
    text: draft.text.trim(),
    status: "open",
    capturedAt: at,
    occurrences: [buildOccurrence(at, draft.origin, draft.note)],
  };
  assertInsightInvariants(insight);
  return insight;
}

/** Registra uma recorrência (nova observação) numa percepção ainda aberta. */
export function recordOccurrence(
  insight: Insight,
  origin: OriginContext,
  at: string,
  note?: string
): Insight {
  ensureOpen(insight, "INSIGHT_RECORD_ON_TERMINAL", "registrar recorrência em");
  assertValidIso(at, "occurrence.at");
  assertValidOrigin(origin, "occurrence");
  const next: Insight = {
    ...insight,
    occurrences: [...insight.occurrences, buildOccurrence(at, origin, note)],
  };
  assertInsightInvariants(next); // captura inclusive ocorrência fora de ordem
  return next;
}

/**
 * Promove (gradua) a percepção para um artefato governado — terminal.
 * Registra o instante (`at`) e, se DECLARADO, o autor (`by`). Sem inferência.
 */
export function promoteInsight(
  insight: Insight,
  target: PromotionTarget,
  at: string,
  by?: string
): Insight {
  ensureOpen(insight, "INSIGHT_PROMOTE_ON_TERMINAL", "promover");
  assertValidIso(at, "resolvedAt");
  const next: Insight = {
    ...insight,
    status: "promoted",
    promotion: { kind: target.kind, ref: target.ref.trim() },
    resolvedAt: at,
    ...(by?.trim() ? { resolvedBy: by.trim() } : {}),
  };
  assertInsightInvariants(next);
  return next;
}

/**
 * Descarta conscientemente a percepção (anti-recaptura) — terminal.
 * Registra o instante (`at`) e, se DECLARADO, o autor (`by`).
 */
export function discardInsight(insight: Insight, reason: string, at: string, by?: string): Insight {
  ensureOpen(insight, "INSIGHT_DISCARD_ON_TERMINAL", "descartar");
  assertValidIso(at, "resolvedAt");
  const next: Insight = {
    ...insight,
    status: "discarded",
    discardReason: typeof reason === "string" ? reason.trim() : reason,
    resolvedAt: at,
    ...(by?.trim() ? { resolvedBy: by.trim() } : {}),
  };
  assertInsightInvariants(next);
  return next;
}

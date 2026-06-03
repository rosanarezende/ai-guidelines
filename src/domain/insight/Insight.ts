import { InsightId } from "./InsightId.js";

/**
 * Domínio: **Percepção em Trânsito** (aprendizado operacional em maturação,
 * ainda não absorvido por nenhum artefato governado).
 *
 * Este módulo carrega APENAS os tipos do agregado + derivações puras.
 * As invariantes vivem em {@link InsightPolicy}; as transições de estado
 * (capturar/registrar recorrência/promover/descartar) vivem no serviço de
 * domínio {@link InsightTransitions}. A separação espelha
 * `WorkItem` (tipos) ↔ `WorkItemPolicy` (invariantes).
 */

/** VO: contexto de origem de uma observação — onde/quando ela foi vista. */
export interface OriginContext {
  /** Id da spec ativa no momento (ex.: "0024"). */
  readonly spec: string;
  /** Cursor de checkpoint da topologia (ex.: "checkpoint-2.4d"); `null` se ausente. */
  readonly cursor: string | null;
}

/** VO: uma observação datada da percepção. Recorrência = nº de ocorrências. */
export interface Occurrence {
  /** ISO-8601 (UTC) — instante da observação. */
  readonly at: string;
  readonly origin: OriginContext;
  /** Nota livre situada a ESTA observação (opcional). */
  readonly note?: string;
}

/** Gêneros de destino quando uma percepção é absorvida (promovida). */
export type PromotionKind = "backlog" | "adr" | "guardrail" | "dec";

export const PROMOTION_KINDS: readonly PromotionKind[] = ["backlog", "adr", "guardrail", "dec"];

export function isPromotionKind(value: unknown): value is PromotionKind {
  return typeof value === "string" && (PROMOTION_KINDS as readonly string[]).includes(value);
}

/** VO: para onde a percepção graduou (gênero + referência do artefato final). */
export interface PromotionTarget {
  readonly kind: PromotionKind;
  /** Referência do artefato que a absorveu (ex.: "GG-0004", "ADR-0025"). */
  readonly ref: string;
}

/**
 * Ciclo de vida (one-way): `open` → `promoted` | `discarded`.
 * Estados terminais são imutáveis — a história é preservada por construção.
 */
export type InsightStatus = "open" | "promoted" | "discarded";

/**
 * Agregado raiz. Imutável: transições retornam novas instâncias.
 *
 * Invariantes (ver {@link InsightPolicy}):
 * - `occurrences` é não-vazio e cronologicamente não-decrescente;
 * - `capturedAt` === `occurrences[0].at` (imutável);
 * - `open` ⇒ sem `promotion`/`discardReason`;
 * - `promoted` ⇒ `promotion` presente, sem `discardReason`;
 * - `discarded` ⇒ `discardReason` presente, sem `promotion`;
 * - `links` sem auto-referência nem duplicatas.
 */
export interface Insight {
  readonly id: InsightId;
  readonly text: string;
  readonly status: InsightStatus;
  readonly capturedAt: string;
  readonly occurrences: ReadonlyArray<Occurrence>;
  readonly links: ReadonlyArray<InsightId>;
  readonly promotion?: PromotionTarget;
  readonly discardReason?: string;
}

/** DTO de captura — sem id/timestamp (alocados pelo serviço/use case via Clock). */
export interface CaptureDraft {
  readonly text: string;
  readonly origin: OriginContext;
  readonly note?: string;
  readonly links?: ReadonlyArray<InsightId>;
}

// ── Derivações puras ────────────────────────────────────────────────────────

/** Recorrência = número de observações acumuladas (cross-spec). */
export function recurrenceOf(insight: Insight): number {
  return insight.occurrences.length;
}

/** Origem = contexto da PRIMEIRA observação (o nascimento). */
export function originOf(insight: Insight): OriginContext {
  return insight.occurrences[0].origin;
}

/** Instante da observação mais recente. */
export function lastSeenAt(insight: Insight): string {
  return insight.occurrences[insight.occurrences.length - 1].at;
}

/** Specs distintas onde a percepção já apareceu, na ordem de primeira aparição. */
export function specsTouched(insight: Insight): ReadonlyArray<string> {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const occ of insight.occurrences) {
    if (!seen.has(occ.origin.spec)) {
      seen.add(occ.origin.spec);
      out.push(occ.origin.spec);
    }
  }
  return out;
}

export function isTerminal(insight: Insight): boolean {
  return insight.status !== "open";
}

import { GovernanceError } from "../shared/errors.js";

/**
 * Value Object: identidade canônica de uma **Percepção em Trânsito**.
 *
 * Formato `PIT-NNNN` — framework-scoped e sequencial, no mesmo idioma de
 * `ADR-NNNN` / `DEC-*`. O prefixo distingue o gênero "observação em
 * maturação" dos gêneros já formalizados (decisão, guardrail, backlog).
 *
 * `NNNN` admite ≥ 4 dígitos (zero-padded) para diff git estável; sequências
 * acima de 9999 simplesmente crescem em largura.
 */
export type InsightId = string;

const INSIGHT_ID_RE = /^PIT-(\d{4,})$/;

export function isInsightId(value: unknown): value is InsightId {
  return typeof value === "string" && INSIGHT_ID_RE.test(value);
}

export function formatInsightId(seq: number): InsightId {
  if (!Number.isInteger(seq) || seq < 1) {
    throw new GovernanceError(
      "INSIGHT_ID_INVALID_SEQ",
      `Sequência de InsightId deve ser inteiro >= 1 (recebido: ${seq}).`
    );
  }
  return `PIT-${String(seq).padStart(4, "0")}`;
}

export function insightIdSeq(id: InsightId): number {
  const match = INSIGHT_ID_RE.exec(id);
  if (!match) {
    throw new GovernanceError(
      "INSIGHT_ID_MALFORMED",
      `InsightId malformado: "${id}" (esperado o formato PIT-NNNN).`
    );
  }
  return Number(match[1]);
}

/** Próximo id sequencial dado o conjunto existente (max + 1; vazio ⇒ PIT-0001). */
export function nextInsightId(existing: ReadonlyArray<InsightId>): InsightId {
  const max = existing.reduce((acc, id) => Math.max(acc, insightIdSeq(id)), 0);
  return formatInsightId(max + 1);
}

/** Ordenação determinística por sequência (diff estável). */
export function compareInsightId(a: InsightId, b: InsightId): number {
  return insightIdSeq(a) - insightIdSeq(b);
}

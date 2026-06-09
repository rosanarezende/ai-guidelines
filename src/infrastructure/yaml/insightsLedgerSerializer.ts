import { parse, stringify } from "yaml";
import { InsightLedger } from "../../domain/insight/InsightLedger.js";
import {
  Insight,
  InsightStatus,
  Occurrence,
  OriginContext,
  PromotionTarget,
} from "../../domain/insight/Insight.js";

/**
 * Parser/serializer puro de uma partição do ledger de Percepções em Trânsito
 * (`.governance/runtime/insights/{open,promoted,discarded}.yml`).
 *
 * Disciplina herdada de `activeSpecsSerializer`:
 * - allowlist estrita de chaves (root e por registro);
 * - round-trip determinístico com ordem de chaves canônica (diff git estável);
 * - opcionais ausentes são OMITIDOS (nunca serializa `null`/`""`).
 *
 * Faz validação ESTRUTURAL (forma/tipos) e delega as INVARIANTES de domínio
 * a {@link InsightLedger.fromArray} — dois níveis, como no resto do runtime.
 *
 * Mapeamento `OriginContext`: a origem é ACHATADA no registro de ocorrência
 * (`spec`/`cursor`), evitando aninhamento. `cursor` ausente ⟺ `null`.
 */

export class InsightsLedgerParseError extends Error {
  constructor(message: string) {
    super(`Invalid insights.yml: ${message}`);
    this.name = "InsightsLedgerParseError";
  }
}

const ALLOWED_ROOT_KEYS = ["version", "insights"] as const;

const ALLOWED_INSIGHT_KEYS: ReadonlySet<string> = new Set([
  "id",
  "text",
  "status",
  "captured_at",
  "occurrences",
  "promotion",
  "discard_reason",
  "resolved_at",
  "resolved_by",
]);

const ALLOWED_OCCURRENCE_KEYS: ReadonlySet<string> = new Set(["at", "spec", "cursor", "note"]);

const ALLOWED_PROMOTION_KEYS: ReadonlySet<string> = new Set(["kind", "ref"]);

const STATUSES: ReadonlySet<string> = new Set<InsightStatus>(["open", "promoted", "discarded"]);

export function parseInsightsLedger(yamlText: string): InsightLedger {
  const raw: unknown = parse(yamlText);
  if (raw === null || raw === undefined) {
    // Arquivo vazio é um ledger vazio legítimo.
    return InsightLedger.empty();
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new InsightsLedgerParseError("root must be a mapping with `version` and `insights`");
  }
  const obj = raw as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (!(ALLOWED_ROOT_KEYS as readonly string[]).includes(key)) {
      throw new InsightsLedgerParseError(
        `unexpected top-level key "${key}" (allowed: ${ALLOWED_ROOT_KEYS.join(", ")})`
      );
    }
  }

  if (obj.version !== 1) {
    throw new InsightsLedgerParseError(`version must be 1 (got: ${JSON.stringify(obj.version)})`);
  }

  if (obj.insights === undefined || obj.insights === null) {
    throw new InsightsLedgerParseError("missing required key `insights`");
  }
  if (!Array.isArray(obj.insights)) {
    throw new InsightsLedgerParseError("`insights` must be a list (possibly empty)");
  }

  const insights = obj.insights.map((rawEntry, index) => parseInsight(rawEntry, index));
  // Delega unicidade + invariantes ao agregado.
  return InsightLedger.fromArray(insights);
}

function parseInsight(raw: unknown, index: number): Insight {
  const where = `insights[${index}]`;
  const entry = requireMapping(raw, where);
  assertNoUnknownKeys(entry, ALLOWED_INSIGHT_KEYS, where);

  const id = requireNonEmptyString(entry.id, `${where}.id`);
  const text = requireNonEmptyString(entry.text, `${where}.text`);
  const status = entry.status;
  if (typeof status !== "string" || !STATUSES.has(status)) {
    throw new InsightsLedgerParseError(
      `${where}.status must be one of: open|promoted|discarded (got: ${JSON.stringify(status)})`
    );
  }
  const capturedAt = requireNonEmptyString(entry.captured_at, `${where}.captured_at`);

  if (!Array.isArray(entry.occurrences) || entry.occurrences.length === 0) {
    throw new InsightsLedgerParseError(`${where}.occurrences must be a non-empty list`);
  }
  const occurrences = entry.occurrences.map((occ, i) =>
    parseOccurrence(occ, `${where}.occurrences[${i}]`)
  );

  const insight: Insight = {
    id,
    text,
    status: status as InsightStatus,
    capturedAt,
    occurrences,
    ...(entry.promotion !== undefined
      ? { promotion: parsePromotion(entry.promotion, `${where}.promotion`) }
      : {}),
    ...(entry.discard_reason !== undefined
      ? { discardReason: requireNonEmptyString(entry.discard_reason, `${where}.discard_reason`) }
      : {}),
    ...(entry.resolved_at !== undefined
      ? { resolvedAt: requireNonEmptyString(entry.resolved_at, `${where}.resolved_at`) }
      : {}),
    ...(entry.resolved_by !== undefined
      ? { resolvedBy: requireNonEmptyString(entry.resolved_by, `${where}.resolved_by`) }
      : {}),
  };
  return insight;
}

function parseOccurrence(raw: unknown, where: string): Occurrence {
  const entry = requireMapping(raw, where);
  assertNoUnknownKeys(entry, ALLOWED_OCCURRENCE_KEYS, where);
  const at = requireNonEmptyString(entry.at, `${where}.at`);
  const spec = requireNonEmptyString(entry.spec, `${where}.spec`);
  const origin: OriginContext = {
    spec,
    cursor: parseOptionalString(entry.cursor, `${where}.cursor`) ?? null,
  };
  const note = parseOptionalString(entry.note, `${where}.note`);
  return { at, origin, ...(note !== undefined ? { note } : {}) };
}

function parsePromotion(raw: unknown, where: string): PromotionTarget {
  const entry = requireMapping(raw, where);
  assertNoUnknownKeys(entry, ALLOWED_PROMOTION_KEYS, where);
  const kind = requireNonEmptyString(entry.kind, `${where}.kind`);
  const ref = requireNonEmptyString(entry.ref, `${where}.ref`);
  // `kind` é validado contra o enum de domínio em assertInsightInvariants (fromArray).
  return { kind: kind as PromotionTarget["kind"], ref };
}

// ── helpers estruturais ─────────────────────────────────────────────────────

function requireMapping(raw: unknown, where: string): Record<string, unknown> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new InsightsLedgerParseError(`${where} must be a mapping`);
  }
  return raw as Record<string, unknown>;
}

function assertNoUnknownKeys(
  entry: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  where: string
): void {
  for (const key of Object.keys(entry)) {
    if (!allowed.has(key)) {
      throw new InsightsLedgerParseError(
        `${where} has unexpected key "${key}" (allowed: ${[...allowed].join(", ")})`
      );
    }
  }
}

function requireNonEmptyString(value: unknown, where: string): string {
  if (typeof value !== "string") {
    throw new InsightsLedgerParseError(`${where} must be a string`);
  }
  if (value.trim() === "") {
    throw new InsightsLedgerParseError(`${where} must be a non-empty string`);
  }
  return value;
}

function parseOptionalString(value: unknown, where: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new InsightsLedgerParseError(`${where} must be a string when present`);
  }
  if (value.trim() === "") {
    throw new InsightsLedgerParseError(`${where} must be non-empty when present (omit the key)`);
  }
  return value;
}

/**
 * Serializa o ledger para YAML determinístico round-trippable.
 *
 * Ordem canônica por registro: id, text, status, captured_at, occurrences,
 * promotion?, discard_reason?, resolved_at?, resolved_by?. Por ocorrência:
 * at, spec, cursor?, note?. Opcionais ausentes (incluindo `cursor` null) são omitidos.
 */
export function stringifyInsightsLedger(ledger: InsightLedger): string {
  const plain = {
    version: 1,
    insights: ledger.all().map((insight) => {
      const obj: Record<string, unknown> = {
        id: insight.id,
        text: insight.text,
        status: insight.status,
        captured_at: insight.capturedAt,
        occurrences: insight.occurrences.map((occ) => serializeOccurrence(occ)),
      };
      if (insight.promotion !== undefined) {
        obj.promotion = { kind: insight.promotion.kind, ref: insight.promotion.ref };
      }
      if (insight.discardReason !== undefined) obj.discard_reason = insight.discardReason;
      if (insight.resolvedAt !== undefined) obj.resolved_at = insight.resolvedAt;
      if (insight.resolvedBy !== undefined) obj.resolved_by = insight.resolvedBy;
      return obj;
    }),
  };
  return stringify(plain, { indent: 2, lineWidth: 0 });
}

function serializeOccurrence(occ: Occurrence): Record<string, unknown> {
  const obj: Record<string, unknown> = { at: occ.at, spec: occ.origin.spec };
  if (occ.origin.cursor !== null) obj.cursor = occ.origin.cursor;
  if (occ.note !== undefined) obj.note = occ.note;
  return obj;
}

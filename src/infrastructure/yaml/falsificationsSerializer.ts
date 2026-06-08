import { parse, stringify } from "yaml";
import { Falsification } from "../../domain/knowledge/Falsification.js";
import { formatGovernedRef, parseGovernedRef } from "../../domain/knowledge/GovernedRef.js";
import { formatRef, parseRef } from "../../domain/knowledge/KnowledgeRef.js";

/**
 * Parser/serializer puro do ledger de Falsifications
 * (`.governance/runtime/falsifications/ledger.yml`).
 *
 * Disciplina herdada de `insightsLedgerSerializer`/`activeSpecsSerializer`:
 * - allowlist estrita de chaves (root e por registro);
 * - round-trip determinístico, ordem de chaves canônica (diff git estável);
 * - opcionais ausentes são OMITIDOS (nunca serializa `null`/`""`).
 *
 * Valida FORMA (tipos + refs bem-formados via `parseGovernedRef`/`parseRef`); as
 * INVARIANTES de domínio (F1–F3, selo do fingerprint) ficam em
 * `validateFalsification` / `co-knowledge:check` — dois níveis, como no resto do runtime.
 */
export class FalsificationsParseError extends Error {
  constructor(message: string) {
    super(`Invalid falsifications.yml: ${message}`);
    this.name = "FalsificationsParseError";
  }
}

const ALLOWED_ROOT_KEYS = ["version", "falsifications"] as const;

const ALLOWED_FALSIFICATION_KEYS: ReadonlySet<string> = new Set([
  "id",
  "claim",
  "fingerprint",
  "constrains",
  "evidence",
  "falsifies_ref",
  "crystallized_as",
  "captured_at",
]);

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function requireStr(value: unknown, field: string, index: number): string {
  const s = str(value);
  if (s === undefined) {
    throw new FalsificationsParseError(`falsifications[${index}].${field} é obrigatório (string).`);
  }
  return s;
}

export function parseFalsifications(yamlText: string): Falsification[] {
  const raw: unknown = parse(yamlText);
  if (raw === null || raw === undefined) return []; // arquivo vazio = ledger vazio legítimo
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new FalsificationsParseError(
      "root must be a mapping with `version` and `falsifications`"
    );
  }
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!(ALLOWED_ROOT_KEYS as readonly string[]).includes(key)) {
      throw new FalsificationsParseError(
        `unexpected top-level key "${key}" (allowed: ${ALLOWED_ROOT_KEYS.join(", ")})`
      );
    }
  }

  const list = obj.falsifications ?? [];
  if (!Array.isArray(list)) {
    throw new FalsificationsParseError("`falsifications` must be a list");
  }
  return list.map((item, index) => parseOne(item, index));
}

function parseOne(item: unknown, index: number): Falsification {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    throw new FalsificationsParseError(`falsifications[${index}] must be a mapping`);
  }
  const o = item as Record<string, unknown>;
  for (const key of Object.keys(o)) {
    if (!ALLOWED_FALSIFICATION_KEYS.has(key)) {
      throw new FalsificationsParseError(`falsifications[${index}]: unexpected key "${key}"`);
    }
  }

  const constrainsRaw = o.constrains;
  if (!Array.isArray(constrainsRaw)) {
    throw new FalsificationsParseError(`falsifications[${index}].constrains must be a list`);
  }
  const constrains = constrainsRaw.map((c, ci) =>
    parseGovernedRef(requireStr(c, `constrains[${ci}]`, index))
  );

  const falsifiesRaw = str(o.falsifies_ref);
  const crystallizedRaw = str(o.crystallized_as);

  return {
    id: requireStr(o.id, "id", index),
    claim: requireStr(o.claim, "claim", index),
    fingerprint: requireStr(o.fingerprint, "fingerprint", index),
    constrains,
    evidence: requireStr(o.evidence, "evidence", index),
    ...(falsifiesRaw !== undefined ? { falsifiesRef: parseRef(falsifiesRaw) } : {}),
    ...(crystallizedRaw !== undefined ? { crystallizedAs: parseRef(crystallizedRaw) } : {}),
    ...(str(o.captured_at) !== undefined ? { capturedAt: str(o.captured_at) } : {}),
  };
}

export function serializeFalsifications(falsifications: ReadonlyArray<Falsification>): string {
  const plain = {
    version: 1,
    falsifications: falsifications.map((f) => ({
      id: f.id,
      claim: f.claim,
      fingerprint: f.fingerprint,
      constrains: f.constrains.map(formatGovernedRef),
      evidence: f.evidence,
      ...(f.falsifiesRef ? { falsifies_ref: formatRef(f.falsifiesRef) } : {}),
      ...(f.crystallizedAs ? { crystallized_as: formatRef(f.crystallizedAs) } : {}),
      ...(f.capturedAt ? { captured_at: f.capturedAt } : {}),
    })),
  };
  return stringify(plain, { indent: 2, lineWidth: 0 });
}

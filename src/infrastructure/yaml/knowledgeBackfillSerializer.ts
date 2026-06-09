import { parse, stringify } from "yaml";
import {
  KnowledgeBackfillEntry,
  KnowledgeBackfillKind,
  KnowledgeBackfillPriority,
  KnowledgeBackfillScope,
  KnowledgeBackfillStatus,
} from "../../domain/knowledge/KnowledgeBackfill.js";

export class KnowledgeBackfillParseError extends Error {
  constructor(message: string) {
    super(`Invalid knowledge-backfill.yml: ${message}`);
    this.name = "KnowledgeBackfillParseError";
  }
}

const ALLOWED_ROOT_KEYS = ["version", "entries"] as const;

const ALLOWED_ENTRY_KEYS: ReadonlySet<string> = new Set([
  "id",
  "kind",
  "ref",
  "status",
  "priority",
  "source",
  "rationale",
  "deadline",
  "scope",
]);

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function requireStr(value: unknown, field: string, index: number): string {
  const s = str(value);
  if (s === undefined) {
    throw new KnowledgeBackfillParseError(`entries[${index}].${field} é obrigatório (string).`);
  }
  return s;
}

export function parseKnowledgeBackfill(yamlText: string): KnowledgeBackfillEntry[] {
  const raw: unknown = parse(yamlText);
  if (raw === null || raw === undefined) return [];
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new KnowledgeBackfillParseError("root must be a mapping with `version` and `entries`");
  }

  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!(ALLOWED_ROOT_KEYS as readonly string[]).includes(key)) {
      throw new KnowledgeBackfillParseError(
        `unexpected top-level key "${key}" (allowed: ${ALLOWED_ROOT_KEYS.join(", ")})`
      );
    }
  }

  const list = obj.entries ?? [];
  if (!Array.isArray(list)) {
    throw new KnowledgeBackfillParseError("`entries` must be a list");
  }
  return list.map(parseOne);
}

function parseOne(item: unknown, index: number): KnowledgeBackfillEntry {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    throw new KnowledgeBackfillParseError(`entries[${index}] must be a mapping`);
  }
  const o = item as Record<string, unknown>;
  for (const key of Object.keys(o)) {
    if (!ALLOWED_ENTRY_KEYS.has(key)) {
      throw new KnowledgeBackfillParseError(`entries[${index}]: unexpected key "${key}"`);
    }
  }

  return {
    id: requireStr(o.id, "id", index),
    kind: requireStr(o.kind, "kind", index) as KnowledgeBackfillKind,
    ref: requireStr(o.ref, "ref", index),
    status: requireStr(o.status, "status", index) as KnowledgeBackfillStatus,
    priority: requireStr(o.priority, "priority", index) as KnowledgeBackfillPriority,
    source: requireStr(o.source, "source", index),
    rationale: requireStr(o.rationale, "rationale", index),
    ...(str(o.deadline) !== undefined ? { deadline: str(o.deadline) } : {}),
    ...(str(o.scope) !== undefined ? { scope: str(o.scope) as KnowledgeBackfillScope } : {}),
  };
}

export function serializeKnowledgeBackfill(entries: ReadonlyArray<KnowledgeBackfillEntry>): string {
  return stringify(
    {
      version: 1,
      entries: entries.map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        ref: entry.ref,
        status: entry.status,
        priority: entry.priority,
        source: entry.source,
        rationale: entry.rationale,
        ...(entry.deadline ? { deadline: entry.deadline } : {}),
        ...(entry.scope ? { scope: entry.scope } : {}),
      })),
    },
    { indent: 2, lineWidth: 0 }
  );
}

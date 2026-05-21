import { parse } from "yaml";
import {
  ActiveSpecEntry,
  ActiveSpecsRoot,
  isActiveSpecStatus,
} from "../../domain/workflow/ActiveSpecEntry.js";
import { isWorkflowStage } from "../../domain/workflow/WorkflowState.js";

/**
 * Parser puro do índice operacional público (`.governance/runtime/active-specs.yml`).
 *
 * Schema cravado em `decision-brief.md` § [DEC-0023-G02] + [DEC-0023-G04]:
 * - Top-level: `version` (===1), `active_specs` (lista).
 * - Por entry — obrigatórios: id, slug, branch, stage, status, spec_path, updated_at.
 * - Por entry — opcionais: title, base_branch, source_state_path, updated_by, last_sync_commit.
 * - `stage` ∈ enum compartilhado com `state.yml.stage` ([DEC-0023-A04]).
 * - `status` ∈ {active, blocked, paused, completed} — vocabulário fechado ([DEC-0023-G04]).
 *
 * Campos proibidos (`next`, `gate`, `focus`, `rationale`, `checklist`, `debts`, `criteria`)
 * recebem mensagem específica citando [DEC-0023-G01]: se carregados aqui, recriam
 * merge incremental da spec por canal lateral e corroem ADR 0020.
 *
 * Drift guard de ambiente (verificar `spec_path` existe no disco) é responsabilidade
 * do use case `ListActiveSpecs`, não deste parser — preserva pureza (espelha o
 * pattern de `workflowStateSerializer.ts`).
 */

export class ActiveSpecsParseError extends Error {
  constructor(message: string) {
    super(`Invalid active-specs.yml: ${message}`);
    this.name = "ActiveSpecsParseError";
  }
}

const ALLOWED_ROOT_KEYS = ["version", "active_specs"] as const;

const REQUIRED_ENTRY_KEYS = [
  "id",
  "slug",
  "branch",
  "stage",
  "status",
  "spec_path",
  "updated_at",
] as const;

const OPTIONAL_ENTRY_KEYS = [
  "title",
  "base_branch",
  "source_state_path",
  "updated_by",
  "last_sync_commit",
] as const;

const ALLOWED_ENTRY_KEYS: ReadonlySet<string> = new Set<string>([
  ...REQUIRED_ENTRY_KEYS,
  ...OPTIONAL_ENTRY_KEYS,
]);

const PROHIBITED_ENTRY_KEYS_HINT: ReadonlySet<string> = new Set([
  "next",
  "gate",
  "focus",
  "rationale",
  "checklist",
  "debts",
  "criteria",
  "dec_refs",
  "tasks",
  "plan",
  "research",
]);

// ISO-8601 estrita: data + hora + segundos + timezone (Z ou ±HH:MM).
// Aceita fração de segundo opcional. NÃO aceita date-only nem offset implícito.
const ISO_8601_STRICT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export function parseActiveSpecs(yamlText: string): ActiveSpecsRoot {
  const raw: unknown = parse(yamlText);
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ActiveSpecsParseError("root must be a mapping with `version` and `active_specs`");
  }
  const obj = raw as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (!(ALLOWED_ROOT_KEYS as readonly string[]).includes(key)) {
      throw new ActiveSpecsParseError(
        `unexpected top-level key "${key}" (allowed: ${ALLOWED_ROOT_KEYS.join(", ")}; ` +
          `expanding the public index requires its own [DEC-*] per [DEC-0023-G02])`
      );
    }
  }

  if (obj.version !== 1) {
    throw new ActiveSpecsParseError(
      `version must be 1 (got: ${JSON.stringify(obj.version)}; bumping requires its own [DEC-*])`
    );
  }

  if (obj.active_specs === undefined || obj.active_specs === null) {
    throw new ActiveSpecsParseError("missing required key `active_specs`");
  }
  if (!Array.isArray(obj.active_specs)) {
    throw new ActiveSpecsParseError("`active_specs` must be a list (possibly empty)");
  }

  const entries: ActiveSpecEntry[] = obj.active_specs.map((rawEntry, index) =>
    parseEntry(rawEntry, index)
  );

  return { version: 1, activeSpecs: entries };
}

function parseEntry(raw: unknown, index: number): ActiveSpecEntry {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ActiveSpecsParseError(`active_specs[${index}] must be a mapping`);
  }
  const entry = raw as Record<string, unknown>;
  const where = `active_specs[${index}]`;

  for (const key of Object.keys(entry)) {
    if (ALLOWED_ENTRY_KEYS.has(key)) continue;
    if (PROHIBITED_ENTRY_KEYS_HINT.has(key)) {
      throw new ActiveSpecsParseError(
        `${where} carries prohibited key "${key}" — the public index must not carry ` +
          `normative spec content. Per [DEC-0023-G01], this re-creates incremental merge ` +
          `of the spec through a side channel and corrodes ADR 0020. ` +
          `Normative content stays on the spec branch.`
      );
    }
    throw new ActiveSpecsParseError(
      `${where} has unexpected key "${key}" ` +
        `(allowed required: ${REQUIRED_ENTRY_KEYS.join(", ")}; ` +
        `allowed optional: ${OPTIONAL_ENTRY_KEYS.join(", ")}; ` +
        `new fields require their own [DEC-*] per [DEC-0023-G02])`
    );
  }

  for (const key of REQUIRED_ENTRY_KEYS) {
    if (entry[key] === undefined) {
      throw new ActiveSpecsParseError(`${where} missing required key "${key}"`);
    }
  }

  const id = requireNonEmptyString(entry.id, `${where}.id`);
  const slug = requireNonEmptyString(entry.slug, `${where}.slug`);
  const branch = requireNonEmptyString(entry.branch, `${where}.branch`);
  const specPath = requireNonEmptyString(entry.spec_path, `${where}.spec_path`);
  const updatedAt = requireNonEmptyString(entry.updated_at, `${where}.updated_at`);

  if (!isWorkflowStage(entry.stage)) {
    throw new ActiveSpecsParseError(
      `${where}.stage must be one of: discovery|decision|planning|implementation|closing ` +
        `(per [DEC-0023-A04]; the public index projects state.yml.stage directly, no translation)`
    );
  }

  if (!isActiveSpecStatus(entry.status)) {
    throw new ActiveSpecsParseError(
      `${where}.status must be one of: active|blocked|paused|completed ` +
        `(per [DEC-0023-G04]; status is an independent dimension, not derived from stage; ` +
        `values like "implementation_in_progress" or "wip" are prohibited)`
    );
  }

  if (!ISO_8601_STRICT.test(updatedAt)) {
    throw new ActiveSpecsParseError(
      `${where}.updated_at must be a strict ISO-8601 timestamp ` +
        `(e.g. "2026-05-21T00:00:00Z"); got: ${JSON.stringify(updatedAt)}`
    );
  }

  const result: ActiveSpecEntry = {
    id,
    slug,
    branch,
    stage: entry.stage,
    status: entry.status,
    specPath,
    updatedAt,
    ...optionalString(entry, "title", "title"),
    ...optionalString(entry, "base_branch", "baseBranch"),
    ...optionalString(entry, "source_state_path", "sourceStatePath"),
    ...optionalString(entry, "updated_by", "updatedBy"),
    ...optionalString(entry, "last_sync_commit", "lastSyncCommit"),
  };

  return result;
}

function requireNonEmptyString(value: unknown, where: string): string {
  if (typeof value !== "string") {
    throw new ActiveSpecsParseError(`${where} must be a string`);
  }
  if (value.trim() === "") {
    throw new ActiveSpecsParseError(`${where} must be a non-empty string`);
  }
  return value;
}

function optionalString(
  entry: Record<string, unknown>,
  yamlKey: string,
  tsKey: string
): Record<string, string> {
  if (entry[yamlKey] === undefined) return {};
  const value = entry[yamlKey];
  if (typeof value !== "string") {
    throw new ActiveSpecsParseError(`active_specs[*].${yamlKey} must be a string when present`);
  }
  if (value.trim() === "") {
    throw new ActiveSpecsParseError(
      `active_specs[*].${yamlKey} must be a non-empty string when present (omit the key instead)`
    );
  }
  return { [tsKey]: value };
}

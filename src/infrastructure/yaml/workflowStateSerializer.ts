import { parse, stringify } from "yaml";
import {
  WorkflowState,
  isGateStatus,
  isWorkflowStage,
} from "../../domain/workflow/WorkflowState.js";

/**
 * Round-trip canônico do `state.yml` mínimo.
 *
 * Schema validado em parse: 4 chaves, nada além — campos extras são
 * rejeitados (proteção contra acreção silenciosa). Round-trip determinístico
 * para diff git limpo.
 */

export class WorkflowStateParseError extends Error {
  constructor(message: string) {
    super(`Invalid state.yml: ${message}`);
    this.name = "WorkflowStateParseError";
  }
}

const ALLOWED_TOP_KEYS = ["stage", "gate", "focus", "next"] as const;
const ALLOWED_GATE_KEYS = ["status"] as const;

export function parseWorkflowState(yamlText: string): WorkflowState {
  const raw: unknown = parse(yamlText);
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new WorkflowStateParseError("root must be a mapping");
  }
  const obj = raw as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (!(ALLOWED_TOP_KEYS as readonly string[]).includes(key)) {
      throw new WorkflowStateParseError(
        `unexpected top-level key "${key}" (allowed: ${ALLOWED_TOP_KEYS.join(", ")})`
      );
    }
  }

  if (!isWorkflowStage(obj.stage)) {
    throw new WorkflowStateParseError(
      `stage must be one of: discovery|decision|planning|implementation|closing|done`
    );
  }

  if (obj.gate === null || typeof obj.gate !== "object" || Array.isArray(obj.gate)) {
    throw new WorkflowStateParseError(`gate must be a mapping with a "status" key`);
  }
  const gate = obj.gate as Record<string, unknown>;
  for (const key of Object.keys(gate)) {
    if (!(ALLOWED_GATE_KEYS as readonly string[]).includes(key)) {
      throw new WorkflowStateParseError(`unexpected gate key "${key}"`);
    }
  }
  if (!isGateStatus(gate.status)) {
    throw new WorkflowStateParseError(`gate.status must be one of: open|awaiting-review|closed`);
  }

  const focus = parseStringArray(obj.focus, "focus");
  const next = parseStringArray(obj.next, "next");

  return {
    stage: obj.stage,
    gate: { status: gate.status },
    focus,
    next,
  };
}

function parseStringArray(value: unknown, fieldName: string): ReadonlyArray<string> {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new WorkflowStateParseError(`${fieldName} must be a list of strings`);
  }
  for (const item of value) {
    if (typeof item !== "string") {
      throw new WorkflowStateParseError(`${fieldName} must contain only strings`);
    }
  }
  return value as ReadonlyArray<string>;
}

export function serializeWorkflowState(state: WorkflowState): string {
  const plain = {
    stage: state.stage,
    gate: { status: state.gate.status },
    focus: [...state.focus],
    next: [...state.next],
  };
  return stringify(plain, { indent: 2, lineWidth: 0 });
}

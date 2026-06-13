import { parse } from "yaml";

/**
 * Parser ESTRITO do contrato governado de trabalho (`.core/governance/work-policy.yml`).
 *
 * Disciplina herdada de `constraintsSourceReader`/`reviewPolicyReader`: allowlist
 * de chaves, enums validados, campo desconhecido → erro claro. Valida FORMA; a
 * derivação do modo e a projeção do briefing são camadas posteriores
 * (`workBrief`). Zero network, zero LLM.
 */
export class WorkPolicyParseError extends Error {
  constructor(message: string) {
    super(`Invalid work-policy.yml: ${message}`);
    this.name = "WorkPolicyParseError";
  }
}

export const WORK_MODES = [
  "blocked",
  "resolve_findings",
  "await_revalidation",
  "implement_checkpoint",
  "prepare_close",
  "current",
] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const PUBLICATION_POLICIES = ["forbidden", "explicit-work-request"] as const;
export type PublicationPolicyValue = (typeof PUBLICATION_POLICIES)[number];

export interface WorkPublicationPolicy {
  readonly commit: PublicationPolicyValue;
  readonly push: PublicationPolicyValue;
  /** Invariante: um commit nunca mistura escopos. */
  readonly mixedScope: "forbidden";
}

export interface WorkModePolicy {
  readonly purpose: string;
  readonly allowedActions: readonly string[];
  readonly forbiddenActions: readonly string[];
  readonly publication: WorkPublicationPolicy;
  readonly validations: readonly string[];
  readonly expectsResolutions: boolean;
  readonly prBodyEditable: boolean;
  readonly stopConditions: readonly string[];
  readonly reportSections: readonly string[];
}

export interface WorkPolicy {
  readonly version: number;
  readonly modes: Readonly<Record<WorkMode, WorkModePolicy>>;
}

const ALLOWED_ROOT_KEYS: ReadonlySet<string> = new Set(["version", "modes"]);
const ALLOWED_MODE_KEYS: ReadonlySet<string> = new Set([
  "purpose",
  "allowed_actions",
  "forbidden_actions",
  "publication",
  "validations",
  "expects_resolutions",
  "pr_body_editable",
  "stop_conditions",
  "report_sections",
]);
const ALLOWED_PUBLICATION_KEYS: ReadonlySet<string> = new Set(["commit", "push", "mixed_scope"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(
  obj: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  where: string
) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new WorkPolicyParseError(
        `${where}: chave desconhecida "${key}" (permitidas: ${[...allowed].join(", ")}).`
      );
    }
  }
}

function requireStr(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new WorkPolicyParseError(`${field} é obrigatório (string não-vazia).`);
  }
  return value.trim();
}

function requireBool(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new WorkPolicyParseError(`${field} deve ser booleano.`);
  }
  return value;
}

function requireStrList(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new WorkPolicyParseError(`${field} deve ser uma lista (mesmo que vazia).`);
  }
  return value.map((v, i) => requireStr(v, `${field}[${i}]`));
}

function parsePublication(raw: unknown, where: string): WorkPublicationPolicy {
  if (!isPlainObject(raw)) {
    throw new WorkPolicyParseError(`${where}.publication é obrigatório (mapping).`);
  }
  rejectUnknownKeys(raw, ALLOWED_PUBLICATION_KEYS, `${where}.publication`);
  const publicationValue = (field: string, value: unknown): PublicationPolicyValue => {
    const str = requireStr(value, `${where}.publication.${field}`);
    if (!(PUBLICATION_POLICIES as readonly string[]).includes(str)) {
      throw new WorkPolicyParseError(
        `${where}.publication.${field} "${str}" inválido (esperado: ${PUBLICATION_POLICIES.join(" | ")}).`
      );
    }
    return str as PublicationPolicyValue;
  };
  const mixed = requireStr(raw.mixed_scope, `${where}.publication.mixed_scope`);
  if (mixed !== "forbidden") {
    throw new WorkPolicyParseError(
      `${where}.publication.mixed_scope deve ser "forbidden" (invariante; commit nunca mistura escopos).`
    );
  }
  return {
    commit: publicationValue("commit", raw.commit),
    push: publicationValue("push", raw.push),
    mixedScope: "forbidden",
  };
}

function parseMode(raw: unknown, mode: WorkMode): WorkModePolicy {
  const where = `modes.${mode}`;
  if (!isPlainObject(raw)) {
    throw new WorkPolicyParseError(`${where} é obrigatório (mapping).`);
  }
  rejectUnknownKeys(raw, ALLOWED_MODE_KEYS, where);
  const reportSections = requireStrList(raw.report_sections, `${where}.report_sections`);
  if (reportSections.length === 0) {
    throw new WorkPolicyParseError(
      `${where}.report_sections não pode ser vazio (contrato do relatório).`
    );
  }
  return {
    purpose: requireStr(raw.purpose, `${where}.purpose`),
    allowedActions: requireStrList(raw.allowed_actions, `${where}.allowed_actions`),
    forbiddenActions: requireStrList(raw.forbidden_actions, `${where}.forbidden_actions`),
    publication: parsePublication(raw.publication, where),
    validations: requireStrList(raw.validations, `${where}.validations`),
    expectsResolutions: requireBool(raw.expects_resolutions, `${where}.expects_resolutions`),
    prBodyEditable: requireBool(raw.pr_body_editable, `${where}.pr_body_editable`),
    stopConditions: requireStrList(raw.stop_conditions, `${where}.stop_conditions`),
    reportSections,
  };
}

export function parseWorkPolicy(yamlText: string): WorkPolicy {
  const raw: unknown = parse(yamlText);
  if (!isPlainObject(raw)) {
    throw new WorkPolicyParseError("root deve ser um mapping com `version` e `modes`.");
  }
  rejectUnknownKeys(raw, ALLOWED_ROOT_KEYS, "root");
  if (raw.version !== 1) {
    throw new WorkPolicyParseError(
      `version deve ser 1 (encontrado: ${JSON.stringify(raw.version)}).`
    );
  }
  if (!isPlainObject(raw.modes)) {
    throw new WorkPolicyParseError("`modes` deve ser um mapping por modo.");
  }
  // Contrato COMPLETO: todos os modos canônicos presentes; modo desconhecido falha.
  for (const key of Object.keys(raw.modes)) {
    if (!(WORK_MODES as readonly string[]).includes(key)) {
      throw new WorkPolicyParseError(
        `modes.${key}: modo desconhecido (esperados: ${WORK_MODES.join(", ")}).`
      );
    }
  }
  const modes = {} as Record<WorkMode, WorkModePolicy>;
  for (const mode of WORK_MODES) {
    if (!(mode in raw.modes)) {
      throw new WorkPolicyParseError(
        `modes.${mode} ausente — o contrato deve cobrir todos os modos.`
      );
    }
    modes[mode] = parseMode((raw.modes as Record<string, unknown>)[mode], mode);
  }
  return { version: 1, modes };
}

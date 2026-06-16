import { parse } from "yaml";

/**
 * Parser ESTRITO do contrato governado de decisões humanas
 * (`.core/governance/human-decision-policy.yml`).
 *
 * Disciplina herdada de `workPolicyReader`/`reviewPolicyReader`: allowlist de
 * chaves, enums validados, campo desconhecido → erro claro. Valida FORMA; a
 * detecção de elegibilidade e a projeção do briefing são camadas posteriores
 * (`src/cli/decide/*`). Zero network, zero LLM.
 */
export class HumanDecisionPolicyParseError extends Error {
  constructor(message: string) {
    super(`Invalid human-decision-policy.yml: ${message}`);
    this.name = "HumanDecisionPolicyParseError";
  }
}

export const PUBLICATION_COMMIT_VALUES = ["after-confirmation"] as const;
export type PublicationCommitValue = (typeof PUBLICATION_COMMIT_VALUES)[number];

export const CONFIRMATION_VALUES = ["required"] as const;
export type ConfirmationValue = (typeof CONFIRMATION_VALUES)[number];

export const TECHNICAL_DETAILS_VALUES = ["available"] as const;
export type TechnicalDetailsValue = (typeof TECHNICAL_DETAILS_VALUES)[number];

export interface HumanDecisionOwner {
  readonly handle: string;
  readonly email: string;
}

export interface HumanDecisionSectionSpec {
  readonly key: string;
  readonly heading: string;
}

export interface HumanDecisionChoiceSpec {
  readonly id: string;
  readonly label: string;
  /** true = aplica efeito governado (escrita); false = read-only (explica/cancela). */
  readonly mutating: boolean;
}

export interface HumanDecisionPublication {
  readonly commit: PublicationCommitValue;
  readonly push: PublicationCommitValue;
  /** Invariante: o commit do efeito governado nunca mistura escopos. */
  readonly mixedDiff: "forbidden";
}

export interface HumanDecisionTypePolicy {
  readonly id: string;
  readonly title: string;
  readonly purpose: string;
  readonly requiresOwner: boolean;
  readonly sections: readonly HumanDecisionSectionSpec[];
  readonly choices: readonly HumanDecisionChoiceSpec[];
  readonly consequences: readonly string[];
  readonly notAuthorized: readonly string[];
  readonly publication: HumanDecisionPublication;
  readonly confirmation: ConfirmationValue;
  readonly technicalDetails: TechnicalDetailsValue;
}

export interface HumanDecisionPolicy {
  readonly version: number;
  readonly owner: HumanDecisionOwner;
  /** Tipos na ORDEM declarada (determinística) + lookup por id. */
  readonly decisionTypes: readonly HumanDecisionTypePolicy[];
}

const ALLOWED_ROOT_KEYS: ReadonlySet<string> = new Set(["version", "owner", "decision_types"]);
const ALLOWED_OWNER_KEYS: ReadonlySet<string> = new Set(["handle", "email"]);
const ALLOWED_TYPE_KEYS: ReadonlySet<string> = new Set([
  "title",
  "purpose",
  "requires_owner",
  "sections",
  "choices",
  "consequences",
  "not_authorized",
  "publication",
  "confirmation",
  "technical_details",
]);
const ALLOWED_SECTION_KEYS: ReadonlySet<string> = new Set(["key", "heading"]);
const ALLOWED_CHOICE_KEYS: ReadonlySet<string> = new Set(["id", "label", "mutating"]);
const ALLOWED_PUBLICATION_KEYS: ReadonlySet<string> = new Set(["commit", "push", "mixed_diff"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(
  obj: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  where: string
): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new HumanDecisionPolicyParseError(
        `${where}: chave desconhecida "${key}" (permitidas: ${[...allowed].join(", ")}).`
      );
    }
  }
}

function requireStr(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HumanDecisionPolicyParseError(`${field} é obrigatório (string não-vazia).`);
  }
  return value.trim();
}

function requireBool(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new HumanDecisionPolicyParseError(`${field} deve ser booleano.`);
  }
  return value;
}

function requireStrList(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HumanDecisionPolicyParseError(`${field} deve ser uma lista NÃO-vazia.`);
  }
  return value.map((v, i) => requireStr(v, `${field}[${i}]`));
}

function parseOwner(raw: unknown): HumanDecisionOwner {
  if (!isPlainObject(raw)) {
    throw new HumanDecisionPolicyParseError("owner é obrigatório (mapping { handle, email }).");
  }
  rejectUnknownKeys(raw, ALLOWED_OWNER_KEYS, "owner");
  return {
    handle: requireStr(raw.handle, "owner.handle"),
    email: requireStr(raw.email, "owner.email"),
  };
}

function parseSections(raw: unknown, where: string): HumanDecisionSectionSpec[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HumanDecisionPolicyParseError(`${where}.sections deve ser uma lista NÃO-vazia.`);
  }
  return raw.map((item, i) => {
    if (!isPlainObject(item)) {
      throw new HumanDecisionPolicyParseError(`${where}.sections[${i}] deve ser um mapping.`);
    }
    rejectUnknownKeys(item, ALLOWED_SECTION_KEYS, `${where}.sections[${i}]`);
    return {
      key: requireStr(item.key, `${where}.sections[${i}].key`),
      heading: requireStr(item.heading, `${where}.sections[${i}].heading`),
    };
  });
}

function parseChoices(raw: unknown, where: string): HumanDecisionChoiceSpec[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HumanDecisionPolicyParseError(`${where}.choices deve ser uma lista NÃO-vazia.`);
  }
  const seen = new Set<string>();
  return raw.map((item, i) => {
    if (!isPlainObject(item)) {
      throw new HumanDecisionPolicyParseError(`${where}.choices[${i}] deve ser um mapping.`);
    }
    rejectUnknownKeys(item, ALLOWED_CHOICE_KEYS, `${where}.choices[${i}]`);
    const id = requireStr(item.id, `${where}.choices[${i}].id`);
    if (seen.has(id)) {
      throw new HumanDecisionPolicyParseError(`${where}.choices: id duplicado "${id}".`);
    }
    seen.add(id);
    return {
      id,
      label: requireStr(item.label, `${where}.choices[${i}].label`),
      mutating: requireBool(item.mutating, `${where}.choices[${i}].mutating`),
    };
  });
}

function parsePublication(raw: unknown, where: string): HumanDecisionPublication {
  if (!isPlainObject(raw)) {
    throw new HumanDecisionPolicyParseError(`${where}.publication é obrigatório (mapping).`);
  }
  rejectUnknownKeys(raw, ALLOWED_PUBLICATION_KEYS, `${where}.publication`);
  const commitValue = (field: string, value: unknown): PublicationCommitValue => {
    const str = requireStr(value, `${where}.publication.${field}`);
    if (!(PUBLICATION_COMMIT_VALUES as readonly string[]).includes(str)) {
      throw new HumanDecisionPolicyParseError(
        `${where}.publication.${field} "${str}" inválido (esperado: ${PUBLICATION_COMMIT_VALUES.join(" | ")}).`
      );
    }
    return str as PublicationCommitValue;
  };
  const mixed = requireStr(raw.mixed_diff, `${where}.publication.mixed_diff`);
  if (mixed !== "forbidden") {
    throw new HumanDecisionPolicyParseError(
      `${where}.publication.mixed_diff deve ser "forbidden" (invariante; commit do efeito nunca mistura escopos).`
    );
  }
  return {
    commit: commitValue("commit", raw.commit),
    push: commitValue("push", raw.push),
    mixedDiff: "forbidden",
  };
}

function parseType(raw: unknown, id: string): HumanDecisionTypePolicy {
  const where = `decision_types.${id}`;
  if (!isPlainObject(raw)) {
    throw new HumanDecisionPolicyParseError(`${where} é obrigatório (mapping).`);
  }
  rejectUnknownKeys(raw, ALLOWED_TYPE_KEYS, where);
  const confirmation = requireStr(raw.confirmation, `${where}.confirmation`);
  if (!(CONFIRMATION_VALUES as readonly string[]).includes(confirmation)) {
    throw new HumanDecisionPolicyParseError(
      `${where}.confirmation "${confirmation}" inválido (esperado: ${CONFIRMATION_VALUES.join(" | ")}).`
    );
  }
  const technicalDetails = requireStr(raw.technical_details, `${where}.technical_details`);
  if (!(TECHNICAL_DETAILS_VALUES as readonly string[]).includes(technicalDetails)) {
    throw new HumanDecisionPolicyParseError(
      `${where}.technical_details "${technicalDetails}" inválido (esperado: ${TECHNICAL_DETAILS_VALUES.join(" | ")}).`
    );
  }
  return {
    id,
    title: requireStr(raw.title, `${where}.title`),
    purpose: requireStr(raw.purpose, `${where}.purpose`),
    requiresOwner: requireBool(raw.requires_owner, `${where}.requires_owner`),
    sections: parseSections(raw.sections, where),
    choices: parseChoices(raw.choices, where),
    consequences: requireStrList(raw.consequences, `${where}.consequences`),
    notAuthorized: requireStrList(raw.not_authorized, `${where}.not_authorized`),
    publication: parsePublication(raw.publication, where),
    confirmation: confirmation as ConfirmationValue,
    technicalDetails: technicalDetails as TechnicalDetailsValue,
  };
}

export function parseHumanDecisionPolicy(yamlText: string): HumanDecisionPolicy {
  const raw: unknown = parse(yamlText);
  if (!isPlainObject(raw)) {
    throw new HumanDecisionPolicyParseError(
      "root deve ser um mapping com `version`, `owner` e `decision_types`."
    );
  }
  rejectUnknownKeys(raw, ALLOWED_ROOT_KEYS, "root");
  if (raw.version !== 1) {
    throw new HumanDecisionPolicyParseError(
      `version deve ser 1 (encontrado: ${JSON.stringify(raw.version)}).`
    );
  }
  const owner = parseOwner(raw.owner);
  if (!isPlainObject(raw.decision_types)) {
    throw new HumanDecisionPolicyParseError("`decision_types` deve ser um mapping por tipo.");
  }
  const decisionTypes: HumanDecisionTypePolicy[] = [];
  for (const id of Object.keys(raw.decision_types)) {
    decisionTypes.push(parseType((raw.decision_types as Record<string, unknown>)[id], id));
  }
  if (decisionTypes.length === 0) {
    throw new HumanDecisionPolicyParseError("`decision_types` não pode ser vazio.");
  }
  return { version: 1, owner, decisionTypes };
}

/** Lookup por id; `undefined` quando não declarado. */
export function findDecisionType(
  policy: HumanDecisionPolicy,
  id: string
): HumanDecisionTypePolicy | undefined {
  return policy.decisionTypes.find((t) => t.id === id);
}

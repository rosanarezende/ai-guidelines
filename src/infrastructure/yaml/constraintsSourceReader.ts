import { parse } from "yaml";
import {
  Constraint,
  ConstraintOrigin,
  EnforcementBinding,
  isConstraintOriginKind,
  isEnforcementMode,
  isSurfaceClass,
} from "../../domain/constraints/Constraint.js";

/**
 * Parser ESTRITO da fonte estruturada de constraints
 * (`.core/constraints/constraints.yml` + overlay `.governance/constraints.yml`).
 *
 * Disciplina herdada de `falsificationsSerializer`/`insightsLedgerSerializer`:
 * - allowlist estrita de chaves (root, constraint, origin, binding);
 * - campos desconhecidos → erro claro (não silenciam);
 * - valida FORMA (tipos + enums); paridade com a fonte humana, resolução de
 *   superfície e mecanismo são camadas posteriores (`compileConstraints`).
 *
 * NÃO copia o texto humano das rules/guardrails — só identidade executável,
 * origem (com `source_ref`) e bindings. Zero network, zero LLM.
 */
export class ConstraintsParseError extends Error {
  constructor(message: string) {
    super(`Invalid constraints.yml: ${message}`);
    this.name = "ConstraintsParseError";
  }
}

const ALLOWED_ROOT_KEYS = ["version", "constraints"] as const;
const ALLOWED_CONSTRAINT_KEYS: ReadonlySet<string> = new Set(["id", "kind", "origin", "bindings"]);
const ALLOWED_ORIGIN_KEYS: ReadonlySet<string> = new Set(["kind", "source_ref", "sources"]);
const ALLOWED_BINDING_KEYS: ReadonlySet<string> = new Set([
  "surface",
  "surface_class",
  "enforcement",
  "mode",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireStr(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ConstraintsParseError(`${field} é obrigatório (string não-vazia).`);
  }
  return value;
}

function rejectUnknownKeys(
  obj: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  where: string
) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new ConstraintsParseError(
        `${where}: chave desconhecida "${key}" (permitidas: ${[...allowed].join(", ")}).`
      );
    }
  }
}

function parseOrigin(raw: unknown, where: string): ConstraintOrigin {
  if (!isPlainObject(raw)) {
    throw new ConstraintsParseError(`${where}.origin é obrigatório (mapping).`);
  }
  rejectUnknownKeys(raw, ALLOWED_ORIGIN_KEYS, `${where}.origin`);
  const kind = requireStr(raw.kind, `${where}.origin.kind`);
  if (!isConstraintOriginKind(kind)) {
    throw new ConstraintsParseError(
      `${where}.origin.kind "${kind}" inválido (esperado: rule | guardrail).`
    );
  }
  const sourceRef = requireStr(raw.source_ref, `${where}.origin.source_ref`);
  let sources: string[] | undefined;
  if (raw.sources !== undefined) {
    if (!Array.isArray(raw.sources)) {
      throw new ConstraintsParseError(`${where}.origin.sources deve ser uma lista.`);
    }
    sources = raw.sources.map((s, i) => requireStr(s, `${where}.origin.sources[${i}]`));
  }
  return { kind, sourceRef, ...(sources !== undefined ? { sources } : {}) };
}

function parseBinding(raw: unknown, where: string): EnforcementBinding {
  if (!isPlainObject(raw)) {
    throw new ConstraintsParseError(`${where} deve ser um mapping.`);
  }
  rejectUnknownKeys(raw, ALLOWED_BINDING_KEYS, where);
  const surface = requireStr(raw.surface, `${where}.surface`);
  const surfaceClass = requireStr(raw.surface_class, `${where}.surface_class`);
  if (!isSurfaceClass(surfaceClass)) {
    throw new ConstraintsParseError(
      `${where}.surface_class "${surfaceClass}" inválido (esperado: event | state).`
    );
  }
  const enforcement = requireStr(raw.enforcement, `${where}.enforcement`);
  const mode = requireStr(raw.mode, `${where}.mode`);
  if (!isEnforcementMode(mode)) {
    throw new ConstraintsParseError(
      `${where}.mode "${mode}" inválido (esperado: advisory | required).`
    );
  }
  return { surface, surfaceClass, enforcement, mode };
}

function parseConstraint(raw: unknown, index: number): Constraint {
  const where = `constraints[${index}]`;
  if (!isPlainObject(raw)) {
    throw new ConstraintsParseError(`${where} deve ser um mapping.`);
  }
  rejectUnknownKeys(raw, ALLOWED_CONSTRAINT_KEYS, where);
  const id = requireStr(raw.id, `${where}.id`);
  const kind = requireStr(raw.kind, `${where}.kind`);
  if (kind !== "constraint") {
    throw new ConstraintsParseError(
      `${where}.kind "${kind}" inválido — o modelo normalizado expõe kind: constraint.`
    );
  }
  const origin = parseOrigin(raw.origin, where);
  if (!Array.isArray(raw.bindings) || raw.bindings.length === 0) {
    throw new ConstraintsParseError(
      `${where}.bindings é obrigatório e não-vazio (≥1 EnforcementBinding).`
    );
  }
  const bindings = raw.bindings.map((b, i) => parseBinding(b, `${where}.bindings[${i}]`));
  return { id, kind: "constraint", origin, bindings };
}

/** Parseia o texto de UMA fonte de constraints. Arquivo vazio = lista vazia legítima. */
export function parseConstraints(yamlText: string): Constraint[] {
  const raw: unknown = parse(yamlText);
  if (raw === null || raw === undefined) return [];
  if (!isPlainObject(raw)) {
    throw new ConstraintsParseError("root deve ser um mapping com `version` e `constraints`.");
  }
  rejectUnknownKeys(raw, new Set(ALLOWED_ROOT_KEYS), "root");
  if (raw.version !== 1) {
    throw new ConstraintsParseError(
      `version deve ser 1 (encontrado: ${JSON.stringify(raw.version)}).`
    );
  }
  const list = raw.constraints ?? [];
  if (!Array.isArray(list)) {
    throw new ConstraintsParseError("`constraints` deve ser uma lista.");
  }
  return list.map((item, index) => parseConstraint(item, index));
}

export interface ConstraintSource {
  /** Caminho relativo da fonte (ex.: `.core/constraints/constraints.yml`). */
  readonly path: string;
  /** Texto bruto (para fingerprint de proveniência). */
  readonly text: string;
  readonly constraints: readonly Constraint[];
  /**
   * Raiz governada ABSOLUTA contra a qual os `source_ref` desta fonte resolvem
   * (core → raiz do pacote/framework; overlay → raiz do consumidor). Define o
   * containment de `source_ref` (F2) e a procedência por origem (F1).
   */
  readonly root: string;
}

/**
 * Funde core + overlay numa lista única, SEM override implícito: id duplicado
 * entre quaisquer fontes é ERRO (não "overlay vence core"). A ordem de entrada
 * não altera o resultado (o manifesto é re-ordenado depois) — mas a detecção de
 * duplicata nomeia ambas as fontes.
 */
export function mergeConstraintSources(sources: readonly ConstraintSource[]): Constraint[] {
  const seen = new Map<string, string>(); // id → path de origem
  const merged: Constraint[] = [];
  for (const source of sources) {
    for (const constraint of source.constraints) {
      const prior = seen.get(constraint.id);
      if (prior !== undefined) {
        throw new ConstraintsParseError(
          `id duplicado "${constraint.id}" entre fontes (${prior} e ${source.path}) — ` +
            `sem override implícito.`
        );
      }
      seen.set(constraint.id, source.path);
      merged.push(constraint);
    }
  }
  return merged;
}

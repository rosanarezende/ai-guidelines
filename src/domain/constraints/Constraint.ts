/**
 * Domínio **Constraint** (CO-3) — o conceito canônico do estágio hoje
 * representado por `rule | guardrail`.
 *
 * `Constraint` **não** é um sexto estágio paralelo: é o colapso normalizado dos
 * dois (cf. `KnowledgeStage`: `rule` e `guardrail` já empatam no mesmo nível de
 * cristalização, diferindo só na origem). O modelo normalizado expõe
 * `kind: "constraint"`; a **origem** vira metadado EXPLÍCITO (`origin.kind`) —
 * declarado e verificado contra o catálogo real, nunca inferido só do prefixo do
 * ID.
 *
 * A fonte canônica executável é `.core/constraints/constraints.yml` (+ overlay
 * opcional de consumidor). O Markdown (rules/guardrails) permanece doutrina/corpo
 * humano referenciado por `origin.sourceRef` — não é parseado semanticamente.
 */

/** Classe observável da superfície (PIT-0008): `event` (invocação/fronteira) vs `state` (estado contínuo). */
export const SURFACE_CLASSES = ["event", "state"] as const;
export type SurfaceClass = (typeof SURFACE_CLASSES)[number];
export function isSurfaceClass(value: unknown): value is SurfaceClass {
  return typeof value === "string" && (SURFACE_CLASSES as readonly string[]).includes(value);
}

/** Força efetiva do binding: `advisory` (avisa) vs `required` (bloqueia). */
export const ENFORCEMENT_MODES = ["advisory", "required"] as const;
export type EnforcementMode = (typeof ENFORCEMENT_MODES)[number];
export function isEnforcementMode(value: unknown): value is EnforcementMode {
  return typeof value === "string" && (ENFORCEMENT_MODES as readonly string[]).includes(value);
}

/** Origem da constraint normalizada. CO-3.1 suporta `rule` e `guardrail` (cada um com paridade própria). */
export const CONSTRAINT_ORIGIN_KINDS = ["rule", "guardrail"] as const;
export type ConstraintOriginKind = (typeof CONSTRAINT_ORIGIN_KINDS)[number];
export function isConstraintOriginKind(value: unknown): value is ConstraintOriginKind {
  return (
    typeof value === "string" && (CONSTRAINT_ORIGIN_KINDS as readonly string[]).includes(value)
  );
}

export interface ConstraintOrigin {
  /** `rule` (catálogo `.core/rules/**`) ou `guardrail` (interno, `governance-foundation.md`). */
  readonly kind: ConstraintOriginKind;
  /** `<path>#<anchor>` — aponta o corpo humano (arquivo + âncora verificáveis). */
  readonly sourceRef: string;
  /** Proveniência adicional (ex.: `DOGFOOD-0024`). Opcional. */
  readonly sources?: readonly string[];
}

/**
 * Declaração mínima de enforcement (Codex Q1, schema C — quatro campos). A
 * constraint é IMPLÍCITA pelo item que contém o binding; no manifesto
 * normalizado ela reaparece como `constraintRef`.
 */
export interface EnforcementBinding {
  /** Superfície namespaced (`npm-script:…` | `registry-command:…`). Ref existente/derivável. */
  readonly surface: string;
  readonly surfaceClass: SurfaceClass;
  /** Mecanismo que EXECUTA a verificação (catálogo local de mecanismos conhecidos). */
  readonly enforcement: string;
  readonly mode: EnforcementMode;
}

export interface Constraint {
  readonly id: string;
  readonly kind: "constraint";
  readonly origin: ConstraintOrigin;
  /** Não-vazio. Uma constraint pode ter N bindings. */
  readonly bindings: readonly EnforcementBinding[];
}

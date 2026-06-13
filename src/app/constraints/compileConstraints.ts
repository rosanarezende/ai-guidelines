import { createHash } from "node:crypto";
import {
  Constraint,
  ConstraintOrigin,
  EnforcementMode,
  SurfaceClass,
} from "../../domain/constraints/Constraint.js";
import {
  DEFAULT_ENFORCEMENT_MECHANISMS,
  EnforcementMechanismDescriptor,
  MechanismStatus,
  resolveMechanism,
} from "../../domain/constraints/EnforcementMechanism.js";
import { formatGovernedRef } from "../../domain/knowledge/GovernedRef.js";
import { GovernanceError } from "../../domain/shared/errors.js";
import { ResolvedSurface, SurfaceResolverRegistry } from "./SurfaceResolver.js";

/**
 * Compilação VERTICAL em memória (CO-3.1): fontes normalizadas → superfícies
 * resolvidas → mecanismos resolvidos → **manifesto determinístico** + arestas do
 * read-model (`Constraint --constrains--> SurfaceRef`).
 *
 * Puro: sem I/O, sem network, sem LLM. A leitura/merge das fontes e os fatos de
 * paridade (existência de arquivo/âncora, catálogos) são INJETADOS. O manifesto
 * NÃO é persistido aqui — o artefato runtime final é CO-3.2.
 *
 * Dois níveis (padrão do runtime): a FORMA já foi validada no parser
 * (`constraintsSourceReader`); aqui ficam as INVARIANTES semânticas — resolução
 * de superfície/mecanismo, compatibilidade de classe, força vs status,
 * unicidade da tupla e paridade com a fonte humana — coletadas como
 * {@link ConstraintViolation} (não-lançantes), para o check reportar todas.
 */

export interface CompiledBindingResolved {
  readonly namespace: string;
  readonly name: string;
  readonly source: string;
  readonly observableClass?: SurfaceClass;
  readonly mutates?: boolean;
}

export interface CompiledBinding {
  readonly constraintRef: string;
  readonly surface: string;
  readonly surfaceClass: SurfaceClass;
  readonly enforcement: string;
  readonly mode: EnforcementMode;
  readonly resolved: CompiledBindingResolved;
  readonly mechanism: { readonly id: string; readonly status: MechanismStatus };
}

export interface CompiledConstraint {
  readonly id: string;
  readonly origin: ConstraintOrigin;
  /** Refs de superfície que esta constraint constrange (formatadas, ordenadas, únicas). */
  readonly surfaces: readonly string[];
}

export interface ManifestEdge {
  readonly from: string;
  /** `formatGovernedRef({ space: "surface", id })` — ex.: `surface:npm-script:gate-decidability:check`. */
  readonly to: string;
  readonly relation: "constrains";
}

export interface SourceFingerprint {
  readonly path: string;
  readonly sha256: string;
}

export interface CompiledConstraintManifest {
  readonly version: number;
  readonly constraints: readonly CompiledConstraint[];
  readonly bindings: readonly CompiledBinding[];
  readonly edges: readonly ManifestEdge[];
  readonly provenance: { readonly sources: readonly SourceFingerprint[] };
}

export interface ConstraintViolation {
  readonly code: string;
  readonly constraintId: string;
  readonly surface?: string;
  readonly message: string;
}

export interface CompileResult {
  readonly manifest: CompiledConstraintManifest;
  readonly violations: readonly ConstraintViolation[];
}

/** Fatos de PARIDADE com a fonte humana — injetados (fs/catálogos resolvidos pelo composition root). */
export interface ConstraintSourceFacts {
  /**
   * Resolve o `source_ref` contra a raiz governada da fonte da `constraint`
   * (F1: core→raiz do pacote, overlay→raiz do consumidor) com containment
   * canônico (F2). `contained=false` ⟹ o ref escapa a raiz; `root` é a raiz
   * resolvida (para diagnóstico).
   */
  resolveSource(
    constraint: Constraint,
    sourcePath: string
  ): { readonly contained: boolean; readonly exists: boolean; readonly root: string };
  /**
   * A fonte DECLARA a âncora como heading canônico do `origin.kind` (F3)?
   * `ambiguous=true` ⟹ heading canônico duplicado.
   */
  anchorIsCanonical(
    constraint: Constraint,
    sourcePath: string,
    anchor: string
  ): { readonly ok: boolean; readonly ambiguous: boolean };
  isKnownRuleId(id: string): boolean;
  isKnownGuardrailId(id: string): boolean;
}

export interface CompileInput {
  readonly constraints: readonly Constraint[];
  /** Fontes brutas para proveniência (fingerprint). */
  readonly sources: readonly { readonly path: string; readonly text: string }[];
  readonly surfaceResolver: SurfaceResolverRegistry;
  readonly mechanismCatalog?: readonly EnforcementMechanismDescriptor[];
  /** Paridade com a fonte humana (opcional — omitida em testes de manifesto puro). */
  readonly facts?: ConstraintSourceFacts;
}

const MANIFEST_VERSION = 1;

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function byString(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function surfaceGovernedRef(surface: string): string {
  return formatGovernedRef({ space: "surface", id: surface });
}

/** Paridade da constraint com sua fonte humana (`source_ref` + catálogo por origem). */
function checkParity(
  constraint: Constraint,
  facts: ConstraintSourceFacts,
  push: (code: string, message: string) => void
): void {
  const { sourceRef, kind } = constraint.origin;
  const hash = sourceRef.indexOf("#");
  if (hash <= 0 || hash >= sourceRef.length - 1) {
    push(
      "PARITY_SOURCE_REF_MALFORMED",
      `source_ref "${sourceRef}" deve ser "<path>#<anchor>" (âncora obrigatória).`
    );
    return;
  }
  const sourcePath = sourceRef.slice(0, hash);
  const anchor = sourceRef.slice(hash + 1);
  const source = facts.resolveSource(constraint, sourcePath);
  if (!source.contained) {
    push(
      "PARITY_SOURCE_OUTSIDE",
      `source_ref "${sourceRef}" escapa a raiz governada (constraint=${constraint.id}, ` +
        `repo_root=${source.root}) — fonte deve viver dentro da raiz do repositório correspondente.`
    );
  } else if (!source.exists) {
    push("PARITY_SOURCE_MISSING", `source_ref aponta arquivo inexistente: ${sourcePath}.`);
  } else {
    const anchorVerdict = facts.anchorIsCanonical(constraint, sourcePath, anchor);
    if (anchorVerdict.ambiguous) {
      push(
        "PARITY_ANCHOR_AMBIGUOUS",
        `âncora "[${anchor}]" tem heading canônico duplicado em ${sourcePath} — declaração ambígua.`
      );
    } else if (!anchorVerdict.ok) {
      push(
        "PARITY_ANCHOR_MISSING",
        `âncora "[${anchor}]" não declarada como heading canônico (${kind}) em ${sourcePath}.`
      );
    }
  }
  if (kind === "rule" && !facts.isKnownRuleId(constraint.id)) {
    push(
      "PARITY_RULE_UNKNOWN",
      `origin.kind=rule mas "${constraint.id}" não é uma rule do catálogo (rules.json) — ` +
        `origem não é provada pelo prefixo do ID.`
    );
  }
  if (kind === "guardrail" && !facts.isKnownGuardrailId(constraint.id)) {
    push(
      "PARITY_GUARDRAIL_UNKNOWN",
      `origin.kind=guardrail mas "${constraint.id}" não é um guardrail da governance-foundation — ` +
        `origem não é provada pelo prefixo do ID.`
    );
  }
}

export function compileConstraints(input: CompileInput): CompileResult {
  const catalog = input.mechanismCatalog ?? DEFAULT_ENFORCEMENT_MECHANISMS;
  const violations: ConstraintViolation[] = [];
  const compiledBindings: CompiledBinding[] = [];
  const edges: ManifestEdge[] = [];
  const constraintSurfaces = new Map<string, Set<string>>();
  const seenTuples = new Set<string>();

  for (const constraint of input.constraints) {
    constraintSurfaces.set(constraint.id, new Set());
    const pushC = (code: string, message: string) =>
      violations.push({ code, constraintId: constraint.id, message });

    if (input.facts) checkParity(constraint, input.facts, pushC);

    for (const binding of constraint.bindings) {
      const pushB = (code: string, message: string) =>
        violations.push({ code, constraintId: constraint.id, surface: binding.surface, message });

      let resolved: ResolvedSurface;
      try {
        resolved = input.surfaceResolver.resolve(binding.surface);
      } catch (err) {
        const code = err instanceof GovernanceError ? err.code : "SURFACE_UNRESOLVED";
        pushB(code, err instanceof Error ? err.message : String(err));
        continue;
      }

      // Classe pelo lado da superfície: só quando a fonte a deriva (registry-command → event).
      if (resolved.observableClass && resolved.observableClass !== binding.surfaceClass) {
        pushB(
          "SURFACE_CLASS_INCOMPATIBLE",
          `surface_class declarado "${binding.surfaceClass}" ≠ classe observável "${resolved.observableClass}" ` +
            `de ${binding.surface} (PIT-0008: evento ⇏ estado contínuo).`
        );
        continue;
      }

      // Mecanismo.
      const mechanism = resolveMechanism(binding.enforcement, catalog);
      if (!mechanism) {
        pushB(
          "MECHANISM_UNKNOWN",
          `mecanismo desconhecido: "${binding.enforcement}" não está no registry de mecanismos.`
        );
        continue;
      }
      if (binding.mode === "required" && mechanism.status === "planned") {
        pushB(
          "MECHANISM_PLANNED_REQUIRED",
          `mode=required aponta mecanismo apenas planned: "${binding.enforcement}" — ` +
            `required não pode depender de mecanismo não-implementado.`
        );
        continue;
      }
      if (!mechanism.supportedSurfaceClasses.includes(binding.surfaceClass)) {
        pushB(
          "MECHANISM_CLASS_UNSUPPORTED",
          `mecanismo "${binding.enforcement}" não suporta surface_class "${binding.surfaceClass}" ` +
            `(suportadas: ${mechanism.supportedSurfaceClasses.join(", ")}).`
        );
        continue;
      }

      // Unicidade da tupla (constraint_ref, surface, enforcement).
      const tuple = [constraint.id, binding.surface, binding.enforcement].join(" ");
      if (seenTuples.has(tuple)) {
        pushB(
          "BINDING_DUPLICATE",
          `tupla duplicada (constraint=${constraint.id}, surface=${binding.surface}, ` +
            `enforcement=${binding.enforcement}).`
        );
        continue;
      }
      seenTuples.add(tuple);

      compiledBindings.push({
        constraintRef: constraint.id,
        surface: binding.surface,
        surfaceClass: binding.surfaceClass,
        enforcement: binding.enforcement,
        mode: binding.mode,
        resolved: {
          namespace: resolved.namespace,
          name: resolved.name,
          source: resolved.source,
          ...(resolved.observableClass !== undefined
            ? { observableClass: resolved.observableClass }
            : {}),
          ...(resolved.mutates !== undefined ? { mutates: resolved.mutates } : {}),
        },
        mechanism: { id: mechanism.id, status: mechanism.status },
      });
      constraintSurfaces.get(constraint.id)!.add(binding.surface);
      edges.push({
        from: constraint.id,
        to: surfaceGovernedRef(binding.surface),
        relation: "constrains",
      });
    }
  }

  // Ordenação determinística — mesmo input ⇒ mesmos bytes.
  compiledBindings.sort(
    (a, b) =>
      byString(a.constraintRef, b.constraintRef) ||
      byString(a.surface, b.surface) ||
      byString(a.enforcement, b.enforcement)
  );
  edges.sort((a, b) => byString(a.from, b.from) || byString(a.to, b.to));

  const constraints: CompiledConstraint[] = [...input.constraints]
    .map((c) => ({
      id: c.id,
      origin: c.origin,
      surfaces: [...(constraintSurfaces.get(c.id) ?? new Set<string>())].sort(byString),
    }))
    .sort((a, b) => byString(a.id, b.id));

  const sources: SourceFingerprint[] = [...input.sources]
    .map((s) => ({ path: s.path, sha256: sha256(s.text) }))
    .sort((a, b) => byString(a.path, b.path));

  return {
    manifest: {
      version: MANIFEST_VERSION,
      constraints,
      bindings: compiledBindings,
      edges,
      provenance: { sources },
    },
    violations,
  };
}

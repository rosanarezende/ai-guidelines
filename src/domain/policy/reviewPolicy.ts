/**
 * Modelo de DOMÍNIO da review policy (Spec 0024 · PR #46).
 *
 * Declarações puras do contrato de policy de reviews — perfis, catálogo de
 * tipos, aplicabilidade, requirements e overrides. O parsing YAML vive em
 * `src/infrastructure/yaml/reviewPolicyReader.ts` (que re-exporta estes tipos
 * para compatibilidade); as derivações de aplicação vivem em
 * `src/app/reviews/reviewRequirements.ts`. Extração exigida pelo Blueprint
 * Integrity Lock: app não importa infrastructure diretamente.
 */
export interface ReviewRolePolicy {
  readonly requiredReviewRoles: readonly string[];
  readonly requiredNativeApprovals: number;
}

export interface AcceptedFindingsPolicy {
  readonly requireResolution: boolean;
  readonly requireVerificationEventForFixed: boolean;
}

export interface GithubReviewPolicy {
  readonly minimumApprovingReviews: number;
  readonly requireCodeOwnerReview: boolean;
  readonly dismissStaleReviewsOnPush: boolean;
  readonly requireLastPushApproval: boolean;
}

export interface ReviewPolicyProfile {
  readonly implementationPr: ReviewRolePolicy;
  readonly integrationPr: ReviewRolePolicy;
  readonly acceptedFindings: AcceptedFindingsPolicy;
  readonly github: GithubReviewPolicy;
}

/** Lane de review (CO-4): objetivo + vetores obrigatórios por papel — fonte do briefing situado. */
export interface ReviewLanePolicy {
  readonly objective: string;
  readonly vectors: readonly string[];
}

/**
 * Política de PUBLICAÇÃO de reviews (CO-4): o canal canônico é o artefato
 * versionado na spec; GitHub é projeção opcional, proibida por default —
 * somente com autorização humana explícita.
 */
/** Autorização do ciclo do artefato canônico (commit/push review-only). */
export const REVIEW_PUBLICATION_COMPANION_IDS = ["governance-graph-snapshot"] as const;

export type ReviewPublicationCompanionId = (typeof REVIEW_PUBLICATION_COMPANION_IDS)[number];

export interface CanonicalArtifactPolicy {
  readonly commitPolicy: string;
  readonly pushPolicy: string;
  readonly mixedDiff: string;
  /** Projeções determinísticas que compõem o envelope atômico da publicação. */
  readonly deterministicCompanions: readonly ReviewPublicationCompanionId[];
}

export interface ReviewPublicationPolicy {
  readonly canonical: string;
  readonly githubComments: string;
  readonly githubException?: string;
  /** Opcional/backward-compatible: ciclo do artefato canônico. */
  readonly canonicalArtifact?: CanonicalArtifactPolicy;
}

// ── Catálogo × requisito (CO-4, rodada 8) ────────────────────────────────────
// `review_types` define O QUE cada review é (catálogo); `review_requirements`
// define QUANDO e COM QUAL FORÇA é exigido. Conceitos independentes: capacidade
// disponível não é obrigação.

export type ReviewRequirementLevel = "disabled" | "optional" | "recommended" | "required";

export const REQUIREMENT_LEVELS: readonly ReviewRequirementLevel[] = [
  "disabled",
  "optional",
  "recommended",
  "required",
];

/** Entry de `review_types`: identidade do tipo (nativo customizado ou do repositório). */
export interface ReviewTypePolicy {
  readonly source?: "framework" | "repository";
  readonly enabled?: boolean;
  readonly title?: string;
  readonly aliases?: readonly string[];
  readonly objective?: string;
  readonly vectors?: readonly string[];
  /** artifact.template — template específico do tipo (fallback: genérico). */
  readonly template?: string | null;
}

/** Condições de um selector (AND entre as presentes). Dado ausente ⇒ unknown. */
export interface ReviewApplicabilitySelector {
  readonly prProfile?: string;
  readonly labelsAny?: readonly string[];
  readonly changedPathsAny?: readonly string[];
}

/** `review_applicability.<tipo>`: OR de selectors (`any`). */
export interface ReviewApplicabilityPolicy {
  readonly any: readonly ReviewApplicabilitySelector[];
}

export interface ReviewRequirementRule {
  readonly id: string;
  readonly priority: number;
  readonly when: ReviewApplicabilitySelector;
  readonly set: Readonly<Record<string, ReviewRequirementLevel>>;
}

export interface ReviewRequirementsPolicy {
  readonly defaults: Readonly<Record<string, ReviewRequirementLevel>>;
  readonly rules: readonly ReviewRequirementRule[];
}

/** Governança dos overrides situados (nó/PR): tightening/relaxation explícitos. */
export interface ReviewOverridePolicy {
  readonly allowTightening: boolean;
  readonly allowRelaxation: boolean;
  readonly relaxationRequires: readonly string[];
}

export interface ReviewPolicy {
  readonly activeProfile: string;
  readonly profiles: Readonly<Record<string, ReviewPolicyProfile>>;
  /** LEGADO (CO-4 rodada 8): lanes por papel — absorvido por review_types. */
  readonly lanes?: Readonly<Record<string, ReviewLanePolicy>>;
  /** Opcional/backward-compatible: política de publicação. */
  readonly publication?: ReviewPublicationPolicy;
  /** Catálogo de tipos de review (nativos customizados + tipos do repositório). */
  readonly reviewTypes?: Readonly<Record<string, ReviewTypePolicy>>;
  /** Onde cada tipo FAZ SENTIDO (não confundir com obrigatoriedade). */
  readonly applicability?: Readonly<Record<string, ReviewApplicabilityPolicy>>;
  /** Quando/com qual força cada tipo é exigido (defaults + regras). */
  readonly requirements?: ReviewRequirementsPolicy;
  /** Governança de overrides situados (tightening/relaxation). */
  readonly overridePolicy?: ReviewOverridePolicy;
}

import { parse } from "yaml";

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
export interface CanonicalArtifactPolicy {
  readonly commitPolicy: string;
  readonly pushPolicy: string;
  readonly mixedDiff: string;
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

export class ReviewPolicyParseError extends Error {
  constructor(message: string) {
    super(`Invalid review policy: ${message}`);
    this.name = "ReviewPolicyParseError";
  }
}

function obj(v: unknown, where: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    throw new ReviewPolicyParseError(`${where} must be a mapping`);
  }
  return v as Record<string, unknown>;
}

function str(v: unknown, where: string): string {
  if (typeof v !== "string" || v.length === 0) {
    throw new ReviewPolicyParseError(`${where} must be a non-empty string`);
  }
  return v;
}

function bool(v: unknown, where: string): boolean {
  if (typeof v !== "boolean") {
    throw new ReviewPolicyParseError(`${where} must be boolean`);
  }
  return v;
}

function nonNegativeInt(v: unknown, where: string): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
    throw new ReviewPolicyParseError(`${where} must be a non-negative integer`);
  }
  return v;
}

function stringList(v: unknown, where: string): string[] {
  if (!Array.isArray(v)) throw new ReviewPolicyParseError(`${where} must be a list`);
  return v.map((item, i) => str(item, `${where}[${i}]`));
}

function rolePolicy(raw: unknown, where: string): ReviewRolePolicy {
  const o = obj(raw, where);
  return {
    requiredReviewRoles: stringList(
      o.required_review_roles ?? [],
      `${where}.required_review_roles`
    ),
    requiredNativeApprovals: nonNegativeInt(
      o.required_native_approvals ?? 0,
      `${where}.required_native_approvals`
    ),
  };
}

function profile(raw: unknown, where: string): ReviewPolicyProfile {
  const o = obj(raw, where);
  const accepted = obj(o.accepted_findings, `${where}.accepted_findings`);
  const github = obj(o.github, `${where}.github`);
  return {
    implementationPr: rolePolicy(o.implementation_pr, `${where}.implementation_pr`),
    integrationPr: rolePolicy(o.integration_pr, `${where}.integration_pr`),
    acceptedFindings: {
      requireResolution: bool(
        accepted.require_resolution ?? false,
        `${where}.accepted_findings.require_resolution`
      ),
      requireVerificationEventForFixed: bool(
        accepted.require_verification_event_for_fixed ?? false,
        `${where}.accepted_findings.require_verification_event_for_fixed`
      ),
    },
    github: {
      minimumApprovingReviews: nonNegativeInt(
        github.minimum_approving_reviews ?? 0,
        `${where}.github.minimum_approving_reviews`
      ),
      requireCodeOwnerReview: bool(
        github.require_code_owner_review ?? false,
        `${where}.github.require_code_owner_review`
      ),
      dismissStaleReviewsOnPush: bool(
        github.dismiss_stale_reviews_on_push ?? false,
        `${where}.github.dismiss_stale_reviews_on_push`
      ),
      requireLastPushApproval: bool(
        github.require_last_push_approval ?? false,
        `${where}.github.require_last_push_approval`
      ),
    },
  };
}

function requirementLevel(v: unknown, where: string): ReviewRequirementLevel {
  if (typeof v !== "string" || !(REQUIREMENT_LEVELS as readonly string[]).includes(v)) {
    throw new ReviewPolicyParseError(
      `${where} must be one of ${REQUIREMENT_LEVELS.join("|")} (got ${JSON.stringify(v)})`
    );
  }
  return v as ReviewRequirementLevel;
}

/** Selector compartilhado por `review_applicability` e `when` das regras. */
function parseSelector(raw: unknown, where: string): ReviewApplicabilitySelector {
  const o = obj(raw, where);
  const selector: {
    prProfile?: string;
    labelsAny?: string[];
    changedPathsAny?: string[];
  } = {};
  for (const key of Object.keys(o)) {
    if (key === "pr_profile") {
      selector.prProfile = str(o.pr_profile, `${where}.pr_profile`);
    } else if (key === "labels") {
      const labels = obj(o.labels, `${where}.labels`);
      selector.labelsAny = stringList(labels.any, `${where}.labels.any`);
    } else if (key === "changed_paths") {
      const paths = obj(o.changed_paths, `${where}.changed_paths`);
      selector.changedPathsAny = stringList(paths.any, `${where}.changed_paths.any`);
    } else {
      throw new ReviewPolicyParseError(
        `${where}: condição desconhecida "${key}" (suportadas: pr_profile, labels.any, changed_paths.any)`
      );
    }
  }
  return selector;
}

function parseReviewTypes(raw: unknown): Record<string, ReviewTypePolicy> {
  const root = obj(raw, "review_types");
  const types: Record<string, ReviewTypePolicy> = {};
  for (const [id, value] of Object.entries(root)) {
    const where = `review_types.${id}`;
    const o = obj(value, where);
    const entry: {
      source?: "framework" | "repository";
      enabled?: boolean;
      title?: string;
      aliases?: string[];
      objective?: string;
      vectors?: string[];
      template?: string | null;
    } = {};
    if (o.source !== undefined) {
      const source = str(o.source, `${where}.source`);
      if (source !== "framework" && source !== "repository") {
        throw new ReviewPolicyParseError(`${where}.source must be framework|repository`);
      }
      entry.source = source;
    }
    if (o.enabled !== undefined) entry.enabled = bool(o.enabled, `${where}.enabled`);
    if (o.title !== undefined) entry.title = str(o.title, `${where}.title`);
    if (o.aliases !== undefined) entry.aliases = stringList(o.aliases, `${where}.aliases`);
    if (o.objective !== undefined) {
      entry.objective = str(o.objective, `${where}.objective`).trim();
    }
    if (o.vectors !== undefined) entry.vectors = stringList(o.vectors, `${where}.vectors`);
    if (o.artifact !== undefined && o.artifact !== null) {
      const artifact = obj(o.artifact, `${where}.artifact`);
      if (artifact.template !== undefined && artifact.template !== null) {
        entry.template = str(artifact.template, `${where}.artifact.template`);
      }
    }
    types[id] = entry;
  }
  return types;
}

function parseApplicability(raw: unknown): Record<string, ReviewApplicabilityPolicy> {
  const root = obj(raw, "review_applicability");
  const result: Record<string, ReviewApplicabilityPolicy> = {};
  for (const [typeId, value] of Object.entries(root)) {
    const where = `review_applicability.${typeId}`;
    const o = obj(value, where);
    const selectors: ReviewApplicabilitySelector[] = [];
    if (o.any !== undefined) {
      if (!Array.isArray(o.any) || o.any.length === 0) {
        throw new ReviewPolicyParseError(`${where}.any must be a non-empty list`);
      }
      for (const [i, sel] of o.any.entries()) {
        selectors.push(parseSelector(sel, `${where}.any[${i}]`));
      }
    }
    // Açúcar: pr_profiles: [a, b] ≡ any: [{pr_profile: a}, {pr_profile: b}].
    if (o.pr_profiles !== undefined) {
      for (const profileId of stringList(o.pr_profiles, `${where}.pr_profiles`)) {
        selectors.push({ prProfile: profileId });
      }
    }
    if (selectors.length === 0) {
      throw new ReviewPolicyParseError(
        `${where}: declare "any" (selectors) ou "pr_profiles" (lista de perfis)`
      );
    }
    result[typeId] = { any: selectors };
  }
  return result;
}

function parseRequirements(raw: unknown): ReviewRequirementsPolicy {
  const root = obj(raw, "review_requirements");
  const defaults: Record<string, ReviewRequirementLevel> = {};
  if (root.defaults !== undefined && root.defaults !== null) {
    const rawDefaults = obj(root.defaults, "review_requirements.defaults");
    for (const [typeId, level] of Object.entries(rawDefaults)) {
      defaults[typeId] = requirementLevel(level, `review_requirements.defaults.${typeId}`);
    }
  }
  const rules: ReviewRequirementRule[] = [];
  if (root.rules !== undefined && root.rules !== null) {
    if (!Array.isArray(root.rules)) {
      throw new ReviewPolicyParseError("review_requirements.rules must be a list");
    }
    const seenIds = new Set<string>();
    for (const [i, rawRule] of root.rules.entries()) {
      const where = `review_requirements.rules[${i}]`;
      const o = obj(rawRule, where);
      const id = str(o.id, `${where}.id`);
      if (seenIds.has(id)) {
        throw new ReviewPolicyParseError(`${where}.id "${id}" duplicado`);
      }
      seenIds.add(id);
      const priority = nonNegativeInt(o.priority ?? 100, `${where}.priority`);
      const when = parseSelector(o.when ?? {}, `${where}.when`);
      const rawSet = obj(o.set, `${where}.set`);
      const set: Record<string, ReviewRequirementLevel> = {};
      for (const [typeId, level] of Object.entries(rawSet)) {
        set[typeId] = requirementLevel(level, `${where}.set.${typeId}`);
      }
      if (Object.keys(set).length === 0) {
        throw new ReviewPolicyParseError(`${where}.set must set at least one type`);
      }
      rules.push({ id, priority, when, set });
    }
  }
  return { defaults, rules };
}

function parseOverridePolicy(raw: unknown): ReviewOverridePolicy {
  const o = obj(raw, "review_requirement_overrides");
  return {
    allowTightening: bool(
      o.allow_tightening ?? true,
      "review_requirement_overrides.allow_tightening"
    ),
    allowRelaxation: bool(
      o.allow_relaxation ?? false,
      "review_requirement_overrides.allow_relaxation"
    ),
    relaxationRequires:
      o.relaxation_requires === undefined || o.relaxation_requires === null
        ? ["actor", "reason"]
        : stringList(o.relaxation_requires, "review_requirement_overrides.relaxation_requires"),
  };
}

export function parseReviewPolicy(yamlText: string): ReviewPolicy {
  const raw = parse(yamlText);
  const root = obj(raw, "root");
  const activeProfile = str(root.active_profile, "active_profile");
  const rawProfiles = obj(root.profiles, "profiles");
  const profiles: Record<string, ReviewPolicyProfile> = {};
  for (const [name, value] of Object.entries(rawProfiles)) {
    profiles[name] = profile(value, `profiles.${name}`);
  }
  if (!profiles[activeProfile]) {
    throw new ReviewPolicyParseError(`active_profile "${activeProfile}" is not declared`);
  }

  let lanes: Record<string, ReviewLanePolicy> | undefined;
  if (root.review_lanes !== undefined && root.review_lanes !== null) {
    const rawLanes = obj(root.review_lanes, "review_lanes");
    lanes = {};
    for (const [name, value] of Object.entries(rawLanes)) {
      const lane = obj(value, `review_lanes.${name}`);
      const rawVectors = lane.vectors;
      if (!Array.isArray(rawVectors) || rawVectors.length === 0) {
        throw new ReviewPolicyParseError(`review_lanes.${name}.vectors must be a non-empty list`);
      }
      lanes[name] = {
        objective: str(lane.objective, `review_lanes.${name}.objective`).trim(),
        vectors: rawVectors.map((v, i) => str(v, `review_lanes.${name}.vectors[${i}]`)),
      };
    }
  }

  let publication: ReviewPublicationPolicy | undefined;
  if (root.publication !== undefined && root.publication !== null) {
    const rawPub = obj(root.publication, "publication");
    let canonicalArtifact: CanonicalArtifactPolicy | undefined;
    if (rawPub.canonical_artifact !== undefined && rawPub.canonical_artifact !== null) {
      const rawCa = obj(rawPub.canonical_artifact, "publication.canonical_artifact");
      canonicalArtifact = {
        commitPolicy: str(rawCa.commit_policy, "publication.canonical_artifact.commit_policy"),
        pushPolicy: str(rawCa.push_policy, "publication.canonical_artifact.push_policy"),
        mixedDiff: str(rawCa.mixed_diff, "publication.canonical_artifact.mixed_diff"),
      };
    }
    publication = {
      canonical: str(rawPub.canonical, "publication.canonical"),
      githubComments: str(rawPub.github_comments, "publication.github_comments"),
      ...(rawPub.github_exception !== undefined && rawPub.github_exception !== null
        ? { githubException: str(rawPub.github_exception, "publication.github_exception") }
        : {}),
      ...(canonicalArtifact ? { canonicalArtifact } : {}),
    };
  }

  const reviewTypes =
    root.review_types !== undefined && root.review_types !== null
      ? parseReviewTypes(root.review_types)
      : undefined;
  const applicability =
    root.review_applicability !== undefined && root.review_applicability !== null
      ? parseApplicability(root.review_applicability)
      : undefined;
  const requirements =
    root.review_requirements !== undefined && root.review_requirements !== null
      ? parseRequirements(root.review_requirements)
      : undefined;
  const overridePolicy =
    root.review_requirement_overrides !== undefined && root.review_requirement_overrides !== null
      ? parseOverridePolicy(root.review_requirement_overrides)
      : undefined;

  return {
    activeProfile,
    profiles,
    ...(lanes ? { lanes } : {}),
    ...(publication ? { publication } : {}),
    ...(reviewTypes ? { reviewTypes } : {}),
    ...(applicability ? { applicability } : {}),
    ...(requirements ? { requirements } : {}),
    ...(overridePolicy ? { overridePolicy } : {}),
  };
}

export function activeReviewPolicyProfile(policy: ReviewPolicy): ReviewPolicyProfile {
  return policy.profiles[policy.activeProfile];
}

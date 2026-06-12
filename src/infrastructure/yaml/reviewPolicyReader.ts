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

export interface ReviewPolicy {
  readonly activeProfile: string;
  readonly profiles: Readonly<Record<string, ReviewPolicyProfile>>;
  /** Opcional/backward-compatible: lanes governadas por papel. */
  readonly lanes?: Readonly<Record<string, ReviewLanePolicy>>;
  /** Opcional/backward-compatible: política de publicação. */
  readonly publication?: ReviewPublicationPolicy;
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

  return {
    activeProfile,
    profiles,
    ...(lanes ? { lanes } : {}),
    ...(publication ? { publication } : {}),
  };
}

export function activeReviewPolicyProfile(policy: ReviewPolicy): ReviewPolicyProfile {
  return policy.profiles[policy.activeProfile];
}

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

export interface ReviewPolicy {
  readonly activeProfile: string;
  readonly profiles: Readonly<Record<string, ReviewPolicyProfile>>;
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
  return { activeProfile, profiles };
}

export function activeReviewPolicyProfile(policy: ReviewPolicy): ReviewPolicyProfile {
  return policy.profiles[policy.activeProfile];
}

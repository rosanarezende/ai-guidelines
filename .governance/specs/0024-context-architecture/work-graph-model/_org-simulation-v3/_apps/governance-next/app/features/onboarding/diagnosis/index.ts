import type { ProfileId, ProfileOption } from "@/app/features/adoption/model";
import diagnosisPtBr from "./locales/pt-br.json";

export type OrgSizeChoice = "one" | "small" | "medium" | "large";
export type ResponsibilityChoice = "collapsed" | "tracks" | "separated";
export type ConflictChoice = "record" | "warn" | "block";

export type DiagnosisAnswers = {
  size?: OrgSizeChoice;
  responsibility?: ResponsibilityChoice;
  conflict?: ConflictChoice;
};

export type DiagnosisChoice = {
  id: string;
  label: string;
  description: string;
};

export const STEP_LABELS = diagnosisPtBr.stepLabels;
export const SIZE_CHOICES = diagnosisPtBr.sizeChoices as DiagnosisChoice[];
export const RESPONSIBILITY_CHOICES = diagnosisPtBr.responsibilityChoices as DiagnosisChoice[];
export const CONFLICT_CHOICES = diagnosisPtBr.conflictChoices as DiagnosisChoice[];

export const CONFLICT_POLICIES: Record<
  ConflictChoice,
  {
    label: string;
    summary: string;
    effect: string;
    review: string;
    appWill: string[];
    appWillNot: string[];
    visibleRisks: string[];
    ceremony: string[];
    enforcement: ProfileOption["enforcement"];
    severity: "info" | "warning" | "error";
  }
> = diagnosisPtBr.conflictPolicies as Record<
  ConflictChoice,
  {
    label: string;
    summary: string;
    effect: string;
    review: string;
    appWill: string[];
    appWillNot: string[];
    visibleRisks: string[];
    ceremony: string[];
    enforcement: ProfileOption["enforcement"];
    severity: "info" | "warning" | "error";
  }
>;

export type ConflictPolicy = (typeof CONFLICT_POLICIES)[ConflictChoice];

export function recommendProfile(answers: DiagnosisAnswers): ProfileId {
  if (answers.size === "one") return "solo";
  if (answers.responsibility === "separated" || answers.conflict === "block") {
    return "full";
  }
  if (answers.responsibility === "tracks") return "trio";
  return "compact";
}

export function recommendationIsReady(answers: DiagnosisAnswers): boolean {
  if (answers.size === "one") return true;
  if (!answers.size || !answers.responsibility) return false;
  if (answers.responsibility === "separated") return true;
  return Boolean(answers.conflict);
}

export function effectiveRecommendation(
  profile: ProfileOption,
  conflictPolicy: (typeof CONFLICT_POLICIES)[ConflictChoice] | null,
  appliesPolicy: boolean
): ProfileOption {
  if (!conflictPolicy || !appliesPolicy) return profile;
  return {
    ...profile,
    description:
      profile.id === "full"
        ? diagnosisPtBr.effectiveRecommendation.fullWithBlock
        : diagnosisPtBr.effectiveRecommendation.profileWithPolicy
            .replace("{profile}", profile.label.toLowerCase())
            .replace("{policy}", conflictPolicy.label.toLowerCase()),
    appWill: conflictPolicy.appWill,
    appWillNot: conflictPolicy.appWillNot,
    visibleRisks: conflictPolicy.visibleRisks,
    ceremony: conflictPolicy.ceremony,
    enforcement: conflictPolicy.enforcement,
  };
}

import {
  assistantCloudNote,
  type AssistantChoice,
  type ProfileId,
} from "@/app/features/adoption/model";
import copy from "./locales/pt-br.json";

export function deriveWorkingSummary({
  profile,
  effectiveProfileLabel,
  selectedSourceCount,
  assistant,
  conflictLabel,
  conflictReview,
}: {
  profile: ProfileId;
  effectiveProfileLabel: string;
  selectedSourceCount: number;
  assistant: AssistantChoice;
  conflictLabel?: string;
  conflictReview?: string;
}): string[] {
  const works = [
    format(copy.summary.works.profile, { profile: effectiveProfileLabel }),
    profile === "solo" ? copy.summary.works.soloRoles : copy.summary.works.declaredRoles,
    copy.summary.works.planning,
    copy.summary.works.auditTrail,
  ];
  if (selectedSourceCount > 0) {
    works.push(format(copy.summary.works.sources, { count: String(selectedSourceCount) }));
  }
  if (assistant === "local") works.push(copy.summary.works.localAssistant);
  if (conflictLabel && conflictReview) {
    works.push(
      format(copy.summary.works.conflict, { label: conflictLabel, review: conflictReview })
    );
  }
  return works;
}

export function derivePendingSummary({
  selectedSourceCount,
  assistant,
  profile,
}: {
  selectedSourceCount: number;
  assistant: AssistantChoice;
  profile: ProfileId;
}): string[] {
  const pending = [];
  if (selectedSourceCount === 0) {
    pending.push(copy.summary.pending.noSources);
  }
  if (assistant === "cloud") pending.push(assistantCloudNote(profile));
  pending.push(copy.summary.pending.noIntegrations);
  pending.push(copy.summary.pending.roleAcceptance);
  return pending;
}

export function deriveRiskSummary(profile: ProfileId): string[] {
  if (profile === "full") return copy.summary.risks.full;
  if (profile === "solo") return copy.summary.risks.solo;
  return copy.summary.risks.default;
}

function format(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

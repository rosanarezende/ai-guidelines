"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { GovernanceSnapshot } from "@/lib/types";
import {
  DEFAULT_ASSIGNMENTS,
  assistantSystems,
  deriveAdoption,
  profileOption,
  type AssistantChoice,
  type ProfileId,
  type RoleAssignments,
  type RoleKey,
  type SourceKindId,
} from "@/app/_domain/adoption/model";
import {
  markOnboardingPartialIfNeeded,
  writeOnboardingStatus,
} from "@/app/_domain/adoption/onboardingStorage";
import {
  CONFLICT_POLICIES,
  effectiveRecommendation,
  recommendProfile,
  recommendationIsReady,
  type DiagnosisAnswers,
} from "../_model/diagnosis";
import { derivePendingSummary, deriveRiskSummary, deriveWorkingSummary } from "../_view/OnboardingView/summary";

type OnboardingContextValue = ReturnType<typeof useOnboardingState>;

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  snapshot,
  children,
}: {
  snapshot: GovernanceSnapshot;
  children: ReactNode;
}) {
  const value = useOnboardingState(snapshot);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return value;
}

function useOnboardingState(snapshot: GovernanceSnapshot) {
  const router = useRouter();
  const adoption = useMemo(() => deriveAdoption(snapshot), [snapshot]);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileId>(
    snapshot.profileDeclaration.profile === "full" ? "full" : "compact"
  );
  const [diagnosis, setDiagnosis] = useState<DiagnosisAnswers>({});
  const [manualProfileOpen, setManualProfileOpen] = useState(false);
  const [manualProfileSelected, setManualProfileSelected] = useState(false);
  const [assignments, setAssignments] = useState<RoleAssignments>(DEFAULT_ASSIGNMENTS);
  const [sourceKinds, setSourceKinds] = useState<Record<SourceKindId, boolean>>({
    git: true,
    local: false,
    mono: false,
    svc: false,
    ext: false,
  });
  const [assistant, setAssistant] = useState<AssistantChoice>("local");

  const recommendedProfileId = recommendProfile(diagnosis);
  const recommendedProfile = profileOption(recommendedProfileId);
  const selectedProfile = profileOption(profile);
  const shouldAskResponsibility = Boolean(diagnosis.size && diagnosis.size !== "one");
  const shouldAskConflict = Boolean(
    shouldAskResponsibility && diagnosis.responsibility && diagnosis.responsibility !== "separated"
  );
  const hasRecommendation = recommendationIsReady(diagnosis);
  const canContinueProfileStep = hasRecommendation || manualProfileSelected;
  const conflictPolicy = diagnosis.conflict ? CONFLICT_POLICIES[diagnosis.conflict] : null;
  const shouldShowConflictPolicy =
    Boolean(conflictPolicy) && hasRecommendation && profile === recommendedProfileId;
  const shouldShowManualOverrideNotice =
    Boolean(conflictPolicy) && manualProfileSelected && profile !== recommendedProfileId;
  const effectiveProfile = effectiveRecommendation(
    selectedProfile,
    conflictPolicy,
    shouldShowConflictPolicy
  );
  const selectedSourceCount = Object.values(sourceKinds).filter(Boolean).length;
  const systems = assistantSystems(snapshot);

  useEffect(() => {
    if (step > 0) markOnboardingPartialIfNeeded();
  }, [step]);

  const catalogHighlights = useMemo(() => {
    const weight = (priority: string) =>
      priority === "P0" ? 0 : priority === "P1" ? 1 : priority === "P2" ? 2 : 3;
    return [...snapshot.integrationCatalog.integrations]
      .sort((a, b) => weight(a.priority) - weight(b.priority) || a.id.localeCompare(b.id))
      .slice(0, 6);
  }, [snapshot.integrationCatalog.integrations]);

  const works = deriveWorkingSummary({
    profile,
    effectiveProfileLabel: effectiveProfile.label,
    selectedSourceCount,
    assistant,
    conflictLabel: conflictPolicy?.label,
    conflictReview: conflictPolicy?.review,
  });
  const pending = derivePendingSummary({ selectedSourceCount, assistant, profile });
  const risks = deriveRiskSummary(profile);

  function updateDiagnosis(patch: Partial<DiagnosisAnswers>) {
    let next: DiagnosisAnswers = { ...diagnosis, ...patch };
    if (patch.size && patch.size !== diagnosis.size) next = { size: patch.size };
    if (patch.responsibility && patch.responsibility !== diagnosis.responsibility) {
      next = { ...next, conflict: undefined };
    }
    if (next.size === "one") next = { size: "one" };
    if (next.responsibility === "separated") next = { ...next, conflict: undefined };
    setDiagnosis(next);
    if (!manualProfileSelected && recommendationIsReady(next)) setProfile(recommendProfile(next));
  }

  function selectManualProfile(nextProfile: ProfileId) {
    setProfile(nextProfile);
    setManualProfileOpen(true);
    setManualProfileSelected(true);
  }

  function useRecommendedProfile() {
    setProfile(recommendedProfileId);
    setManualProfileOpen(false);
    setManualProfileSelected(false);
  }

  function changeAssignment(role: RoleKey, value: string) {
    setAssignments((current) => ({ ...current, [role]: value }));
  }

  function toggleSource(source: SourceKindId) {
    setSourceKinds((current) => ({ ...current, [source]: !current[source] }));
  }

  function finishOnboarding() {
    writeOnboardingStatus("finished");
    router.push("/");
  }

  return {
    snapshot,
    adoption,
    step,
    profile,
    diagnosis,
    manualProfileOpen,
    manualProfileSelected,
    assignments,
    sourceKinds,
    assistant,
    recommendedProfileId,
    recommendedProfile,
    selectedProfile,
    shouldAskResponsibility,
    shouldAskConflict,
    hasRecommendation,
    canContinueProfileStep,
    conflictPolicy,
    shouldShowConflictPolicy,
    shouldShowManualOverrideNotice,
    effectiveProfile,
    selectedSourceCount,
    systems,
    catalogHighlights,
    works,
    pending,
    risks,
    setStep,
    setAssistant,
    setManualProfileOpen,
    setManualProfileSelected,
    updateDiagnosis,
    selectManualProfile,
    useRecommendedProfile,
    changeAssignment,
    toggleSource,
    finishOnboarding,
  };
}

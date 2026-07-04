import type {
  AssistantChoice,
  ProfileId,
  ProfileOption,
  RoleAssignments,
  RoleKey,
  SourceKindId,
} from "@/app/features/adoption/model";
import type { AdoptionSummary } from "@/app/features/adoption/model";
import type { GovernanceSnapshot } from "@/lib/types";
import type { ConflictPolicy, DiagnosisAnswers } from "../../diagnosis";
import { AssistantStep } from "../../steps/AssistantStep";
import { IntegrationsStep } from "../../steps/IntegrationsStep";
import { PeopleStep } from "../../steps/PeopleStep";
import { ProfileDiagnosisStep } from "../../steps/ProfileDiagnosisStep";
import { ReviewStep } from "../../steps/ReviewStep";
import { SourcesStep } from "../../steps/SourcesStep";

export function OnboardingStepContent({
  step,
  diagnosis,
  profile,
  recommendedProfileId,
  recommendedProfile,
  selectedProfile,
  effectiveProfile,
  shouldAskResponsibility,
  shouldAskConflict,
  hasRecommendation,
  manualProfileSelected,
  manualProfileOpen,
  conflictPolicy,
  shouldShowConflictPolicy,
  shouldShowManualOverrideNotice,
  updateDiagnosis,
  setProfile,
  setManualProfileOpen,
  setManualProfileSelected,
  assignments,
  authorities,
  onAssignmentChange,
  sourceKinds,
  selectedSourceCount,
  adoption,
  onToggleSource,
  assistant,
  systems,
  onAssistantSelect,
  catalogHighlights,
  works,
  pending,
  risks,
  onFinish,
}: OnboardingStepContentProps) {
  if (step === 1) {
    return (
      <ProfileDiagnosisStep
        diagnosis={diagnosis}
        profile={profile}
        recommendedProfileId={recommendedProfileId}
        recommendedProfile={recommendedProfile}
        selectedProfile={selectedProfile}
        effectiveProfile={effectiveProfile}
        shouldAskResponsibility={shouldAskResponsibility}
        shouldAskConflict={shouldAskConflict}
        hasRecommendation={hasRecommendation}
        manualProfileSelected={manualProfileSelected}
        manualProfileOpen={manualProfileOpen}
        conflictPolicy={conflictPolicy}
        shouldShowConflictPolicy={shouldShowConflictPolicy}
        shouldShowManualOverrideNotice={shouldShowManualOverrideNotice}
        updateDiagnosis={updateDiagnosis}
        setProfile={setProfile}
        setManualProfileOpen={setManualProfileOpen}
        setManualProfileSelected={setManualProfileSelected}
      />
    );
  }
  if (step === 2) {
    return (
      <PeopleStep
        assignments={assignments}
        authorities={authorities}
        profile={profile}
        onChange={onAssignmentChange}
      />
    );
  }
  if (step === 3) {
    return (
      <SourcesStep
        sourceKinds={sourceKinds}
        selectedSourceCount={selectedSourceCount}
        adoption={adoption}
        onToggle={onToggleSource}
      />
    );
  }
  if (step === 4) {
    return (
      <AssistantStep
        assistant={assistant}
        profile={profile}
        systems={systems}
        onSelect={onAssistantSelect}
      />
    );
  }
  if (step === 5) return <IntegrationsStep integrations={catalogHighlights} />;
  if (step === 6) {
    return <ReviewStep works={works} pending={pending} risks={risks} onFinish={onFinish} />;
  }
  return null;
}

type OnboardingStepContentProps = {
  step: number;
  diagnosis: DiagnosisAnswers;
  profile: ProfileId;
  recommendedProfileId: ProfileId;
  recommendedProfile: ProfileOption;
  selectedProfile: ProfileOption;
  effectiveProfile: ProfileOption;
  shouldAskResponsibility: boolean;
  shouldAskConflict: boolean;
  hasRecommendation: boolean;
  manualProfileSelected: boolean;
  manualProfileOpen: boolean;
  conflictPolicy: ConflictPolicy | null;
  shouldShowConflictPolicy: boolean;
  shouldShowManualOverrideNotice: boolean;
  updateDiagnosis: (patch: Partial<DiagnosisAnswers>) => void;
  setProfile: (profile: ProfileId) => void;
  setManualProfileOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  setManualProfileSelected: (value: boolean) => void;
  assignments: RoleAssignments;
  authorities: GovernanceSnapshot["authorities"];
  onAssignmentChange: (role: RoleKey, value: string) => void;
  sourceKinds: Record<SourceKindId, boolean>;
  selectedSourceCount: number;
  adoption: AdoptionSummary;
  onToggleSource: (source: SourceKindId) => void;
  assistant: AssistantChoice;
  systems: ReturnType<typeof import("@/app/features/adoption/model").assistantSystems>;
  onAssistantSelect: (assistant: AssistantChoice) => void;
  catalogHighlights: GovernanceSnapshot["integrationCatalog"]["integrations"];
  works: string[];
  pending: string[];
  risks: string[];
  onFinish: () => void;
};

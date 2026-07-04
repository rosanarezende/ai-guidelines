"use client";

// OnboardingView.tsx — orquestra o onboarding; cada passo vive em `steps/*`.
// IMPORTANTE: nada aqui persiste. É projeção de UX sobre o snapshot; a declaração real
// vive em org.yml/authorities.yml e só muda por comando governado (fatia futura).
import { Box, Button, Paper } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { GovernanceSnapshot } from "@/lib/types";
import {
  DEFAULT_ASSIGNMENTS,
  assistantSystems,
  deriveAdoption,
  profileChipLabel,
  profileOption,
  type AssistantChoice,
  type ProfileId,
  type RoleAssignments,
  type RoleKey,
  type SourceKindId,
} from "@/app/features/adoption/model";
import {
  markOnboardingPartialIfNeeded,
  writeOnboardingStatus,
} from "@/app/features/adoption/onboardingStorage";
import AppShell from "@/app/ui/shell/AppShell";
import {
  CONFLICT_POLICIES,
  effectiveRecommendation,
  recommendProfile,
  recommendationIsReady,
  type DiagnosisAnswers,
} from "../../diagnosis";
import { WelcomeStep } from "../../steps/WelcomeStep";
import { OnboardingActions } from "./OnboardingActions";
import { OnboardingStepper } from "./OnboardingStepper";
import { OnboardingStepContent } from "./OnboardingStepContent";
import copy from "./locales/pt-br.json";
import { derivePendingSummary, deriveRiskSummary, deriveWorkingSummary } from "./summary";

export default function OnboardingView({ snapshot }: { snapshot: GovernanceSnapshot }) {
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

  const updateDiagnosis = (patch: Partial<DiagnosisAnswers>) => {
    let next: DiagnosisAnswers = { ...diagnosis, ...patch };
    if (patch.size && patch.size !== diagnosis.size) {
      next = { size: patch.size };
    }
    if (patch.responsibility && patch.responsibility !== diagnosis.responsibility) {
      next = { ...next, conflict: undefined };
    }
    if (next.size === "one") {
      next = { size: "one" };
    }
    if (next.responsibility === "separated") {
      next = { ...next, conflict: undefined };
    }
    setDiagnosis(next);
    if (!manualProfileSelected && recommendationIsReady(next)) {
      setProfile(recommendProfile(next));
    }
  };

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

  function finishOnboarding() {
    writeOnboardingStatus("finished");
    router.push("/");
  }

  function toggleSource(source: SourceKindId) {
    setSourceKinds((current) => ({ ...current, [source]: !current[source] }));
  }

  return (
    <AppShell
      subtitle={copy.shell.subtitle}
      chip={profileChipLabel(snapshot.profileDeclaration.profile)}
      headerAction={
        <Button component={Link} href="/" size="small" color="inherit">
          {copy.shell.saveForLater}
        </Button>
      }
    >
      {step === 0 ? (
        <WelcomeStep onStart={() => setStep(1)} />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 3.5,
            alignItems: "start",
            gridTemplateColumns: { xs: "1fr", md: "264px 1fr" },
          }}
        >
          <OnboardingStepper step={step} />
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, display: "grid", gap: 2.5 }}>
            <OnboardingStepContent
              step={step}
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
              assignments={assignments}
              authorities={snapshot.authorities}
              onAssignmentChange={(role: RoleKey, value: string) =>
                setAssignments((current) => ({ ...current, [role]: value }))
              }
              sourceKinds={sourceKinds}
              selectedSourceCount={selectedSourceCount}
              adoption={adoption}
              onToggleSource={toggleSource}
              assistant={assistant}
              systems={systems}
              onAssistantSelect={setAssistant}
              catalogHighlights={catalogHighlights}
              works={works}
              pending={pending}
              risks={risks}
              onFinish={finishOnboarding}
            />
            <OnboardingActions
              step={step}
              canContinueProfileStep={canContinueProfileStep}
              onBack={() => setStep(step - 1)}
              onNext={() => setStep(step + 1)}
            />
          </Paper>
        </Box>
      )}
    </AppShell>
  );
}

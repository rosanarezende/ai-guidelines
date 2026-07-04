"use client";

// OnboardingView.tsx — orquestra o onboarding; cada passo vive em `steps/*`.
// IMPORTANTE: nada aqui persiste. É projeção de UX sobre o snapshot; a declaração real
// vive em org.yml/authorities.yml e só muda por comando governado (fatia futura).
import { Box, Button, Paper } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { GovernanceSnapshot } from "@/lib/types";
import { Flex } from "@/app/ui/shared/components";
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
} from "../diagnosis";
import { WelcomeStep } from "../steps/WelcomeStep";
import { ProfileDiagnosisStep } from "../steps/ProfileDiagnosisStep";
import { PeopleStep } from "../steps/PeopleStep";
import { SourcesStep } from "../steps/SourcesStep";
import { AssistantStep } from "../steps/AssistantStep";
import { IntegrationsStep } from "../steps/IntegrationsStep";
import { ReviewStep } from "../steps/ReviewStep";
import { OnboardingStepper } from "./OnboardingStepper";
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
            {step === 1 ? (
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
            ) : null}

            {step === 2 ? (
              <PeopleStep
                assignments={assignments}
                authorities={snapshot.authorities}
                profile={profile}
                onChange={(role: RoleKey, value: string) =>
                  setAssignments((current) => ({ ...current, [role]: value }))
                }
              />
            ) : null}

            {step === 3 ? (
              <SourcesStep
                sourceKinds={sourceKinds}
                selectedSourceCount={selectedSourceCount}
                adoption={adoption}
                onToggle={toggleSource}
              />
            ) : null}

            {step === 4 ? (
              <AssistantStep
                assistant={assistant}
                profile={profile}
                systems={systems}
                onSelect={setAssistant}
              />
            ) : null}

            {step === 5 ? <IntegrationsStep integrations={catalogHighlights} /> : null}

            {step === 6 ? (
              <ReviewStep
                works={works}
                pending={pending}
                risks={risks}
                onFinish={finishOnboarding}
              />
            ) : null}

            {step >= 1 && step <= 5 ? (
              <Flex
                justify="space-between"
                align="center"
                sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}
              >
                <Button
                  color="inherit"
                  startIcon={<ArrowBackIcon />}
                  disabled={step === 1}
                  onClick={() => setStep(step - 1)}
                >
                  {copy.actions.back}
                </Button>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  disabled={step === 1 && !canContinueProfileStep}
                  onClick={() => setStep(step + 1)}
                >
                  {copy.actions.next}
                </Button>
              </Flex>
            ) : null}
          </Paper>
        </Box>
      )}
    </AppShell>
  );
}

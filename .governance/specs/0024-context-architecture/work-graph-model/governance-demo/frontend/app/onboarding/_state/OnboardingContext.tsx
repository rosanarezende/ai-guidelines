"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { GovernanceSnapshot, IntegrationCatalog } from "@demo/contracts";
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
  addDeclaredWorkSource,
  dismissAssistantChoice,
  listWorkSources,
  reportOnboardingStatus,
  saveAssistantProviderChoice,
  saveOnboardingPath,
  saveProfileChoice,
} from "@/app/_domain/adoption/shellClient";
import {
  CONFLICT_POLICIES,
  effectiveRecommendation,
  recommendProfile,
  recommendationIsReady,
  type DiagnosisAnswers,
} from "../_model/diagnosis";
import {
  derivePendingSummary,
  deriveRiskSummary,
  deriveWorkingSummary,
} from "../_view/OnboardingView/summary";

// Contexto da ORGANIZAÇÃO em onboarding. `snapshot` só existe na demo acme;
// organização nova não recebe dados da demo (catálogo de adapters é neutro).
export type OnboardingOrg = {
  workspaceId: string;
  workspaceName: string;
  isDemo: boolean;
  onboardingStatus: "not-started" | "partial" | "finished";
  persistedStep?: number;
  initialProfile: ProfileId;
  profileSaved: boolean;
  persistedSourceKinds: string[];
  persistedAssistant: AssistantChoice;
  catalog: IntegrationCatalog;
};

type OnboardingContextValue = ReturnType<typeof useOnboardingState>;

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  snapshot,
  org,
  children,
}: {
  snapshot: GovernanceSnapshot | null;
  org: OnboardingOrg;
  children: ReactNode;
}) {
  const value = useOnboardingState(snapshot, org);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return value;
}

function useOnboardingState(snapshot: GovernanceSnapshot | null, org: OnboardingOrg) {
  const router = useRouter();
  const adoption = useMemo(() => (snapshot ? deriveAdoption(snapshot) : null), [snapshot]);
  const [step, setStep] = useState(() => initialStepForOrg(org));
  const [profile, setProfile] = useState<ProfileId>(org.initialProfile);
  const [diagnosis, setDiagnosis] = useState<DiagnosisAnswers>({});
  const [manualProfileOpen, setManualProfileOpen] = useState(false);
  const [manualProfileSelected, setManualProfileSelected] = useState(org.profileSaved);
  const [assignments, setAssignments] = useState<RoleAssignments>(DEFAULT_ASSIGNMENTS);
  const [sourceKinds, setSourceKinds] = useState<Record<SourceKindId, boolean>>(() =>
    initialSourceKinds(org.persistedSourceKinds)
  );
  const [assistant, setAssistant] = useState<AssistantChoice>(org.persistedAssistant);

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
  const systems = assistantSystems(org.catalog);

  useEffect(() => {
    // Progresso é estado da organização, persistido file-first no servidor
    // (fire-and-forget: o servidor nunca rebaixa finished para partial).
    if (step > 0) void reportOnboardingStatus("partial", step);
  }, [step]);

  const catalogHighlights = useMemo(() => {
    const weight = (priority: string) =>
      priority === "P0" ? 0 : priority === "P1" ? 1 : priority === "P2" ? 2 : 3;
    return [...org.catalog.integrations]
      .sort((a, b) => weight(a.priority) - weight(b.priority) || a.id.localeCompare(b.id))
      .slice(0, 6);
  }, [org.catalog.integrations]);

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

  async function persistProfileStep() {
    if (org.isDemo) return; // demo é fixture: não grava configuração
    const policy =
      diagnosis.conflict === "warn"
        ? "warn-review"
        : (diagnosis.conflict ?? (profile === "solo" ? "record" : "warn-review"));
    await saveOnboardingPath("guided");
    await saveProfileChoice({
      profile,
      sensitiveAccumulationPolicy: policy,
      reason: manualProfileSelected
        ? "escolha manual no onboarding"
        : "recomendado pelo diagnóstico guiado",
    });
  }

  async function persistSourceStep() {
    if (org.isDemo) return;
    const existing = await listWorkSources();
    const existingKinds = new Set(existing.map((source) => source.kind));
    const kindMap: Record<SourceKindId, { kind: string; label: string }> = {
      git: { kind: "git-repo", label: "Fontes Git (declarado no onboarding)" },
      local: { kind: "local-folder", label: "Pastas locais (declarado no onboarding)" },
      mono: { kind: "monorepo-module", label: "Monorepo com módulos (declarado no onboarding)" },
      svc: { kind: "external-link", label: "Serviços/URLs (declarado no onboarding)" },
      ext: { kind: "manual-upload", label: "Evidência manual (declarado no onboarding)" },
    };
    for (const [source, selected] of Object.entries(sourceKinds)) {
      const mapped = kindMap[source as SourceKindId];
      if (selected && !existingKinds.has(mapped.kind)) {
        await addDeclaredWorkSource(mapped);
      }
    }
  }

  async function persistAssistantStep() {
    if (org.isDemo) return;
    if (assistant === "local") {
      await saveAssistantProviderChoice({
        kind: "ollama",
        label: "Ollama local",
        endpoint: "http://127.0.0.1:11434",
      });
    } else if (assistant === "none") {
      await dismissAssistantChoice();
    }
    // assistant === "cloud": nada é salvo — exige aprovação/egress explícitos
  }

  // Persistência REAL das escolhas por etapa (R1): o usuário pode sair no meio
  // e retomar sem perder o que já escolheu.
  async function persistCurrentStep(currentStep: number) {
    if (currentStep === 1) await persistProfileStep();
    if (currentStep === 3) await persistSourceStep();
    if (currentStep === 4) await persistAssistantStep();
  }

  async function continueStep() {
    await persistCurrentStep(step);
    setStep(step + 1);
  }

  async function finishOnboarding() {
    await persistProfileStep();
    await persistSourceStep();
    await persistAssistantStep();
    await reportOnboardingStatus("finished", 6);
    router.push("/");
  }

  return {
    snapshot,
    org,
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
    continueStep,
    updateDiagnosis,
    selectManualProfile,
    useRecommendedProfile,
    changeAssignment,
    toggleSource,
    finishOnboarding,
  };
}

function initialStepForOrg(org: OnboardingOrg): number {
  if (org.onboardingStatus === "not-started") return 0;
  if (
    typeof org.persistedStep === "number" &&
    Number.isInteger(org.persistedStep) &&
    org.persistedStep > 0 &&
    org.persistedStep <= 6
  ) {
    return org.persistedStep;
  }
  if (!org.profileSaved) return 1;
  if (org.persistedSourceKinds.length === 0) return 3;
  return 4;
}

function initialSourceKinds(kinds: string[]): Record<SourceKindId, boolean> {
  const set = new Set(kinds);
  return {
    git: set.has("git-repo") || set.has("github") || set.has("provider-versioned-source"),
    local: set.has("local-folder") || set.has("cloud-synced-folder"),
    mono: set.has("monorepo-module"),
    svc: set.has("external-link"),
    ext: set.has("manual-upload"),
  };
}

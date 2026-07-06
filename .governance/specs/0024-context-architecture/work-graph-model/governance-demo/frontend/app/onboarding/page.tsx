import { redirect } from "next/navigation";
import { loadGovernanceSnapshot, loadIntegrationCatalog } from "@demo/backend";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import type { ProfileId } from "@/app/_domain/adoption/model";
import OnboardingView from "./_view/OnboardingView";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const gate = await resolveAdoptionGate();
  if (!gate.principal) redirect("/signup");
  const workspace = gate.currentWorkspace;
  if (!workspace) redirect("/organizations");

  // Snapshot governado só existe para a demo acme-*; organização nova recebe
  // apenas o catálogo neutro de integrações.
  const snapshot = gate.isDemo ? await loadGovernanceSnapshot() : null;
  const initialProfile: ProfileId =
    workspace.profileDeclaration?.profile ??
    (snapshot?.profileDeclaration.profile === "full" ? "full" : "compact");
  const sourceKinds = workspace.workSources.map((source) => source.kind);
  const assistantChoice = workspace.assistantConfig?.dismissed
    ? "none"
    : workspace.assistantConfig?.providers.some((provider) => provider.kind === "ollama")
      ? "local"
      : "local";

  return (
    <OnboardingView
      snapshot={snapshot}
      org={{
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        isDemo: gate.isDemo,
        onboardingStatus: workspace.onboardingStatus,
        persistedStep: workspace.onboardingStep,
        initialProfile,
        profileSaved: Boolean(workspace.profileDeclaration),
        persistedSourceKinds: sourceKinds,
        persistedAssistant: assistantChoice,
        catalog: snapshot?.integrationCatalog ?? loadIntegrationCatalog(),
      }}
    />
  );
}

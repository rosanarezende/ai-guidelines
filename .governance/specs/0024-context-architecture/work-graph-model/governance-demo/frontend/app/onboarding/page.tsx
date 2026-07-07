import { redirect } from "next/navigation";
import { loadGovernanceSnapshot, loadIntegrationCatalog } from "@demo/backend";
import { principalPersonId } from "@demo/domain";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import type { ProfileId } from "@/app/_domain/adoption/model";
import OnboardingView from "./_view/OnboardingView";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const gate = await resolveAdoptionGate();
  if (!gate.principal) redirect("/login");
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
        principalId: gate.principal.id,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        isDemo: gate.isDemo,
        entryContext: deriveEntryContext(gate.state, gate.principal.id, workspace.id),
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

function deriveEntryContext(
  state: Awaited<ReturnType<typeof resolveAdoptionGate>>["state"],
  principalId: string,
  workspaceId: string
) {
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  const personId = principalPersonId(state, principalId, workspaceId);
  if (!workspace || !personId) return { kind: "workspace-setup" as const, proposedRoles: [] };
  const proposedRoles = workspace.roleAssignments
    .filter(
      (assignment) =>
        assignment.status === "proposed" &&
        assignment.subject.kind === "person" &&
        assignment.subject.id === personId
    )
    .map((assignment) => ({ id: assignment.id, roleId: assignment.roleId }));
  return proposedRoles.length
    ? { kind: "member-join" as const, proposedRoles }
    : { kind: "workspace-setup" as const, proposedRoles: [] };
}

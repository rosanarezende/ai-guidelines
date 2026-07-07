import { redirect } from "next/navigation";
import { DEMO_WORKSPACE_ID, isDemoWorkspace } from "@demo/domain";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import OrganizationsView from "./_view/OrganizationsView";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const gate = await resolveAdoptionGate();
  if (!gate.principal) redirect("/signup");
  const organizations = gate.workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    kind: workspace.kind,
    onboardingStatus: workspace.onboardingStatus,
    isDemo: isDemoWorkspace(workspace),
    isCurrent: gate.currentWorkspace?.id === workspace.id,
  }));
  return (
    <OrganizationsView
      principalId={gate.principal.id}
      principalName={gate.principal.displayName}
      organizations={organizations}
      demoAttached={organizations.some((organization) => organization.id === DEMO_WORKSPACE_ID)}
    />
  );
}

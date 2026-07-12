import { redirect } from "next/navigation";
import { loadGovernanceSnapshot } from "@demo/backend";
import { entryRedirect, resolveAdoptionGate } from "@/server/adoption/gate";
import HomeView from "./_view/HomeView";
import WorkspaceHome from "./_view/WorkspaceHome";

export const dynamic = "force-dynamic";

export default async function Page() {
  const gate = await resolveAdoptionGate();
  const target = entryRedirect(gate);
  if (target) redirect(target);
  const workspace = gate.currentWorkspace;
  if (!workspace) redirect("/organizations");

  if (!gate.isDemo) return <WorkspaceHome workspace={workspace} />;

  // Somente a organização demo acme-* lê o snapshot governado da sim.
  const snapshot = await loadGovernanceSnapshot();
  return (
    <HomeView
      snapshot={snapshot}
      workspaceName={workspace.name}
      onboardingStatus={workspace.onboardingStatus === "finished" ? "finished" : "partial"}
    />
  );
}

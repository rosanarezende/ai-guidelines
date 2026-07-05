import { redirect } from "next/navigation";
import { entryRedirect, resolveAdoptionGate } from "@/server/adoption/gate";
import SourcesView from "./_view/SourcesView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const gate = await resolveAdoptionGate();
  const target = entryRedirect(gate);
  if (target) redirect(target);
  const workspace = gate.currentWorkspace;
  if (!workspace) redirect("/organizations");

  return (
    <SourcesView
      workspace={{
        id: workspace.id,
        name: workspace.name,
        demo: gate.isDemo,
        onboardingStatus: workspace.onboardingStatus,
        governanceHost: workspace.governanceHost
          ? {
              kind: workspace.governanceHost.kind,
              pathOrUrl: workspace.governanceHost.pathOrUrl,
              ...(workspace.governanceHost.status ? { status: workspace.governanceHost.status } : {}),
            }
          : null,
        sandboxDeclared: Boolean(workspace.sandboxDeclared),
      }}
    />
  );
}

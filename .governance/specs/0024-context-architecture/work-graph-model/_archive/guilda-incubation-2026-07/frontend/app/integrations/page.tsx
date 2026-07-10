import { redirect } from "next/navigation";
import { entryRedirect, resolveAdoptionGate } from "@/server/adoption/gate";
import { integrationBacklog } from "@/server/adoption/application/integrations";
import IntegrationsHubView from "./_view/IntegrationsHubView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const gate = await resolveAdoptionGate();
  const target = entryRedirect(gate);
  if (target) redirect(target);
  const workspace = gate.currentWorkspace;
  if (!workspace || !gate.principal) redirect("/organizations");
  const backlog = await integrationBacklog(workspace.id);
  if (!backlog) redirect("/organizations");

  return (
    <IntegrationsHubView
      workspace={{
        id: workspace.id,
        name: workspace.name,
        demo: gate.isDemo,
        hasGovernanceHost: Boolean(workspace.governanceHost),
      }}
      accountId={gate.principal.id}
      entries={backlog.entries}
      honestyNote={backlog.honestyNote}
    />
  );
}

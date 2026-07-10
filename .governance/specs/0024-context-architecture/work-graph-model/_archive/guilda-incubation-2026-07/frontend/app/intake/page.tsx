import { redirect } from "next/navigation";
import { entryRedirect, resolveAdoptionGate } from "@/server/adoption/gate";
import IntakeView from "./_view/IntakeView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const gate = await resolveAdoptionGate();
  const target = entryRedirect(gate);
  if (target) redirect(target);
  const workspace = gate.currentWorkspace;
  if (!workspace || !gate.principal) redirect("/organizations");

  return (
    <IntakeView
      accountId={gate.principal.id}
      workspace={{
        id: workspace.id,
        name: workspace.name,
        demo: gate.isDemo,
        hasGovernanceHost: Boolean(workspace.governanceHost),
        targets: workspace.planning?.targets || [],
        initiatives: workspace.intake?.initiatives || [],
      }}
    />
  );
}

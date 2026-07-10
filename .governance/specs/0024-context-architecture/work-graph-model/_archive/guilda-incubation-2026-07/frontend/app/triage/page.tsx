import { redirect } from "next/navigation";
import { entryRedirect, resolveAdoptionGate } from "@/server/adoption/gate";
import TriagePlaceholderView from "./_view/TriagePlaceholderView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const gate = await resolveAdoptionGate();
  const target = entryRedirect(gate);
  if (target) redirect(target);
  const workspace = gate.currentWorkspace;
  if (!workspace || !gate.principal) redirect("/organizations");
  return (
    <TriagePlaceholderView
      workspace={{
        id: workspace.id,
        name: workspace.name,
        demo: gate.isDemo,
        hasGovernanceHost: Boolean(workspace.governanceHost),
        initiatives: workspace.intake?.initiatives || [],
      }}
      accountId={gate.principal.id}
    />
  );
}

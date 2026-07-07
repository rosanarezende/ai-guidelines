import { redirect } from "next/navigation";
import { entryRedirect, resolveAdoptionGate } from "@/server/adoption/gate";
import AuditPlaceholderView from "./_view/AuditPlaceholderView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const gate = await resolveAdoptionGate();
  const target = entryRedirect(gate);
  if (target) redirect(target);
  const workspace = gate.currentWorkspace;
  if (!workspace || !gate.principal) redirect("/organizations");

  return (
    <AuditPlaceholderView
      workspace={{
        id: workspace.id,
        name: workspace.name,
        demo: gate.isDemo,
        hasGovernanceHost: Boolean(workspace.governanceHost),
      }}
      accountId={gate.principal.id}
    />
  );
}

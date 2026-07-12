import { redirect } from "next/navigation";
import { loadGovernanceSnapshot } from "@demo/backend";
import { entryRedirect, resolveAdoptionGate } from "@/server/adoption/gate";
import ContractsPlaceholderView from "./_view/ContractsPlaceholderView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const gate = await resolveAdoptionGate();
  const target = entryRedirect(gate);
  if (target) redirect(target);
  const workspace = gate.currentWorkspace;
  if (!workspace || !gate.principal) redirect("/organizations");
  const snapshot = gate.isDemo ? await loadGovernanceSnapshot() : null;

  return (
    <ContractsPlaceholderView
      workspace={{
        id: workspace.id,
        name: workspace.name,
        demo: gate.isDemo,
        hasGovernanceHost: Boolean(workspace.governanceHost),
      }}
      accountId={gate.principal.id}
      snapshot={snapshot}
    />
  );
}

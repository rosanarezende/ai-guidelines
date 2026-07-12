import { redirect } from "next/navigation";
import { entryRedirect, resolveAdoptionGate } from "@/server/adoption/gate";
import WorkView from "./_view/WorkView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const gate = await resolveAdoptionGate();
  const target = entryRedirect(gate);
  if (target) redirect(target);
  const workspace = gate.currentWorkspace;
  if (!workspace) redirect("/organizations");

  return (
    <WorkView
      workspace={{
        id: workspace.id,
        name: workspace.name,
        demo: gate.isDemo,
        onboardingStatus: workspace.onboardingStatus,
      }}
    />
  );
}

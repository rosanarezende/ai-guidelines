import { redirect } from "next/navigation";
import { loadGovernanceSnapshot } from "@demo/backend";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import SettingsView from "./_view/SettingsView";
import WorkspaceSettingsView from "./_view/WorkspaceSettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const gate = await resolveAdoptionGate();
  if (!gate.principal) redirect("/signup");
  const workspace = gate.currentWorkspace;
  if (!workspace) redirect("/organizations");

  if (!gate.isDemo) return <WorkspaceSettingsView workspace={workspace} />;

  const snapshot = await loadGovernanceSnapshot();
  return <SettingsView snapshot={snapshot} />;
}

import { loadGovernanceSnapshot } from "@/lib/governance-server";
import SettingsView from "../features/settings/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const snapshot = await loadGovernanceSnapshot();
  return <SettingsView snapshot={snapshot} />;
}

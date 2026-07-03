import { loadGovernanceSnapshot } from "@/lib/governance-server.mjs";
import GovernanceConsole from "./ui/GovernanceConsole.jsx";

export const dynamic = "force-dynamic";

export default async function Page() {
  const snapshot = await loadGovernanceSnapshot();
  return <GovernanceConsole initialSnapshot={snapshot} />;
}

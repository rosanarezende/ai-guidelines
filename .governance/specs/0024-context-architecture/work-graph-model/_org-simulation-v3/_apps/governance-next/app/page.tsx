import { loadGovernanceSnapshot } from "@/lib/governance-server";
import GovernanceApp from "./ui/GovernanceApp";

export const dynamic = "force-dynamic";

export default async function Page() {
  const snapshot = await loadGovernanceSnapshot();
  return <GovernanceApp initialSnapshot={snapshot} />;
}

import { loadGovernanceSnapshot } from "@/lib/governance-server";
import GovernanceConsole from "../features/console/GovernanceConsole";

export const dynamic = "force-dynamic";

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const snapshot = await loadGovernanceSnapshot();
  return <GovernanceConsole initialSnapshot={snapshot} initialView={view} />;
}

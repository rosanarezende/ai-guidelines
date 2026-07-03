import { loadGovernanceSnapshot } from "@/lib/governance-server";
import GovernanceApp from "../ui/GovernanceApp";

export const dynamic = "force-dynamic";

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const snapshot = await loadGovernanceSnapshot();
  return <GovernanceApp initialSnapshot={snapshot} initialView={view} />;
}

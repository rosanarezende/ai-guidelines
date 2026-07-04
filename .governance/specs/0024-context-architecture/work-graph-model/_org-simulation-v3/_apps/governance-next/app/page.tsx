import { loadGovernanceSnapshot } from "@/lib/governance-server";
import HomeView from "./features/home/views/HomeView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const snapshot = await loadGovernanceSnapshot();
  return <HomeView snapshot={snapshot} />;
}

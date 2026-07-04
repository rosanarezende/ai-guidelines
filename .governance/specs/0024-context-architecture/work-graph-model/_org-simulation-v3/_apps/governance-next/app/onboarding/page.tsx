import { loadGovernanceSnapshot } from "@/lib/governance-server";
import OnboardingView from "../features/onboarding/views/OnboardingView";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const snapshot = await loadGovernanceSnapshot();
  return <OnboardingView snapshot={snapshot} />;
}

import { redirect } from "next/navigation";
import { loadGovernanceSnapshot } from "@demo/backend";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import ConsoleUnavailable from "./_view/ConsoleUnavailable";
import GovernanceConsole from "./_view/GovernanceConsole";

export const dynamic = "force-dynamic";

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const gate = await resolveAdoptionGate();
  if (!gate.principal) redirect("/signup");
  const workspace = gate.currentWorkspace;
  if (!workspace) redirect("/organizations");

  // O console mostra o grafo governado da organização ATUAL. Hoje só a demo
  // acme-* tem host vinculado; organização sem host recebe o estado honesto.
  if (!gate.isDemo) return <ConsoleUnavailable workspaceName={workspace.name} />;

  const { view } = await searchParams;
  const snapshot = await loadGovernanceSnapshot();
  return <GovernanceConsole initialSnapshot={snapshot} initialView={view} />;
}

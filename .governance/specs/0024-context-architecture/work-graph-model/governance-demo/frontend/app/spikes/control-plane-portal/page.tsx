// /spikes/control-plane-portal — bancada interna do spike S1 (QRD-36/41).
// Prova a separacao: portal/control plane para conta/convite; governance host
// Git-backed como SSOT/auditoria; authority sempre fora do control plane.
import { createGovernanceProposal, runPortalSpikeFlow } from "@demo/domain";
import { describeBetterAuthCandidate } from "./_model/better-auth-candidate";
import ControlPlanePortalSpikeView from "./_view/ControlPlanePortalSpikeView";

export const dynamic = "force-dynamic";

export default function ControlPlanePortalSpikePage() {
  const flow = runPortalSpikeFlow();
  const staleProposal = createGovernanceProposal(flow.acceptedState, {
    workspaceId: "ws-mundo-da-mel",
    actorAccountId: "acct-business",
    sourceRevision: "rev-stale",
    targetPath: "intents/intent-new-market.yml",
  });

  return (
    <ControlPlanePortalSpikeView
      auth={describeBetterAuthCandidate()}
      projection={flow.publicProjection}
      proposal={flow.proposalResult}
      bridgeDryRun={flow.bridgeDryRun}
      persistedSnapshot={flow.persistedSnapshot}
      staleProposal={staleProposal}
      secretLeakCount={flow.secretLeaks.length}
    />
  );
}

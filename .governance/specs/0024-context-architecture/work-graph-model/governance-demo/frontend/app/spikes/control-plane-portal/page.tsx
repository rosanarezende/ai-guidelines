// /spikes/control-plane-portal — bancada interna do spike S1 (QRD-36/41).
// Prova a separacao: portal/control plane para conta/convite; governance host
// Git-backed como SSOT/auditoria; authority sempre fora do control plane.
import {
  acceptPortalInvite,
  collectSecretLeaks,
  createGovernanceProposal,
  createPortalControlPlaneSpikeFixture,
  projectPublicControlPlaneState,
} from "@demo/domain";
import { describeBetterAuthCandidate } from "./_model/better-auth-candidate";
import ControlPlanePortalSpikeView from "./_view/ControlPlanePortalSpikeView";

export const dynamic = "force-dynamic";

export default function ControlPlanePortalSpikePage() {
  const initial = createPortalControlPlaneSpikeFixture();
  const invited = acceptPortalInvite(initial, "invite-business", "acct-business");
  const projection = projectPublicControlPlaneState(invited);
  const proposal = createGovernanceProposal(invited, {
    workspaceId: "ws-mundo-da-mel",
    actorAccountId: "acct-business",
    sourceRevision: "rev-governance-001",
    targetPath: "intents/intent-new-market.yml",
  });
  const staleProposal = createGovernanceProposal(invited, {
    workspaceId: "ws-mundo-da-mel",
    actorAccountId: "acct-business",
    sourceRevision: "rev-stale",
    targetPath: "intents/intent-new-market.yml",
  });
  const secretLeaks = collectSecretLeaks(
    projection,
    initial.providerSecrets.map((secret) => secret.secretValue)
  );

  return (
    <ControlPlanePortalSpikeView
      auth={describeBetterAuthCandidate()}
      projection={projection}
      proposal={proposal}
      staleProposal={staleProposal}
      secretLeakCount={secretLeaks.length}
    />
  );
}

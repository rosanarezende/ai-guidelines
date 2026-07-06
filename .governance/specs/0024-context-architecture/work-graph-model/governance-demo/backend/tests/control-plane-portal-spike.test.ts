import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptPortalInvite,
  collectSecretLeaks,
  createGovernanceProposal,
  createPortalControlPlaneSpikeFixture,
  portalAccountHasGovernanceAuthority,
  projectPublicControlPlaneState,
  PORTAL_TOPOLOGIES,
} from "@demo/domain/server";

test("APP-40: public control-plane projection exposes workspace metadata without governed content", () => {
  const state = createPortalControlPlaneSpikeFixture();
  const projection = projectPublicControlPlaneState(state);

  assert.equal(projection.workspaces[0]?.id, "ws-mundo-da-mel");
  assert.equal(projection.providerLinks[0]?.repo, "mundo-da-mel-governance");
  assert.equal(projection.governanceAuthorityGrantCount, 0);
  assert.deepEqual(
    Object.keys(projection).sort(),
    [
      "accounts",
      "governanceAuthorityGrantCount",
      "invites",
      "memberships",
      "providerLinks",
      "workspaces",
    ].sort()
  );
  assert.equal(JSON.stringify(projection).includes("initiatives"), false);
  assert.equal(JSON.stringify(projection).includes("event-log"), false);
});

test("APP-41: accepting a portal invite creates membership but never governance authority", () => {
  const invited = acceptPortalInvite(
    createPortalControlPlaneSpikeFixture(),
    "invite-business",
    "acct-business"
  );

  assert.equal(
    invited.memberships.some(
      (membership) =>
        membership.accountId === "acct-business" && membership.workspaceId === "ws-mundo-da-mel"
    ),
    true
  );
  assert.equal(
    portalAccountHasGovernanceAuthority(invited, "acct-business", "ws-mundo-da-mel"),
    false
  );
  assert.equal(invited.governanceAuthorityGrants.length, 0);
});

test("SEC-13: provider secret is never present in public projection", () => {
  const state = createPortalControlPlaneSpikeFixture();
  const projection = projectPublicControlPlaneState(state);
  const secrets = state.providerSecrets.map((secret) => secret.secretValue);

  assert.deepEqual(collectSecretLeaks(projection, secrets), []);
  assert.equal(JSON.stringify(projection).includes("ghp_spike_secret_must_never_leak"), false);
});

test("ARCH-CP: governance proposal is proposal-only and requires matching sourceRevision", () => {
  const state = acceptPortalInvite(
    createPortalControlPlaneSpikeFixture(),
    "invite-business",
    "acct-business"
  );
  const ok = createGovernanceProposal(state, {
    workspaceId: "ws-mundo-da-mel",
    actorAccountId: "acct-business",
    sourceRevision: "rev-governance-001",
    targetPath: "intents/intent-new-market.yml",
  });
  const stale = createGovernanceProposal(state, {
    workspaceId: "ws-mundo-da-mel",
    actorAccountId: "acct-business",
    sourceRevision: "rev-stale",
    targetPath: "intents/intent-new-market.yml",
  });

  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.proposal.status, "proposal-only");
    assert.equal(ok.proposal.branchCandidate, "governance/proposal-1");
  }
  assert.deepEqual(stale, { ok: false, error: "source-revision-stale" });
});

test("QRD-41: all four delivery topologies are modeled", () => {
  assert.deepEqual(
    [...PORTAL_TOPOLOGIES],
    ["local-solo", "git-backed", "self-hosted-portal", "hosted-portal"]
  );
});

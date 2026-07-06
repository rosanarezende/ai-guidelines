import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  acceptPortalInvite,
  assertNoControlPlaneLeakage,
  collectSecretLeaks,
  createGovernanceProposal,
  createPortalControlPlaneSpikeFixture,
  dryRunGitHubBridgeProposal,
  portalAccountHasGovernanceAuthority,
  projectPublicControlPlaneState,
  PORTAL_TOPOLOGIES,
  runPortalSpikeFlow,
} from "@demo/domain/server";
import { FilePortalControlPlaneStore, buildPortalSpikeEvents } from "../src/index.ts";

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

test("ARCH-CP: GitHub bridge dry-run creates a PR candidate without remote writes", () => {
  const flow = runPortalSpikeFlow();

  assert.equal(flow.bridgeDryRun.ok, true);
  if (flow.bridgeDryRun.ok) {
    assert.equal(flow.bridgeDryRun.repo, "rosana/mundo-da-mel-governance");
    assert.equal(flow.bridgeDryRun.writesToRemote, false);
    assert.equal(flow.bridgeDryRun.pullRequestCandidate.base, "main");
    assert.equal(flow.bridgeDryRun.pullRequestCandidate.head, "governance/proposal-1");
  }
  assert.deepEqual(flow.secretLeaks, []);
});

test("S1b: portal store persists sanitized snapshot and deterministic event-log", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "portal-control-plane-"));
  try {
    const flow = runPortalSpikeFlow();
    const store = new FilePortalControlPlaneStore(rootDir);
    const receipt = await store.persistState({
      state: flow.proposedState,
      events: buildPortalSpikeEvents({
        workspaceId: "ws-mundo-da-mel",
        sourceRevision: "rev-governance-001",
      }),
    });
    const snapshot = await store.readSnapshot();
    const events = await store.readEvents();
    const rawSnapshot = await readFile(receipt.snapshotPath, "utf8");
    const rawEvents = await readFile(receipt.eventLogPath, "utf8");

    assert.equal(receipt.eventCount, 4);
    assert.equal(snapshot.schemaVersion, 1);
    assert.equal(snapshot.providerLinks[0]?.installationIdRedacted, "gh-i...3456");
    assert.equal(snapshot.proposals[0]?.status, "proposal-only");
    assert.equal(
      events.every((event) => event.writesToRemote === false),
      true
    );
    assert.equal(
      events.some((event) => event.type === "portal.github-bridge.dry-run"),
      true
    );
    assert.equal(rawSnapshot.includes("ghp_spike_secret_must_never_leak"), false);
    assert.equal(rawEvents.includes("ghp_spike_secret_must_never_leak"), false);
    assert.deepEqual(
      assertNoControlPlaneLeakage({
        publicProjection: flow.publicProjection,
        persistedSnapshot: snapshot,
        bridgeDryRun: dryRunGitHubBridgeProposal({
          state: flow.proposedState,
          proposalId: "proposal-1",
        }),
        secrets: flow.initialState.providerSecrets.map((secret) => secret.secretValue),
      }),
      []
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("QRD-41: all four delivery topologies are modeled", () => {
  assert.deepEqual(
    [...PORTAL_TOPOLOGIES],
    ["local-solo", "git-backed", "self-hosted-portal", "hosted-portal"]
  );
});

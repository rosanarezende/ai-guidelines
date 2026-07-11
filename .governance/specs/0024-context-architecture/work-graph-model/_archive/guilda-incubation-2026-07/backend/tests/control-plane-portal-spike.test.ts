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
  assertNeo4jIsReadModelOnly,
  portalAccountHasGovernanceAuthority,
  projectPublicControlPlaneState,
  PORTAL_TOPOLOGIES,
  runPortalSpikeFlow,
  selectPortalStoreCandidate,
} from "@demo/domain/server";
import {
  FilePortalControlPlaneStore,
  buildPortalSpikeEvents,
  evaluateBetterAuthPortalStoreProfiles,
  runBetterAuthPostgresPortalLiveSpike,
  runBetterAuthSQLiteInviteAcceptHttpSpike,
  runBetterAuthSQLitePortalHttpSpike,
} from "../src/index.ts";

test("APP-40: public control-plane projection exposes workspace metadata without governed content", () => {
  const state = createPortalControlPlaneSpikeFixture();
  const projection = projectPublicControlPlaneState(state);

  assert.equal(projection.workspaces[0]?.id, "ws-acme-honey");
  assert.equal(projection.providerLinks[0]?.repo, "acme-honey-governance");
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
        membership.accountId === "acct-business" && membership.workspaceId === "ws-acme-honey"
    ),
    true
  );
  assert.equal(
    portalAccountHasGovernanceAuthority(invited, "acct-business", "ws-acme-honey"),
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
    workspaceId: "ws-acme-honey",
    actorAccountId: "acct-business",
    sourceRevision: "rev-governance-001",
    targetPath: "intents/intent-new-market.yml",
  });
  const stale = createGovernanceProposal(state, {
    workspaceId: "ws-acme-honey",
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
    assert.equal(flow.bridgeDryRun.repo, "rosana/acme-honey-governance");
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
        workspaceId: "ws-acme-honey",
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
    await rm(rootDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  }
});

test("QRD-41: all four delivery topologies are modeled", () => {
  assert.deepEqual(
    [...PORTAL_TOPOLOGIES],
    ["local-solo", "git-backed", "self-hosted-portal", "hosted-portal"]
  );
});

test("S1c: SQLite and PostgreSQL are viable Better Auth portal-store profiles", async () => {
  const report = await evaluateBetterAuthPortalStoreProfiles();
  const sqlite = report.profiles.find((profile) => profile.id === "sqlite");
  const postgres = report.profiles.find((profile) => profile.id === "postgres");

  assert.equal(report.generatedFor, "control-plane-portal-spike");
  assert.equal(report.summary.sqliteReady, true);
  assert.equal(report.summary.postgresReady, true);
  assert.equal(report.summary.postgresLiveConnectionRequiredForThisSpike, false);
  assert.equal(sqlite?.readyForSpike, true);
  assert.equal(sqlite?.liveCheck.status, "not-required");
  assert.equal(postgres?.readyForSpike, true);
  assert.equal(postgres?.liveCheck.status, "skipped-without-database-url");
  assert.deepEqual(
    sqlite?.driverStatus.map((driver) => [driver.packageName, driver.available]),
    [
      ["better-auth", true],
      ["@better-auth/kysely-adapter", true],
      ["kysely", true],
      ["better-sqlite3", true],
    ]
  );
  assert.deepEqual(
    postgres?.driverStatus.map((driver) => [driver.packageName, driver.available]),
    [
      ["better-auth", true],
      ["@better-auth/kysely-adapter", true],
      ["kysely", true],
      ["pg", true],
    ]
  );
});

test("S1c: portal-store selection keeps local and shared recommendations distinct", () => {
  assert.equal(selectPortalStoreCandidate({ accessPattern: "solo-local" }).id, "sqlite");
  assert.equal(selectPortalStoreCandidate({ accessPattern: "solo-git-backed" }).id, "sqlite");
  assert.equal(selectPortalStoreCandidate({ accessPattern: "small-team-shared" }).id, "postgres");
  assert.equal(
    selectPortalStoreCandidate({ accessPattern: "controlled-organization" }).id,
    "postgres"
  );
  assert.equal(selectPortalStoreCandidate({ accessPattern: "hosted-portal" }).id, "postgres");
});

test("S1c: Neo4j remains a graph read-model, not a portal account store", async () => {
  const report = await evaluateBetterAuthPortalStoreProfiles();
  const neo4j = report.profiles.find((profile) => profile.id === "neo4j");

  assert.equal(assertNeo4jIsReadModelOnly(), true);
  assert.equal(report.summary.neo4jRejectedAsPortalStore, true);
  assert.equal(neo4j?.betterAuthSupported, false);
  assert.equal(neo4j?.decision, "not-portal-store");
  assert.equal(neo4j?.role, "governance-graph-read-model");
  assert.equal(neo4j?.liveCheck.status, "not-portal-store");
});

test("S1d: Better Auth HTTP flow persists signup, session and organization in SQLite", async () => {
  const report = await runBetterAuthSQLitePortalHttpSpike();

  assert.equal(report.ok, true, report.error);
  assert.equal(report.store, "sqlite");
  assert.equal(report.http.signUpEmailStatus, 200);
  assert.equal(report.http.createOrganizationStatus, 200);
  assert.equal(report.http.listOrganizationsStatus, 200);
  assert.equal(report.http.sessionCookieIssued, true);
  assert.equal(report.migration.requiredTablesPresent, true);
  assert.deepEqual(
    report.migration.createdTables.filter((table) =>
      ["account", "invitation", "member", "organization", "session", "user"].includes(table)
    ),
    ["account", "invitation", "member", "organization", "session", "user"]
  );
  assert.equal(report.persisted.userCount, 1);
  assert.equal(report.persisted.sessionCount, 1);
  assert.equal(report.persisted.organizationCount, 1);
  assert.equal(report.persisted.memberCount, 1);
  assert.equal(report.persisted.createdOrganizationSlug, "acme-honey");
  assert.equal(report.persisted.creatorRole, "owner");
  assert.deepEqual(report.boundary, {
    governanceAuthorityGrantedByPortal: false,
    neo4jUsedAsAccountStore: false,
    contentPlaneRead: false,
  });
});

test("S1e: Better Auth HTTP invite and accept flow persists portal membership in SQLite", async () => {
  const report = await runBetterAuthSQLiteInviteAcceptHttpSpike();

  assert.equal(report.ok, true, report.error);
  assert.equal(report.http.creatorSignUpStatus, 200);
  assert.equal(report.http.createOrganizationStatus, 200);
  assert.equal(report.http.inviteMemberStatus, 200);
  assert.equal(report.http.inviteeSignUpStatus, 200);
  assert.equal(report.http.acceptInvitationStatus, 200);
  assert.equal(report.http.creatorListOrganizationsStatus, 200);
  assert.equal(report.http.inviteeListOrganizationsStatus, 200);
  assert.equal(report.http.creatorCookieIssued, true);
  assert.equal(report.http.inviteeCookieIssued, true);
  assert.equal(report.persisted.userCount, 2);
  assert.equal(report.persisted.sessionCount, 2);
  assert.equal(report.persisted.organizationCount, 1);
  assert.equal(report.persisted.memberCount, 2);
  assert.equal(report.persisted.invitationCount, 1);
  assert.equal(report.persisted.acceptedInvitationCount, 1);
  assert.equal(report.persisted.ownerMemberCount, 1);
  assert.equal(report.persisted.invitedMemberCount, 1);
  assert.equal(report.persisted.organizationSlug, "acme-honey-invite");
  assert.deepEqual(report.sharedAccess, {
    creatorOrganizationCount: 1,
    inviteeOrganizationCount: 1,
    creatorSeesWorkspace: true,
    inviteeSeesWorkspace: true,
    sameWorkspaceVisibleToBoth: true,
  });
  assert.deepEqual(report.boundary, {
    invitedUserOperatedGitHub: false,
    governanceAuthorityGrantedByPortal: false,
    contentPlaneRead: false,
  });
});

test("S1f: PostgreSQL shared portal proof is opt-in and skipped without explicit environment", async () => {
  assert.deepEqual(await runBetterAuthPostgresPortalLiveSpike({}), {
    generatedFor: "control-plane-portal-spike",
    id: "S1f",
    store: "postgres",
    status: "skipped-without-database-url",
    ok: false,
    env: {
      databaseUrlProvided: false,
      explicitApply: false,
    },
    boundary: {
      governanceAuthorityGrantedByPortal: false,
      contentPlaneRead: false,
    },
  });
  assert.deepEqual(
    await runBetterAuthPostgresPortalLiveSpike({
      GOVERNANCE_PORTAL_POSTGRES_URL: "postgres://example.invalid/demo",
    }),
    {
      generatedFor: "control-plane-portal-spike",
      id: "S1f",
      store: "postgres",
      status: "skipped-without-explicit-apply",
      ok: false,
      env: {
        databaseUrlProvided: true,
        explicitApply: false,
      },
      boundary: {
        governanceAuthorityGrantedByPortal: false,
        contentPlaneRead: false,
      },
    }
  );
});

test("S1f: PostgreSQL live shared portal proof runs when explicitly configured", async () => {
  const hasUrl = Boolean(process.env.GOVERNANCE_PORTAL_POSTGRES_URL);
  const hasApply =
    process.env.GOVERNANCE_PORTAL_POSTGRES_SPIKE_APPLY === "1" ||
    process.env.GOVERNANCE_PORTAL_POSTGRES_SPIKE_APPLY === "true";

  const report = await runBetterAuthPostgresPortalLiveSpike();

  if (!hasUrl) {
    assert.equal(report.status, "skipped-without-database-url");
    return;
  }
  if (!hasApply) {
    assert.equal(report.status, "skipped-without-explicit-apply");
    return;
  }

  assert.equal(report.status, "passed", report.error);
  assert.equal(report.ok, true, report.error);
  assert.equal(report.http?.creatorSignUpStatus, 200);
  assert.equal(report.http?.createOrganizationStatus, 200);
  assert.equal(report.http?.inviteMemberStatus, 200);
  assert.equal(report.http?.inviteeSignUpStatus, 200);
  assert.equal(report.http?.acceptInvitationStatus, 200);
  assert.equal(report.http?.creatorListOrganizationsStatus, 200);
  assert.equal(report.http?.inviteeListOrganizationsStatus, 200);
  assert.equal(report.persisted?.organizationCount, 1);
  assert.equal(report.persisted?.memberCount, 2);
  assert.equal(report.persisted?.acceptedInvitationCount, 1);
  assert.equal(report.sharedAccess?.creatorSeesWorkspace, true);
  assert.equal(report.sharedAccess?.inviteeSeesWorkspace, true);
  assert.equal(report.sharedAccess?.sameWorkspaceVisibleToBoth, true);
  assert.deepEqual(report.boundary, {
    governanceAuthorityGrantedByPortal: false,
    contentPlaneRead: false,
  });
});

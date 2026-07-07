import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGovernedQueryKey,
  PortalQueryScopeSchema,
  SensitiveCacheEventSchema,
  sensitiveQueryCacheDirective,
  type PortalQueryScope,
} from "@demo/contracts";

const SCOPE: PortalQueryScope = {
  accountId: "acct-rosana",
  principalId: "principal-rosana",
  workspaceId: "mundo-da-mel",
  authProvider: "better-auth",
  sessionEpoch: "session-epoch-2026-07-06",
  membershipRevision: "membership-rev-001",
};

test("APP-45 scope schema accepts only non-secret portal/query identifiers", () => {
  assert.deepEqual(PortalQueryScopeSchema.parse(SCOPE), SCOPE);

  assert.throws(
    () =>
      PortalQueryScopeSchema.parse({
        ...SCOPE,
        sessionToken: "secret-token-that-must-never-enter-query-keys",
      }),
    /Unrecognized key/
  );

  assert.throws(
    () =>
      PortalQueryScopeSchema.parse({
        ...SCOPE,
        sessionEpoch: "bearer-secret-token",
      }),
    /auth scope ids/
  );
});

test("APP-45 governed query key is scoped by account, session, workspace and membership", () => {
  const key = buildGovernedQueryKey(SCOPE, "results-dashboard", ["cycle-2026-q3"]);
  assert.deepEqual(key, [
    "governance-demo",
    "account",
    "acct-rosana",
    "session",
    "session-epoch-2026-07-06",
    "workspace",
    "mundo-da-mel",
    "membership",
    "membership-rev-001",
    "resource",
    "results-dashboard",
    "cycle-2026-q3",
  ]);

  const switchedWorkspaceKey = buildGovernedQueryKey(
    { ...SCOPE, workspaceId: "cliente-acme" },
    "results-dashboard",
    ["cycle-2026-q3"]
  );
  assert.notDeepEqual(switchedWorkspaceKey, key);

  const acceptedInviteKey = buildGovernedQueryKey(
    { ...SCOPE, membershipRevision: "membership-rev-002" },
    "results-dashboard",
    ["cycle-2026-q3"]
  );
  assert.notDeepEqual(acceptedInviteKey, key);
});

test("APP-45 sensitive cache events parse fail-closed and return explicit directives", () => {
  assert.deepEqual(
    sensitiveQueryCacheDirective({
      type: "logout",
      accountId: "acct-rosana",
    }),
    { action: "clear-all-sensitive", reason: "logout" }
  );

  assert.deepEqual(
    sensitiveQueryCacheDirective({
      type: "account-switch",
      fromAccountId: "acct-rosana",
      toAccountId: "acct-business",
    }),
    { action: "clear-all-sensitive", reason: "account-switch" }
  );

  assert.deepEqual(
    sensitiveQueryCacheDirective({
      type: "workspace-switch",
      accountId: "acct-rosana",
      fromWorkspaceId: "mundo-da-mel",
      toWorkspaceId: "cliente-acme",
    }),
    {
      action: "invalidate-account-sensitive",
      accountId: "acct-rosana",
      reason: "workspace-switch",
    }
  );

  assert.deepEqual(
    sensitiveQueryCacheDirective({
      type: "invite-accept",
      accountId: "acct-rosana",
      workspaceId: "mundo-da-mel",
      membershipRevision: "membership-rev-002",
    }),
    {
      action: "invalidate-workspace-sensitive",
      accountId: "acct-rosana",
      workspaceId: "mundo-da-mel",
      reason: "invite-accept",
    }
  );

  assert.throws(
    () =>
      SensitiveCacheEventSchema.parse({
        type: "invite-accept",
        accountId: "acct-rosana",
        workspaceId: "mundo-da-mel",
        token: "invite-token-must-not-enter-cache-policy",
      }),
    /Unrecognized key/
  );
});

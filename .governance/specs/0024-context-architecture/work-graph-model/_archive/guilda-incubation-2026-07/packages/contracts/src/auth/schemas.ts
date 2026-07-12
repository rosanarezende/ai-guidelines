import { z } from "zod";

const nonSecretId = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .refine((value) => !/token|secret|password|bearer/i.test(value), {
    message: "auth scope ids must be opaque non-secret ids, never tokens or secrets",
  });

export const AuthProviderKindSchema = z.enum(["local-dev", "better-auth", "anonymous-demo"]);

export const PortalAuthMethodSchema = z.enum(["magic-link", "github", "google"]);

export type PortalAuthMethod = z.infer<typeof PortalAuthMethodSchema>;

export const PortalQueryScopeSchema = z
  .object({
    accountId: nonSecretId,
    principalId: nonSecretId,
    workspaceId: nonSecretId,
    authProvider: AuthProviderKindSchema,
    sessionEpoch: nonSecretId,
    membershipRevision: nonSecretId,
  })
  .strict();

export type PortalQueryScope = z.infer<typeof PortalQueryScopeSchema>;

export const GovernedQueryResourceSchema = z.enum([
  "results-dashboard",
  "governance-map",
  "work-items",
  "members",
  "settings",
]);

export type GovernedQueryResource = z.infer<typeof GovernedQueryResourceSchema>;

export type GovernedQueryKey = readonly [
  "governance-demo",
  "account",
  string,
  "session",
  string,
  "workspace",
  string,
  "membership",
  string,
  "resource",
  GovernedQueryResource,
  ...string[],
];

export function buildGovernedQueryKey(
  scope: PortalQueryScope,
  resource: GovernedQueryResource,
  details: readonly string[] = []
): GovernedQueryKey {
  const parsedScope = PortalQueryScopeSchema.parse(scope);
  const parsedResource = GovernedQueryResourceSchema.parse(resource);
  return [
    "governance-demo",
    "account",
    parsedScope.accountId,
    "session",
    parsedScope.sessionEpoch,
    "workspace",
    parsedScope.workspaceId,
    "membership",
    parsedScope.membershipRevision,
    "resource",
    parsedResource,
    ...details,
  ] as const;
}

const scopedWorkspaceEvent = z
  .object({
    accountId: nonSecretId,
    workspaceId: nonSecretId,
    membershipRevision: nonSecretId.optional(),
  })
  .strict();

export const SensitiveCacheEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("login"),
      accountId: nonSecretId,
      sessionEpoch: nonSecretId,
    })
    .strict(),
  z
    .object({
      type: z.literal("logout"),
      accountId: nonSecretId.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("account-switch"),
      fromAccountId: nonSecretId,
      toAccountId: nonSecretId,
    })
    .strict(),
  z
    .object({
      type: z.literal("workspace-switch"),
      accountId: nonSecretId,
      fromWorkspaceId: nonSecretId.optional(),
      toWorkspaceId: nonSecretId,
    })
    .strict(),
  scopedWorkspaceEvent.extend({ type: z.literal("invite-accept") }).strict(),
  scopedWorkspaceEvent.extend({ type: z.literal("membership-change") }).strict(),
]);

export type SensitiveCacheEvent = z.infer<typeof SensitiveCacheEventSchema>;

export type SensitiveQueryCacheDirective =
  | {
      action: "clear-all-sensitive";
      reason: "login" | "logout" | "account-switch";
    }
  | {
      action: "invalidate-account-sensitive";
      accountId: string;
      reason: "workspace-switch";
    }
  | {
      action: "invalidate-workspace-sensitive";
      accountId: string;
      workspaceId: string;
      reason: "invite-accept" | "membership-change";
    };

export function sensitiveQueryCacheDirective(
  event: SensitiveCacheEvent
): SensitiveQueryCacheDirective {
  const parsed = SensitiveCacheEventSchema.parse(event);
  switch (parsed.type) {
    case "login":
    case "logout":
    case "account-switch":
      return { action: "clear-all-sensitive", reason: parsed.type };
    case "workspace-switch":
      return {
        action: "invalidate-account-sensitive",
        accountId: parsed.accountId,
        reason: parsed.type,
      };
    case "invite-accept":
    case "membership-change":
      return {
        action: "invalidate-workspace-sensitive",
        accountId: parsed.accountId,
        workspaceId: parsed.workspaceId,
        reason: parsed.type,
      };
  }
}

export const AUTH_QUERY_ZOD_SCHEMA_IDS = [
  "AuthProviderKindSchema",
  "PortalAuthMethodSchema",
  "PortalQueryScopeSchema",
  "GovernedQueryResourceSchema",
  "SensitiveCacheEventSchema",
] as const;

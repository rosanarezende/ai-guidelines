"use client";

import type { QueryClient, QueryKey } from "@tanstack/react-query";
import {
  SensitiveCacheEventSchema,
  sensitiveQueryCacheDirective,
  type SensitiveCacheEvent,
  type SensitiveQueryCacheDirective,
} from "@demo/contracts";

type ApplySensitiveQueryCacheResult = {
  directive: SensitiveQueryCacheDirective;
  matchedQueries: number;
};

export async function applySensitiveQueryCacheEvent(
  queryClient: QueryClient,
  event: SensitiveCacheEvent
): Promise<ApplySensitiveQueryCacheResult> {
  const parsed = SensitiveCacheEventSchema.parse(event);
  const directive = sensitiveQueryCacheDirective(parsed);
  const predicate = sensitiveQueryPredicate(directive);
  const matchedQueries = queryClient.getQueryCache().findAll({ predicate }).length;

  if (directive.action === "clear-all-sensitive") {
    queryClient.removeQueries({ predicate });
  } else {
    await queryClient.invalidateQueries({ predicate, refetchType: "none" });
  }

  return { directive, matchedQueries };
}

function sensitiveQueryPredicate(directive: SensitiveQueryCacheDirective) {
  return ({ queryKey }: { queryKey: QueryKey }): boolean => {
    if (directive.action === "clear-all-sensitive") {
      return isGovernedQuery(queryKey) || isLegacyWorkspaceQuery(queryKey);
    }
    if (directive.action === "invalidate-account-sensitive") {
      return (
        matchesGovernedAccount(queryKey, directive.accountId) || isLegacyWorkspaceQuery(queryKey)
      );
    }
    return (
      matchesGovernedWorkspace(queryKey, directive.accountId, directive.workspaceId) ||
      matchesLegacyWorkspace(queryKey, directive.workspaceId)
    );
  };
}

function isGovernedQuery(queryKey: QueryKey): boolean {
  return queryKey[0] === "governance-demo";
}

function matchesGovernedAccount(queryKey: QueryKey, accountId: string): boolean {
  return isGovernedQuery(queryKey) && queryKey[1] === "account" && queryKey[2] === accountId;
}

function matchesGovernedWorkspace(
  queryKey: QueryKey,
  accountId: string,
  workspaceId: string
): boolean {
  return (
    matchesGovernedAccount(queryKey, accountId) &&
    queryKey[5] === "workspace" &&
    queryKey[6] === workspaceId
  );
}

function isLegacyWorkspaceQuery(queryKey: QueryKey): boolean {
  return queryKey[0] === "workspace";
}

function matchesLegacyWorkspace(queryKey: QueryKey, workspaceId: string): boolean {
  return isLegacyWorkspaceQuery(queryKey) && queryKey[1] === workspaceId;
}

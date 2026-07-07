import {
  buildGovernedQueryKey,
  type GovernedQueryKey,
  type PortalQueryScope,
} from "@demo/contracts";

export const workspaceQueryKeys = {
  resultsDashboard: (workspaceId: string) =>
    ["workspace", workspaceId, "results", "dashboard"] as const,
  governanceMap: (workspaceId: string) => ["workspace", workspaceId, "map", "governance"] as const,
  workItems: (workspaceId: string) => ["workspace", workspaceId, "work", "items"] as const,
};

export type WorkspaceQueryKey = ReturnType<
  (typeof workspaceQueryKeys)[keyof typeof workspaceQueryKeys]
>;

export const scopedWorkspaceQueryKeys = {
  resultsDashboard: (scope: PortalQueryScope): GovernedQueryKey =>
    buildGovernedQueryKey(scope, "results-dashboard"),
  governanceMap: (scope: PortalQueryScope): GovernedQueryKey =>
    buildGovernedQueryKey(scope, "governance-map"),
  workItems: (scope: PortalQueryScope): GovernedQueryKey =>
    buildGovernedQueryKey(scope, "work-items"),
};

export type ScopedWorkspaceQueryKey = ReturnType<
  (typeof scopedWorkspaceQueryKeys)[keyof typeof scopedWorkspaceQueryKeys]
>;

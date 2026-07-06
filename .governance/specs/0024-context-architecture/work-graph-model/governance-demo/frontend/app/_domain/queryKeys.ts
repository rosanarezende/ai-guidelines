export const workspaceQueryKeys = {
  resultsDashboard: (workspaceId: string) =>
    ["workspace", workspaceId, "results", "dashboard"] as const,
  governanceMap: (workspaceId: string) => ["workspace", workspaceId, "map", "governance"] as const,
  workItems: (workspaceId: string) => ["workspace", workspaceId, "work", "items"] as const,
};

export type WorkspaceQueryKey = ReturnType<
  (typeof workspaceQueryKeys)[keyof typeof workspaceQueryKeys]
>;

declare module "*_lib/index.mjs" {
  export function buildGraphReadModel(input: unknown): {
    nodes: Array<{ id: string; type: string; label?: string; data?: unknown }>;
    edges: Array<{ id: string; source: string; target: string; type: string }>;
  };
  export function openFileGovernanceRuntime(): {
    repository: {
      loadCommandHistory(): unknown[];
    };
    loadOrg(): Record<string, unknown>;
    currentRevision(): string;
    validateOrg(org: Record<string, unknown>): Array<{
      level: "error" | "warn";
      rule: string;
      node: string;
      msg: string;
    }>;
    dryRunGovernedCommand(
      command: unknown,
      options?: unknown
    ): {
      ok: boolean;
      issues: Array<{ level: "error" | "warn"; rule: string; node: string; msg: string }>;
      receipt?: Record<string, unknown>;
    };
    executeGovernedCommand(command: unknown): {
      ok: boolean;
      issues: Array<{ level: "error" | "warn"; rule: string; node: string; msg: string }>;
      receipt?: Record<string, unknown>;
    };
  };
}

declare module "*_tools/repo-contracts.mjs" {
  export function loadPublishedRepoContracts(): unknown[];
  export function validateRepoContracts(
    org: unknown,
    options: unknown
  ): Array<{
    level: "error" | "warn";
    rule: string;
    node: string;
    msg: string;
  }>;
}

declare module "*_tools/repo-contexts.mjs" {
  export function loadPublishedContexts(): unknown[];
  export function validateRepoContexts(
    org: unknown,
    options: unknown
  ): Promise<
    Array<{
      level: "error" | "warn";
      rule: string;
      node: string;
      msg: string;
    }>
  >;
}

declare module "*_tools/repo-works.mjs" {
  export function loadPublishedRepoWorks(): unknown[];
  export function validateRepoWorks(
    org: unknown,
    options: unknown
  ): Array<{
    level: "error" | "warn";
    rule: string;
    node: string;
    msg: string;
  }>;
}

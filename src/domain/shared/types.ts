export type WorkItemId = string;

export const WORK_ITEM_KINDS = [
  "spec",
  "exploration",
  "fix",
  "patch",
  "incident",
  "proposal",
  "experiment",
] as const;

export type WorkItemKind = (typeof WORK_ITEM_KINDS)[number];

export type LifecycleStatus = "draft" | "in-progress" | "review" | "done" | "archived";

export type ValueStatus = "pending" | "won" | "lost" | "inconclusive";

export type ResolutionMode = "pending" | "cleaned-up" | "kept";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

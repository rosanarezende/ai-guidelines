/**
 * Estado operacional mínimo de uma spec.
 *
 * Schema canônico fechado em `decision-brief.md` § DEC-0023-A04.
 */

export type WorkflowStage =
  | "discovery"
  | "decision"
  | "planning"
  | "implementation"
  | "closing"
  | "done";

export type GateStatus = "open" | "awaiting-review" | "closed";

export type TopologyRole = "governance" | "execution" | "integration";

export const WORKFLOW_STAGES: readonly WorkflowStage[] = [
  "discovery",
  "decision",
  "planning",
  "implementation",
  "closing",
  "done",
];

export const GATE_STATUSES: readonly GateStatus[] = ["open", "awaiting-review", "closed"];

export const TOPOLOGY_ROLES: readonly TopologyRole[] = ["governance", "execution", "integration"];

export interface TopologyCursor {
  readonly pr: string;
  readonly checkpoint: string;
}

export interface PrTopologyNode {
  readonly id: string;
  readonly github_pr: number | null;
  readonly role: TopologyRole;
  readonly terminal: boolean;
  readonly sequence: number | null;
  readonly checkpoints: ReadonlyArray<string>;
}

export interface TopologyPrs {
  readonly concluded: ReadonlyArray<PrTopologyNode>;
  readonly active: ReadonlyArray<PrTopologyNode>;
  readonly planned: ReadonlyArray<PrTopologyNode>;
}

export interface WorkflowTopology {
  readonly cursor: TopologyCursor;
  readonly prs: TopologyPrs;
}

export interface WorkflowState {
  readonly stage: WorkflowStage;
  readonly gate: { readonly status: GateStatus };
  readonly focus: ReadonlyArray<string>;
  readonly next: ReadonlyArray<string>;
  readonly topology?: WorkflowTopology;
}

export function isWorkflowStage(value: unknown): value is WorkflowStage {
  return typeof value === "string" && (WORKFLOW_STAGES as readonly string[]).includes(value);
}

export function isGateStatus(value: unknown): value is GateStatus {
  return typeof value === "string" && (GATE_STATUSES as readonly string[]).includes(value);
}

export function isTopologyRole(value: unknown): value is TopologyRole {
  return typeof value === "string" && (TOPOLOGY_ROLES as readonly string[]).includes(value);
}

export function defaultWorkflowState(): WorkflowState {
  return {
    stage: "discovery",
    gate: { status: "open" },
    focus: [],
    next: [],
  };
}

export function isExecutionAuthorized(state: WorkflowState, tasksFileExists: boolean): boolean {
  return tasksFileExists && state.gate.status === "closed";
}

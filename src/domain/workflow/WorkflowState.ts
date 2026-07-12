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

/**
 * Override SITUADO de requirement de review para um nó específico (CO-4,
 * rodada 8): a owner ajusta a força de um tipo neste nó sem editar a policy
 * global. Tightening/relaxation são governados por
 * `review-policy.yml § review_requirement_overrides`.
 */
export interface NodeReviewRequirementOverride {
  readonly requirement: "disabled" | "optional" | "recommended" | "required";
  readonly reason?: string;
  readonly actor?: string;
}

export type NodeReviewPlanRecommendation = "not_needed" | "optional" | "recommended" | "required";

export type NodeReviewPlanDecision = "pending" | "waived" | "optional" | "recommended" | "required";

export type NodeReviewRevalidationDecision = "pending" | "waived" | "required";

/**
 * Decisão SITUADA sobre revalidação quando uma review obrigatória já aprovada
 * fica stale por um delta posterior. A dispensa nunca transforma stale em
 * current; apenas declara que a owner aceitou não repetir a review inteira
 * para aquele delta.
 */
export interface NodeReviewPlanRevalidation {
  readonly owner_decision: NodeReviewRevalidationDecision;
  readonly reason?: string;
  readonly actor?: string;
}

/**
 * Plano SITUADO de review para um PR/nó. A automação recomenda; a owner decide.
 * A decisão é projetada para `review_requirements` efetivos, mas preserva a
 * distinção entre sugestão do sistema e escolha humana.
 */
export interface NodeReviewPlanEntry {
  readonly system_recommendation: NodeReviewPlanRecommendation;
  readonly owner_decision: NodeReviewPlanDecision;
  readonly reason?: string;
  readonly actor?: string;
  readonly revalidation?: NodeReviewPlanRevalidation;
}

export interface PrTopologyNode {
  readonly id: string;
  readonly github_pr: number | null;
  readonly role: TopologyRole;
  readonly terminal: boolean;
  readonly sequence: number | null;
  readonly checkpoints: ReadonlyArray<string>;
  /** Plano situado por tipo de review (sistema recomenda; owner decide). */
  readonly review_plan?: Readonly<Record<string, NodeReviewPlanEntry>>;
  /** Overrides situados por tipo de review (opcional). */
  readonly review_requirements?: Readonly<Record<string, NodeReviewRequirementOverride>>;
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

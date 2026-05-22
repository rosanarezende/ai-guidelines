/**
 * Estado operacional mínimo de uma spec.
 *
 * Schema canônico fechado em `decision-brief.md` § DEC-0023-A04:
 * 4 chaves, nada além. Novas chaves exigem decisão própria.
 */

export type WorkflowStage = "discovery" | "decision" | "planning" | "implementation" | "closing";

export type GateStatus = "open" | "awaiting-review" | "closed";

export const WORKFLOW_STAGES: readonly WorkflowStage[] = [
  "discovery",
  "decision",
  "planning",
  "implementation",
  "closing",
];

export const GATE_STATUSES: readonly GateStatus[] = ["open", "awaiting-review", "closed"];

export interface WorkflowState {
  readonly stage: WorkflowStage;
  readonly gate: { readonly status: GateStatus };
  readonly focus: ReadonlyArray<string>;
  readonly next: ReadonlyArray<string>;
}

export function isWorkflowStage(value: unknown): value is WorkflowStage {
  return typeof value === "string" && (WORKFLOW_STAGES as readonly string[]).includes(value);
}

export function isGateStatus(value: unknown): value is GateStatus {
  return typeof value === "string" && (GATE_STATUSES as readonly string[]).includes(value);
}

export function defaultWorkflowState(): WorkflowState {
  return {
    stage: "discovery",
    gate: { status: "open" },
    focus: [],
    next: [],
  };
}

/**
 * Computa se a execução de uma spec está estruturalmente autorizada localmente.
 *
 * Conforme DEC-0023-E03, a autorização de execução local (L2) é baseada em:
 * 1. Presença física do arquivo de tarefas (`tasks.md`) no diretório da spec.
 * 2. Estado de planejamento concluído (`gate.status === "closed"`).
 *
 * É uma função de domínio 100% pura, livre de efeitos colaterais e I/O.
 */
export function isExecutionAuthorized(state: WorkflowState, tasksFileExists: boolean): boolean {
  return tasksFileExists && state.gate.status === "closed";
}

import {
  IncidentSeverity,
  LifecycleStatus,
  ResolutionMode,
  ValueStatus,
  WorkItemId,
  WorkItemKind,
} from "../shared/types.js";

/**
 * DTO de entrada para criação de um WorkItem.
 *
 * Diferente de {@link WorkItem}:
 * - `status` é opcional (default aplicado pelo use case).
 * - Não carrega `createdAt`/`updatedAt`: timestamps pertencem aos use cases
 *   (via Clock port), não ao caller.
 *
 * Validação dos invariantes por pilar fica em {@link WorkItemPolicy}.
 */
export interface WorkItemDraft {
  readonly id: WorkItemId;
  readonly kind: WorkItemKind;
  readonly title: string;
  readonly status?: LifecycleStatus;
  readonly workspacePath?: string;
  readonly sourceRefs?: ReadonlyArray<string>;
  readonly hypothesis?: string;
  readonly successMetrics?: ReadonlyArray<string>;
  readonly outcome?: ValueStatus;
  readonly resolution?: ResolutionMode;
  readonly severity?: IncidentSeverity;
}

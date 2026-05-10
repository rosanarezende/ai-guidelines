import { GovernancePolicies } from "../../domain/policy/GovernancePolicies.js";
import { isDenseKind, isDenseItem, WorkItem } from "../../domain/work-item/WorkItem.js";
import { WorkItemDraft } from "../../domain/work-item/WorkItemDraft.js";
import { Clock } from "../ports/Clock.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { RegistryStore } from "../ports/RegistryStore.js";
import { WorkspaceStore } from "../ports/WorkspaceStore.js";

export interface RegisterWorkItemDeps {
  readonly policy: GovernancePolicies;
  readonly registry: RegistryStore;
  readonly workspace: WorkspaceStore;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export interface RegisterWorkItemInput extends Omit<WorkItemDraft, "id" | "status"> {
  readonly id?: string;
  readonly status?: WorkItemDraft["status"];
}

export class RegisterWorkItem {
  constructor(private readonly deps: RegisterWorkItemDeps) {}

  execute(input: RegisterWorkItemInput): WorkItem {
    const { policy, registry, workspace, clock, ids } = this.deps;
    const id = input.id ?? ids.next();
    const draft: WorkItemDraft = {
      ...input,
      id,
      status: input.status ?? "draft",
    };

    // Policy-first: nada toca registry/workspace antes da validação.
    policy.validateNewItem(draft);

    const now = clock.nowIso();
    const item = buildWorkItem(draft, now);

    // Atomicidade: registry primeiro; se workspace falhar, rollback do registry.
    registry.add(item);

    if (isDenseItem(item)) {
      try {
        workspace.createWorkspace(item.workspacePath);
      } catch (err) {
        registry.remove(item.id);
        throw err;
      }
    }

    return item;
  }
}

/**
 * Constrói o WorkItem da variante correta a partir de um draft já validado.
 * O cast no retorno é seguro porque {@link GovernancePolicies.validateNewItem}
 * já garantiu os invariantes do pilar (incluindo workspacePath para densos).
 */
function buildWorkItem(draft: WorkItemDraft, now: string): WorkItem {
  const base = {
    id: draft.id,
    title: draft.title,
    status: draft.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    sourceRefs: draft.sourceRefs ?? [],
  };

  if (isDenseKind(draft.kind)) {
    return {
      ...base,
      kind: draft.kind,
      workspacePath: draft.workspacePath as string,
      hypothesis: draft.hypothesis,
      successMetrics: draft.successMetrics,
      outcome: draft.outcome,
      resolution: draft.resolution,
      severity: draft.severity,
    };
  }

  return {
    ...base,
    kind: draft.kind,
  };
}

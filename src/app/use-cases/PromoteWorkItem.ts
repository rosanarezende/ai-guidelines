import { GovernancePolicies, PromotionInput } from "../../domain/policy/GovernancePolicies.js";
import { GovernanceError } from "../../domain/shared/errors.js";
import { WorkItemId } from "../../domain/shared/types.js";
import { isDenseKind, WorkItem } from "../../domain/work-item/WorkItem.js";
import { Clock } from "../ports/Clock.js";
import { RegistryStore } from "../ports/RegistryStore.js";
import { WorkspaceStore } from "../ports/WorkspaceStore.js";

export interface PromoteWorkItemDeps {
  readonly policy: GovernancePolicies;
  readonly registry: RegistryStore;
  readonly workspace: WorkspaceStore;
  readonly clock: Clock;
}

export interface PromoteWorkItemInput {
  readonly id: WorkItemId;
  readonly target: PromotionInput["target"];
  readonly workspacePath?: string;
}

export class PromoteWorkItem {
  constructor(private readonly deps: PromoteWorkItemDeps) {}

  execute(input: PromoteWorkItemInput): WorkItem {
    const { policy, registry, workspace, clock } = this.deps;
    const current = registry.find(input.id);
    if (!current) {
      throw new GovernanceError(
        "REGISTRY_NOT_FOUND",
        `Item com id '${input.id}' não existe no registry.`
      );
    }

    const patch = policy.promote(current, {
      target: input.target,
      workspacePath: input.workspacePath,
    });

    let workspaceCreated = false;
    if (
      patch.kind &&
      isDenseKind(patch.kind) &&
      patch.workspacePath &&
      !workspace.exists(patch.workspacePath)
    ) {
      workspace.createWorkspace(patch.workspacePath);
      workspaceCreated = true;
    }

    try {
      return registry.update(input.id, patch, clock.nowIso());
    } catch (err) {
      if (workspaceCreated && patch.workspacePath) {
        workspace.removeWorkspace(patch.workspacePath);
      }
      throw err;
    }
  }
}

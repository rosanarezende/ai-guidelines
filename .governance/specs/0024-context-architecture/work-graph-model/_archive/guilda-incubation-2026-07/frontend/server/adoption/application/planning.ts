import type { PlanningTargetRequest } from "@demo/contracts";
import { dispatchForWorkspace, type UseCaseResult } from "./use-cases";
import type { Workspace } from "@demo/domain";

export async function savePlanningTarget(input: {
  principalId: string;
  workspaceId: string;
  target: PlanningTargetRequest;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace("local.planning.save", input.principalId, input.workspaceId, {
    target: {
      id: input.target.metricId,
      objectiveTitle: input.target.objectiveTitle,
      metricId: input.target.metricId,
      targetValue: input.target.targetValue,
      cycle: input.target.cycle,
    },
  });
}

import type { IntakeInitiativeRequest } from "@demo/contracts";
import type { Workspace } from "@demo/domain";
import { dispatchForWorkspace, type UseCaseResult } from "./use-cases";

export async function registerIntakeInitiative(input: {
  principalId: string;
  workspaceId: string;
  initiative: IntakeInitiativeRequest;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace("local.intake.register", input.principalId, input.workspaceId, {
    initiative: input.initiative,
  });
}

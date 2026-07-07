import type { TriageConfirmRequest } from "@demo/contracts";
import type { Workspace } from "@demo/domain";
import { dispatchForWorkspace, type UseCaseResult } from "./use-cases";

export async function confirmTriageDecision(input: {
  principalId: string;
  workspaceId: string;
  decision: TriageConfirmRequest;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace("local.triage.confirm", input.principalId, input.workspaceId, {
    decision: input.decision,
  });
}

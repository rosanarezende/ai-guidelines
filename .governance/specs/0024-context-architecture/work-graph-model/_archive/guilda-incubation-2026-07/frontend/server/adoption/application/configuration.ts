// configuration.ts — use cases de configuração persistida do onboarding (R1).
// Perfil, regra de acúmulo sensível, caminho do onboarding, workspace-mode,
// stack (execution/store/graph-read-model/identity) e status de integração.
import { stackCompatibilityWarnings, type Workspace, type WorkspaceStack } from "@demo/domain";
import { dispatchForWorkspace, type UseCaseResult } from "./use-cases";

export async function saveProfileDeclaration(input: {
  principalId: string;
  workspaceId: string;
  profile: unknown;
  sensitiveAccumulationPolicy: unknown;
  reason?: unknown;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace("local.profile.save", input.principalId, input.workspaceId, {
    profile: input.profile,
    sensitiveAccumulationPolicy: input.sensitiveAccumulationPolicy,
    reason: typeof input.reason === "string" ? input.reason : "",
  });
}

export async function setOnboardingPath(input: {
  principalId: string;
  workspaceId: string;
  path: unknown;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace("local.onboarding.set-path", input.principalId, input.workspaceId, {
    path: input.path,
  });
}

export async function saveWorkspaceMode(input: {
  principalId: string;
  workspaceId: string;
  mode: unknown;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace("local.workspace-mode.save", input.principalId, input.workspaceId, {
    mode: input.mode,
  });
}

export type StackSaveResult = { workspace: Workspace; warnings: string[] };

export async function saveWorkspaceStack(input: {
  principalId: string;
  workspaceId: string;
  stack: Partial<WorkspaceStack>;
}): Promise<UseCaseResult<StackSaveResult>> {
  const result = await dispatchForWorkspace(
    "local.workspace-stack.save",
    input.principalId,
    input.workspaceId,
    { stack: input.stack }
  );
  if (!result.ok) return result;
  const workspace = result.value;
  const warnings = workspace.stack
    ? stackCompatibilityWarnings(workspace.mode || "local", workspace.stack)
    : [];
  return { ok: true, value: { workspace, warnings } };
}

export async function setIntegrationStatus(input: {
  principalId: string;
  workspaceId: string;
  integrationId: string;
  status: unknown;
  note?: unknown;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace(
    "local.integration.set-status",
    input.principalId,
    input.workspaceId,
    {
      integrationId: input.integrationId,
      status: input.status,
      ...(typeof input.note === "string" && input.note ? { note: input.note } : {}),
    }
  );
}

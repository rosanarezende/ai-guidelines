// use-cases.ts — application layer of the local adoption shell.
//
// Cada caso de uso monta um LocalShellCommand (id/issuedAt/payload completos) e
// despacha pela porta de store (file-first, mock-api ou demo). A transição de
// estado mora no reducer PURO do domínio (applyShellCommand) — mesma semântica
// em todas as fontes de dados. A sessão (cookie) é da camada de interface.
import { randomUUID } from "node:crypto";
import {
  normalizeWorkspace,
  validDisplayName,
  validWorkspaceName,
  workspaceSlugId,
  DEMO_WORKSPACE_ID,
  type AdoptionState,
  type LocalAccount,
  type LocalShellCommand,
  type LocalShellCommandType,
  type OnboardingStatus,
  type Workspace,
  type WorkspaceKind,
} from "@demo/domain";
import { shellStore, type DispatchResult } from "../infrastructure/store";

export type UseCaseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const CREATABLE_KINDS: WorkspaceKind[] = ["company", "personal", "client"];

export function newShellCommand(
  type: LocalShellCommandType,
  principalId: string | undefined,
  payload: Record<string, unknown>
): LocalShellCommand {
  return {
    id: `cmd-${randomUUID()}`,
    type,
    issuedAt: new Date().toISOString(),
    ...(principalId ? { principalId } : {}),
    payload,
  };
}

export async function readShellState(): Promise<AdoptionState> {
  return shellStore().load();
}

export async function dispatchShellCommand(command: LocalShellCommand): Promise<DispatchResult> {
  return shellStore().dispatch(command);
}

// Despacha e devolve o workspace atualizado (padrão dos use cases de config).
export async function dispatchForWorkspace(
  type: LocalShellCommandType,
  principalId: string,
  workspaceId: string,
  payload: Record<string, unknown>
): Promise<UseCaseResult<Workspace>> {
  const result = await dispatchShellCommand(
    newShellCommand(type, principalId, { workspaceId, ...payload })
  );
  if (!result.ok) return result;
  const workspace = result.state.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return { ok: false, error: "unknown-workspace" };
  return { ok: true, value: normalizeWorkspace(workspace) };
}

export async function signupLocalPrincipal(input: {
  displayName: unknown;
  email?: unknown;
}): Promise<UseCaseResult<LocalAccount>> {
  if (!validDisplayName(input.displayName)) return { ok: false, error: "invalid-display-name" };
  const email =
    typeof input.email === "string" && input.email.trim() ? input.email.trim() : undefined;
  const principal: LocalAccount = {
    id: `local-${randomUUID()}`,
    displayName: String(input.displayName).trim(),
    ...(email ? { email } : {}),
    preferredLocale: "pt-br",
  };
  const result = await dispatchShellCommand(
    newShellCommand("local.principal.create", principal.id, { principal })
  );
  return result.ok ? { ok: true, value: principal } : result;
}

export async function createWorkspace(input: {
  principalId: string;
  name: unknown;
  kind: unknown;
}): Promise<UseCaseResult<Workspace>> {
  if (!validWorkspaceName(input.name)) return { ok: false, error: "invalid-workspace-name" };
  const kind = CREATABLE_KINDS.find((item) => item === input.kind);
  if (!kind) return { ok: false, error: "invalid-workspace-kind" };
  const state = await readShellState();
  const workspaceId = workspaceSlugId(
    String(input.name),
    state.workspaces.map((workspace) => workspace.id)
  );
  const result = await dispatchShellCommand(
    newShellCommand("local.workspace.create", input.principalId, {
      workspaceId,
      name: input.name,
      kind,
    })
  );
  if (!result.ok) return result;
  const created = result.state.workspaces.find((item) => item.id === workspaceId);
  if (!created) return { ok: false, error: "workspace-not-created" };
  return { ok: true, value: normalizeWorkspace(created) };
}

export async function attachDemoWorkspace(input: {
  principalId: string;
  companyName: string;
}): Promise<UseCaseResult<Workspace>> {
  const result = await dispatchShellCommand(
    newShellCommand("local.workspace.attach-demo", input.principalId, {
      company: input.companyName,
    })
  );
  if (!result.ok) return result;
  const attached = result.state.workspaces.find((item) => item.id === DEMO_WORKSPACE_ID);
  if (!attached) return { ok: false, error: "demo-not-attached" };
  return { ok: true, value: normalizeWorkspace(attached) };
}

export async function selectWorkspace(input: {
  principalId: string;
  workspaceId: string;
}): Promise<UseCaseResult<Workspace>> {
  const result = await dispatchShellCommand(
    newShellCommand("local.workspace.select", input.principalId, {
      workspaceId: input.workspaceId,
    })
  );
  if (!result.ok) return result;
  const workspace = result.state.workspaces.find((item) => item.id === input.workspaceId);
  if (!workspace) return { ok: false, error: "unknown-workspace" };
  return { ok: true, value: normalizeWorkspace(workspace) };
}

export async function setOnboardingStatus(input: {
  principalId: string;
  workspaceId: string;
  status: OnboardingStatus;
  step?: number;
}): Promise<UseCaseResult<Workspace>> {
  if (!["partial", "finished"].includes(input.status)) {
    return { ok: false, error: "invalid-status" };
  }
  if (
    input.step !== undefined &&
    (!Number.isInteger(input.step) || input.step < 0 || input.step > 6)
  ) {
    return { ok: false, error: "invalid-onboarding-step" };
  }
  return dispatchForWorkspace("local.onboarding.set-status", input.principalId, input.workspaceId, {
    status: input.status,
    ...(input.step !== undefined ? { step: input.step } : {}),
  });
}

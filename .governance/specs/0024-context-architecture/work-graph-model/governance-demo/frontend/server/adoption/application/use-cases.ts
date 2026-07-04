// use-cases.ts — application layer of the local adoption shell.
//
// Pure orchestration over the backend domain (adoption-shell) and the file
// state store. Não toca Next/React/MUI. Cada caso de uso é um comando com id,
// registrado no event-log local; a sessão (cookie) é responsabilidade da
// camada de interface.
import { randomUUID } from "node:crypto";
import {
  buildDemoWorkspace,
  buildEmptyWorkspace,
  principalCanAccessWorkspace,
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
} from "@demo/backend/domain";
import { applyLocalShellCommand, loadAdoptionState } from "../infrastructure/file-state-store";

export type UseCaseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const CREATABLE_KINDS: WorkspaceKind[] = ["company", "personal", "client"];

function command(
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

export function readShellState(): AdoptionState {
  return loadAdoptionState();
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
  const result = await applyLocalShellCommand(
    command("local.principal.create", principal.id, { displayName: principal.displayName }),
    (state) => ({ ...state, principals: [...state.principals, principal] })
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
  let created: Workspace | null = null;
  const result = await applyLocalShellCommand(
    command("local.workspace.create", input.principalId, { name: input.name, kind }),
    (state) => {
      if (!state.principals.some((principal) => principal.id === input.principalId)) {
        return { error: "unknown-principal" };
      }
      const id = workspaceSlugId(
        String(input.name),
        state.workspaces.map((workspace) => workspace.id)
      );
      created = buildEmptyWorkspace(id, String(input.name), kind);
      return {
        ...state,
        workspaces: [...state.workspaces, created],
        memberships: [
          ...state.memberships,
          { principalId: input.principalId, workspaceId: id, roles: ["admin"] },
        ],
      };
    }
  );
  if (!result.ok) return result;
  if (!created) return { ok: false, error: "workspace-not-created" };
  return { ok: true, value: created };
}

export async function attachDemoWorkspace(input: {
  principalId: string;
  companyName: string;
}): Promise<UseCaseResult<Workspace>> {
  let attached: Workspace | null = null;
  const result = await applyLocalShellCommand(
    command("local.workspace.attach-demo", input.principalId, { company: input.companyName }),
    (state) => {
      if (!state.principals.some((principal) => principal.id === input.principalId)) {
        return { error: "unknown-principal" };
      }
      const existing = state.workspaces.find((workspace) => workspace.id === DEMO_WORKSPACE_ID);
      attached = existing || buildDemoWorkspace(input.companyName);
      const workspaces = existing ? state.workspaces : [...state.workspaces, attached];
      const hasMembership = principalCanAccessWorkspace(
        state,
        input.principalId,
        DEMO_WORKSPACE_ID
      );
      return {
        ...state,
        workspaces,
        memberships: hasMembership
          ? state.memberships
          : [
              ...state.memberships,
              { principalId: input.principalId, workspaceId: DEMO_WORKSPACE_ID, roles: ["admin"] },
            ],
      };
    }
  );
  if (!result.ok) return result;
  if (!attached) return { ok: false, error: "demo-not-attached" };
  return { ok: true, value: attached };
}

export async function selectWorkspace(input: {
  principalId: string;
  workspaceId: string;
}): Promise<UseCaseResult<Workspace>> {
  const state = loadAdoptionState();
  if (!principalCanAccessWorkspace(state, input.principalId, input.workspaceId)) {
    return { ok: false, error: "not-a-member" };
  }
  const workspace = state.workspaces.find((item) => item.id === input.workspaceId);
  if (!workspace) return { ok: false, error: "unknown-workspace" };
  const result = await applyLocalShellCommand(
    command("local.workspace.select", input.principalId, { workspaceId: input.workspaceId }),
    (current) => current
  );
  return result.ok ? { ok: true, value: workspace } : result;
}

export async function setOnboardingStatus(input: {
  principalId: string;
  workspaceId: string;
  status: OnboardingStatus;
}): Promise<UseCaseResult<Workspace>> {
  if (!["partial", "finished"].includes(input.status)) {
    return { ok: false, error: "invalid-status" };
  }
  let updated: Workspace | null = null;
  const result = await applyLocalShellCommand(
    command("local.onboarding.set-status", input.principalId, {
      workspaceId: input.workspaceId,
      status: input.status,
    }),
    (state) => {
      if (!principalCanAccessWorkspace(state, input.principalId, input.workspaceId)) {
        return { error: "not-a-member" };
      }
      const workspace = state.workspaces.find((item) => item.id === input.workspaceId);
      if (!workspace) return { error: "unknown-workspace" };
      if (workspace.onboardingStatus === "finished" && input.status === "partial") {
        updated = workspace;
        return state;
      }
      updated = { ...workspace, onboardingStatus: input.status };
      return {
        ...state,
        workspaces: state.workspaces.map((item) =>
          item.id === input.workspaceId ? (updated as Workspace) : item
        ),
      };
    }
  );
  if (!result.ok) return result;
  if (!updated) return { ok: false, error: "unknown-workspace" };
  return { ok: true, value: updated };
}

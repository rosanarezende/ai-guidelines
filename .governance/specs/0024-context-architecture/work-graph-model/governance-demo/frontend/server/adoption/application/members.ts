// members.ts — pessoas, grupos/times, convites, papéis e authority derivada (R1).
// Convite local: token gerado aqui, status pending, expiração e revogação
// (QRD-19). Papel para OUTRA pessoa nasce proposed; authority nunca é gravada.
import { randomUUID } from "node:crypto";
import {
  detectSensitiveAccumulation,
  normalizeWorkspace,
  principalPersonId,
  resolveWorkspaceAuthority,
  type AuthorityGrant,
  type SubjectRef,
  type Workspace,
  type WorkspaceInvite,
  type WorkspaceRoleId,
} from "@demo/backend/domain";
import {
  dispatchForWorkspace,
  dispatchShellCommand,
  newShellCommand,
  readShellState,
  type UseCaseResult,
} from "./use-cases";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type MembersOverview = {
  people: Workspace["people"];
  groups: Workspace["groups"];
  serviceAccounts: Workspace["serviceAccounts"];
  invites: Array<Omit<WorkspaceInvite, "token">>;
  roleAssignments: Workspace["roleAssignments"];
  authority: AuthorityGrant[];
  sensitiveAccumulations: Array<{ personId: string; roles: WorkspaceRoleId[] }>;
};

export async function membersOverview(workspaceId: string): Promise<MembersOverview | null> {
  const state = await readShellState();
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return null;
  const ws = normalizeWorkspace(workspace);
  return {
    people: ws.people,
    groups: ws.groups,
    serviceAccounts: ws.serviceAccounts,
    // o token NÃO sai na listagem: ele é o segredo do convite
    invites: ws.invites.map(({ token: _token, ...invite }) => invite),
    roleAssignments: ws.roleAssignments,
    authority: resolveWorkspaceAuthority(ws),
    sensitiveAccumulations: detectSensitiveAccumulation(ws),
  };
}

export async function invitePerson(input: {
  principalId: string;
  workspaceId: string;
  personName: unknown;
  email?: unknown;
}): Promise<UseCaseResult<WorkspaceInvite>> {
  const now = new Date().getTime();
  const invite: WorkspaceInvite = {
    id: `inv-${randomUUID()}`,
    personName: typeof input.personName === "string" ? input.personName.trim() : "",
    ...(typeof input.email === "string" && input.email.trim() ? { email: input.email.trim() } : {}),
    token: randomUUID().replaceAll("-", ""),
    status: "pending",
    invitedBy: input.principalId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + INVITE_TTL_MS).toISOString(),
  };
  const result = await dispatchForWorkspace(
    "local.member.invite",
    input.principalId,
    input.workspaceId,
    { invite }
  );
  // devolve o convite COM token uma única vez (quem convida repassa o código)
  return result.ok ? { ok: true, value: invite } : result;
}

export async function decideInvite(input: {
  principalId: string;
  workspaceId?: string;
  inviteId: string;
  action: "accept" | "decline" | "revoke";
  token?: unknown;
}): Promise<UseCaseResult<Workspace>> {
  const type =
    input.action === "accept"
      ? "local.invite.accept"
      : input.action === "decline"
        ? "local.invite.decline"
        : "local.invite.revoke";
  const state = await readShellState();
  const workspaceId =
    input.workspaceId ||
    state.workspaces.find((workspace) =>
      normalizeWorkspace(workspace).invites.some(
        (invite) =>
          invite.id === input.inviteId &&
          typeof input.token === "string" &&
          invite.token === input.token
      )
    )?.id;
  if (!workspaceId) return { ok: false, error: "unknown-invite" };
  const result = await dispatchShellCommand(
    newShellCommand(type, input.principalId, {
      workspaceId,
      inviteId: input.inviteId,
      ...(typeof input.token === "string" ? { token: input.token } : {}),
      ...(input.action === "accept" ? { personId: `person-${randomUUID()}` } : {}),
    })
  );
  if (!result.ok) return result;
  const workspace = result.state.workspaces.find((item) => item.id === workspaceId);
  return workspace
    ? { ok: true, value: normalizeWorkspace(workspace) }
    : { ok: false, error: "unknown-workspace" };
}

export async function createGroup(input: {
  principalId: string;
  workspaceId: string;
  kind: unknown;
  name: unknown;
  memberPersonIds?: unknown;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace("local.group.create", input.principalId, input.workspaceId, {
    group: {
      id: `grp-${randomUUID()}`,
      kind: input.kind,
      name: input.name,
      memberPersonIds: Array.isArray(input.memberPersonIds) ? input.memberPersonIds : [],
      managedBy: "local",
    },
  });
}

export async function assignRole(input: {
  principalId: string;
  workspaceId: string;
  subject: SubjectRef;
  roleId: unknown;
  reason?: unknown;
}): Promise<UseCaseResult<Workspace>> {
  const state = await readShellState();
  const actorPersonId = principalPersonId(state, input.principalId, input.workspaceId);
  return dispatchForWorkspace("local.role.assign", input.principalId, input.workspaceId, {
    assignment: {
      id: `role-${randomUUID()}`,
      subject: input.subject,
      roleId: input.roleId,
      status: "proposed",
      proposedBy: input.principalId,
      proposedAt: new Date().toISOString(),
      ...(typeof input.reason === "string" && input.reason ? { reason: input.reason } : {}),
    },
    ...(actorPersonId ? { actorPersonId } : {}),
  });
}

export async function decideRole(input: {
  principalId: string;
  workspaceId: string;
  assignmentId: string;
  action: "accept" | "reject" | "revoke";
  reason?: unknown;
}): Promise<UseCaseResult<Workspace>> {
  const type =
    input.action === "accept"
      ? "local.role.accept"
      : input.action === "reject"
        ? "local.role.reject"
        : "local.role.revoke";
  return dispatchForWorkspace(type, input.principalId, input.workspaceId, {
    assignmentId: input.assignmentId,
    ...(typeof input.reason === "string" && input.reason ? { reason: input.reason } : {}),
  });
}

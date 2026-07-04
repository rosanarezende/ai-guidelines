// adoption-authorization.test.ts — falsificação R1.1 do shell de adoção.
// O teste usa o mesmo executor autorizado que backend real e mock-api usam.
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAuthorizedShellCommand,
  defaultWorkspaceStack,
  emptyAdoptionState,
  principalCanAccessWorkspace,
  principalPersonId,
  resolveWorkspaceAuthority,
} from "../src/domain/index.ts";
import type {
  AdoptionState,
  LocalShellCommand,
  LocalShellCommandType,
  Workspace,
} from "../src/domain/index.ts";

function command(
  type: LocalShellCommandType,
  principalId: string | undefined,
  payload: Record<string, unknown>,
  id: string
): LocalShellCommand {
  return {
    id,
    type,
    principalId,
    issuedAt: "2026-07-04T12:00:00.000Z",
    payload,
  };
}

function apply(
  state: AdoptionState,
  type: LocalShellCommandType,
  principalId: string | undefined,
  payload: Record<string, unknown>,
  id: string
): AdoptionState {
  const result = applyAuthorizedShellCommand(state, command(type, principalId, payload, id));
  if (!result.ok) throw new Error(`${type}: ${result.error}`);
  return result.state;
}

function tryApply(
  state: AdoptionState,
  type: LocalShellCommandType,
  principalId: string | undefined,
  payload: Record<string, unknown>,
  id: string
) {
  return applyAuthorizedShellCommand(state, command(type, principalId, payload, id));
}

function workspace(state: AdoptionState): Workspace {
  const found = state.workspaces.find((item) => item.id === "acme-honey");
  if (!found) throw new Error("workspace acme-honey não encontrado");
  return found;
}

function baseState(): AdoptionState {
  let state = emptyAdoptionState();
  state = apply(
    state,
    "local.principal.create",
    undefined,
    { principal: { id: "local-ana", displayName: "Ana Admin", preferredLocale: "pt-br" } },
    "cmd-principal-ana"
  );
  state = apply(
    state,
    "local.workspace.create",
    "local-ana",
    { workspaceId: "acme-honey", name: "Acme Honey", kind: "company" },
    "cmd-workspace"
  );
  return state;
}

function stateWithInvitedMember(): AdoptionState {
  let state = baseState();
  state = apply(
    state,
    "local.principal.create",
    undefined,
    { principal: { id: "local-bia", displayName: "Bia Member", preferredLocale: "pt-br" } },
    "cmd-principal-bia"
  );
  state = apply(
    state,
    "local.member.invite",
    "local-ana",
    {
      workspaceId: "acme-honey",
      invite: {
        id: "inv-bia",
        personName: "Bia Member",
        email: "bia@example.test",
        token: "token-bia",
        status: "pending",
        invitedBy: "local-ana",
        createdAt: "2026-07-04T12:00:00.000Z",
        expiresAt: "2026-07-11T12:00:00.000Z",
      },
    },
    "cmd-invite-bia"
  );
  state = apply(
    state,
    "local.invite.accept",
    "local-bia",
    {
      workspaceId: "acme-honey",
      inviteId: "inv-bia",
      token: "token-bia",
      personId: "person-bia",
    },
    "cmd-accept-bia"
  );
  return state;
}

test("convite aceito cria membership real para o principal convidado", () => {
  const state = stateWithInvitedMember();
  assert.equal(principalCanAccessWorkspace(state, "local-bia", "acme-honey"), true);
  assert.equal(principalPersonId(state, "local-bia", "acme-honey"), "person-bia");
  assert.equal(
    workspace(state).people.some((person) => person.id === "person-bia"),
    true
  );
});

test("membro sem authority não altera configuração sensível do workspace", () => {
  const state = stateWithInvitedMember();
  const result = tryApply(
    state,
    "local.profile.save",
    "local-bia",
    {
      workspaceId: "acme-honey",
      profile: "full",
      sensitiveAccumulationPolicy: "block",
      reason: "tentativa não autorizada",
    },
    "cmd-bia-profile"
  );
  assert.deepEqual(result, { ok: false, error: "missing-authority" });
});

test("actorPersonId forjado não transforma papel em self-assigned", () => {
  const state = stateWithInvitedMember();
  const result = tryApply(
    state,
    "local.role.assign",
    "local-ana",
    {
      workspaceId: "acme-honey",
      actorPersonId: "person-bia",
      assignment: {
        id: "role-bia-security",
        subject: { kind: "person", id: "person-bia" },
        roleId: "security-owner",
        status: "proposed",
        proposedBy: "local-ana",
        proposedAt: "2026-07-04T12:00:00.000Z",
      },
    },
    "cmd-spoof-actor"
  );
  assert.deepEqual(result, { ok: false, error: "actor-person-mismatch" });
});

test("papel atribuído a outra pessoa fica proposed e só o sujeito aceita", () => {
  let state = stateWithInvitedMember();
  const anaPersonId = principalPersonId(state, "local-ana", "acme-honey");
  state = apply(
    state,
    "local.role.assign",
    "local-ana",
    {
      workspaceId: "acme-honey",
      actorPersonId: anaPersonId,
      assignment: {
        id: "role-bia-source",
        subject: { kind: "person", id: "person-bia" },
        roleId: "source-owner",
        status: "proposed",
        proposedBy: "local-ana",
        proposedAt: "2026-07-04T12:00:00.000Z",
      },
    },
    "cmd-propose-role"
  );
  assert.equal(workspace(state).roleAssignments[0]?.status, "proposed");
  assert.equal(resolveWorkspaceAuthority(workspace(state)).length, 0);

  const wrongSubject = tryApply(
    state,
    "local.role.accept",
    "local-ana",
    { workspaceId: "acme-honey", assignmentId: "role-bia-source" },
    "cmd-wrong-accept"
  );
  assert.deepEqual(wrongSubject, { ok: false, error: "subject-only" });

  state = apply(
    state,
    "local.role.accept",
    "local-bia",
    { workspaceId: "acme-honey", assignmentId: "role-bia-source" },
    "cmd-bia-accept"
  );
  assert.equal(workspace(state).roleAssignments[0]?.status, "accepted");
  assert.deepEqual(resolveWorkspaceAuthority(workspace(state)), [
    {
      personId: "person-bia",
      roleId: "source-owner",
      origin: "direct",
      assignmentId: "role-bia-source",
    },
  ]);
});

test("onboarding não finaliza sem host válido ou sandbox explícito", () => {
  let state = baseState();
  const denied = tryApply(
    state,
    "local.onboarding.set-status",
    "local-ana",
    { workspaceId: "acme-honey", status: "finished" },
    "cmd-finish-early"
  );
  assert.equal(denied.ok, false);
  assert.match(denied.error, /^onboarding-incomplete:/);

  state = apply(
    state,
    "local.profile.save",
    "local-ana",
    {
      workspaceId: "acme-honey",
      profile: "solo",
      sensitiveAccumulationPolicy: "record",
      reason: "dogfood solo",
    },
    "cmd-profile"
  );
  state = apply(
    state,
    "local.workspace-mode.save",
    "local-ana",
    { workspaceId: "acme-honey", mode: "local" },
    "cmd-mode"
  );
  state = apply(
    state,
    "local.workspace-stack.save",
    "local-ana",
    { workspaceId: "acme-honey", stack: defaultWorkspaceStack() },
    "cmd-stack"
  );
  state = apply(
    state,
    "local.sandbox.declare",
    "local-ana",
    { workspaceId: "acme-honey" },
    "cmd-sandbox"
  );
  state = apply(
    state,
    "local.onboarding.set-status",
    "local-ana",
    { workspaceId: "acme-honey", status: "finished" },
    "cmd-finish"
  );
  assert.equal(workspace(state).onboardingStatus, "finished");
});

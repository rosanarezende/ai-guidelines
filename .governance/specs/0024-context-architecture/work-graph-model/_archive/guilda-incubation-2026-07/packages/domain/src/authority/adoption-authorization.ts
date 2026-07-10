// adoption-authorization.ts — policy kernel for the local adoption shell.
//
// Routes and mock-api must not call the reducer directly. This module resolves
// principal -> workspace -> person -> effective authority, checks the action,
// then applies the pure reducer. The result is still deterministic and shared
// by the real file store and the mock API.
import {
  canCompleteOnboarding,
  normalizeWorkspace,
  principalCanAccessWorkspace,
  principalHasAnyWorkspaceRole,
  principalMembershipForWorkspace,
  principalPersonId,
  roleIsSensitive,
  WORKSPACE_ROLE_IDS,
  type AdoptionState,
  type LocalShellCommand,
  type LocalShellCommandType,
  type RoleAssignment,
  type WorkspaceRoleId,
} from "../workspace/adoption-shell.ts";
import { applyShellCommand, type ShellReduceResult } from "../onboarding/adoption-commands.ts";

export type AuthorizationDecision = { ok: true } | { ok: false; error: string };

const CONFIG_ROLES: WorkspaceRoleId[] = ["workspace-admin", "sponsor", "security-owner"];
const MEMBERSHIP_ROLES: WorkspaceRoleId[] = ["workspace-admin", "sponsor", "security-owner"];
const ROLE_MANAGEMENT_ROLES: WorkspaceRoleId[] = ["workspace-admin", "sponsor", "security-owner"];
const HOST_ROLES: WorkspaceRoleId[] = ["workspace-admin", "technical-owner", "security-owner"];
const SOURCE_ROLES: WorkspaceRoleId[] = ["workspace-admin", "technical-owner", "source-owner"];
const PLANNING_ROLES: WorkspaceRoleId[] = ["workspace-admin", "sponsor", "target-definer"];
const INTAKE_ROLES: WorkspaceRoleId[] = [
  "workspace-admin",
  "sponsor",
  "technical-owner",
  "source-owner",
];
const TRIAGE_ROLES: WorkspaceRoleId[] = ["workspace-admin", "technical-owner", "source-owner"];
const ASSISTANT_ROLES: WorkspaceRoleId[] = ["workspace-admin", "security-owner", "technical-owner"];
const INTEGRATION_ROLES: WorkspaceRoleId[] = [
  "workspace-admin",
  "security-owner",
  "technical-owner",
  "source-owner",
];

function text(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function commandWorkspaceId(command: LocalShellCommand): string | undefined {
  return text(command.payload || {}, "workspaceId");
}

function principalExists(state: AdoptionState, command: LocalShellCommand): AuthorizationDecision {
  if (!command.principalId) return { ok: false, error: "missing-principal" };
  if (!state.principals.some((principal) => principal.id === command.principalId)) {
    return { ok: false, error: "unknown-principal" };
  }
  return { ok: true };
}

function requireMember(
  state: AdoptionState,
  command: LocalShellCommand,
  workspaceId: string
): AuthorizationDecision {
  const principal = principalExists(state, command);
  if (!principal.ok) return principal;
  if (!principalCanAccessWorkspace(state, command.principalId!, workspaceId)) {
    return { ok: false, error: "not-a-member" };
  }
  return { ok: true };
}

function requireAuthority(
  state: AdoptionState,
  command: LocalShellCommand,
  workspaceId: string,
  roleIds: WorkspaceRoleId[],
  error = "missing-authority"
): AuthorizationDecision {
  const member = requireMember(state, command, workspaceId);
  if (!member.ok) return member;
  if (!principalHasAnyWorkspaceRole(state, command.principalId!, workspaceId, roleIds)) {
    return { ok: false, error };
  }
  return { ok: true };
}

function assignmentFor(
  state: AdoptionState,
  workspaceId: string,
  assignmentId: string | undefined
): RoleAssignment | undefined {
  if (!assignmentId) return undefined;
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  return normalizeWorkspace(workspace || ({} as never)).roleAssignments.find(
    (assignment) => assignment.id === assignmentId
  );
}

function authorizeRoleAssign(
  state: AdoptionState,
  command: LocalShellCommand,
  workspaceId: string
): AuthorizationDecision {
  const assignment = command.payload["assignment"] as RoleAssignment | undefined;
  if (!assignment?.roleId || !WORKSPACE_ROLE_IDS.includes(assignment.roleId)) {
    return { ok: false, error: "invalid-role" };
  }
  const actorPersonId = text(command.payload, "actorPersonId");
  const resolvedActor = principalPersonId(state, command.principalId || "", workspaceId);
  if (actorPersonId && actorPersonId !== resolvedActor) {
    return { ok: false, error: "actor-person-mismatch" };
  }
  const isSelf = assignment.subject?.kind === "person" && assignment.subject.id === resolvedActor;
  if (isSelf) {
    const workspace = state.workspaces.find((item) => item.id === workspaceId);
    const profile = workspace?.profileDeclaration?.profile;
    if (profile === "full" && roleIsSensitive(assignment.roleId)) {
      return { ok: false, error: "sensitive-self-assignment-blocked" };
    }
    return requireMember(state, command, workspaceId);
  }
  return requireAuthority(
    state,
    command,
    workspaceId,
    ROLE_MANAGEMENT_ROLES,
    "missing-role-manager"
  );
}

function authorizeRoleDecision(
  state: AdoptionState,
  command: LocalShellCommand,
  workspaceId: string
): AuthorizationDecision {
  const assignment = assignmentFor(state, workspaceId, text(command.payload, "assignmentId"));
  if (!assignment) return { ok: false, error: "unknown-assignment" };
  const actorPersonId = principalPersonId(state, command.principalId || "", workspaceId);
  const isSubject = assignment.subject.kind === "person" && assignment.subject.id === actorPersonId;
  if (command.type === "local.role.accept" || command.type === "local.role.reject") {
    if (isSubject) return requireMember(state, command, workspaceId);
    if (assignment.subject.kind === "team" || assignment.subject.kind === "group") {
      return requireAuthority(
        state,
        command,
        workspaceId,
        ROLE_MANAGEMENT_ROLES,
        "missing-group-role-manager"
      );
    }
    return { ok: false, error: "subject-only" };
  }
  if (isSubject) return requireMember(state, command, workspaceId);
  return requireAuthority(
    state,
    command,
    workspaceId,
    ROLE_MANAGEMENT_ROLES,
    "missing-role-manager"
  );
}

function authorizeInviteDecision(
  state: AdoptionState,
  command: LocalShellCommand,
  workspaceId: string
): AuthorizationDecision {
  if (command.type === "local.invite.revoke") {
    return requireAuthority(
      state,
      command,
      workspaceId,
      MEMBERSHIP_ROLES,
      "missing-membership-manager"
    );
  }
  const principal = principalExists(state, command);
  if (!principal.ok) return principal;
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  const inviteId = text(command.payload, "inviteId");
  const token = text(command.payload, "token");
  const invite = normalizeWorkspace(workspace || ({} as never)).invites.find(
    (item) => item.id === inviteId
  );
  if (!invite || !token || token !== invite.token)
    return { ok: false, error: "invalid-invite-token" };
  return { ok: true };
}

export function authorizeShellCommand(
  state: AdoptionState,
  command: LocalShellCommand
): AuthorizationDecision {
  if (!command?.id || !command.type) return { ok: false, error: "command-schema" };
  const workspaceId = commandWorkspaceId(command);

  switch (command.type as LocalShellCommandType) {
    case "local.principal.create":
      return { ok: true };

    case "local.workspace.create":
    case "local.workspace.attach-demo":
      return principalExists(state, command);

    case "local.workspace.select":
      return workspaceId
        ? requireMember(state, command, workspaceId)
        : { ok: false, error: "missing-workspace-id" };

    case "local.invite.accept":
    case "local.invite.decline":
    case "local.invite.revoke":
      return workspaceId
        ? authorizeInviteDecision(state, command, workspaceId)
        : { ok: false, error: "missing-workspace-id" };

    default:
      break;
  }

  if (!workspaceId) return { ok: false, error: "missing-workspace-id" };

  switch (command.type as LocalShellCommandType) {
    case "local.onboarding.set-path":
      return requireMember(state, command, workspaceId);

    case "local.onboarding.set-status": {
      const status = text(command.payload, "status");
      if (status !== "finished") return requireMember(state, command, workspaceId);
      const authority = requireAuthority(
        state,
        command,
        workspaceId,
        CONFIG_ROLES,
        "missing-onboarding-authority"
      );
      if (!authority.ok) return authority;
      const workspace = state.workspaces.find((item) => item.id === workspaceId);
      const completion = workspace
        ? canCompleteOnboarding(workspace)
        : { ok: false as const, blockers: ["unknown-workspace"] };
      if (completion.ok === false) {
        return {
          ok: false,
          error: `onboarding-incomplete:${completion.blockers.join(",")}`,
        };
      }
      return { ok: true };
    }

    case "local.profile.save":
    case "local.workspace-mode.save":
    case "local.workspace-stack.save":
      return requireAuthority(state, command, workspaceId, CONFIG_ROLES);

    case "local.planning.save":
      return requireAuthority(
        state,
        command,
        workspaceId,
        PLANNING_ROLES,
        "missing-target-manager"
      );

    case "local.intake.register":
      return requireAuthority(state, command, workspaceId, INTAKE_ROLES, "missing-intake-manager");

    case "local.triage.confirm":
      return requireAuthority(state, command, workspaceId, TRIAGE_ROLES, "missing-triage-manager");

    case "local.member.invite":
    case "local.group.create":
      return requireAuthority(
        state,
        command,
        workspaceId,
        MEMBERSHIP_ROLES,
        "missing-membership-manager"
      );

    case "local.role.assign":
      return authorizeRoleAssign(state, command, workspaceId);

    case "local.role.accept":
    case "local.role.reject":
    case "local.role.revoke":
      return authorizeRoleDecision(state, command, workspaceId);

    case "local.host.link":
    case "local.host.record-fit-check":
    case "local.sandbox.declare":
      return requireAuthority(state, command, workspaceId, HOST_ROLES, "missing-host-manager");

    case "local.work-source.add":
    case "local.work-source.record-scan":
      return requireAuthority(state, command, workspaceId, SOURCE_ROLES, "missing-source-manager");

    case "local.assistant.save-provider":
    case "local.assistant.set-default":
    case "local.assistant.dismiss":
      return requireAuthority(
        state,
        command,
        workspaceId,
        ASSISTANT_ROLES,
        "missing-assistant-manager"
      );

    case "local.integration.set-status":
      return requireAuthority(
        state,
        command,
        workspaceId,
        INTEGRATION_ROLES,
        "missing-integration-manager"
      );

    default:
      return { ok: false, error: `unknown-command-type:${command.type as string}` };
  }
}

export function applyAuthorizedShellCommand(
  state: AdoptionState,
  command: LocalShellCommand
): ShellReduceResult {
  const decision = authorizeShellCommand(state, command);
  if (decision.ok === false) return { ok: false, error: decision.error };
  return applyShellCommand(state, command);
}

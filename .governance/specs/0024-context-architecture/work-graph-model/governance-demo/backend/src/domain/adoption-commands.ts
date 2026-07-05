// adoption-commands.ts — reducer PURO dos comandos do shell local de adoção.
//
// Uma única função de transição de estado compartilhada por:
//   · backend real (file-first: lock + escrita atômica + event-log);
//   · mock-api (lowdb) — mesma semântica, persistência de desenvolvimento.
// Toda mutação local É um comando; ids/timestamps vêm no payload (o reducer é
// determinístico e valida fail-closed: comando desconhecido/inválido = erro).
import {
  buildDemoWorkspace,
  buildEmptyWorkspace,
  canCompleteOnboarding,
  defaultWorkspaceStack,
  deriveSourceTrust,
  normalizeWorkspace,
  principalCanAccessWorkspace,
  sourceTrustLimitations,
  validDisplayName,
  validWorkspaceName,
  ASSISTANT_FUNCTIONS,
  DEMO_WORKSPACE_ID,
  WORKSPACE_ROLE_IDS,
  type AdoptionState,
  type AssistantFunction,
  type AssistantProviderConfig,
  type GovernanceHost,
  type HostFitCheck,
  type LocalAccount,
  type LocalShellCommand,
  type RoleAssignment,
  type SubjectRef,
  type Workspace,
  type WorkspaceGroup,
  type WorkspaceInvite,
  type WorkspaceRoleId,
  type WorkSource,
  type WorkSourceScan,
} from "./adoption-shell.ts";

export type ShellReduceResult = { ok: true; state: AdoptionState } | { ok: false; error: string };

type Payload = Record<string, unknown>;

function err(error: string): ShellReduceResult {
  return { ok: false, error };
}

function text(payload: Payload, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function updateWorkspace(
  state: AdoptionState,
  workspaceId: string,
  update: (workspace: Workspace) => Workspace | { error: string }
): ShellReduceResult {
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return err("unknown-workspace");
  const next = update(normalizeWorkspace(workspace));
  if ("error" in next) return err(next.error);
  return {
    ok: true,
    state: {
      ...state,
      workspaces: state.workspaces.map((item) => (item.id === workspaceId ? next : item)),
    },
  };
}

function requireMember(
  state: AdoptionState,
  command: LocalShellCommand,
  workspaceId: string
): string | null {
  if (!command.principalId) return "missing-principal";
  if (!state.principals.some((principal) => principal.id === command.principalId))
    return "unknown-principal";
  if (!principalCanAccessWorkspace(state, command.principalId, workspaceId)) return "not-a-member";
  return null;
}

export function applyShellCommand(
  state: AdoptionState,
  command: LocalShellCommand
): ShellReduceResult {
  if (!command?.id || !command.type) return err("command-schema");
  const payload = command.payload || {};

  switch (command.type) {
    case "local.principal.create": {
      const principal = payload["principal"] as LocalAccount | undefined;
      if (!principal?.id || !validDisplayName(principal.displayName))
        return err("invalid-display-name");
      if (state.principals.some((item) => item.id === principal.id))
        return err("duplicate-principal");
      return { ok: true, state: { ...state, principals: [...state.principals, principal] } };
    }

    case "local.workspace.create": {
      const id = text(payload, "workspaceId");
      const name = payload["name"];
      const kind = text(payload, "kind") as Workspace["kind"] | undefined;
      if (!command.principalId || !state.principals.some((p) => p.id === command.principalId))
        return err("unknown-principal");
      if (!id) return err("missing-workspace-id");
      if (!validWorkspaceName(name)) return err("invalid-workspace-name");
      if (!kind || !["company", "personal", "client"].includes(kind))
        return err("invalid-workspace-kind");
      if (state.workspaces.some((workspace) => workspace.id === id))
        return err("duplicate-workspace");
      const principal = state.principals.find((item) => item.id === command.principalId);
      if (!principal) return err("unknown-principal");
      const personId = `person-${command.principalId}`;
      const workspace = {
        ...buildEmptyWorkspace(id, String(name), kind),
        people: [
          {
            id: personId,
            displayName: principal.displayName,
            ...(principal.email ? { email: principal.email } : {}),
          },
        ],
      };
      return {
        ok: true,
        state: {
          ...state,
          workspaces: [...state.workspaces, workspace],
          memberships: [
            ...state.memberships,
            {
              principalId: command.principalId,
              workspaceId: id,
              personId,
              roles: ["admin"],
              status: "active",
            },
          ],
        },
      };
    }

    case "local.workspace.attach-demo": {
      if (!command.principalId || !state.principals.some((p) => p.id === command.principalId))
        return err("unknown-principal");
      const existing = state.workspaces.find((workspace) => workspace.id === DEMO_WORKSPACE_ID);
      const workspaces = existing
        ? state.workspaces
        : [...state.workspaces, buildDemoWorkspace(text(payload, "company") || "Acme")];
      const hasMembership = principalCanAccessWorkspace(
        state,
        command.principalId,
        DEMO_WORKSPACE_ID
      );
      return {
        ok: true,
        state: {
          ...state,
          workspaces,
          memberships: hasMembership
            ? state.memberships
            : [
                ...state.memberships,
                {
                  principalId: command.principalId,
                  workspaceId: DEMO_WORKSPACE_ID,
                  roles: ["admin"],
                },
              ],
        },
      };
    }

    case "local.workspace.select": {
      const workspaceId = text(payload, "workspaceId");
      if (!workspaceId) return err("missing-workspace-id");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      // Seleção não muda estado compartilhado (sessão é da interface); o
      // comando existe para trilha/auditoria.
      return { ok: true, state };
    }

    case "local.onboarding.set-status": {
      const workspaceId = text(payload, "workspaceId");
      const status = text(payload, "status");
      const rawStep = payload["step"];
      const step = typeof rawStep === "number" ? Math.floor(rawStep) : undefined;
      if (!workspaceId) return err("missing-workspace-id");
      if (!status || !["partial", "finished"].includes(status)) return err("invalid-status");
      if (step !== undefined && (step < 0 || step > 6)) return err("invalid-onboarding-step");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        if (workspace.onboardingStatus === "finished" && status === "partial") return workspace;
        if (status === "finished") {
          const completion = canCompleteOnboarding(workspace);
          if (completion.ok === false) {
            return { error: `onboarding-incomplete:${completion.blockers[0]}` };
          }
        }
        return {
          ...workspace,
          onboardingStatus: status as Workspace["onboardingStatus"],
          ...(step !== undefined ? { onboardingStep: step } : {}),
        };
      });
    }

    case "local.onboarding.set-path": {
      const workspaceId = text(payload, "workspaceId");
      const path = text(payload, "path");
      if (!workspaceId) return err("missing-workspace-id");
      if (!path || !["guided", "advanced"].includes(path)) return err("invalid-onboarding-path");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => ({
        ...workspace,
        onboardingPath: path as Workspace["onboardingPath"],
      }));
    }

    case "local.profile.save": {
      const workspaceId = text(payload, "workspaceId");
      const profile = text(payload, "profile");
      const policy = text(payload, "sensitiveAccumulationPolicy");
      const reason = text(payload, "reason") || "";
      if (!workspaceId) return err("missing-workspace-id");
      if (!profile || !["full", "compact", "trio", "solo"].includes(profile))
        return err("invalid-profile");
      if (!policy || !["record", "warn-review", "block"].includes(policy))
        return err("invalid-accumulation-policy");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => ({
        ...workspace,
        profileDeclaration: {
          profile: profile as NonNullable<Workspace["profileDeclaration"]>["profile"],
          sensitiveAccumulationPolicy: policy as NonNullable<
            Workspace["profileDeclaration"]
          >["sensitiveAccumulationPolicy"],
          reason,
          savedAt: command.issuedAt,
        },
      }));
    }

    case "local.workspace-mode.save": {
      const workspaceId = text(payload, "workspaceId");
      const mode = text(payload, "mode");
      if (!workspaceId) return err("missing-workspace-id");
      if (!mode || !["local", "shared", "controlled"].includes(mode)) return err("invalid-mode");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => ({
        ...workspace,
        mode: mode as Workspace["mode"],
      }));
    }

    case "local.workspace-stack.save": {
      const workspaceId = text(payload, "workspaceId");
      if (!workspaceId) return err("missing-workspace-id");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      const patch = payload["stack"] as Partial<Workspace["stack"]> | undefined;
      if (!patch || typeof patch !== "object") return err("missing-stack");
      return updateWorkspace(state, workspaceId, (workspace) => {
        const current = workspace.stack || defaultWorkspaceStack();
        const next = { ...current, ...patch };
        if (!["local-process", "docker-compose", "self-hosted-server"].includes(next.executionMode))
          return { error: "invalid-execution-mode" };
        if (!["files", "sqlite", "postgres"].includes(next.operationalStore))
          return { error: "invalid-operational-store" };
        if (!["none", "file-export", "neo4j"].includes(next.graphReadModel?.kind || ""))
          return { error: "invalid-graph-read-model" };
        return { ...workspace, stack: next };
      });
    }

    case "local.member.invite": {
      const workspaceId = text(payload, "workspaceId");
      const invite = payload["invite"] as WorkspaceInvite | undefined;
      if (!workspaceId) return err("missing-workspace-id");
      if (!invite?.id || !validDisplayName(invite.personName) || !invite.token)
        return err("invalid-invite");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        if (workspace.invites.some((item) => item.id === invite.id))
          return { error: "duplicate-invite" };
        return { ...workspace, invites: [...workspace.invites, { ...invite, status: "pending" }] };
      });
    }

    case "local.invite.accept":
    case "local.invite.decline":
    case "local.invite.revoke": {
      const workspaceId = text(payload, "workspaceId");
      const inviteId = text(payload, "inviteId");
      if (!workspaceId || !inviteId) return err("missing-invite-ref");
      // accept/decline usam o TOKEN (o sujeito ainda não é membro);
      // revoke exige membro do workspace.
      if (command.type === "local.invite.revoke") {
        const membership = requireMember(state, command, workspaceId);
        if (membership) return err(membership);
      }
      const updated = updateWorkspace(state, workspaceId, (workspace) => {
        const invite = workspace.invites.find((item) => item.id === inviteId);
        if (!invite) return { error: "unknown-invite" };
        if (invite.status !== "pending") return { error: "invite-not-pending" };
        if (command.type !== "local.invite.revoke") {
          const token = text(payload, "token");
          if (!token || token !== invite.token) return { error: "invalid-invite-token" };
          if (invite.expiresAt && invite.expiresAt < command.issuedAt) {
            return {
              ...workspace,
              invites: workspace.invites.map((item) =>
                item.id === inviteId ? { ...item, status: "expired" } : item
              ),
            };
          }
        }
        if (command.type === "local.invite.accept") {
          const personId = text(payload, "personId");
          if (!personId) return { error: "missing-person-id" };
          const person = {
            id: personId,
            displayName: invite.personName,
            ...(invite.email ? { email: invite.email } : {}),
          };
          return {
            ...workspace,
            people: workspace.people.some((item) => item.id === personId)
              ? workspace.people
              : [...workspace.people, person],
            invites: workspace.invites.map((item) =>
              item.id === inviteId
                ? { ...item, status: "accepted", decidedAt: command.issuedAt, personId }
                : item
            ),
          };
        }
        const status = command.type === "local.invite.decline" ? "declined" : "revoked";
        return {
          ...workspace,
          invites: workspace.invites.map((item) =>
            item.id === inviteId ? { ...item, status, decidedAt: command.issuedAt } : item
          ),
        };
      });
      if (!updated.ok || command.type !== "local.invite.accept") return updated;
      const personId = text(payload, "personId");
      if (!command.principalId || !personId) return updated;
      const alreadyMember = updated.state.memberships.some(
        (membership) =>
          membership.principalId === command.principalId && membership.workspaceId === workspaceId
      );
      return {
        ok: true,
        state: {
          ...updated.state,
          memberships: alreadyMember
            ? updated.state.memberships.map((membership) =>
                membership.principalId === command.principalId &&
                membership.workspaceId === workspaceId
                  ? { ...membership, personId, status: "active" }
                  : membership
              )
            : [
                ...updated.state.memberships,
                {
                  principalId: command.principalId,
                  workspaceId,
                  personId,
                  roles: [],
                  status: "active",
                },
              ],
        },
      };
    }

    case "local.group.create": {
      const workspaceId = text(payload, "workspaceId");
      const group = payload["group"] as WorkspaceGroup | undefined;
      if (!workspaceId) return err("missing-workspace-id");
      if (!group?.id || !["team", "group"].includes(group.kind) || !validDisplayName(group.name))
        return err("invalid-group");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        if (workspace.groups.some((item) => item.id === group.id))
          return { error: "duplicate-group" };
        const memberPersonIds = (group.memberPersonIds || []).filter((personId) =>
          workspace.people.some((person) => person.id === personId)
        );
        return { ...workspace, groups: [...workspace.groups, { ...group, memberPersonIds }] };
      });
    }

    case "local.role.assign": {
      const workspaceId = text(payload, "workspaceId");
      const assignment = payload["assignment"] as RoleAssignment | undefined;
      if (!workspaceId) return err("missing-workspace-id");
      if (!assignment?.id || !WORKSPACE_ROLE_IDS.includes(assignment.roleId))
        return err("invalid-role");
      const subject = assignment.subject as SubjectRef | undefined;
      if (!subject?.kind || !subject.id) return err("invalid-subject");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        if (workspace.roleAssignments.some((item) => item.id === assignment.id))
          return { error: "duplicate-assignment" };
        if (subject.kind === "service-account")
          return { error: "service-account-role-not-allowed" };
        // QRD-10: actor == subject pode self-assign; actor != subject entra proposed.
        const isSelf = subject.kind === "person" && text(payload, "actorPersonId") === subject.id;
        const status: RoleAssignment["status"] = isSelf ? "self-assigned" : "proposed";
        return {
          ...workspace,
          roleAssignments: [
            ...workspace.roleAssignments,
            { ...assignment, status, proposedAt: command.issuedAt },
          ],
        };
      });
    }

    case "local.role.accept":
    case "local.role.reject":
    case "local.role.revoke": {
      const workspaceId = text(payload, "workspaceId");
      const assignmentId = text(payload, "assignmentId");
      if (!workspaceId || !assignmentId) return err("missing-assignment-ref");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        const assignment = workspace.roleAssignments.find((item) => item.id === assignmentId);
        if (!assignment) return { error: "unknown-assignment" };
        if (command.type === "local.role.revoke") {
          if (assignment.status === "revoked") return { error: "already-revoked" };
        } else if (assignment.status !== "proposed") {
          return { error: "assignment-not-proposed" };
        }
        const status =
          command.type === "local.role.accept"
            ? "accepted"
            : command.type === "local.role.reject"
              ? "rejected"
              : "revoked";
        return {
          ...workspace,
          roleAssignments: workspace.roleAssignments.map((item) =>
            item.id === assignmentId
              ? {
                  ...item,
                  status,
                  decidedAt: command.issuedAt,
                  ...(text(payload, "reason") ? { reason: text(payload, "reason") } : {}),
                }
              : item
          ),
        };
      });
    }

    case "local.host.link": {
      const workspaceId = text(payload, "workspaceId");
      const host = payload["host"] as GovernanceHost | undefined;
      if (!workspaceId) return err("missing-workspace-id");
      if (
        !host?.kind ||
        !["dedicated-repo", "local-folder", "existing-repo-folder"].includes(host.kind) ||
        !host.pathOrUrl
      )
        return err("invalid-host");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => ({
        ...workspace,
        governanceHost: host,
        sandboxDeclared: false,
      }));
    }

    case "local.host.record-fit-check": {
      const workspaceId = text(payload, "workspaceId");
      const fitCheck = payload["fitCheck"] as HostFitCheck | undefined;
      if (!workspaceId || !fitCheck?.checkedAt) return err("missing-fit-check");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        if (!workspace.governanceHost) return { error: "no-host-linked" };
        return {
          ...workspace,
          governanceHost: {
            ...workspace.governanceHost,
            fitCheck,
            status: fitCheck.ok ? "scaffolded" : workspace.governanceHost.status || "declared",
          },
        };
      });
    }

    case "local.sandbox.declare": {
      const workspaceId = text(payload, "workspaceId");
      if (!workspaceId) return err("missing-workspace-id");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => ({
        ...workspace,
        sandboxDeclared: true,
      }));
    }

    case "local.work-source.add": {
      const workspaceId = text(payload, "workspaceId");
      const source = payload["source"] as WorkSource | undefined;
      if (!workspaceId) return err("missing-workspace-id");
      if (!source?.id || !source.kind || !source.label) return err("invalid-work-source");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        if (workspace.workSources.some((item) => item.id === source.id))
          return { error: "duplicate-work-source" };
        const trust = source.sourceTrust || "declared";
        return {
          ...workspace,
          workSources: [
            ...workspace.workSources,
            { ...source, sourceTrust: trust, limitations: sourceTrustLimitations(trust) },
          ],
        };
      });
    }

    case "local.work-source.record-scan": {
      const workspaceId = text(payload, "workspaceId");
      const sourceId = text(payload, "sourceId");
      const scan = payload["scan"] as WorkSourceScan | undefined;
      if (!workspaceId || !sourceId || !scan?.scannedAt) return err("missing-scan");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        const source = workspace.workSources.find((item) => item.id === sourceId);
        if (!source) return { error: "unknown-work-source" };
        const trust = deriveSourceTrust({
          kind: source.kind,
          gitDetected: Boolean(scan.gitHead),
          ...(scan.cloudSyncProvider ? { cloudSyncProvider: scan.cloudSyncProvider } : {}),
          providerConnected: Boolean(source.providerVersionId),
          scanFailed: scan.errors.length > 0,
        });
        return {
          ...workspace,
          workSources: workspace.workSources.map((item) =>
            item.id === sourceId
              ? {
                  ...item,
                  lastScan: scan,
                  sourceTrust: trust,
                  limitations: sourceTrustLimitations(trust),
                  freshness: scan.errors.length ? "unknown" : "fresh",
                  status: scan.errors.length ? item.status : "connected",
                  ...(scan.gitHead
                    ? { providerVersionId: scan.gitHead, provider: "git-local" }
                    : {}),
                }
              : item
          ),
        };
      });
    }

    case "local.assistant.save-provider": {
      const workspaceId = text(payload, "workspaceId");
      const provider = payload["provider"] as AssistantProviderConfig | undefined;
      if (!workspaceId) return err("missing-workspace-id");
      if (
        !provider?.id ||
        !["lexical-deterministic", "ollama", "openai-compatible", "cloud-approved"].includes(
          provider.kind
        )
      )
        return err("invalid-provider");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        const config = workspace.assistantConfig || {
          providers: [],
          defaults: {},
          dismissed: false,
        };
        const providers = config.providers.some((item) => item.id === provider.id)
          ? config.providers.map((item) => (item.id === provider.id ? provider : item))
          : [...config.providers, provider];
        return {
          ...workspace,
          assistantConfig: { ...config, providers, dismissed: false },
        };
      });
    }

    case "local.assistant.set-default": {
      const workspaceId = text(payload, "workspaceId");
      const fn = text(payload, "function") as AssistantFunction | undefined;
      const providerId = text(payload, "providerId");
      if (!workspaceId || !providerId) return err("missing-default-ref");
      if (!fn || !ASSISTANT_FUNCTIONS.includes(fn)) return err("invalid-assistant-function");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        const config = workspace.assistantConfig || {
          providers: [],
          defaults: {},
          dismissed: false,
        };
        if (!config.providers.some((item) => item.id === providerId))
          return { error: "unknown-provider" };
        return {
          ...workspace,
          assistantConfig: { ...config, defaults: { ...config.defaults, [fn]: providerId } },
        };
      });
    }

    case "local.assistant.dismiss": {
      const workspaceId = text(payload, "workspaceId");
      if (!workspaceId) return err("missing-workspace-id");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => ({
        ...workspace,
        assistantConfig: {
          ...(workspace.assistantConfig || { providers: [], defaults: {} }),
          dismissed: true,
        },
      }));
    }

    case "local.integration.set-status": {
      const workspaceId = text(payload, "workspaceId");
      const integrationId = text(payload, "integrationId");
      const status = text(payload, "status");
      if (!workspaceId || !integrationId) return err("missing-integration-ref");
      if (!status || !["configured", "disabled"].includes(status))
        return err("invalid-integration-status");
      const membership = requireMember(state, command, workspaceId);
      if (membership) return err(membership);
      return updateWorkspace(state, workspaceId, (workspace) => {
        const others = workspace.integrations.filter((item) => item.id !== integrationId);
        return {
          ...workspace,
          integrations: [
            ...others,
            {
              id: integrationId,
              status: status as "configured" | "disabled",
              configuredAt: command.issuedAt,
              ...(text(payload, "note") ? { note: text(payload, "note") } : {}),
            },
          ],
        };
      });
    }

    default:
      // fail-closed: comando desconhecido nunca aplica silenciosamente
      return err(`unknown-command-type:${command.type as string}`);
  }
}

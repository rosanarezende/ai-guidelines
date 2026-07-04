// shellClient.ts — gateway client do shell local de adoção.
//
// Toda escrita passa pelas rotas /api/local/* (que aplicam comando + event-log
// no backend file-first). A UI não usa storage do navegador: a sessão vive em
// cookie httpOnly e o estado vive em arquivo no servidor local.
import type {
  AuthorityGrant,
  OnboardingStatus,
  RoleAssignment,
  SubjectRef,
  Workspace,
  WorkspaceGroup,
  WorkspaceInvite,
  WorkspaceKind,
  WorkspacePerson,
  WorkspaceRoleId,
  WorkSource,
  WorkSourceKind,
} from "@demo/backend/domain";

export type ShellWorkspaceSummary = {
  id: string;
  name?: string;
  kind?: WorkspaceKind;
  onboardingStatus: OnboardingStatus;
};

type ShellResponse<T> = ({ ok: true } & T) | { ok: false; error: string };

async function postJson<T>(url: string, body: unknown): Promise<ShellResponse<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as ShellResponse<T>;
  } catch {
    return { ok: false, error: "network" };
  }
}

export function signupLocal(input: { displayName: string; email?: string }) {
  return postJson<{ principal: { id: string; displayName: string } }>("/api/local/signup", input);
}

export function createOrganization(input: { name: string; kind: WorkspaceKind }) {
  return postJson<{ workspace: ShellWorkspaceSummary }>("/api/local/organizations", input);
}

export function attachDemoOrganization() {
  return postJson<{ workspace: ShellWorkspaceSummary }>("/api/local/organizations", {
    mode: "demo",
  });
}

export function selectOrganization(workspaceId: string) {
  return postJson<{ workspace: ShellWorkspaceSummary }>("/api/local/organizations/select", {
    workspaceId,
  });
}

export function reportOnboardingStatus(status: Extract<OnboardingStatus, "partial" | "finished">) {
  return postJson<{ onboardingStatus: OnboardingStatus }>("/api/local/onboarding/status", {
    status,
  });
}

// ── persistência das ESCOLHAS do onboarding (R1) ───────────────────────────

export function saveProfileChoice(input: {
  profile: string;
  sensitiveAccumulationPolicy: string;
  reason: string;
}) {
  return postJson<{ profileDeclaration: unknown }>("/api/local/onboarding/profile", input);
}

export function saveOnboardingPath(path: "guided" | "advanced") {
  return postJson<{ onboardingPath: string }>("/api/local/onboarding/path", { path });
}

export function addDeclaredWorkSource(input: { kind: string; label: string; pathOrUrl?: string }) {
  return postJson<{ source: unknown }>("/api/local/work-sources", input);
}

export async function listWorkSources(): Promise<Array<{ id: string; kind: string }>> {
  try {
    const response = await fetch("/api/local/work-sources");
    const body = (await response.json()) as {
      ok: boolean;
      workSources?: Array<{ id: string; kind: string }>;
    };
    return body.ok ? body.workSources || [] : [];
  } catch {
    return [];
  }
}

export type MembersOverview = {
  people: WorkspacePerson[];
  groups: WorkspaceGroup[];
  serviceAccounts: Workspace["serviceAccounts"];
  invites: Array<Omit<WorkspaceInvite, "token">>;
  roleAssignments: RoleAssignment[];
  authority: AuthorityGrant[];
  sensitiveAccumulations: Array<{ personId: string; roles: WorkspaceRoleId[] }>;
};

export async function getMembersOverview(): Promise<ShellResponse<MembersOverview>> {
  try {
    const response = await fetch("/api/local/members");
    return (await response.json()) as ShellResponse<MembersOverview>;
  } catch {
    return { ok: false, error: "network" };
  }
}

export function inviteWorkspacePerson(input: { personName: string; email?: string }) {
  return postJson<{ invite: WorkspaceInvite }>("/api/local/members", input);
}

export function createWorkspaceGroup(input: {
  kind: "team" | "group";
  name: string;
  memberPersonIds: string[];
}) {
  return postJson<{ groups: WorkspaceGroup[] }>("/api/local/members/groups", input);
}

export type RolesOverview = {
  roleCatalog: WorkspaceRoleId[];
  roleAssignments: RoleAssignment[];
  authority: AuthorityGrant[];
  sensitiveAccumulations: Array<{ personId: string; roles: WorkspaceRoleId[] }>;
};

export async function getRolesOverview(): Promise<ShellResponse<RolesOverview>> {
  try {
    const response = await fetch("/api/local/roles");
    return (await response.json()) as ShellResponse<RolesOverview>;
  } catch {
    return { ok: false, error: "network" };
  }
}

export function assignWorkspaceRole(input: {
  subject: SubjectRef;
  roleId: string;
  reason?: string;
}) {
  return postJson<{ roleAssignments: RoleAssignment[] }>("/api/local/roles", input);
}

export function decideWorkspaceRole(
  assignmentId: string,
  input: { action: "accept" | "reject" | "revoke"; reason?: string }
) {
  return postJson<{ roleAssignments: RoleAssignment[] }>(`/api/local/roles/${assignmentId}`, input);
}

export async function getWorkSources(): Promise<ShellResponse<{ workSources: WorkSource[] }>> {
  try {
    const response = await fetch("/api/local/work-sources");
    return (await response.json()) as ShellResponse<{ workSources: WorkSource[] }>;
  } catch {
    return { ok: false, error: "network" };
  }
}

export function addWorkspaceWorkSource(input: {
  kind: WorkSourceKind;
  label: string;
  pathOrUrl?: string;
}) {
  return postJson<{ source: WorkSource }>("/api/local/work-sources", input);
}

export function scanWorkspaceWorkSource(sourceId: string) {
  return postJson<{ source: WorkSource }>(`/api/local/work-sources/${sourceId}/scan`, {});
}

export function saveAssistantProviderChoice(input: {
  kind: string;
  label?: string;
  endpoint?: string;
  runTest?: boolean;
}) {
  return postJson<{ provider: unknown }>("/api/local/assistant", input);
}

export function dismissAssistantChoice() {
  return postJson<{ dismissed: boolean }>("/api/local/assistant", { action: "dismiss" });
}

export function routeAfterSelect(workspace: ShellWorkspaceSummary): string {
  return workspace.onboardingStatus === "not-started" ? "/onboarding" : "/";
}

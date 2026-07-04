// adoption-shell.ts — product adoption layer above the governed work graph.
//
// This is not a replacement for authority, policy, or the file-first graph.
// It describes how a human using the app selects accounts, workspaces,
// governance hosts, sources, and memberships before commands touch governed
// files.

export type LocaleCode = "pt-br";

export type OnboardingStatus = "not-started" | "partial" | "finished";

export type WorkspaceKind = "company" | "personal" | "client" | "sandbox-demo";

export type GovernanceHostKind = "dedicated-repo" | "local-folder" | "existing-repo-folder";

export type WorkSourceKind =
  | "git-repo"
  | "local-folder"
  | "monorepo-module"
  | "service-catalog"
  | "backlog-tool";

export type GovernanceProfileId = "full" | "compact" | "trio" | "solo";

export type SensitiveAccumulationPolicy = "record" | "warn-review" | "block";

export type MembershipRole =
  | "admin"
  | "payer"
  | "sponsor"
  | "security"
  | "technical-owner"
  | "actual-attester";

export type AssistantProviderKind = "none" | "local" | "cloud";

export type IntegrationStatus = "available" | "configured" | "coming-soon" | "deferred";

export type LocalAccount = {
  id: string;
  displayName: string;
  email?: string;
  preferredLocale: LocaleCode;
  activeWorkspaceId?: string;
};

export type GovernanceHost = {
  kind: GovernanceHostKind;
  pathOrUrl: string;
  label?: string;
};

export type WorkSource = {
  id: string;
  kind: WorkSourceKind;
  label: string;
  pathOrUrl?: string;
  adapterId?: string;
  status: "draft" | "connected" | "manual-evidence";
};

export type WorkspacePerson = {
  id: string;
  displayName: string;
  email?: string;
};

export type Membership = {
  personId: string;
  roles: MembershipRole[];
};

export type WorkspaceProfileDeclaration = {
  profile: GovernanceProfileId;
  sensitiveAccumulationPolicy: SensitiveAccumulationPolicy;
  reason: string;
};

export type AssistantPreference = {
  provider: AssistantProviderKind;
  system?: string;
  endpoint?: string;
};

export type AssistantConnectionResult = {
  ok: boolean;
  provider: "ollama";
  endpoint: string;
  checkedPath: "/api/tags";
  models: string[];
  error?: "blocked-endpoint" | "unreachable" | "invalid-response";
  messageKey: string;
};

export type Workspace = {
  id: string;
  name: string;
  kind: WorkspaceKind;
  locale: LocaleCode;
  governanceHost?: GovernanceHost;
  people: WorkspacePerson[];
  memberships: Membership[];
  workSources: WorkSource[];
  profileDeclaration?: WorkspaceProfileDeclaration;
  assistant?: AssistantPreference;
  onboardingStatus: OnboardingStatus;
};

// ── local adoption state (server-side, file-first) ────────────────────────
//
// The local shell is HONEST local identity: a `local-principal` is not an
// authenticated cloud account. Real auth/identity-provider integration is a
// future adapter; these types must not close that door (ids are opaque,
// principals are a list, memberships are explicit).

export type PrincipalMembership = {
  principalId: string;
  workspaceId: string;
  roles: MembershipRole[];
};

export const ADOPTION_STATE_SCHEMA = "governance.local-adoption/v1";

export type AdoptionState = {
  schema: typeof ADOPTION_STATE_SCHEMA;
  principals: LocalAccount[];
  workspaces: Workspace[];
  memberships: PrincipalMembership[];
};

export function emptyAdoptionState(): AdoptionState {
  return { schema: ADOPTION_STATE_SCHEMA, principals: [], workspaces: [], memberships: [] };
}

export type LocalShellCommandType =
  | "local.principal.create"
  | "local.workspace.create"
  | "local.workspace.attach-demo"
  | "local.workspace.select"
  | "local.onboarding.set-status";

export type LocalShellCommand = {
  id: string;
  type: LocalShellCommandType;
  issuedAt: string;
  principalId?: string;
  payload: Record<string, unknown>;
};

export function validDisplayName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 80;
}

export function validWorkspaceName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 80;
}

export function workspaceSlugId(name: string, existingIds: string[]): string {
  const slug =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "workspace";
  if (!existingIds.includes(slug)) return slug;
  let counter = 2;
  while (existingIds.includes(`${slug}-${counter}`)) counter += 1;
  return `${slug}-${counter}`;
}

export function buildDemoWorkspace(companyName: string): Workspace {
  return {
    id: DEMO_WORKSPACE_ID,
    name: companyName || "Acme",
    kind: "sandbox-demo",
    locale: "pt-br",
    governanceHost: {
      kind: "dedicated-repo",
      pathOrUrl: "acme/governance/",
      label: "Host demo acme/governance",
    },
    people: [],
    memberships: [],
    workSources: [],
    onboardingStatus: "not-started",
  };
}

export function buildEmptyWorkspace(id: string, name: string, kind: WorkspaceKind): Workspace {
  return {
    id,
    name: name.trim(),
    kind,
    locale: "pt-br",
    people: [],
    memberships: [],
    workSources: [],
    onboardingStatus: "not-started",
  };
}

export function principalWorkspaces(state: AdoptionState, principalId: string): Workspace[] {
  const ids = new Set(
    state.memberships
      .filter((membership) => membership.principalId === principalId)
      .map((membership) => membership.workspaceId)
  );
  return state.workspaces.filter((workspace) => ids.has(workspace.id));
}

export function principalCanAccessWorkspace(
  state: AdoptionState,
  principalId: string,
  workspaceId: string
): boolean {
  return state.memberships.some(
    (membership) => membership.principalId === principalId && membership.workspaceId === workspaceId
  );
}

export function isDemoWorkspace(workspace: Pick<Workspace, "id" | "kind">): boolean {
  return workspace.id === DEMO_WORKSPACE_ID || workspace.kind === "sandbox-demo";
}

export const DEMO_WORKSPACE_ID = "demo-acme";

export function profileAllowsHardBlock(profile: GovernanceProfileId): boolean {
  return profile === "full";
}

export function sourceCanProveExecution(source: WorkSource): boolean {
  return source.status === "connected";
}

export function workspaceHasGovernanceHost(workspace: Workspace): boolean {
  return Boolean(workspace.governanceHost?.kind && workspace.governanceHost.pathOrUrl);
}

export function workspaceHasEvidenceSource(workspace: Workspace): boolean {
  return workspace.workSources.some(sourceCanProveExecution);
}

export function workspaceIsGovernable(workspace: Workspace): boolean {
  return workspaceHasGovernanceHost(workspace);
}

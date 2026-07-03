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

export type WorkspaceState = {
  account: LocalAccount | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
};

export type LocalStorageKeys = {
  account: "governance:account:v1";
  workspaces: "governance:workspaces:v1";
  lastWorkspaceId: "governance:last-workspace-id";
  workspaceStatusPrefix: "governance:workspace:";
  legacyOnboardingStatus: "acme-governance:onboarding-status";
};

export const LOCAL_STORAGE_KEYS: LocalStorageKeys = {
  account: "governance:account:v1",
  workspaces: "governance:workspaces:v1",
  lastWorkspaceId: "governance:last-workspace-id",
  workspaceStatusPrefix: "governance:workspace:",
  legacyOnboardingStatus: "acme-governance:onboarding-status",
};

export const DEMO_WORKSPACE_ID = "demo-acme";

export function workspaceStatusKey(workspaceId: string): string {
  return `${LOCAL_STORAGE_KEYS.workspaceStatusPrefix}${workspaceId}:onboarding-status`;
}

export function normalizeOnboardingStatus(value: unknown): OnboardingStatus {
  return value === "partial" || value === "finished" ? value : "not-started";
}

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

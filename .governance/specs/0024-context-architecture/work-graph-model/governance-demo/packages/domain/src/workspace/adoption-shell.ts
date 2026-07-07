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
  | "cloud-synced-folder"
  | "manual-upload"
  | "external-link"
  | "provider-versioned-source"
  | "github"
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
  identityProvider?: "local" | "better-auth";
  portalUserId?: string;
  preferredLocale: LocaleCode;
  activeWorkspaceId?: string;
};

// ── governance host (QRD-08/09/21) ─────────────────────────────────────────
// Três distribuições físicas de primeira classe + sandbox explícito.
// Host dedicado usa `<workspace-slug>-governance/`; host embutido usa
// `.governance-host/` (nunca `.governance/`, que é sidecar de fonte).

export type GovernanceHostStatus = "declared" | "linked" | "scaffolded";

export type HostFitCheck = {
  checkedAt: string;
  pathExists: boolean;
  writable: boolean;
  manifestPresent: boolean;
  eventLogPresent: boolean;
  sourceRevision?: string;
  warnings: string[];
  ok: boolean;
};

export type GovernanceHost = {
  kind: GovernanceHostKind;
  pathOrUrl: string;
  label?: string;
  status?: GovernanceHostStatus;
  fitReason?: string;
  fitCheck?: HostFitCheck;
};

export function governanceHostDirName(kind: GovernanceHostKind, workspaceSlug: string): string {
  return kind === "existing-repo-folder" ? ".governance-host" : `${workspaceSlug}-governance`;
}

// ── fontes de trabalho (QRD-22) ─────────────────────────────────────────────
// Fonte sem Git é fonte REAL rebaixada: sourceTrust explícito diz o que ela
// prova e o que não prova. Pasta sincronizada em nuvem sem API conectada
// NUNCA sobe além de cloud-sync-unverified.

export type SourceTrust =
  | "snapshot-only"
  | "cloud-sync-unverified"
  | "provider-versioned"
  | "provider-audited"
  | "declared"
  | "untrusted";

export type WorkSourceScan = {
  scannedAt: string;
  fileCount?: number;
  contentHash?: string;
  gitHead?: string;
  gitDirtyFiles?: number;
  cloudSyncProvider?: string;
  errors: string[];
};

export type WorkSource = {
  id: string;
  kind: WorkSourceKind;
  label: string;
  pathOrUrl?: string;
  adapterId?: string;
  status: "draft" | "connected" | "manual-evidence";
  sourceTrust?: SourceTrust;
  provider?: string;
  providerVersionId?: string;
  freshness?: "fresh" | "stale" | "unknown";
  limitations?: string[];
  lastScan?: WorkSourceScan;
};

// Limitações visíveis derivadas do trust (copy honesta obrigatória da QRD-22).
export function sourceTrustLimitations(trust: SourceTrust): string[] {
  switch (trust) {
    case "snapshot-only":
      return ["prova estado local por hash no momento da leitura; não prova histórico nem autoria"];
    case "cloud-sync-unverified":
      return [
        "pasta sincronizada detectada sem API conectada: não prova revisão remota, autoria nem sincronização",
      ];
    case "provider-versioned":
      return ["prova versão/timestamp do provider; auditoria depende de plano/permissão"];
    case "provider-audited":
      return ["eventos auditáveis sujeitos a retenção/permissão do provider"];
    case "declared":
      return ["declaração humana sem prova independente"];
    case "untrusted":
      return ["validação falhou; fonte não prova nada até nova varredura"];
  }
}

export function deriveSourceTrust(input: {
  kind: WorkSourceKind;
  gitDetected: boolean;
  cloudSyncProvider?: string;
  providerConnected: boolean;
  scanFailed: boolean;
}): SourceTrust {
  if (input.scanFailed) return "untrusted";
  if (input.kind === "manual-upload" || input.kind === "external-link") return "declared";
  // Git local tem revision id verificável (commit); provider conectado idem.
  if (input.gitDetected || input.providerConnected) return "provider-versioned";
  if (input.cloudSyncProvider) return "cloud-sync-unverified";
  return "snapshot-only";
}

export type WorkspacePerson = {
  id: string;
  displayName: string;
  email?: string;
};

export type Membership = {
  personId: string;
  roles: MembershipRole[];
};

// ── subjects, grupos, convites e papéis (QRD-10/11/19) ─────────────────────
// Account != Membership != RoleAssignment != Authority. Papel atribuído a
// OUTRA pessoa nasce proposed e só gera autoridade após aceite do sujeito.
// Authority efetiva é sempre DERIVADA, nunca gravada.

export type SubjectKind = "person" | "team" | "group" | "service-account" | "external-group";

export type SubjectRef = { kind: SubjectKind; id: string };

export type WorkspaceGroup = {
  id: string;
  kind: "team" | "group";
  name: string;
  memberPersonIds: string[];
  managedBy?: "local" | "external-idp";
  source?: string;
  lastSyncedAt?: string;
};

// Service account exige owner humano, escopo e TTL (QRD-19); não aceita papel.
export type ServiceAccount = {
  id: string;
  name: string;
  ownerPersonId: string;
  scope: string;
  expiresAt: string;
};

export type InviteStatus = "pending" | "accepted" | "declined" | "revoked" | "expired";

export type WorkspaceInvite = {
  id: string;
  personName: string;
  email?: string;
  token: string;
  portalOrganizationId?: string;
  portalInvitationId?: string;
  status: InviteStatus;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  decidedAt?: string;
  personId?: string;
};

export type WorkspaceRoleId =
  | "workspace-admin"
  | "sponsor"
  | "cost-owner"
  | "security-owner"
  | "technical-owner"
  | "source-owner"
  | "target-definer"
  | "actual-attester"
  | "auditor";

export const WORKSPACE_ROLE_IDS: WorkspaceRoleId[] = [
  "workspace-admin",
  "sponsor",
  "cost-owner",
  "security-owner",
  "technical-owner",
  "source-owner",
  "target-definer",
  "actual-attester",
  "auditor",
];

// Papéis cuja acumulação na mesma pessoa é sensível (SoD por perfil).
export const SENSITIVE_ROLE_IDS: WorkspaceRoleId[] = [
  "workspace-admin",
  "sponsor",
  "security-owner",
  "actual-attester",
];

export type RoleAssignmentStatus =
  | "self-assigned"
  | "proposed"
  | "accepted"
  | "rejected"
  | "revoked";

export type RoleAssignment = {
  id: string;
  subject: SubjectRef;
  roleId: WorkspaceRoleId;
  status: RoleAssignmentStatus;
  proposedBy: string;
  proposedAt: string;
  decidedAt?: string;
  reason?: string;
};

export type AuthorityGrant = {
  personId: string;
  roleId: WorkspaceRoleId;
  origin: "self-assigned" | "direct" | `team:${string}` | `group:${string}`;
  assignmentId: string;
};

// ── configuração do workspace (QRD-14/15/16/17) ────────────────────────────
// governance-profile = como decisões funcionam · workspace-mode = quão
// compartilhado/verificável · stack = como roda/persiste/projeta. Modo nunca
// prende a vendor; adapters entram por escolha.

export type WorkspaceMode = "local" | "shared" | "controlled";

export type ExecutionMode = "local-process" | "docker-compose" | "self-hosted-server";

export type OperationalStore = "files" | "sqlite" | "postgres";

export type GraphReadModelKind = "none" | "file-export" | "neo4j";

export type IdentityProviderKind =
  | "none"
  | "local-auth"
  | "github-oauth"
  | "google-oidc"
  | "oidc"
  | "gitlab-oauth"
  | "bitbucket-oauth";

export type GraphReadModelConfig = {
  kind: GraphReadModelKind;
  url?: string;
  status?: "not-configured" | "configured-unverified" | "healthy" | "stale";
  sourceRevision?: string;
  lastCheckedAt?: string;
};

export type WorkspaceStack = {
  executionMode: ExecutionMode;
  operationalStore: OperationalStore;
  graphReadModel: GraphReadModelConfig;
  identityProvider: IdentityProviderKind;
  // profiles opcionais do Compose (ex.: "assistant" para Ollama, desligado por default)
  composeProfiles: string[];
};

export function defaultWorkspaceStack(): WorkspaceStack {
  return {
    executionMode: "local-process",
    operationalStore: "files",
    graphReadModel: { kind: "none" },
    identityProvider: "none",
    composeProfiles: [],
  };
}

// Incoerências viram warning/bloqueio visível (QRD-15), nunca silêncio.
export function stackCompatibilityWarnings(mode: WorkspaceMode, stack: WorkspaceStack): string[] {
  const warnings: string[] = [];
  if (mode === "shared" && stack.executionMode === "local-process")
    warnings.push(
      "shared com processo local só vale como avaliação — mais de uma pessoa exige app acessível ao time"
    );
  if (mode === "shared" && stack.identityProvider === "none")
    warnings.push("shared exige pelo menos local-auth com convites/aceite");
  if (mode === "controlled" && stack.identityProvider === "none")
    warnings.push("controlled sem identity provider exige exceção explícita");
  if (stack.graphReadModel.kind === "neo4j" && !stack.graphReadModel.sourceRevision)
    warnings.push(
      "neo4j sem sourceRevision não pode servir consulta — read-model derivado exige revisão da fonte"
    );
  return warnings;
}

export type WorkspaceProfileDeclaration = {
  profile: GovernanceProfileId;
  sensitiveAccumulationPolicy: SensitiveAccumulationPolicy;
  reason: string;
  savedAt?: string;
};

// ── assistente multi-provider (QRD-18/24) ──────────────────────────────────

export type AssistantPreference = {
  provider: AssistantProviderKind;
  system?: string;
  endpoint?: string;
};

export type AssistantFunction =
  | "explain-policy"
  | "summarize-context"
  | "suggest-triage-questions"
  | "suggest-matches"
  | "classify-source"
  | "draft-register"
  | "draft-decision";

export const ASSISTANT_FUNCTIONS: AssistantFunction[] = [
  "explain-policy",
  "summarize-context",
  "suggest-triage-questions",
  "suggest-matches",
  "classify-source",
  "draft-register",
  "draft-decision",
];

export type AssistantProviderKindId =
  | "lexical-deterministic"
  | "ollama"
  | "openai-compatible"
  | "cloud-approved";

export type DataClassification = "public" | "internal" | "confidential" | "restricted";

export type AssistantProviderConfig = {
  id: string;
  kind: AssistantProviderKindId;
  label: string;
  preset?: string;
  endpoint?: string;
  model?: string;
  maxClassification: DataClassification;
  egressApproved: boolean;
  lastHealth?: {
    status: "ok" | "unreachable" | "egress-blocked";
    checkedAt: string;
    models?: string[];
  };
};

export type WorkspaceAssistantConfig = {
  providers: AssistantProviderConfig[];
  defaults: Partial<Record<AssistantFunction, string>>;
  dismissed: boolean;
};

// ── integrações por workspace (QRD-26) ─────────────────────────────────────

export type WorkspaceIntegrationState = {
  id: string;
  status: "configured" | "disabled";
  configuredAt: string;
  note?: string;
};

export type IntegrationBacklogStatus = "disponivel" | "release-1" | "em-breve" | "adiado";

export type IntegrationBacklogEntry = {
  id: string;
  category: string;
  status: IntegrationBacklogStatus;
  configured: boolean;
  localAdapter?: string;
  // compromisso release-1 da parte CLOUD (ex.: GitHub work-source dentro de
  // git-provider, que já tem mecanismo local) — separado do status local
  cloudRelease1?: boolean;
  systems: string[];
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

export type OnboardingPath = "guided" | "advanced";

export type Workspace = {
  id: string;
  name: string;
  kind: WorkspaceKind;
  locale: LocaleCode;
  governanceHost?: GovernanceHost;
  // sandbox explícito (QRD-08): permite "concluir" sem host SEM chamar isso de
  // organização governada — a UI mantém a degradação visível.
  sandboxDeclared?: boolean;
  people: WorkspacePerson[];
  memberships: Membership[];
  groups: WorkspaceGroup[];
  serviceAccounts: ServiceAccount[];
  invites: WorkspaceInvite[];
  roleAssignments: RoleAssignment[];
  workSources: WorkSource[];
  profileDeclaration?: WorkspaceProfileDeclaration;
  mode?: WorkspaceMode;
  stack?: WorkspaceStack;
  onboardingPath?: OnboardingPath;
  onboardingStep?: number;
  assistant?: AssistantPreference;
  assistantConfig?: WorkspaceAssistantConfig;
  integrations: WorkspaceIntegrationState[];
  onboardingStatus: OnboardingStatus;
};

// Estado gravado por versões anteriores do shell não tem os campos novos;
// a normalização preenche defaults sem reescrever o arquivo (leitura pura).
export function normalizeWorkspace(workspace: Workspace): Workspace {
  return {
    ...workspace,
    people: workspace.people || [],
    memberships: workspace.memberships || [],
    groups: workspace.groups || [],
    serviceAccounts: workspace.serviceAccounts || [],
    invites: workspace.invites || [],
    roleAssignments: workspace.roleAssignments || [],
    workSources: workspace.workSources || [],
    integrations: workspace.integrations || [],
  };
}

// ── local adoption state (server-side, file-first) ────────────────────────
//
// The local shell is HONEST local identity: a `local-principal` is not an
// authenticated cloud account. Real auth/identity-provider integration is a
// future adapter; these types must not close that door (ids are opaque,
// principals are a list, memberships are explicit).

export type PrincipalMembership = {
  principalId: string;
  workspaceId: string;
  personId?: string;
  roles: MembershipRole[];
  status?: "active" | "revoked";
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
  | "local.onboarding.set-status"
  | "local.onboarding.set-path"
  | "local.profile.save"
  | "local.workspace-mode.save"
  | "local.workspace-stack.save"
  | "local.member.invite"
  | "local.invite.accept"
  | "local.invite.decline"
  | "local.invite.revoke"
  | "local.group.create"
  | "local.role.assign"
  | "local.role.accept"
  | "local.role.reject"
  | "local.role.revoke"
  | "local.host.link"
  | "local.host.record-fit-check"
  | "local.sandbox.declare"
  | "local.work-source.add"
  | "local.work-source.record-scan"
  | "local.assistant.save-provider"
  | "local.assistant.set-default"
  | "local.assistant.dismiss"
  | "local.integration.set-status";

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
      status: "linked",
    },
    people: [],
    memberships: [],
    groups: [],
    serviceAccounts: [],
    invites: [],
    roleAssignments: [],
    workSources: [],
    integrations: [],
    onboardingStatus: "finished",
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
    groups: [],
    serviceAccounts: [],
    invites: [],
    roleAssignments: [],
    workSources: [],
    integrations: [],
    onboardingStatus: "not-started",
  };
}

export function principalWorkspaces(state: AdoptionState, principalId: string): Workspace[] {
  const ids = new Set(
    state.memberships
      .filter(
        (membership) => membership.principalId === principalId && membership.status !== "revoked"
      )
      .map((membership) => membership.workspaceId)
  );
  return state.workspaces.filter((workspace) => ids.has(workspace.id));
}

export function principalMembershipForWorkspace(
  state: AdoptionState,
  principalId: string,
  workspaceId: string
): PrincipalMembership | undefined {
  return state.memberships.find(
    (membership) =>
      membership.principalId === principalId &&
      membership.workspaceId === workspaceId &&
      membership.status !== "revoked"
  );
}

export function principalCanAccessWorkspace(
  state: AdoptionState,
  principalId: string,
  workspaceId: string
): boolean {
  return Boolean(principalMembershipForWorkspace(state, principalId, workspaceId));
}

export function principalPersonId(
  state: AdoptionState,
  principalId: string,
  workspaceId: string
): string | undefined {
  return principalMembershipForWorkspace(state, principalId, workspaceId)?.personId;
}

export function isDemoWorkspace(workspace: Pick<Workspace, "id" | "kind">): boolean {
  return workspace.id === DEMO_WORKSPACE_ID || workspace.kind === "sandbox-demo";
}

export const DEMO_WORKSPACE_ID = "demo-acme";

export function profileAllowsHardBlock(profile: GovernanceProfileId): boolean {
  return profile === "full";
}

// ── authority derivada (QRD-10/11) ─────────────────────────────────────────
// Efetiva = assignment accepted/self-assigned direto OU herdado de team/group
// do qual a pessoa é membro. Proposed/rejected/revoked nunca geram autoridade.

export function resolveWorkspaceAuthority(workspace: Workspace): AuthorityGrant[] {
  const ws = normalizeWorkspace(workspace);
  const grants: AuthorityGrant[] = [];
  const groupById = new Map(ws.groups.map((group) => [group.id, group]));
  for (const assignment of ws.roleAssignments) {
    if (assignment.status !== "accepted" && assignment.status !== "self-assigned") continue;
    if (assignment.subject.kind === "person") {
      grants.push({
        personId: assignment.subject.id,
        roleId: assignment.roleId,
        origin: assignment.status === "self-assigned" ? "self-assigned" : "direct",
        assignmentId: assignment.id,
      });
      continue;
    }
    if (assignment.subject.kind === "team" || assignment.subject.kind === "group") {
      const group = groupById.get(assignment.subject.id);
      for (const personId of group?.memberPersonIds || []) {
        grants.push({
          personId,
          roleId: assignment.roleId,
          origin: `${assignment.subject.kind}:${assignment.subject.id}`,
          assignmentId: assignment.id,
        });
      }
    }
    // service-account/external-group não viram autoridade de pessoa aqui:
    // service account age por escopo próprio; grupo externo exige sync/policy.
  }
  return grants;
}

export function personAuthority(workspace: Workspace, personId: string): AuthorityGrant[] {
  return resolveWorkspaceAuthority(workspace).filter((grant) => grant.personId === personId);
}

export function principalAuthority(
  state: AdoptionState,
  principalId: string,
  workspaceId: string
): AuthorityGrant[] {
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  const personId = principalPersonId(state, principalId, workspaceId);
  if (!workspace || !personId) return [];
  return personAuthority(workspace, personId);
}

export function principalHasAnyWorkspaceRole(
  state: AdoptionState,
  principalId: string,
  workspaceId: string,
  roleIds: WorkspaceRoleId[]
): boolean {
  const membership = principalMembershipForWorkspace(state, principalId, workspaceId);
  if (!membership) return false;
  if (membership.roles.includes("admin")) return true;
  return principalAuthority(state, principalId, workspaceId).some((grant) =>
    roleIds.includes(grant.roleId)
  );
}

export function roleIsSensitive(roleId: WorkspaceRoleId): boolean {
  return SENSITIVE_ROLE_IDS.includes(roleId);
}

// Acumulação sensível detectada (não bloqueada aqui — política decide).
export function detectSensitiveAccumulation(
  workspace: Workspace
): Array<{ personId: string; roles: WorkspaceRoleId[] }> {
  const byPerson = new Map<string, Set<WorkspaceRoleId>>();
  for (const grant of resolveWorkspaceAuthority(workspace)) {
    if (!SENSITIVE_ROLE_IDS.includes(grant.roleId)) continue;
    byPerson.set(grant.personId, (byPerson.get(grant.personId) || new Set()).add(grant.roleId));
  }
  return [...byPerson.entries()]
    .filter(([, roles]) => roles.size > 1)
    .map(([personId, roles]) => ({ personId, roles: [...roles] }));
}

// ── projeção do backlog de integrações (QRD-26) ────────────────────────────
// Recebe o catálogo versionado (dado neutro) + estado do workspace e devolve
// status honesto: disponivel (mecanismo local) · release-1 (compromisso) ·
// em-breve (backlog priorizado) · adiado (risk-gated).

export const RELEASE_1_INTEGRATION_IDS = ["git-provider"];

export type CatalogIntegrationItem = {
  id: string;
  category: string;
  systems: string[];
  priority: string;
  "local-adapter"?: string;
};

export function projectIntegrationBacklog(
  catalogItems: CatalogIntegrationItem[],
  workspaceIntegrations: WorkspaceIntegrationState[]
): IntegrationBacklogEntry[] {
  const configured = new Set(
    workspaceIntegrations
      .filter((integration) => integration.status === "configured")
      .map((integration) => integration.id)
  );
  return catalogItems.map((item) => {
    const localAdapter = item["local-adapter"];
    let status: IntegrationBacklogStatus = "em-breve";
    if (item.priority === "deferred") status = "adiado";
    else if (localAdapter) status = "disponivel";
    else if (RELEASE_1_INTEGRATION_IDS.includes(item.id)) status = "release-1";
    return {
      id: item.id,
      category: item.category,
      status,
      configured: configured.has(item.id),
      ...(localAdapter ? { localAdapter } : {}),
      ...(RELEASE_1_INTEGRATION_IDS.includes(item.id) ? { cloudRelease1: true } : {}),
      systems: item.systems || [],
    };
  });
}

export function sourceCanProveExecution(source: WorkSource): boolean {
  return source.status === "connected";
}

export function workspaceHasGovernanceHost(workspace: Workspace): boolean {
  return Boolean(workspace.governanceHost?.kind && workspace.governanceHost.pathOrUrl);
}

export function workspaceHasValidGovernanceHost(workspace: Workspace): boolean {
  if (isDemoWorkspace(workspace)) return workspaceHasGovernanceHost(workspace);
  const host = workspace.governanceHost;
  if (!host?.kind || !host.pathOrUrl) return false;
  if (host.status !== "linked" && host.status !== "scaffolded") return false;
  const fit = host.fitCheck;
  return Boolean(fit?.ok && fit.manifestPresent && fit.eventLogPresent);
}

export function workspaceHasEvidenceSource(workspace: Workspace): boolean {
  return workspace.workSources.some(sourceCanProveExecution);
}

export function workspaceIsGovernable(workspace: Workspace): boolean {
  return workspaceHasValidGovernanceHost(workspace);
}

export type OnboardingCompletionResult = { ok: true } | { ok: false; blockers: string[] };

export function canCompleteOnboarding(workspace: Workspace): OnboardingCompletionResult {
  const ws = normalizeWorkspace(workspace);
  if (isDemoWorkspace(ws)) return { ok: true };
  const blockers: string[] = [];
  if (!ws.profileDeclaration) blockers.push("missing-profile");
  if (!ws.mode) blockers.push("missing-workspace-mode");
  if (!ws.stack) blockers.push("missing-workspace-stack");
  if (!ws.sandboxDeclared && !workspaceHasValidGovernanceHost(ws)) {
    blockers.push("missing-governance-host");
  }
  if (ws.mode && ws.stack) {
    for (const warning of stackCompatibilityWarnings(ws.mode, ws.stack)) {
      blockers.push(`stack-warning:${warning}`);
    }
  }
  return blockers.length ? { ok: false, blockers } : { ok: true };
}

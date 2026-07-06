export const PORTAL_TOPOLOGIES = [
  "local-solo",
  "git-backed",
  "self-hosted-portal",
  "hosted-portal",
] as const;

export type PortalTopology = (typeof PORTAL_TOPOLOGIES)[number];

export type PortalAccount = {
  id: string;
  email: string;
  displayName: string;
  provider: "email" | "github" | "google" | "oidc";
};

export type PortalWorkspace = {
  id: string;
  name: string;
  topology: PortalTopology;
  governanceHostRef?: GovernanceHostRef;
};

export type GovernanceHostRef = {
  provider: "github";
  owner: string;
  repo: string;
  defaultBranch: string;
  sourceRevision: string;
  installationId: string;
};

export type PortalInvite = {
  id: string;
  workspaceId: string;
  email: string;
  invitedByAccountId: string;
  intendedPersona: "business" | "designer" | "investor" | "developer";
  status: "pending" | "accepted" | "revoked" | "expired";
  acceptedByAccountId?: string;
};

export type PortalMembership = {
  accountId: string;
  workspaceId: string;
  source: "creator" | "invite";
};

export type ProviderSecret = {
  id: string;
  providerLinkId: string;
  secretValue: string;
};

export type GovernanceProposal = {
  id: string;
  workspaceId: string;
  actorAccountId: string;
  sourceRevision: string;
  targetPath: string;
  status: "proposal-only" | "blocked-stale-revision";
  branchCandidate: string;
};

export type PortalControlPlaneState = {
  accounts: PortalAccount[];
  workspaces: PortalWorkspace[];
  invites: PortalInvite[];
  memberships: PortalMembership[];
  providerSecrets: ProviderSecret[];
  proposals: GovernanceProposal[];
  governanceAuthorityGrants: [];
};

export type PublicControlPlaneProjection = {
  accounts: Array<Pick<PortalAccount, "id" | "email" | "displayName" | "provider">>;
  workspaces: PortalWorkspace[];
  invites: Array<Omit<PortalInvite, "invitedByAccountId">>;
  memberships: PortalMembership[];
  providerLinks: Array<{
    provider: GovernanceHostRef["provider"];
    owner: string;
    repo: string;
    installationIdRedacted: string;
  }>;
  governanceAuthorityGrantCount: 0;
};

export type ProposalResult =
  | { ok: true; state: PortalControlPlaneState; proposal: GovernanceProposal }
  | { ok: false; error: "source-revision-stale" };

export function createPortalControlPlaneSpikeFixture(): PortalControlPlaneState {
  const governanceHostRef: GovernanceHostRef = {
    provider: "github",
    owner: "rosana",
    repo: "mundo-da-mel-governance",
    defaultBranch: "main",
    sourceRevision: "rev-governance-001",
    installationId: "gh-installation-123456",
  };

  return {
    accounts: [
      {
        id: "acct-rosana",
        email: "rosana@example.test",
        displayName: "Rosana",
        provider: "email",
      },
      {
        id: "acct-business",
        email: "negocios@example.test",
        displayName: "Pessoa de negocio",
        provider: "google",
      },
    ],
    workspaces: [
      {
        id: "ws-mundo-da-mel",
        name: "Mundo da Mel",
        topology: "git-backed",
        governanceHostRef,
      },
    ],
    invites: [
      {
        id: "invite-business",
        workspaceId: "ws-mundo-da-mel",
        email: "negocios@example.test",
        invitedByAccountId: "acct-rosana",
        intendedPersona: "business",
        status: "pending",
      },
    ],
    memberships: [{ accountId: "acct-rosana", workspaceId: "ws-mundo-da-mel", source: "creator" }],
    providerSecrets: [
      {
        id: "secret-github-app",
        providerLinkId: "gh-installation-123456",
        secretValue: "ghp_spike_secret_must_never_leak",
      },
    ],
    proposals: [],
    governanceAuthorityGrants: [],
  };
}

export function acceptPortalInvite(
  state: PortalControlPlaneState,
  inviteId: string,
  accountId: string
): PortalControlPlaneState {
  const invite = state.invites.find((item) => item.id === inviteId);
  if (!invite || invite.status !== "pending") return state;

  const membershipExists = state.memberships.some(
    (item) => item.accountId === accountId && item.workspaceId === invite.workspaceId
  );

  return {
    ...state,
    invites: state.invites.map((item) =>
      item.id === inviteId ? { ...item, status: "accepted", acceptedByAccountId: accountId } : item
    ),
    memberships: membershipExists
      ? state.memberships
      : [...state.memberships, { accountId, workspaceId: invite.workspaceId, source: "invite" }],
  };
}

export function portalAccountHasGovernanceAuthority(
  state: PortalControlPlaneState,
  accountId: string,
  workspaceId: string
): false {
  void state;
  void accountId;
  void workspaceId;
  return false;
}

export function projectPublicControlPlaneState(
  state: PortalControlPlaneState
): PublicControlPlaneProjection {
  return {
    accounts: state.accounts.map(({ id, email, displayName, provider }) => ({
      id,
      email,
      displayName,
      provider,
    })),
    workspaces: state.workspaces,
    invites: state.invites.map(({ invitedByAccountId: _invitedByAccountId, ...invite }) => invite),
    memberships: state.memberships,
    providerLinks: state.workspaces
      .map((workspace) => workspace.governanceHostRef)
      .filter((ref): ref is GovernanceHostRef => Boolean(ref))
      .map((ref) => ({
        provider: ref.provider,
        owner: ref.owner,
        repo: ref.repo,
        installationIdRedacted: redactIdentifier(ref.installationId),
      })),
    governanceAuthorityGrantCount: 0,
  };
}

export function createGovernanceProposal(
  state: PortalControlPlaneState,
  input: {
    workspaceId: string;
    actorAccountId: string;
    sourceRevision: string;
    targetPath: string;
  }
): ProposalResult {
  const workspace = state.workspaces.find((item) => item.id === input.workspaceId);
  const expectedRevision = workspace?.governanceHostRef?.sourceRevision;
  if (!expectedRevision || expectedRevision !== input.sourceRevision) {
    return { ok: false, error: "source-revision-stale" };
  }

  const proposal: GovernanceProposal = {
    id: `proposal-${state.proposals.length + 1}`,
    workspaceId: input.workspaceId,
    actorAccountId: input.actorAccountId,
    sourceRevision: input.sourceRevision,
    targetPath: input.targetPath,
    status: "proposal-only",
    branchCandidate: `governance/proposal-${state.proposals.length + 1}`,
  };

  return { ok: true, state: { ...state, proposals: [...state.proposals, proposal] }, proposal };
}

export function collectSecretLeaks(value: unknown, secrets: string[]): string[] {
  const serialized = JSON.stringify(value);
  return secrets.filter((secret) => serialized.includes(secret));
}

function redactIdentifier(value: string): string {
  if (value.length <= 6) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

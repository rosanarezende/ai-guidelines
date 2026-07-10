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

export type GovernanceHostRef = {
  provider: "github";
  owner: string;
  repo: string;
  defaultBranch: string;
  sourceRevision: string;
  installationId: string;
};

export type PortalWorkspace = {
  id: string;
  name: string;
  topology: PortalTopology;
  governanceHostRef?: GovernanceHostRef;
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

export type PortalProviderLink = {
  id: string;
  workspaceId: string;
  provider: GovernanceHostRef["provider"];
  owner: string;
  repo: string;
  defaultBranch: string;
  sourceRevision: string;
  installationId: string;
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
  providerLinks: PortalProviderLink[];
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

export type PortalPersistedSnapshot = {
  schemaVersion: 1;
  accounts: PortalAccount[];
  workspaces: Array<
    Omit<PortalWorkspace, "governanceHostRef"> & {
      governanceHostRef?: Omit<GovernanceHostRef, "installationId"> & {
        installationIdRedacted: string;
      };
    }
  >;
  invites: PortalInvite[];
  memberships: PortalMembership[];
  providerLinks: Array<
    Omit<PortalProviderLink, "installationId"> & { installationIdRedacted: string }
  >;
  proposals: GovernanceProposal[];
  governanceAuthorityGrants: [];
};

export type ProposalResult =
  | { ok: true; state: PortalControlPlaneState; proposal: GovernanceProposal }
  | { ok: false; error: "source-revision-stale" };

export type GitHubBridgeDryRunResult =
  | {
      ok: true;
      provider: "github";
      repo: string;
      branchCandidate: string;
      pullRequestCandidate: {
        title: string;
        body: string;
        base: string;
        head: string;
      };
      sourceRevision: string;
      writesToRemote: false;
    }
  | { ok: false; error: "proposal-required" };

export type PortalSpikeFlowResult = {
  initialState: PortalControlPlaneState;
  acceptedState: PortalControlPlaneState;
  proposedState: PortalControlPlaneState;
  proposalResult: ProposalResult;
  bridgeDryRun: GitHubBridgeDryRunResult;
  publicProjection: PublicControlPlaneProjection;
  persistedSnapshot: PortalPersistedSnapshot;
  secretLeaks: string[];
};

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
    providerLinks: [
      {
        id: "provider-link-github",
        workspaceId: "ws-mundo-da-mel",
        provider: "github",
        owner: governanceHostRef.owner,
        repo: governanceHostRef.repo,
        defaultBranch: governanceHostRef.defaultBranch,
        sourceRevision: governanceHostRef.sourceRevision,
        installationId: governanceHostRef.installationId,
      },
    ],
    providerSecrets: [
      {
        id: "secret-github-app",
        providerLinkId: "provider-link-github",
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
    workspaces: state.workspaces.map((workspace) => ({
      ...workspace,
      governanceHostRef: workspace.governanceHostRef
        ? {
            ...workspace.governanceHostRef,
            installationId: redactIdentifier(workspace.governanceHostRef.installationId),
          }
        : undefined,
    })),
    invites: state.invites.map(({ invitedByAccountId: _invitedByAccountId, ...invite }) => invite),
    memberships: state.memberships,
    providerLinks: state.providerLinks.map((link) => ({
      provider: link.provider,
      owner: link.owner,
      repo: link.repo,
      installationIdRedacted: redactIdentifier(link.installationId),
    })),
    governanceAuthorityGrantCount: 0,
  };
}

export function projectPersistedControlPlaneState(
  state: PortalControlPlaneState
): PortalPersistedSnapshot {
  return {
    schemaVersion: 1,
    accounts: state.accounts,
    workspaces: state.workspaces.map((workspace) => ({
      ...workspace,
      governanceHostRef: workspace.governanceHostRef
        ? {
            provider: workspace.governanceHostRef.provider,
            owner: workspace.governanceHostRef.owner,
            repo: workspace.governanceHostRef.repo,
            defaultBranch: workspace.governanceHostRef.defaultBranch,
            sourceRevision: workspace.governanceHostRef.sourceRevision,
            installationIdRedacted: redactIdentifier(workspace.governanceHostRef.installationId),
          }
        : undefined,
    })),
    invites: state.invites,
    memberships: state.memberships,
    providerLinks: state.providerLinks.map(({ installationId, ...link }) => ({
      ...link,
      installationIdRedacted: redactIdentifier(installationId),
    })),
    proposals: state.proposals,
    governanceAuthorityGrants: [],
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

export function dryRunGitHubBridgeProposal(input: {
  state: PortalControlPlaneState;
  proposalId: string;
}): GitHubBridgeDryRunResult {
  const proposal = input.state.proposals.find((item) => item.id === input.proposalId);
  if (!proposal) return { ok: false, error: "proposal-required" };

  const workspace = input.state.workspaces.find((item) => item.id === proposal.workspaceId);
  const host = workspace?.governanceHostRef;
  if (!host) return { ok: false, error: "proposal-required" };

  return {
    ok: true,
    provider: "github",
    repo: `${host.owner}/${host.repo}`,
    branchCandidate: proposal.branchCandidate,
    pullRequestCandidate: {
      title: `Governance proposal ${proposal.id}`,
      body: `Dry-run only. sourceRevision=${proposal.sourceRevision}; target=${proposal.targetPath}`,
      base: host.defaultBranch,
      head: proposal.branchCandidate,
    },
    sourceRevision: proposal.sourceRevision,
    writesToRemote: false,
  };
}

export function collectSecretLeaks(value: unknown, secrets: string[]): string[] {
  const serialized = JSON.stringify(value);
  return secrets.filter((secret) => serialized.includes(secret));
}

export function assertNoControlPlaneLeakage(input: {
  publicProjection: unknown;
  persistedSnapshot: unknown;
  bridgeDryRun: unknown;
  secrets: string[];
}): string[] {
  return [
    ...collectSecretLeaks(input.publicProjection, input.secrets),
    ...collectSecretLeaks(input.persistedSnapshot, input.secrets),
    ...collectSecretLeaks(input.bridgeDryRun, input.secrets),
  ];
}

export function runPortalSpikeFlow(): PortalSpikeFlowResult {
  const initialState = createPortalControlPlaneSpikeFixture();
  const acceptedState = acceptPortalInvite(initialState, "invite-business", "acct-business");
  const proposalResult = createGovernanceProposal(acceptedState, {
    workspaceId: "ws-mundo-da-mel",
    actorAccountId: "acct-business",
    sourceRevision: "rev-governance-001",
    targetPath: "intents/intent-new-market.yml",
  });
  const proposedState = proposalResult.ok ? proposalResult.state : acceptedState;
  const bridgeDryRun = proposalResult.ok
    ? dryRunGitHubBridgeProposal({ state: proposedState, proposalId: proposalResult.proposal.id })
    : { ok: false as const, error: "proposal-required" as const };
  const publicProjection = projectPublicControlPlaneState(proposedState);
  const persistedSnapshot = projectPersistedControlPlaneState(proposedState);
  const secretLeaks = assertNoControlPlaneLeakage({
    publicProjection,
    persistedSnapshot,
    bridgeDryRun,
    secrets: initialState.providerSecrets.map((secret) => secret.secretValue),
  });

  return {
    initialState,
    acceptedState,
    proposedState,
    proposalResult,
    bridgeDryRun,
    publicProjection,
    persistedSnapshot,
    secretLeaks,
  };
}

function redactIdentifier(value: string): string {
  if (value.length <= 6) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

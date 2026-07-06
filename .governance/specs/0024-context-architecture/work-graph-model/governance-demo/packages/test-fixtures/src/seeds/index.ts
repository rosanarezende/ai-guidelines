// seeds/index.ts — cenários resetáveis da mock API (QRD-06 + APP-DECISIONS §17).
// Cada seed é um AdoptionState construído com os builders do DOMÍNIO real —
// type-checked contra o mesmo contrato do backend. Nomes acme-*, nunca reais.
import {
  buildDemoWorkspace,
  buildEmptyWorkspace,
  defaultWorkspaceStack,
  emptyAdoptionState,
  sourceTrustLimitations,
  DEMO_WORKSPACE_ID,
  type AdoptionState,
  type LocalAccount,
  type Workspace,
} from "@demo/domain";

const ANA: LocalAccount = { id: "local-ana", displayName: "Ana", preferredLocale: "pt-br" };
const BIA: LocalAccount = { id: "local-bia", displayName: "Bia", preferredLocale: "pt-br" };
const CAIO: LocalAccount = { id: "local-caio", displayName: "Caio", preferredLocale: "pt-br" };
const EVA: LocalAccount = { id: "local-eva", displayName: "Eva", preferredLocale: "pt-br" };
const NOW = "2027-01-10T12:00:00.000Z";
const LATER = "2027-01-17T12:00:00.000Z";

function base(mutate?: (workspace: Workspace) => Workspace): AdoptionState {
  const workspace = {
    ...buildEmptyWorkspace("acme-honey", "Acme Honey", "company"),
    people: [{ id: "person-ana", displayName: "Ana" }],
  };
  return {
    ...emptyAdoptionState(),
    principals: [ANA],
    workspaces: [mutate ? mutate(workspace) : workspace],
    memberships: [
      {
        principalId: ANA.id,
        workspaceId: "acme-honey",
        personId: "person-ana",
        roles: ["admin"],
        status: "active",
      },
    ],
  };
}

function withPeople(workspace: Workspace): Workspace {
  return {
    ...workspace,
    people: [
      { id: "person-ana", displayName: "Ana" },
      { id: "person-bia", displayName: "Bia", email: "bia@acme.example" },
      { id: "person-caio", displayName: "Caio" },
    ],
  };
}

export const SEEDS: Record<string, () => AdoptionState> = {
  // e2e default: nenhum principal — a jornada começa no /signup
  blank: () => emptyAdoptionState(),

  "empty-workspace": () => base(),

  "onboarding-partial": () =>
    base((ws) => ({
      ...ws,
      onboardingStatus: "partial",
      onboardingPath: "guided",
      profileDeclaration: {
        profile: "solo",
        sensitiveAccumulationPolicy: "record",
        reason: "diagnóstico guiado",
        savedAt: NOW,
      },
    })),

  "acme-demo": () => {
    const state = base();
    return {
      ...state,
      workspaces: [...state.workspaces, buildDemoWorkspace("Acme")],
      memberships: [
        ...state.memberships,
        { principalId: ANA.id, workspaceId: DEMO_WORKSPACE_ID, roles: ["admin"] },
      ],
    };
  },

  "workspace-sem-host": () => base((ws) => ({ ...ws, onboardingStatus: "partial" })),

  "workspace-host-local": () =>
    base((ws) => ({
      ...ws,
      governanceHost: {
        kind: "local-folder",
        pathOrUrl: "acme-honey-governance",
        status: "scaffolded",
        fitReason: "experimento local antes de versionar",
        fitCheck: {
          checkedAt: NOW,
          pathExists: true,
          writable: true,
          manifestPresent: true,
          eventLogPresent: true,
          sourceRevision: "seed00000001",
          warnings: ["pasta local sem Git: colaboração, backup e auditoria rebaixadas"],
          ok: true,
        },
      },
    })),

  "workspace-host-embutido": () =>
    base((ws) => ({
      ...ws,
      governanceHost: {
        kind: "existing-repo-folder",
        pathOrUrl: "acme-monolito",
        status: "scaffolded",
        fitReason: "monolito é o centro real do trabalho",
        fitCheck: {
          checkedAt: NOW,
          pathExists: true,
          writable: true,
          manifestPresent: true,
          eventLogPresent: true,
          sourceRevision: "seed00000002",
          warnings: [
            "sem CODEOWNERS detectado: .governance-host/ não tem review próprio — risco visível",
          ],
          ok: true,
        },
      },
    })),

  "workspace-local": () => base((ws) => ({ ...ws, mode: "local", stack: defaultWorkspaceStack() })),

  "workspace-shared": () =>
    base((ws) => ({
      ...ws,
      mode: "shared",
      stack: {
        ...defaultWorkspaceStack(),
        executionMode: "docker-compose",
        operationalStore: "sqlite",
        identityProvider: "local-auth",
      },
    })),

  "workspace-controlled": () =>
    base((ws) => ({
      ...ws,
      mode: "controlled",
      stack: {
        ...defaultWorkspaceStack(),
        executionMode: "docker-compose",
        operationalStore: "postgres",
        identityProvider: "oidc",
      },
    })),

  "workspace-controlled-neo4j": () =>
    base((ws) => ({
      ...ws,
      mode: "controlled",
      stack: {
        ...defaultWorkspaceStack(),
        executionMode: "docker-compose",
        operationalStore: "postgres",
        identityProvider: "oidc",
        graphReadModel: {
          kind: "neo4j",
          url: "bolt://127.0.0.1:7687",
          status: "healthy",
          sourceRevision: "seed00000003",
          lastCheckedAt: NOW,
        },
      },
    })),

  "workspace-docker-compose": () =>
    base((ws) => ({
      ...ws,
      mode: "shared",
      stack: {
        ...defaultWorkspaceStack(),
        executionMode: "docker-compose",
        identityProvider: "local-auth",
      },
    })),

  "workspace-docker-ollama-profile": () =>
    base((ws) => ({
      ...ws,
      mode: "shared",
      stack: {
        ...defaultWorkspaceStack(),
        executionMode: "docker-compose",
        identityProvider: "local-auth",
        composeProfiles: ["assistant"],
      },
      assistantConfig: {
        providers: [
          {
            id: "prov-ollama-compose",
            kind: "ollama",
            label: "Ollama (Compose profile, desligado por default)",
            preset: "compose-profile",
            endpoint: "http://127.0.0.1:11434",
            maxClassification: "internal",
            egressApproved: false,
          },
        ],
        defaults: {},
        dismissed: false,
      },
    })),

  "workspace-groups-teams": () =>
    base((ws) => ({
      ...withPeople(ws),
      groups: [
        {
          id: "grp-plataforma",
          kind: "team",
          name: "Time Plataforma",
          memberPersonIds: ["person-bia", "person-caio"],
          managedBy: "local",
        },
        {
          id: "grp-sec-review",
          kind: "group",
          name: "Security Reviewers",
          memberPersonIds: ["person-bia"],
          managedBy: "local",
        },
      ],
      roleAssignments: [
        {
          id: "role-team-tech",
          subject: { kind: "team", id: "grp-plataforma" },
          roleId: "technical-owner",
          status: "accepted",
          proposedBy: ANA.id,
          proposedAt: NOW,
          decidedAt: NOW,
        },
      ],
    })),

  "workspace-authority-personas": () => {
    const state = base((ws) => ({
      ...withPeople(ws),
      people: [...withPeople(ws).people, { id: "person-eva", displayName: "Eva" }],
      mode: "controlled",
      profileDeclaration: {
        profile: "full",
        sensitiveAccumulationPolicy: "block",
        reason: "seed de personas para contratos de authority",
        savedAt: NOW,
      },
      roleAssignments: [
        {
          id: "role-bia-security",
          subject: { kind: "person", id: "person-bia" },
          roleId: "security-owner",
          status: "accepted",
          proposedBy: ANA.id,
          proposedAt: NOW,
          decidedAt: NOW,
        },
        {
          id: "role-caio-sponsor",
          subject: { kind: "person", id: "person-caio" },
          roleId: "sponsor",
          status: "accepted",
          proposedBy: ANA.id,
          proposedAt: NOW,
          decidedAt: NOW,
        },
        {
          id: "role-eva-source-owner",
          subject: { kind: "person", id: "person-eva" },
          roleId: "source-owner",
          status: "proposed",
          proposedBy: ANA.id,
          proposedAt: NOW,
        },
      ],
    }));
    return {
      ...state,
      principals: [...state.principals, BIA, CAIO, EVA],
      memberships: [
        ...state.memberships,
        {
          principalId: BIA.id,
          workspaceId: "acme-honey",
          personId: "person-bia",
          roles: [],
          status: "active",
        },
        {
          principalId: CAIO.id,
          workspaceId: "acme-honey",
          personId: "person-caio",
          roles: [],
          status: "active",
        },
        {
          principalId: EVA.id,
          workspaceId: "acme-honey",
          personId: "person-eva",
          roles: [],
          status: "active",
        },
      ],
    };
  },

  "workspace-shared-convites": () =>
    base((ws) => ({
      ...withPeople(ws),
      mode: "shared",
      invites: [
        {
          id: "inv-dani",
          personName: "Dani",
          email: "dani@acme.example",
          token: "seed-token-dani",
          status: "pending",
          invitedBy: ANA.id,
          createdAt: NOW,
          expiresAt: LATER,
        },
        {
          id: "inv-edu",
          personName: "Edu",
          token: "seed-token-edu",
          status: "pending",
          invitedBy: ANA.id,
          createdAt: NOW,
          expiresAt: LATER,
        },
      ],
    })),

  "workspace-shared-github": () =>
    base((ws) => ({
      ...ws,
      mode: "shared",
      stack: { ...defaultWorkspaceStack(), identityProvider: "github-oauth" },
    })),

  "workspace-shared-google": () =>
    base((ws) => ({
      ...ws,
      mode: "shared",
      stack: { ...defaultWorkspaceStack(), identityProvider: "google-oidc" },
    })),

  "workspace-controlled-oidc": () =>
    base((ws) => ({
      ...ws,
      mode: "controlled",
      stack: {
        ...defaultWorkspaceStack(),
        executionMode: "self-hosted-server",
        operationalStore: "postgres",
        identityProvider: "oidc",
      },
    })),

  "workspace-cloud-synced-folder": () =>
    base((ws) => ({
      ...ws,
      workSources: [
        {
          id: "src-drive",
          kind: "cloud-synced-folder",
          label: "Materiais no Drive",
          pathOrUrl: "C:/Users/ana/Google Drive/acme-materiais",
          status: "draft",
          sourceTrust: "cloud-sync-unverified",
          limitations: sourceTrustLimitations("cloud-sync-unverified"),
          lastScan: {
            scannedAt: NOW,
            fileCount: 87,
            contentHash: "seed00000004",
            cloudSyncProvider: "google-drive",
            errors: [],
          },
        },
      ],
    })),

  "workspace-provider-versioned-source": () =>
    base((ws) => ({
      ...ws,
      workSources: [
        {
          id: "src-figma",
          kind: "provider-versioned-source",
          label: "Design system (Figma)",
          pathOrUrl: "https://figma.example/acme-file",
          status: "connected",
          provider: "figma",
          providerVersionId: "version-9f2c",
          sourceTrust: "provider-versioned",
          freshness: "fresh",
          limitations: sourceTrustLimitations("provider-versioned"),
        },
      ],
    })),

  "workspace-compact-policy": () =>
    base((ws) => ({
      ...withPeople(ws),
      profileDeclaration: {
        profile: "compact",
        sensitiveAccumulationPolicy: "warn-review",
        reason: "time de 3 pessoas; acumulação registrada e revisada",
        savedAt: NOW,
      },
      roleAssignments: [
        {
          id: "role-ana-sponsor",
          subject: { kind: "person", id: "person-ana" },
          roleId: "sponsor",
          status: "self-assigned",
          proposedBy: ANA.id,
          proposedAt: NOW,
        },
        {
          id: "role-ana-security",
          subject: { kind: "person", id: "person-ana" },
          roleId: "security-owner",
          status: "self-assigned",
          proposedBy: ANA.id,
          proposedAt: NOW,
        },
      ],
    })),

  "workspace-multi-assistant": () =>
    base((ws) => ({
      ...ws,
      assistantConfig: {
        providers: [
          {
            id: "prov-lexical",
            kind: "lexical-deterministic",
            label: "Baseline lexical",
            maxClassification: "restricted",
            egressApproved: false,
          },
          {
            id: "prov-ollama",
            kind: "ollama",
            label: "Ollama local",
            endpoint: "http://127.0.0.1:11434",
            maxClassification: "confidential",
            egressApproved: false,
            lastHealth: { status: "ok", checkedAt: NOW, models: ["acme-local-model"] },
          },
          {
            id: "prov-gateway",
            kind: "openai-compatible",
            label: "Gateway interno (LiteLLM)",
            preset: "litellm",
            endpoint: "http://127.0.0.1:4000",
            maxClassification: "internal",
            egressApproved: false,
          },
        ],
        defaults: {
          "suggest-matches": "prov-lexical",
          "explain-policy": "prov-ollama",
          "summarize-context": "prov-ollama",
        },
        dismissed: false,
      },
    })),

  "workspace-with-integration-statuses": () =>
    base((ws) => ({
      ...ws,
      onboardingStatus: "partial",
      governanceHost: {
        kind: "local-folder",
        pathOrUrl: "acme-honey-governance",
        status: "scaffolded",
        fitReason: "seed para contratos de integração e fontes",
        fitCheck: {
          checkedAt: NOW,
          pathExists: true,
          writable: true,
          manifestPresent: true,
          eventLogPresent: true,
          sourceRevision: "seed00000006",
          warnings: [],
          ok: true,
        },
      },
      workSources: [
        {
          id: "src-local-api",
          kind: "git-repo",
          label: "acme-core-api",
          pathOrUrl: "C:/acme/acme-core-api",
          adapterId: "git-local",
          status: "connected",
          sourceTrust: "provider-versioned",
          freshness: "fresh",
          limitations: sourceTrustLimitations("provider-versioned"),
          lastScan: {
            scannedAt: NOW,
            fileCount: 42,
            contentHash: "seed00000007",
            gitHead: "seedgit0001",
            gitDirtyFiles: 0,
            errors: [],
          },
        },
        {
          id: "src-drive-evidence",
          kind: "cloud-synced-folder",
          label: "evidências no Drive",
          pathOrUrl: "C:/Users/ana/Google Drive/acme-evidencias",
          status: "manual-evidence",
          sourceTrust: "cloud-sync-unverified",
          freshness: "unknown",
          limitations: sourceTrustLimitations("cloud-sync-unverified"),
        },
      ],
      assistantConfig: {
        providers: [
          {
            id: "prov-lexical",
            kind: "lexical-deterministic",
            label: "Baseline lexical",
            maxClassification: "restricted",
            egressApproved: false,
          },
          {
            id: "prov-ollama",
            kind: "ollama",
            label: "Ollama local",
            endpoint: "http://127.0.0.1:11434",
            maxClassification: "confidential",
            egressApproved: false,
            lastHealth: { status: "ok", checkedAt: NOW, models: ["acme-local-model"] },
          },
        ],
        defaults: {
          "suggest-matches": "prov-lexical",
          "explain-policy": "prov-ollama",
        },
        dismissed: false,
      },
      integrations: [
        { id: "git-provider", status: "configured", configuredAt: NOW },
        { id: "assistant-runtime-local", status: "configured", configuredAt: NOW },
        {
          id: "observability",
          status: "disabled",
          configuredAt: NOW,
          note: "catalogada; precisa de fonte externa antes de virar evidência automática",
        },
      ],
    })),

  "workspace-planning-progressivo": () => {
    // planejamento mora no host governado; a seed representa o cenário com a
    // demo acme anexada (objectives/targets reais) + workspace próprio pronto
    const state = base((ws) => ({ ...ws, onboardingStatus: "finished", sandboxDeclared: true }));
    return {
      ...state,
      workspaces: [...state.workspaces, buildDemoWorkspace("Acme")],
      memberships: [
        ...state.memberships,
        { principalId: ANA.id, workspaceId: DEMO_WORKSPACE_ID, roles: ["admin"] },
      ],
    };
  },

  "workspace-github-work-source": () =>
    base((ws) => ({
      ...ws,
      workSources: [
        {
          id: "src-github",
          kind: "github",
          label: "acme/acme-checkout (GitHub)",
          pathOrUrl: "https://github.example/acme/acme-checkout",
          adapterId: "git-provider",
          status: "draft",
          provider: "github",
          sourceTrust: "declared",
          limitations: [
            "contrato GitHub work-source modelado; conexão cloud real é fatia seguinte — nunca aparece como connected sem mecanismo",
          ],
        },
      ],
      integrations: [{ id: "git-provider", status: "configured", configuredAt: NOW }],
    })),
};

export function seedNames(): string[] {
  return Object.keys(SEEDS);
}

export function buildSeed(name: string): AdoptionState | null {
  const factory = SEEDS[name];
  return factory ? factory() : null;
}

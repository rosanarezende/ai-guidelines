// seed-coverage.spec.ts — matriz de regressão das seeds da mock-api.
// Cada seed representa um estado inicial de produto. O teste prova que ela
// carrega, permanece tipada e preserva os invariantes mínimos que a UI/e2e usam.
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  DEMO_WORKSPACE_ID,
  resolveWorkspaceAuthority,
  sourceTrustLimitations,
  stackCompatibilityWarnings,
  type AdoptionState,
  type Workspace,
} from "../../backend/src/domain/index.ts";
import { MOCK_API_URL } from "../playwright.config.ts";

type SeedCase = {
  name: string;
  proves: string;
  assert: (state: AdoptionState) => void;
};

async function loadSeed(request: APIRequestContext, name: string): Promise<AdoptionState> {
  const reset = await request.post(`${MOCK_API_URL}/__reset`, { data: { seed: name } });
  expect(reset.ok(), `reset seed ${name}`).toBeTruthy();
  const state = await request.get(`${MOCK_API_URL}/api/shell/state`);
  expect(state.ok(), `state seed ${name}`).toBeTruthy();
  return (await state.json()) as AdoptionState;
}

function workspace(state: AdoptionState, id = "acme-honey"): Workspace {
  const found = state.workspaces.find((item) => item.id === id);
  expect(found, `workspace ${id}`).toBeTruthy();
  return found as Workspace;
}

function expectBasePrincipal(state: AdoptionState): void {
  expect(state.principals.map((item) => item.id)).toContain("local-ana");
  expect(state.memberships).toContainEqual({
    principalId: "local-ana",
    workspaceId: "acme-honey",
    personId: "person-ana",
    roles: ["admin"],
    status: "active",
  });
}

const CASES: SeedCase[] = [
  {
    name: "blank",
    proves: "estado inicial sem conta",
    assert: (state) => {
      expect(state.principals).toHaveLength(0);
      expect(state.workspaces).toHaveLength(0);
      expect(state.memberships).toHaveLength(0);
    },
  },
  {
    name: "empty-workspace",
    proves: "workspace novo ainda sem onboarding",
    assert: (state) => {
      expectBasePrincipal(state);
      const ws = workspace(state);
      expect(ws.onboardingStatus).toBe("not-started");
      expect(ws.people).toContainEqual({ id: "person-ana", displayName: "Ana" });
    },
  },
  {
    name: "onboarding-partial",
    proves: "onboarding parcial persistido",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.onboardingStatus).toBe("partial");
      expect(ws.onboardingPath).toBe("guided");
      expect(ws.profileDeclaration).toMatchObject({
        profile: "solo",
        sensitiveAccumulationPolicy: "record",
      });
    },
  },
  {
    name: "acme-demo",
    proves: "demo acme anexada sem virar workspace real do usuário",
    assert: (state) => {
      expect(workspace(state).kind).toBe("company");
      const demo = workspace(state, DEMO_WORKSPACE_ID);
      expect(demo.kind).toBe("sandbox-demo");
      expect(state.memberships).toContainEqual({
        principalId: "local-ana",
        workspaceId: DEMO_WORKSPACE_ID,
        roles: ["admin"],
      });
    },
  },
  {
    name: "workspace-sem-host",
    proves: "workspace parcial sem host continua degradado",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.onboardingStatus).toBe("partial");
      expect(ws.governanceHost).toBeUndefined();
      expect(ws.sandboxDeclared).toBeFalsy();
    },
  },
  {
    name: "workspace-host-local",
    proves: "host local scaffolded com warnings visíveis",
    assert: (state) => {
      const host = workspace(state).governanceHost;
      expect(host).toMatchObject({
        kind: "local-folder",
        status: "scaffolded",
        pathOrUrl: "acme-honey-governance",
      });
      expect(host?.fitCheck).toMatchObject({
        manifestPresent: true,
        eventLogPresent: true,
        ok: true,
      });
      expect(host?.fitCheck?.warnings.join(" ")).toContain("pasta local sem Git");
    },
  },
  {
    name: "workspace-host-embutido",
    proves: "host embutido usa .governance-host sem confundir sidecar",
    assert: (state) => {
      const host = workspace(state).governanceHost;
      expect(host?.kind).toBe("existing-repo-folder");
      expect(host?.pathOrUrl).toBe("acme-monolito");
      expect(host?.fitCheck?.ok).toBe(true);
      expect(host?.fitCheck?.warnings.join(" ")).toContain("CODEOWNERS");
    },
  },
  {
    name: "workspace-local",
    proves: "modo local simples",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.mode).toBe("local");
      expect(ws.stack?.executionMode).toBe("local-process");
      expect(ws.stack?.operationalStore).toBe("files");
      expect(ws.stack?.graphReadModel.kind).toBe("none");
    },
  },
  {
    name: "workspace-shared",
    proves: "modo compartilhado com stack mínima",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.mode).toBe("shared");
      expect(ws.stack).toMatchObject({
        executionMode: "docker-compose",
        operationalStore: "sqlite",
        identityProvider: "local-auth",
      });
      expect(stackCompatibilityWarnings(ws.mode!, ws.stack!)).toHaveLength(0);
    },
  },
  {
    name: "workspace-controlled",
    proves: "modo controlado com identity provider",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.mode).toBe("controlled");
      expect(ws.stack).toMatchObject({
        executionMode: "docker-compose",
        operationalStore: "postgres",
        identityProvider: "oidc",
      });
    },
  },
  {
    name: "workspace-controlled-neo4j",
    proves: "Neo4j só aparece saudável com sourceRevision",
    assert: (state) => {
      const graph = workspace(state).stack?.graphReadModel;
      expect(graph).toMatchObject({
        kind: "neo4j",
        status: "healthy",
        sourceRevision: "seed00000003",
      });
    },
  },
  {
    name: "workspace-docker-compose",
    proves: "docker compose como execução compartilhada",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.mode).toBe("shared");
      expect(ws.stack?.executionMode).toBe("docker-compose");
      expect(ws.stack?.identityProvider).toBe("local-auth");
    },
  },
  {
    name: "workspace-docker-ollama-profile",
    proves: "perfil compose do assistente local não liga cloud por acidente",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.stack?.composeProfiles).toContain("assistant");
      expect(ws.assistantConfig?.providers).toContainEqual(
        expect.objectContaining({
          id: "prov-ollama-compose",
          kind: "ollama",
          egressApproved: false,
        })
      );
    },
  },
  {
    name: "workspace-groups-teams",
    proves: "papel de time gera authority derivada para membros",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.groups.map((item) => item.id)).toEqual(["grp-plataforma", "grp-sec-review"]);
      const authority = resolveWorkspaceAuthority(ws);
      expect(authority).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ personId: "person-bia", roleId: "technical-owner" }),
          expect.objectContaining({ personId: "person-caio", roleId: "technical-owner" }),
        ])
      );
    },
  },
  {
    name: "workspace-shared-convites",
    proves: "convites pendentes preservam token local",
    assert: (state) => {
      const invites = workspace(state).invites;
      expect(invites).toHaveLength(2);
      expect(invites).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "inv-dani", status: "pending", token: "seed-token-dani" }),
          expect.objectContaining({ id: "inv-edu", status: "pending", token: "seed-token-edu" }),
        ])
      );
    },
  },
  {
    name: "workspace-shared-github",
    proves: "GitHub OAuth como identity provider opcional",
    assert: (state) => {
      expect(workspace(state).stack?.identityProvider).toBe("github-oauth");
    },
  },
  {
    name: "workspace-shared-google",
    proves: "Google/OIDC como identity provider opcional",
    assert: (state) => {
      expect(workspace(state).stack?.identityProvider).toBe("google-oidc");
    },
  },
  {
    name: "workspace-controlled-oidc",
    proves: "modo controlado self-hosted com OIDC genérico",
    assert: (state) => {
      expect(workspace(state).stack).toMatchObject({
        executionMode: "self-hosted-server",
        operationalStore: "postgres",
        identityProvider: "oidc",
      });
    },
  },
  {
    name: "workspace-cloud-synced-folder",
    proves: "pasta sincronizada em nuvem é rebaixada",
    assert: (state) => {
      const source = workspace(state).workSources[0];
      expect(source).toMatchObject({
        kind: "cloud-synced-folder",
        status: "draft",
        sourceTrust: "cloud-sync-unverified",
      });
      expect(source?.limitations).toEqual(sourceTrustLimitations("cloud-sync-unverified"));
      expect(source?.lastScan?.cloudSyncProvider).toBe("google-drive");
    },
  },
  {
    name: "workspace-provider-versioned-source",
    proves: "fonte versionada por provider pode ser connected",
    assert: (state) => {
      const source = workspace(state).workSources[0];
      expect(source).toMatchObject({
        kind: "provider-versioned-source",
        provider: "figma",
        status: "connected",
        sourceTrust: "provider-versioned",
        providerVersionId: "version-9f2c",
      });
    },
  },
  {
    name: "workspace-compact-policy",
    proves: "perfil compact registra acúmulo sensível como visível",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.profileDeclaration).toMatchObject({
        profile: "compact",
        sensitiveAccumulationPolicy: "warn-review",
      });
      expect(ws.roleAssignments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ roleId: "sponsor", status: "self-assigned" }),
          expect.objectContaining({ roleId: "security-owner", status: "self-assigned" }),
        ])
      );
    },
  },
  {
    name: "workspace-multi-assistant",
    proves: "múltiplos assistentes e defaults por função",
    assert: (state) => {
      const assistant = workspace(state).assistantConfig;
      expect(assistant?.providers.map((item) => item.kind)).toEqual([
        "lexical-deterministic",
        "ollama",
        "openai-compatible",
      ]);
      expect(assistant?.defaults).toMatchObject({
        "suggest-matches": "prov-lexical",
        "explain-policy": "prov-ollama",
      });
      expect(assistant?.providers).toContainEqual(
        expect.objectContaining({
          id: "prov-ollama",
          lastHealth: expect.objectContaining({ status: "ok" }),
        })
      );
    },
  },
  {
    name: "workspace-with-integration-statuses",
    proves: "contratos de integração têm seed rica sem depender de UI pronta",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.governanceHost?.status).toBe("scaffolded");
      expect(ws.workSources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "src-local-api",
            status: "connected",
            sourceTrust: "provider-versioned",
          }),
          expect.objectContaining({
            id: "src-drive-evidence",
            status: "manual-evidence",
            sourceTrust: "cloud-sync-unverified",
          }),
        ])
      );
      expect(ws.integrations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "git-provider", status: "configured" }),
          expect.objectContaining({ id: "assistant-runtime-local", status: "configured" }),
          expect.objectContaining({ id: "observability", status: "disabled" }),
        ])
      );
    },
  },
  {
    name: "workspace-planning-progressivo",
    proves: "planejamento usa demo acme e workspace próprio explicitamente sandbox",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.onboardingStatus).toBe("finished");
      expect(ws.sandboxDeclared).toBe(true);
      expect(workspace(state, DEMO_WORKSPACE_ID).kind).toBe("sandbox-demo");
    },
  },
  {
    name: "workspace-github-work-source",
    proves: "GitHub work-source release-1 não finge conexão cloud pronta",
    assert: (state) => {
      const ws = workspace(state);
      expect(ws.workSources[0]).toMatchObject({
        kind: "github",
        adapterId: "git-provider",
        status: "draft",
        sourceTrust: "declared",
      });
      expect(ws.integrations).toContainEqual(
        expect.objectContaining({ id: "git-provider", status: "configured" })
      );
    },
  },
];

test("mock-api expõe somente seeds cobertas pela matriz E2E", async ({ request }) => {
  const response = await request.get(`${MOCK_API_URL}/__seeds`);
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { seeds: string[] };
  expect([...body.seeds].sort()).toEqual(CASES.map((item) => item.name).sort());
});

for (const seed of CASES) {
  test(`seed ${seed.name} — ${seed.proves}`, async ({ request }) => {
    const state = await loadSeed(request, seed.name);
    seed.assert(state);
  });
}

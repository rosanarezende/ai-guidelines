// seed-coverage.test.ts — matriz de regressão das seeds da mock-api.
// MIGRADO de Playwright (HTTP + __reset) para node:test: constrói cada seed via
// buildSeed() diretamente, sem servidor nem browser. Cada seed representa um
// estado inicial de produto; o teste prova que carrega, permanece tipada e
// preserva os invariantes que a UI/e2e assumem.
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_WORKSPACE_ID,
  resolveWorkspaceAuthority,
  sourceTrustLimitations,
  stackCompatibilityWarnings,
  type AdoptionState,
  type Workspace,
} from "../src/index.ts";
import { buildSeed, seedNames } from "@demo/test-fixtures";
import { arrayContainsExact, arrayContainsMatch, matchObject } from "./support/assert-match.ts";

type SeedCase = {
  name: string;
  proves: string;
  assert: (state: AdoptionState) => void;
};

function load(name: string): AdoptionState {
  const state = buildSeed(name);
  assert.ok(state, `seed ${name} deve construir`);
  return state;
}

function workspace(state: AdoptionState, id = "acme-honey"): Workspace {
  const found = state.workspaces.find((item) => item.id === id);
  assert.ok(found, `workspace ${id}`);
  return found;
}

function expectBasePrincipal(state: AdoptionState): void {
  assert.ok(state.principals.map((item) => item.id).includes("local-ana"));
  arrayContainsExact(state.memberships, {
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
      assert.equal(state.principals.length, 0);
      assert.equal(state.workspaces.length, 0);
      assert.equal(state.memberships.length, 0);
    },
  },
  {
    name: "empty-workspace",
    proves: "workspace novo ainda sem onboarding",
    assert: (state) => {
      expectBasePrincipal(state);
      const ws = workspace(state);
      assert.equal(ws.onboardingStatus, "not-started");
      arrayContainsExact(ws.people, { id: "person-ana", displayName: "Ana" });
    },
  },
  {
    name: "onboarding-partial",
    proves: "onboarding parcial persistido",
    assert: (state) => {
      const ws = workspace(state);
      assert.equal(ws.onboardingStatus, "partial");
      assert.equal(ws.onboardingPath, "guided");
      matchObject(ws.profileDeclaration, {
        profile: "solo",
        sensitiveAccumulationPolicy: "record",
      });
    },
  },
  {
    name: "acme-demo",
    proves: "demo acme anexada sem virar workspace real do usuario",
    assert: (state) => {
      assert.equal(workspace(state).kind, "company");
      assert.equal(workspace(state, DEMO_WORKSPACE_ID).kind, "sandbox-demo");
      arrayContainsExact(state.memberships, {
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
      assert.equal(ws.onboardingStatus, "partial");
      assert.equal(ws.governanceHost, undefined);
      assert.ok(!ws.sandboxDeclared);
    },
  },
  {
    name: "workspace-host-local",
    proves: "host local scaffolded com warnings visiveis",
    assert: (state) => {
      const host = workspace(state).governanceHost;
      matchObject(host, {
        kind: "local-folder",
        status: "scaffolded",
        pathOrUrl: "acme-honey-governance",
      });
      matchObject(host?.fitCheck, { manifestPresent: true, eventLogPresent: true, ok: true });
      assert.ok((host?.fitCheck?.warnings || []).join(" ").includes("pasta local sem Git"));
    },
  },
  {
    name: "workspace-host-embutido",
    proves: "host embutido usa .governance-host sem confundir sidecar",
    assert: (state) => {
      const host = workspace(state).governanceHost;
      assert.equal(host?.kind, "existing-repo-folder");
      assert.equal(host?.pathOrUrl, "acme-monolito");
      assert.equal(host?.fitCheck?.ok, true);
      assert.ok((host?.fitCheck?.warnings || []).join(" ").includes("CODEOWNERS"));
    },
  },
  {
    name: "workspace-local",
    proves: "modo local simples",
    assert: (state) => {
      const ws = workspace(state);
      assert.equal(ws.mode, "local");
      assert.equal(ws.stack?.executionMode, "local-process");
      assert.equal(ws.stack?.operationalStore, "files");
      assert.equal(ws.stack?.graphReadModel.kind, "none");
    },
  },
  {
    name: "workspace-shared",
    proves: "modo compartilhado com stack minima",
    assert: (state) => {
      const ws = workspace(state);
      assert.equal(ws.mode, "shared");
      matchObject(ws.stack, {
        executionMode: "docker-compose",
        operationalStore: "sqlite",
        identityProvider: "local-auth",
      });
      assert.equal(stackCompatibilityWarnings(ws.mode!, ws.stack!).length, 0);
    },
  },
  {
    name: "workspace-controlled",
    proves: "modo controlado com identity provider",
    assert: (state) => {
      const ws = workspace(state);
      assert.equal(ws.mode, "controlled");
      matchObject(ws.stack, {
        executionMode: "docker-compose",
        operationalStore: "postgres",
        identityProvider: "oidc",
      });
    },
  },
  {
    name: "workspace-controlled-neo4j",
    proves: "Neo4j so aparece saudavel com sourceRevision",
    assert: (state) => {
      matchObject(workspace(state).stack?.graphReadModel, {
        kind: "neo4j",
        status: "healthy",
        sourceRevision: "seed00000003",
      });
    },
  },
  {
    name: "workspace-docker-compose",
    proves: "docker compose como execucao compartilhada",
    assert: (state) => {
      const ws = workspace(state);
      assert.equal(ws.mode, "shared");
      assert.equal(ws.stack?.executionMode, "docker-compose");
      assert.equal(ws.stack?.identityProvider, "local-auth");
    },
  },
  {
    name: "workspace-docker-ollama-profile",
    proves: "perfil compose do assistente local nao liga cloud por acidente",
    assert: (state) => {
      const ws = workspace(state);
      assert.ok((ws.stack?.composeProfiles || []).includes("assistant"));
      arrayContainsMatch(ws.assistantConfig?.providers, [
        { id: "prov-ollama-compose", kind: "ollama", egressApproved: false },
      ]);
    },
  },
  {
    name: "workspace-groups-teams",
    proves: "papel de time gera authority derivada para membros",
    assert: (state) => {
      const ws = workspace(state);
      assert.deepEqual(
        ws.groups.map((item) => item.id),
        ["grp-plataforma", "grp-sec-review"]
      );
      arrayContainsMatch(resolveWorkspaceAuthority(ws), [
        { personId: "person-bia", roleId: "technical-owner" },
        { personId: "person-caio", roleId: "technical-owner" },
      ]);
    },
  },
  {
    name: "workspace-authority-personas",
    proves: "personas de teste usam principals distintos e authority derivada",
    assert: (state) => {
      const ws = workspace(state);
      const ids = state.principals.map((item) => item.id);
      for (const id of ["local-ana", "local-bia", "local-caio", "local-eva"]) {
        assert.ok(ids.includes(id), `principal ${id}`);
      }
      arrayContainsMatch(state.memberships, [
        { principalId: "local-bia", personId: "person-bia" },
        { principalId: "local-caio", personId: "person-caio" },
        { principalId: "local-eva", personId: "person-eva" },
      ]);
      arrayContainsMatch(ws.roleAssignments, [
        { roleId: "security-owner", status: "accepted" },
        { roleId: "sponsor", status: "accepted" },
        { roleId: "source-owner", status: "proposed" },
      ]);
    },
  },
  {
    name: "workspace-shared-convites",
    proves: "convites pendentes preservam token local",
    assert: (state) => {
      const invites = workspace(state).invites;
      assert.equal(invites.length, 2);
      arrayContainsMatch(invites, [
        { id: "inv-dani", status: "pending", token: "seed-token-dani" },
        { id: "inv-edu", status: "pending", token: "seed-token-edu" },
      ]);
    },
  },
  {
    name: "workspace-shared-github",
    proves: "GitHub OAuth como identity provider opcional",
    assert: (state) => {
      assert.equal(workspace(state).stack?.identityProvider, "github-oauth");
    },
  },
  {
    name: "workspace-shared-google",
    proves: "Google/OIDC como identity provider opcional",
    assert: (state) => {
      assert.equal(workspace(state).stack?.identityProvider, "google-oidc");
    },
  },
  {
    name: "workspace-controlled-oidc",
    proves: "modo controlado self-hosted com OIDC generico",
    assert: (state) => {
      matchObject(workspace(state).stack, {
        executionMode: "self-hosted-server",
        operationalStore: "postgres",
        identityProvider: "oidc",
      });
    },
  },
  {
    name: "workspace-cloud-synced-folder",
    proves: "pasta sincronizada em nuvem e rebaixada",
    assert: (state) => {
      const source = workspace(state).workSources[0];
      matchObject(source, {
        kind: "cloud-synced-folder",
        status: "draft",
        sourceTrust: "cloud-sync-unverified",
      });
      assert.deepEqual(source?.limitations, sourceTrustLimitations("cloud-sync-unverified"));
      assert.equal(source?.lastScan?.cloudSyncProvider, "google-drive");
    },
  },
  {
    name: "workspace-provider-versioned-source",
    proves: "fonte versionada por provider pode ser connected",
    assert: (state) => {
      matchObject(workspace(state).workSources[0], {
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
    proves: "perfil compact registra acumulo sensivel como visivel",
    assert: (state) => {
      const ws = workspace(state);
      matchObject(ws.profileDeclaration, {
        profile: "compact",
        sensitiveAccumulationPolicy: "warn-review",
      });
      arrayContainsMatch(ws.roleAssignments, [
        { roleId: "sponsor", status: "self-assigned" },
        { roleId: "security-owner", status: "self-assigned" },
      ]);
    },
  },
  {
    name: "workspace-multi-assistant",
    proves: "multiplos assistentes e defaults por funcao",
    assert: (state) => {
      const assistant = workspace(state).assistantConfig;
      assert.deepEqual(
        assistant?.providers.map((item) => item.kind),
        ["lexical-deterministic", "ollama", "openai-compatible"]
      );
      matchObject(assistant?.defaults, {
        "suggest-matches": "prov-lexical",
        "explain-policy": "prov-ollama",
      });
      const ollama = assistant?.providers.find((item) => item.id === "prov-ollama");
      assert.equal(ollama?.lastHealth?.status, "ok");
    },
  },
  {
    name: "workspace-with-integration-statuses",
    proves: "contratos de integracao tem seed rica sem depender de UI pronta",
    assert: (state) => {
      const ws = workspace(state);
      assert.equal(ws.governanceHost?.status, "scaffolded");
      arrayContainsMatch(ws.workSources, [
        { id: "src-local-api", status: "connected", sourceTrust: "provider-versioned" },
        {
          id: "src-drive-evidence",
          status: "manual-evidence",
          sourceTrust: "cloud-sync-unverified",
        },
      ]);
      arrayContainsMatch(ws.integrations, [
        { id: "git-provider", status: "configured" },
        { id: "assistant-runtime-local", status: "configured" },
        { id: "observability", status: "disabled" },
      ]);
    },
  },
  {
    name: "workspace-planning-progressivo",
    proves: "planejamento usa demo acme e workspace proprio explicitamente sandbox",
    assert: (state) => {
      const ws = workspace(state);
      assert.equal(ws.onboardingStatus, "finished");
      assert.equal(ws.sandboxDeclared, true);
      assert.equal(workspace(state, DEMO_WORKSPACE_ID).kind, "sandbox-demo");
    },
  },
  {
    name: "workspace-github-work-source",
    proves: "GitHub work-source release-1 nao finge conexao cloud pronta",
    assert: (state) => {
      const ws = workspace(state);
      matchObject(ws.workSources[0], {
        kind: "github",
        adapterId: "git-provider",
        status: "draft",
        sourceTrust: "declared",
      });
      arrayContainsMatch(ws.integrations, [{ id: "git-provider", status: "configured" }]);
    },
  },
];

test("mock-api expoe somente seeds cobertas pela matriz de regressao", () => {
  assert.deepEqual([...seedNames()].sort(), CASES.map((item) => item.name).sort());
});

for (const seed of CASES) {
  test(`seed ${seed.name} — ${seed.proves}`, () => {
    seed.assert(load(seed.name));
  });
}

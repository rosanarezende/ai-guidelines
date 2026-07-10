// security-journey.spec.ts — fronteira HTTP do shell de adoção.
// Prova que convite cria membership real e que membership comum não autoriza
// configuração sensível do workspace.
import { test, expect, type APIRequestContext, type APIResponse } from "@playwright/test";
import { MOCK_API_URL } from "../playwright.config.ts";

test.beforeEach(async ({ request }) => {
  const reset = await request.post(`${MOCK_API_URL}/__reset`, { data: { seed: "blank" } });
  expect(reset.ok()).toBeTruthy();
});

async function createSignedWorkspace(request: APIRequestContext) {
  const signup = await request.post("/api/local/signup", {
    data: { displayName: "Ana Admin" },
  });
  expect(signup.ok()).toBeTruthy();
  const org = await request.post("/api/local/organizations", {
    data: { name: "Acme Honey", kind: "company" },
  });
  expect(org.ok()).toBeTruthy();
  return org;
}

async function expectSchemaInvalid(response: APIResponse, path?: string) {
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { error?: string; issues?: Array<{ path?: string }> };
  expect(body.error).toBe("schema-invalid");
  if (path) {
    expect(body.issues?.some((issue) => issue.path === path)).toBeTruthy();
  } else {
    expect(body.issues?.length || 0).toBeGreaterThan(0);
  }
}

test("convite tokenizado cria membership e não concede authority sensível", async ({ browser }) => {
  const admin = await browser.newContext();
  const adminApi = admin.request;

  const signupAdmin = await adminApi.post("/api/local/signup", {
    data: { displayName: "Ana Admin", email: "ana@example.test" },
  });
  expect(signupAdmin.ok()).toBeTruthy();

  const org = await adminApi.post("/api/local/organizations", {
    data: { name: "Acme Honey", kind: "company" },
  });
  expect(org.ok()).toBeTruthy();
  const { workspace } = (await org.json()) as { workspace: { id: string } };

  const inviteResponse = await adminApi.post("/api/local/members", {
    data: { personName: "Bia Member", email: "bia@example.test" },
  });
  expect(inviteResponse.ok()).toBeTruthy();
  const { invite } = (await inviteResponse.json()) as {
    invite: { id: string; token: string };
  };

  const member = await browser.newContext();
  const memberApi = member.request;
  const signupMember = await memberApi.post("/api/local/signup", {
    data: { displayName: "Bia Member", email: "bia@example.test" },
  });
  expect(signupMember.ok()).toBeTruthy();

  const accept = await memberApi.post(`/api/local/members/invites/${invite.id}`, {
    data: { action: "accept", token: invite.token },
  });
  expect(accept.ok()).toBeTruthy();

  const select = await memberApi.post("/api/local/organizations/select", {
    data: { workspaceId: workspace.id },
  });
  expect(select.ok()).toBeTruthy();

  const forbidden = await memberApi.post("/api/local/onboarding/profile", {
    data: {
      profile: "full",
      sensitiveAccumulationPolicy: "block",
      reason: "tentativa sem authority",
    },
  });
  expect(forbidden.status()).toBe(422);
  await expect(forbidden.json()).resolves.toMatchObject({
    ok: false,
    error: "missing-authority",
  });

  await admin.close();
  await member.close();
});

test("onboarding finished bloqueia sem host ou sandbox explícito", async ({ request }) => {
  const signup = await request.post("/api/local/signup", {
    data: { displayName: "Ana Admin", email: "ana@example.test" },
  });
  expect(signup.ok()).toBeTruthy();
  const org = await request.post("/api/local/organizations", {
    data: { name: "Acme Honey", kind: "company" },
  });
  expect(org.ok()).toBeTruthy();

  const finish = await request.post("/api/local/onboarding/status", {
    data: { status: "finished" },
  });
  expect(finish.status()).toBe(422);
  const body = (await finish.json()) as { error?: string };
  expect(body.error || "").toContain("onboarding-incomplete");
});

// Camada de rota real (HTTP, sem browser): a casca da rota — sessão e parse de
// JSON — só é provada aqui. O contrato de comando (authority/replay/isolamento)
// vive no layer in-memory da mock-api (mock-api/tests/api-commands.test.ts).
test("rota /api/local sem sessão retorna 401 no-session (fail-closed)", async ({ request }) => {
  const response = await request.post("/api/local/onboarding/profile", {
    data: { profile: "solo", sensitiveAccumulationPolicy: "record" },
  });
  expect(response.status()).toBe(401);
  const body = (await response.json()) as { error?: string };
  expect(body.error).toBe("no-session");
});

test("rota /api/local com sessão mas JSON inválido retorna 400 invalid-json", async ({
  request,
}) => {
  const signup = await request.post("/api/local/signup", {
    data: { displayName: "Ana Admin" },
  });
  expect(signup.ok()).toBeTruthy();
  const org = await request.post("/api/local/organizations", {
    data: { name: "Acme Honey", kind: "company" },
  });
  expect(org.ok()).toBeTruthy();

  // Buffer envia bytes crus: Playwright NAO re-serializa (uma string com
  // content-type json viraria um JSON string valido e passaria do parse).
  const response = await request.post("/api/local/onboarding/profile", {
    headers: { "content-type": "application/json" },
    data: Buffer.from("{ nao-e-json-valido"),
  });
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { error?: string };
  expect(body.error).toBe("invalid-json");
});

test("rota /api/local/onboarding/profile valida payload por Zod antes do use case", async ({
  request,
}) => {
  const signup = await request.post("/api/local/signup", {
    data: { displayName: "Ana Admin" },
  });
  expect(signup.ok()).toBeTruthy();
  const org = await request.post("/api/local/organizations", {
    data: { name: "Acme Honey", kind: "company" },
  });
  expect(org.ok()).toBeTruthy();

  const response = await request.post("/api/local/onboarding/profile", {
    data: {
      profile: "enterprise",
      sensitiveAccumulationPolicy: "record",
      extra: "campo nao previsto",
    },
  });
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { error?: string; issues?: Array<{ path?: string }> };
  expect(body.error).toBe("schema-invalid");
  expect(body.issues?.some((issue) => issue.path === "profile")).toBeTruthy();
});

test("rota /api/local/onboarding/stack valida payload por Zod antes do use case", async ({
  request,
}) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/onboarding/stack", {
    data: {
      stack: {
        executionMode: "lambda",
        graphReadModel: { kind: "neo4j", extra: "campo nao previsto" },
      },
    },
  });
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { error?: string; issues?: Array<{ path?: string }> };
  expect(body.error).toBe("schema-invalid");
  expect(body.issues?.some((issue) => issue.path === "stack.executionMode")).toBeTruthy();
});

test("rota /api/local/members valida convite por Zod antes do use case", async ({ request }) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/members", {
    data: { personName: "Bia Member", email: "email-invalido" },
  });
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { error?: string; issues?: Array<{ path?: string }> };
  expect(body.error).toBe("schema-invalid");
  expect(body.issues?.some((issue) => issue.path === "email")).toBeTruthy();
});

test("rota /api/local/members/groups valida grupo por Zod antes do use case", async ({
  request,
}) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/members/groups", {
    data: { kind: "chapter", name: "Time Produto", memberPersonIds: ["person-1"] },
  });
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { error?: string; issues?: Array<{ path?: string }> };
  expect(body.error).toBe("schema-invalid");
  expect(body.issues?.some((issue) => issue.path === "kind")).toBeTruthy();
});

test("rota /api/local/members/invites/[id] valida decisao por Zod antes do use case", async ({
  request,
}) => {
  const response = await request.post("/api/local/members/invites/inv-test", {
    data: { action: "approve", token: "12345678" },
  });
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { error?: string; issues?: Array<{ path?: string }> };
  expect(body.error).toBe("schema-invalid");
  expect(body.issues?.some((issue) => issue.path === "action")).toBeTruthy();
});

test("rota /api/local/roles valida atribuicao por Zod antes do use case", async ({ request }) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/roles", {
    data: { subject: { kind: "robot", id: "person-1" }, roleId: "workspace-admin" },
  });
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { error?: string; issues?: Array<{ path?: string }> };
  expect(body.error).toBe("schema-invalid");
  expect(body.issues?.some((issue) => issue.path === "subject.kind")).toBeTruthy();
});

test("rota /api/local/roles/[id] valida decisao por Zod antes do use case", async ({ request }) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/roles/role-test", {
    data: { action: "approve" },
  });
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { error?: string; issues?: Array<{ path?: string }> };
  expect(body.error).toBe("schema-invalid");
  expect(body.issues?.some((issue) => issue.path === "action")).toBeTruthy();
});

test("rota /api/local/signup valida conta por Zod antes do use case", async ({ request }) => {
  const response = await request.post("/api/local/signup", {
    data: { displayName: "A", email: "email-invalido" },
  });
  await expectSchemaInvalid(response, "displayName");
});

test("rota /api/local/organizations valida criacao por Zod antes do use case", async ({
  request,
}) => {
  const signup = await request.post("/api/local/signup", {
    data: { displayName: "Ana Admin" },
  });
  expect(signup.ok()).toBeTruthy();

  const response = await request.post("/api/local/organizations", {
    data: { name: "Acme Honey", kind: "sandbox-demo" },
  });
  await expectSchemaInvalid(response);
});

test("rota /api/local/organizations/select valida workspace por Zod antes do use case", async ({
  request,
}) => {
  const signup = await request.post("/api/local/signup", {
    data: { displayName: "Ana Admin" },
  });
  expect(signup.ok()).toBeTruthy();

  const response = await request.post("/api/local/organizations/select", {
    data: { workspaceId: "" },
  });
  await expectSchemaInvalid(response, "workspaceId");
});

test("rota /api/local/governance-host valida action/kind por Zod antes do use case", async ({
  request,
}) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/governance-host", {
    data: { action: "create", kind: "workspace-folder", pathOrUrl: "C:/tmp/acme" },
  });
  await expectSchemaInvalid(response, "kind");
});

test("rota /api/local/work-sources valida fonte por Zod antes do use case", async ({ request }) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/work-sources", {
    data: { kind: "jira", label: "Fonte externa" },
  });
  await expectSchemaInvalid(response, "kind");
});

test("rota /api/local/work-sources/[id]/scan valida corpo vazio por Zod", async ({ request }) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/work-sources/src-test/scan", {
    data: { unexpected: true },
  });
  await expectSchemaInvalid(response, "");
});

test("rota /api/local/work-sources/[id]/browser-scan valida snapshot por Zod", async ({
  request,
}) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/work-sources/src-test/browser-scan", {
    data: { scan: { fileCount: -1, contentHash: "bad" } },
  });
  await expectSchemaInvalid(response, "scan.fileCount");
});

test("rota /api/local/assistant valida provider por Zod antes do use case", async ({ request }) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/assistant", {
    data: { kind: "agent-cloud", endpoint: "http://127.0.0.1:11434" },
  });
  await expectSchemaInvalid(response);
});

test("rota /api/local/assistant/defaults valida funcao por Zod antes do use case", async ({
  request,
}) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/assistant/defaults", {
    data: { function: "rewrite-policy", providerId: "prov-1" },
  });
  await expectSchemaInvalid(response, "function");
});

test("rota /api/local/assistant/test valida endpoint por Zod antes do use case", async ({
  request,
}) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/assistant/test", {
    data: { kind: "ollama", endpoint: "not a url" },
  });
  await expectSchemaInvalid(response, "endpoint");
});

test("rota /api/local/integrations/[id] valida status por Zod antes do use case", async ({
  request,
}) => {
  await createSignedWorkspace(request);

  const response = await request.post("/api/local/integrations/git-provider", {
    data: { status: "enabled" },
  });
  await expectSchemaInvalid(response, "status");
});

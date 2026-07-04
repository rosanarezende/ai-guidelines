// security-journey.spec.ts — fronteira HTTP do shell de adoção.
// Prova que convite cria membership real e que membership comum não autoriza
// configuração sensível do workspace.
import { test, expect } from "@playwright/test";
import { MOCK_API_URL } from "../playwright.config.ts";

test.beforeEach(async ({ request }) => {
  const reset = await request.post(`${MOCK_API_URL}/__reset`, { data: { seed: "blank" } });
  expect(reset.ok()).toBeTruthy();
});

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

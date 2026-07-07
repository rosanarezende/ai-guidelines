import { expect, request as requestFactory, test } from "@playwright/test";
import { MOCK_API_URL } from "../playwright.config.ts";

test.beforeEach(async ({ request }) => {
  const reset = await request.post(`${MOCK_API_URL}/__reset`, { data: { seed: "blank" } });
  expect(reset.ok()).toBeTruthy();
});

test("APP-45 Better Auth cria conta, workspace, convite e aceite sem conceder authority", async () => {
  const creator = await requestFactory.newContext({ baseURL: "http://127.0.0.1:3024" });
  const invitee = await requestFactory.newContext({ baseURL: "http://127.0.0.1:3024" });
  try {
    const creatorSignup = await creator.post("/api/auth/sign-up/email", {
      data: {
        email: "portal-creator@example.com",
        password: "correct horse battery staple",
        name: "Portal Creator",
      },
    });
    expect(creatorSignup.ok()).toBeTruthy();

    const creatorBridge = await creator.post("/api/local/auth/bridge", { data: {} });
    expect(creatorBridge.ok()).toBeTruthy();
    await expectPortalPrincipal(creatorBridge);

    const org = await creator.post("/api/local/organizations", {
      data: { name: "Portal Team", kind: "company" },
    });
    expect(org.ok()).toBeTruthy();
    const orgBody = (await org.json()) as { workspace: { id: string } };
    expect(orgBody.workspace.id).toBe("portal-team");

    const invite = await creator.post("/api/local/members", {
      data: { personName: "Bia Partner", email: "portal-invitee@example.com" },
    });
    expect(invite.ok()).toBeTruthy();
    const inviteBody = (await invite.json()) as {
      invite: { id: string; token: string; portalInvitationId?: string };
    };
    expect(inviteBody.invite.portalInvitationId).toBeTruthy();

    const inviteeSignup = await invitee.post("/api/auth/sign-up/email", {
      data: {
        email: "portal-invitee@example.com",
        password: "correct horse battery staple",
        name: "Bia Partner",
      },
    });
    expect(inviteeSignup.ok()).toBeTruthy();

    const inviteeBridge = await invitee.post("/api/local/auth/bridge", { data: {} });
    expect(inviteeBridge.ok()).toBeTruthy();
    await expectPortalPrincipal(inviteeBridge);

    const accept = await invitee.post(`/api/local/members/invites/${inviteBody.invite.id}`, {
      data: { action: "accept", token: inviteBody.invite.token },
    });
    expect(accept.ok()).toBeTruthy();
    const acceptBody = (await accept.json()) as { people: Array<{ email?: string }> };
    expect(acceptBody.people.some((person) => person.email === "portal-invitee@example.com")).toBe(
      true
    );

    const select = await invitee.post("/api/local/organizations/select", {
      data: { workspaceId: orgBody.workspace.id },
    });
    expect(select.ok()).toBeTruthy();

    const roles = await invitee.get("/api/local/roles");
    expect(roles.ok()).toBeTruthy();
    const rolesBody = (await roles.json()) as { authority: unknown[] };
    expect(rolesBody.authority).toEqual([]);
  } finally {
    await creator.dispose();
    await invitee.dispose();
  }
});

async function expectPortalPrincipal(response: { json(): Promise<unknown> }) {
  const body = (await response.json()) as {
    principal?: { id?: string; identityProvider?: string };
  };
  expect(body.principal?.id).toMatch(/^portal-/);
  expect(body.principal?.identityProvider).toBe("better-auth");
}

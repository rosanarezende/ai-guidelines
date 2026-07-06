import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Settings, membros, papeis e assistentes", () => {
  test("APP-07 pessoas, times e papeis sao modelados por sujeito", async ({ page, request }) => {
    await openWorkspace(page, request, "workspace-groups-teams", "/settings");
    await expect(page.getByTestId("people-list")).toContainText("Ana");
    await expect(page.getByTestId("groups-list")).toContainText(/time|grupo/i);
    await page.getByTestId("role-assignment-person").click();
    await page.getByTestId("role-source-owner").click();
    await page.getByTestId("role-assign-submit").click();
    await expect(page.getByTestId("role-assignment-status")).toContainText(/proposed|pendente/i);
    await expect(page.getByTestId("effective-authority-panel")).not.toContainText("source-owner");
  });

  test("APP-10 assistente/modelo e opcional, multi-provider e seguro", async ({
    page,
    request,
  }) => {
    await openWorkspace(page, request, "workspace-multi-assistant", "/settings");
    await expect(page.getByTestId("assistant-provider-list")).toBeVisible();
    await page.getByTestId("assistant-provider-ollama").click();
    await page.getByTestId("assistant-health-check").click();
    await expect(page.getByTestId("assistant-health-result")).toContainText(
      /ok|unavailable|limited/i
    );

    await page.getByTestId("assistant-provider-cloud").click();
    await expect(page.getByTestId("egress-approval-required")).toBeVisible();
    await expect(page.getByTestId("assistant-active-status")).not.toContainText(/connected|ativo/i);
  });

  test("APP-15 Settings de organizacao espelha onboarding", async ({ page, request }) => {
    await openWorkspace(page, request, "workspace-compact-policy", "/settings");
    const profile = page.getByTestId("settings-governance-profile");
    await expect(profile).toContainText(/compact|time enxuto/i);
    await expect(page.getByTestId("settings-sensitive-policy")).toContainText(
      /record|review|avisa/i
    );
    await page.goto("/");
    await expect(page.getByTestId("home-governance-profile")).toContainText(/compact|time enxuto/i);
  });

  test("APP-16 Settings gerencia pessoas, grupos, convites e roles", async ({ page, request }) => {
    await openWorkspace(page, request, "workspace-shared-convites", "/settings");
    await page.getByTestId("invite-create-name").fill("Bia Produto");
    await page.getByTestId("invite-create-email").fill("bia@example.test");
    await page.getByTestId("invite-create-submit").click();
    await expect(page.getByTestId("invite-token")).toBeVisible();
    await page.getByTestId("invite-revoke").click();
    await expect(page.getByTestId("invite-status")).toContainText(/revoked|revogado/i);
  });

  test("APP-19 Settings de assistente mostra provider/defaults reais", async ({
    page,
    request,
  }) => {
    pendingContract("APP-19", "fixme");

    await openWorkspace(page, request, "workspace-multi-assistant", "/settings");
    await expect(page.getByTestId("assistant-default-explain-policy")).toBeVisible();
    await expect(page.getByTestId("assistant-default-triage")).toBeVisible();
    await page.goto("/integrations");
    await expect(page.getByTestId("integration-card-assistant-runtime")).toBeVisible();
  });
});

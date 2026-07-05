import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Seguranca, authority e fail-closed", () => {
  test("SEC-01 provider cloud nao ativa sem egress/authority", async ({ page, request }) => {
    pendingContract("SEC-01");

    await openWorkspace(page, request, "workspace-controlled", "/integrations");
    await page.getByTestId("integration-card-cloud-assistant").click();
    await page.getByTestId("integration-request-activation").click();
    await expect(page.getByTestId("integration-activation-status")).toContainText(
      /blocked|pending/i
    );
    await expect(page.getByTestId("integration-approval-required")).toContainText(
      /security|egress/i
    );
  });

  test("SEC-02 read-model derivado nao autoriza acao stale", async ({ page, request }) => {
    pendingContract("SEC-02");

    await openWorkspace(page, request, "demo-acme", "/map", "sandbox-demo");
    await page.getByTestId("map-node-outcome").click();
    await page.getByTestId("derived-action-open").click();
    await page.getByTestId("simulate-stale-revision").click();
    await page.getByTestId("derived-action-confirm").click();
    await expect(page.getByTestId("command-error")).toContainText(/stale|revision|refresh/i);
  });

  test("SEC-03 authority nunca deriva apenas de login externo", async ({ page, request }) => {
    pendingContract("SEC-03");

    await openWorkspace(page, request, "workspace-shared-github", "/settings");
    await expect(page.getByTestId("identity-provider-status")).toContainText(/GitHub/i);
    await expect(page.getByTestId("effective-authority-panel")).not.toContainText(
      /sponsor|security-owner/i
    );
    await page.goto("/integrations");
    await expect(page.getByTestId("github-authority-warning")).toContainText(
      /nao concede authority/i
    );
  });
});

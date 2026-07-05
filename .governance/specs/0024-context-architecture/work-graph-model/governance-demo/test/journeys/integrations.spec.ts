import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Integracoes como produto", () => {
  test("APP-11 onboarding mostra integracoes como opcionais e contextuais", async ({
    page,
    request,
  }) => {
    pendingContract("APP-11", "fixme");

    await openWorkspace(page, request, "workspace-with-integration-statuses", "/onboarding");
    await page.getByTestId("onboarding-step-integrations").click();
    await expect(page.getByTestId("integration-status-release-1")).toBeVisible();
    await expect(page.getByTestId("integration-manual-alternative")).toBeVisible();
  });

  test("APP-20 Settings resume integracoes e aponta para hub", async ({ page, request }) => {
    pendingContract("APP-20", "fixme");

    await openWorkspace(page, request, "workspace-with-integration-statuses", "/settings");
    await expect(page.getByTestId("settings-integration-summary")).toBeVisible();
    await page.getByTestId("settings-open-integrations-hub").click();
    await expect(page).toHaveURL(/\/integrations/);
  });

  test("INT-01 hub compara providers por valor, permissao e risco", async ({ page, request }) => {
    pendingContract("INT-01", "fixme");

    await openWorkspace(page, request, "workspace-with-integration-statuses", "/integrations");
    await expect(page.getByTestId("integration-filter-available")).toBeVisible();
    await expect(page.getByTestId("integration-card-github-work-source")).toContainText(/permiss/i);
    await expect(page.getByTestId("integration-card-github-work-source")).toContainText(
      /sem esta integracao/i
    );
    await expect(page.getByTestId("integration-card-cloud-assistant")).not.toContainText(
      /connected|ativo/i
    );
  });

  test("INT-02 sugestoes contextuais aparecem no fluxo certo", async ({ page, request }) => {
    pendingContract("INT-02", "fixme");

    await openWorkspace(page, request, "workspace-with-integration-statuses", "/sources");
    await expect(page.getByTestId("contextual-integration-github-work-source")).toBeVisible();
    await page.goto("/results");
    await expect(page.getByTestId("contextual-integration-observability")).toBeVisible();
    await page.goto("/work");
    await expect(page.getByTestId("contextual-integration-ci-code-quality")).toBeVisible();
  });

  test("INT-03 GitHub work-source nao se confunde com GitHub login", async ({ page, request }) => {
    pendingContract("INT-03", "fixme");

    await openWorkspace(page, request, "workspace-github-work-source", "/integrations");
    await expect(page.getByTestId("github-login-status")).toContainText(/identity|login/i);
    await expect(page.getByTestId("github-work-source-status")).toContainText(/repos|source/i);
    await expect(page.getByTestId("github-authority-warning")).toContainText(
      /nao concede authority/i
    );
  });
});

import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Execucao, repo-work e contratos", () => {
  test("APP-26 Work mostra repo-work, status, ack e evidencia", async ({ page, request }) => {
    await openWorkspace(page, request, "acme-demo", "/work", "demo-acme");
    await expect(page.getByTestId("repo-work-list")).toBeVisible();
    await page.getByTestId("repo-work-filter-blocked").click();
    await expect(page.getByTestId("repo-work-card").first()).toContainText(
      /owner|status|evidencia/i
    );
    await page.getByTestId("repo-work-open-evidence").first().click();
    await expect(page.getByTestId("work-evidence-panel")).toContainText(
      /test|commit|verification/i
    );
  });

  test("APP-27 Contracts mostra owner, consumers, janela e contention", async ({
    page,
    request,
  }) => {
    await openWorkspace(page, request, "acme-demo", "/contracts", "demo-acme");
    await expect(page.getByTestId("contract-list")).toContainText(/owner|consumer|revision/i);
    await page.getByTestId("contract-acme-user-context").click();
    await expect(page.getByTestId("contract-compatibility-window")).toBeVisible();
    await expect(page.getByTestId("contract-contention-panel")).toContainText(/intent|decision/i);
    await page.goto("/map");
    await expect(page.getByTestId("map-contract-impact")).toBeVisible();
  });
});

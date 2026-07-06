import { expect, test } from "@playwright/test";
import {
  expectConsistentText,
  openWorkspace,
  pendingContract,
} from "./support/contract-fixtures.ts";

test.describe("Consistencia entre telas", () => {
  test("CONS-01 perfil escolhido aparece igual em onboarding, Home e Settings", async ({
    page,
    request,
  }) => {
    pendingContract("CONS-01", "expected-fail");

    await openWorkspace(page, request, "workspace-compact-policy", "/");
    await expectConsistentText(page, ["/", "/settings", "/onboarding"], /compact|time enxuto/i);
  });

  test("CONS-02 fonte adicionada aparece igual em Sources, Settings e Home", async ({
    page,
    request,
  }) => {
    await openWorkspace(page, request, "workspace-provider-versioned-source", "/sources");
    const sourceName = await page.getByTestId("source-card-primary-name").innerText();
    await expectConsistentText(page, ["/sources", "/settings", "/"], sourceName);
  });

  test("CONS-03 integracao conectada aparece igual no hub, Settings e sugestoes", async ({
    page,
    request,
  }) => {
    pendingContract("CONS-03", "fixme");

    await openWorkspace(page, request, "workspace-with-integration-statuses", "/integrations");
    await expect(page.getByTestId("integration-card-git-local")).toContainText(
      /disponivel|connected/i
    );
    await page.goto("/settings");
    await expect(page.getByTestId("settings-integration-summary")).toContainText(/git/i);
    await page.goto("/sources");
    await expect(page.getByTestId("contextual-integration-git-local")).toBeVisible();
  });
});

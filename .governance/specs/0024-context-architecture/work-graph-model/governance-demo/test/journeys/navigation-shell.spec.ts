import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Navegacao global e shell", () => {
  test("APP-35 navegacao global organiza fluxo sem virar console tecnico", async ({
    page,
    request,
  }) => {
    pendingContract("APP-35", "fixme");

    await openWorkspace(page, request, "empty-workspace", "/");

    await expect(page.getByTestId("global-navigation")).toBeVisible();
    await expect(page.getByTestId("global-navigation-primary")).toContainText(/configuracao/i);
    await expect(page.getByTestId("global-navigation-primary")).toContainText(/fontes/i);
    await expect(page.getByTestId("global-navigation-primary")).toContainText(/resultados|mapa/i);
    await expect(page.getByTestId("global-navigation-technical")).toContainText(/console/i);
    await expect(page.getByTestId("cup-launcher")).toBeVisible();
    await expect(page.getByTestId("global-navigation")).not.toContainText(/acme-demo/i);
  });
});

import { expect, test } from "@playwright/test";
import { openWorkspace, resetSeed } from "./support/contract-fixtures.ts";

const PROTECTED_ROUTES = ["/work", "/contracts", "/audit", "/integrations"] as const;

test.describe("Route gates de produto", () => {
  test("rotas operacionais sem sessão voltam para entrada", async ({ page, request }) => {
    await resetSeed(request, "blank");

    for (const route of PROTECTED_ROUTES) {
      await page.goto(route);
      await expect(page, route).toHaveURL(/\/(login|signup)$/);
    }
  });

  test("workspace real sem demo não vaza read-model da Acme em contratos/auditoria", async ({
    page,
    request,
  }) => {
    for (const route of ["/contracts", "/audit"] as const) {
      await openWorkspace(page, request, "empty-workspace", route);
      await expect(page.locator("body"), route).not.toContainText(
        /acme-user-context|checkout-stack/i
      );
      await expect(page.locator("body"), route).toContainText(/host|read-model|governance/i);
    }
  });
});

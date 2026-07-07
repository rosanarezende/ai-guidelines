import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Auth real e escopo de cache", () => {
  test("APP-46 Better Auth escopa cache TanStack por sessao/workspace", async ({
    page,
    request,
  }) => {
    pendingContract("APP-46", "expected-fail");

    await openWorkspace(page, request, "workspace-shared-convites", "/organizations");

    await expect(page.getByTestId("auth-provider-better-auth")).toContainText(/next\.js/i);
    await expect(page.getByTestId("auth-provider-better-auth")).not.toContainText(
      /tanstack start/i
    );

    await page.getByTestId("accept-invite-as-member").click();
    await expect(page.getByTestId("portal-membership-status")).toContainText(/accepted/i);
    await expect(page.getByTestId("governance-authority-status")).toContainText(
      /sem authority governada/i
    );

    await page.getByTestId("workspace-switcher").click();
    await page.getByTestId("workspace-option-empty").click();
    await expect(page.getByTestId("query-cache-scope")).toContainText(/workspace/i);
    await expect(page.getByTestId("query-cache-scope")).toContainText(/session/i);
    await expect(page.getByTestId("cross-workspace-cache-warning")).not.toBeVisible();

    await page.getByTestId("logout-button").click();
    await expect(page.getByTestId("tanstack-cache-cleared")).toBeVisible();
  });
});

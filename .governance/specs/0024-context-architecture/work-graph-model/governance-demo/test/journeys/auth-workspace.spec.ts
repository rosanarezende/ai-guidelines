import { expect, test } from "@playwright/test";
import { expectNoAcmeDemoLeak, openWorkspace, resetSeed } from "./support/contract-fixtures.ts";

test.describe("Auth, workspace e shell", () => {
  test("APP-02 cria workspace novo sem vazar dados da demo", async ({ page, request }) => {
    await resetSeed(request, "blank");
    await page.goto("/");
    await expect(page).toHaveURL(/\/signup$/);
    await page.getByTestId("signup-display-name").fill("Ana Admin");
    await page.getByTestId("signup-submit").click();
    await expect(page).toHaveURL(/\/organizations$/);

    await page.getByTestId("workspace-create-name").fill("Mundo da Mel");
    await page.getByTestId("workspace-kind-company").click();
    await page.getByTestId("workspace-create-submit").click();

    await expect(page).toHaveURL(/\/onboarding$/);
    await expectNoAcmeDemoLeak(page);

    await page.goto("/");
    await expect(page).toHaveURL(/\/onboarding$/);
    await expectNoAcmeDemoLeak(page);

    await page.goto("/settings");
    await expect(page.getByTestId("settings-workspace-name")).toContainText("Mundo da Mel");
    await expectNoAcmeDemoLeak(page);

    await page.goto("/console");
    await expect(page.getByTestId("console-unavailable")).toBeVisible();
    await expectNoAcmeDemoLeak(page);
  });

  test("APP-13 Home de workspace parcial mostra proximo passo real", async ({ page, request }) => {
    await openWorkspace(page, request, "onboarding-partial", "/");
    await expect(page.getByTestId("home-next-safe-step")).toBeVisible();
    await expect(page.getByTestId("home-next-safe-step")).toContainText(/onboarding|host|fonte/i);
    await expect(page.getByTestId("home-technical-console-card")).toContainText(
      /indispon.vel|configur/i
    );
  });

  test("APP-14 demo acme permanece explicitamente demo", async ({ page, request }) => {
    await openWorkspace(page, request, "acme-demo", "/organizations", "demo-acme");
    await expect(page.getByTestId("workspace-demo-badge")).toBeVisible();
    await page.goto("/");
    await expect(page.getByTestId("home-demo-banner")).toContainText(/demo|sandbox/i);
    await page.goto("/organizations");
    await page.getByTestId("workspace-switcher").click();
    await expect(page.getByTestId("workspace-real-list")).toBeVisible();
  });
});

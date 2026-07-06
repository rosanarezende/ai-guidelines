import { expect, test } from "@playwright/test";
import { openWorkspace } from "./support/contract-fixtures.ts";

test.describe("Onboarding como contrato funcional", () => {
  test("APP-05 perfil e responsabilidades guiam recomendacao compreensivel", async ({
    page,
    request,
  }) => {
    await openWorkspace(page, request, "empty-workspace", "/onboarding");
    await page.getByTestId("onboarding-start").click();
    await page.getByTestId("org-size-up-to-5").click();
    await page.getByTestId("responsibility-collapsed").click();
    await page.getByTestId("sensitive-policy-review").click();
    await expect(page.getByTestId("profile-recommendation-card")).toContainText(/time enxuto/i);
    await expect(page.getByTestId("profile-policy-impact")).toContainText(/revisao|avisa/i);

    const profileSave = page.waitForResponse((response) =>
      response.url().includes("/api/local/onboarding/profile")
    );
    await page.getByTestId("onboarding-save-profile").click();
    const profileSaveResponse = await profileSave;
    expect(profileSaveResponse.ok()).toBeTruthy();
    await expect(profileSaveResponse.json()).resolves.toMatchObject({ ok: true });
    await expect(page.getByText("Papéis e responsáveis")).toBeVisible();
    await page.goto("/settings");
    await expect(page.getByTestId("settings-governance-profile")).toContainText(
      /time enxuto|compact/i
    );
    await page.goto("/");
    await expect(page.getByTestId("home-governance-profile")).toContainText(/time enxuto|compact/i);
  });

  test("APP-06 responsabilidades aparecem somente quando fazem sentido", async ({
    page,
    request,
  }) => {
    await openWorkspace(page, request, "empty-workspace", "/onboarding");
    await page.getByTestId("onboarding-start").click();
    await page.getByTestId("org-size-solo").click();
    await expect(page.getByTestId("role-separation-question")).toHaveCount(0);
    await expect(page.getByTestId("solo-profile-explanation")).toBeVisible();

    await page.getByTestId("change-profile-answers").click();
    await page.getByTestId("org-size-more-than-20").click();
    await expect(page.getByTestId("role-separation-question")).toBeVisible();
    await expect(page.getByTestId("sod-explanation")).toBeVisible();
  });

  test("APP-12 revisao final do onboarding e honesta", async ({ page, request }) => {
    await openWorkspace(page, request, "workspace-host-local", "/onboarding");
    await page.getByTestId("onboarding-review-step").click();
    await expect(page.getByTestId("onboarding-review-ready")).toContainText(
      /já funciona|ja funciona/i
    );
    await expect(page.getByTestId("onboarding-review-warnings")).toContainText(
      /pendente|rebaixado/i
    );
    await page.getByTestId("onboarding-finish").click();

    await page.goto("/");
    await expect(page.getByTestId("home-onboarding-complete")).toBeVisible();
    await expect(page.getByTestId("home-continue-onboarding")).toHaveCount(0);
  });
});

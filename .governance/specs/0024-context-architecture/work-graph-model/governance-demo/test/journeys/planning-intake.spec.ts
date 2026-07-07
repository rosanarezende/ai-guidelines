import { expect, test } from "@playwright/test";
import { openWorkspace } from "./support/contract-fixtures.ts";

test.describe("Planejamento e intake", () => {
  test("APP-22 planejamento cria ciclo, objetivo, metrica e target", async ({ page, request }) => {
    await openWorkspace(page, request, "workspace-planning-progressivo", "/planning");
    await page.getByTestId("planning-cycle-create").click();
    await page.getByTestId("objective-title").fill("Aumentar ativacao");
    await page.getByTestId("metric-definition").fill("activation-rate");
    await page.getByTestId("target-value").fill("12");
    const saveResponse = page.waitForResponse("**/api/local/planning/targets");
    await page.getByTestId("planning-save").click();
    expect((await saveResponse).ok()).toBeTruthy();
    await page.goto("/results");
    await expect(page.getByTestId("target-card-activation-rate")).toBeVisible();
    await expect(page.getByTestId("target-card-activation-rate")).toContainText(/sem actual/i);
  });

  test("APP-23 intake registra iniciativa sem breakdown tecnico inicial", async ({
    page,
    request,
  }) => {
    await openWorkspace(page, request, "workspace-planning-progressivo", "/intake");
    await page.getByTestId("initiative-register").click();
    await page.getByTestId("initiative-problem").fill("Usuários não concluem a etapa inicial");
    await page.getByTestId("initiative-bet").fill("Melhorar orientação no primeiro uso");
    await page.getByTestId("initiative-question").fill("Quais repos/superficies são afetados?");
    const saveResponse = page.waitForResponse("**/api/local/intake/initiatives");
    await page.getByTestId("initiative-submit").click();
    expect((await saveResponse).ok()).toBeTruthy();
    await expect(page.getByTestId("proposal-status")).toContainText(/triagem/i);
    await page.goto("/triage");
    await expect(page.getByTestId("triage-queue")).toContainText(/primeiro uso/i);
  });
});

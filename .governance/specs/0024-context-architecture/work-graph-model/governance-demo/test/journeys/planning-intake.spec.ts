import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Planejamento e intake", () => {
  test("APP-22 planejamento cria ciclo, objetivo, metrica e target", async ({ page, request }) => {
    pendingContract("APP-22", "expected-fail");

    await openWorkspace(page, request, "workspace-planning-progressivo", "/planning");
    await page.getByTestId("planning-cycle-create").click();
    await page.getByTestId("objective-title").fill("Aumentar ativacao");
    await page.getByTestId("metric-definition").fill("activation-rate");
    await page.getByTestId("target-value").fill("12");
    await page.getByTestId("planning-save").click();
    await page.goto("/results");
    await expect(page.getByTestId("target-card-activation-rate")).toBeVisible();
    await expect(page.getByTestId("target-card-activation-rate")).toContainText(/sem actual/i);
  });

  test("APP-23 intake registra iniciativa sem breakdown tecnico inicial", async ({
    page,
    request,
  }) => {
    pendingContract("APP-23", "fixme");

    await openWorkspace(page, request, "workspace-planning-progressivo", "/intake");
    await page.getByTestId("initiative-register").click();
    await page.getByTestId("initiative-problem").fill("Usuários não concluem a etapa inicial");
    await page.getByTestId("initiative-bet").fill("Melhorar orientação no primeiro uso");
    await page.getByTestId("initiative-question").fill("Quais repos/superficies são afetados?");
    await page.getByTestId("initiative-submit").click();
    await expect(page.getByTestId("proposal-status")).toContainText(/triagem/i);
    await page.goto("/triage");
    await expect(page.getByTestId("triage-queue")).toContainText(/primeiro uso/i);
  });
});

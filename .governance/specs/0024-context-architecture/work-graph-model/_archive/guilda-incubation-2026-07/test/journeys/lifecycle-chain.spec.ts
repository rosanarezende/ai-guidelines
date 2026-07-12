// lifecycle-chain.spec.ts — contrato de CADEIA cross-feature. Prova que uma
// iniciativa é rastreável de planning até audit, com o mesmo id atravessando
// telas. fixme: /planning /intake /triage /gates /contracts /audit ainda não
// existem. Corpo escrito com test.step para orientar a implementação.
import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Cadeia de vida da iniciativa", () => {
  test("APP-33 iniciativa rastreavel de planejamento ate audit", async ({ page, request }) => {
    pendingContract("APP-33", "fixme");

    await openWorkspace(page, request, "workspace-planning-progressivo", "/planning");

    let objectiveId = "";
    await test.step("planning cria objetivo/target sem actual", async () => {
      await page.getByTestId("planning-cycle-create").click();
      await page.getByTestId("objective-title").fill("Aumentar ativacao");
      await page.getByTestId("metric-definition").fill("activation-rate");
      await page.getByTestId("target-value").fill("12");
      await page.getByTestId("planning-save").click();
      objectiveId = await page.getByTestId("objective-id").innerText();
      await page.goto("/results");
      await expect(page.getByTestId(`target-card-${objectiveId}`)).toContainText(/sem actual/i);
    });

    let initiativeId = "";
    await test.step("intake vira item de triage e decisao de gate", async () => {
      await page.goto("/intake");
      await page.getByTestId("initiative-register").click();
      await page.getByTestId("initiative-problem").fill("Usuarios nao concluem etapa inicial");
      await page.getByTestId("initiative-link-objective").selectOption(objectiveId);
      await page.getByTestId("initiative-submit").click();
      initiativeId = await page.getByTestId("initiative-id").innerText();
      await page.goto("/triage");
      await expect(page.getByTestId(`triage-item-${initiativeId}`)).toBeVisible();
      await page.goto("/gates");
      await page.getByTestId(`gate-approve-${initiativeId}`).click();
      await expect(page.getByTestId("gate-authority-check")).toContainText(/ok/i);
    });

    await test.step("outcome em work/contracts aparece em results e audit", async () => {
      await page.goto("/results");
      await expect(page.getByTestId(`target-card-${objectiveId}`)).toContainText(/actual/i);
      await page.goto("/audit");
      await expect(page.getByTestId("audit-event-list")).toContainText(initiativeId);
    });
  });
});

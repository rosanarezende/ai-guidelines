import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Triagem, matcher e gates", () => {
  test("APP-24 triage transforma duvidas em itens e usa matcher advisory", async ({
    page,
    request,
  }) => {
    pendingContract("APP-24");

    await openWorkspace(page, request, "workspace-provider-versioned-source", "/triage");
    await page.getByTestId("triage-item-create-from-question").click();
    await expect(page.getByTestId("triage-item-fate-options")).toContainText(
      /exploration|missing-info|direct/i
    );
    await page.getByTestId("matcher-run").click();
    await expect(page.getByTestId("matcher-suggestion-list")).toContainText(/score|unknown/i);
    await page.getByTestId("matcher-human-confirm").click();
    await page.goto("/audit");
    await expect(page.getByTestId("audit-event-list")).toContainText(/matcher.*overrid|confirm/i);
  });

  test("APP-25 gate/ativacao exige autoridade e evidencia visivel", async ({ page, request }) => {
    pendingContract("APP-25");

    await openWorkspace(page, request, "workspace-shared", "/gates");
    await expect(page.getByTestId("gate-requester")).toBeVisible();
    await expect(page.getByTestId("gate-approver")).toBeVisible();
    await page.getByTestId("gate-approve").click();
    await expect(page.getByTestId("gate-authority-check")).toContainText(/ok|missing/i);
    await page.goto("/audit");
    await expect(page.getByTestId("audit-event-list")).toContainText(/gate|activate/i);
  });
});

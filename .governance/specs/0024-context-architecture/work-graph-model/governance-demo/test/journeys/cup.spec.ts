import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Cup / Contextual Work Partner", () => {
  test("CUP-01 Cup abre como overlay contextual sem provider externo", async ({
    page,
    request,
  }) => {
    pendingContract("CUP-01", "expected-fail");

    await openWorkspace(page, request, "empty-workspace", "/onboarding");
    await page.getByTestId("cup-open-button").click();
    await expect(page.getByTestId("cup-panel")).toBeVisible();
    await expect(page.getByTestId("cup-specialist")).toContainText(/setup|onboarding/i);
    await expect(page.getByTestId("cup-provider-status")).toContainText(
      /local|sem provider|deterministico/i
    );
  });

  test("CUP-02 Cup explica policies versionadas", async ({ page, request }) => {
    pendingContract("CUP-02", "expected-fail");

    await openWorkspace(page, request, "workspace-controlled", "/integrations");
    await page.getByTestId("cloud-provider-request").click();
    await page.getByTestId("cup-open-button").click();
    await expect(page.getByTestId("cup-policy-reference")).toContainText(/POLICY-HANDBOOK|egress/i);
    await expect(page.getByTestId("cup-next-step")).toContainText(/security|aprova/i);
  });

  test("CUP-03 Cup nao executa mutacao sem confirmacao humana", async ({ page, request }) => {
    pendingContract("CUP-03", "expected-fail");

    await openWorkspace(page, request, "workspace-host-local", "/sources");
    await page.getByTestId("cup-open-button").click();
    await page.getByTestId("cup-draft-add-source").click();
    await expect(page.getByTestId("cup-draft-command")).toContainText(/dry-run|baseRevision/i);
    await expect(page.getByTestId("cup-execute-command")).toBeDisabled();
    await page.getByTestId("cup-human-confirmation").click();
    await expect(page.getByTestId("cup-execute-command")).toBeEnabled();
  });

  test("CUP-04 Cup respeita permissoes e nao vaza contexto bloqueado", async ({
    page,
    request,
  }) => {
    pendingContract("CUP-04", "expected-fail");

    await openWorkspace(page, request, "workspace-controlled", "/triage");
    await page.getByTestId("cup-open-button").click();
    await expect(page.getByTestId("cup-context-boundary")).toContainText(
      /restricted|redacted|policy/i
    );
    await page.getByTestId("cup-provider-cloud").click();
    await expect(page.getByTestId("cup-egress-blocked")).toBeVisible();
  });
});

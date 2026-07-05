import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Governance host e fontes de trabalho", () => {
  test("APP-08 governance host e escolhido antes das fontes", async ({ page, request }) => {
    pendingContract("APP-08");

    await openWorkspace(page, request, "workspace-sem-host", "/sources");
    await expect(page.getByTestId("host-required-before-sources")).toBeVisible();
    await page.getByTestId("host-option-local-folder").click();
    await expect(page.getByTestId("host-fit-check-result")).toContainText(/warning|ok|bloqueio/i);
    await page.getByTestId("host-use-sandbox").click();
    await expect(page.getByTestId("sandbox-not-real-governance")).toBeVisible();
  });

  test("APP-09 onboarding de fontes guia local vs nuvem", async ({ page, request }) => {
    pendingContract("APP-09");

    await openWorkspace(page, request, "workspace-host-local", "/onboarding");
    await page.getByTestId("onboarding-step-sources").click();
    await page.getByTestId("source-kind-local").click();
    await expect(page.getByTestId("local-source-project-state")).toBeVisible();
    await expect(page.getByTestId("local-source-git-state")).toBeVisible();
    await page.getByTestId("source-kind-cloud").click();
    await expect(page.getByTestId("cloud-provider-github")).toBeVisible();
  });

  test("APP-17 Settings gerencia governance host com fit-check", async ({ page, request }) => {
    pendingContract("APP-17");

    await openWorkspace(page, request, "workspace-host-local", "/settings");
    await expect(page.getByTestId("governance-host-card")).toContainText("sourceRevision");
    await expect(page.getByTestId("governance-host-warnings")).toBeVisible();
    await page.goto("/console");
    await expect(page.getByTestId("console-source-revision")).toBeVisible();
  });

  test("APP-18 Settings e Sources mostram as mesmas fontes", async ({ page, request }) => {
    pendingContract("APP-18");

    await openWorkspace(page, request, "workspace-provider-versioned-source", "/sources");
    const sourceName = await page.getByTestId("source-card-primary-name").innerText();
    await page.goto("/settings");
    await expect(page.getByTestId("settings-source-list")).toContainText(sourceName);
    await page.goto("/");
    await expect(page.getByTestId("home-source-summary")).toContainText(sourceName);
  });

  test("APP-21 Sources dedicada cadastra fonte local/cloud/manual", async ({ page, request }) => {
    pendingContract("APP-21");

    await openWorkspace(page, request, "workspace-host-local", "/sources");
    await page.getByTestId("source-add").click();
    await page.getByTestId("source-project-local").click();
    await page.getByTestId("source-local-browse").click();
    await expect(page.getByTestId("source-local-fallback-path")).toBeVisible();
    await page.getByTestId("source-project-cloud").click();
    await expect(page.getByTestId("source-cloud-connect-github")).toBeVisible();
  });
});

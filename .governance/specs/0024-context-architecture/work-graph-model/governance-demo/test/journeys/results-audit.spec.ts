import { expect, test } from "@playwright/test";
import { openWorkspace, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Resultados, mapa, operacao, auditoria e console", () => {
  test("APP-28 Results mostra targets, outcomes, actual e confidence", async ({
    page,
    request,
  }) => {
    pendingContract("APP-28");

    await openWorkspace(page, request, "demo-acme", "/results", "sandbox-demo");
    await expect(page.getByTestId("results-target-chart")).toBeVisible();
    await expect(page.getByTestId("results-confidence-legend")).toContainText(
      /valid|self|stale|sem evidencia/i
    );
    await page.getByTestId("results-filter-self-attested").click();
    await expect(page.getByTestId("results-warning-panel")).toContainText(/auto-declar|self/i);
  });

  test("APP-29 Mapa de governanca explica caminho e impacto", async ({ page, request }) => {
    pendingContract("APP-29");

    await openWorkspace(page, request, "demo-acme", "/map", "sandbox-demo");
    await expect(page.getByTestId("governance-map")).toBeVisible();
    await page.getByTestId("map-search").fill("checkout");
    await page.getByTestId("map-result-checkout-stack").click();
    await expect(page.getByTestId("map-detail-panel")).toContainText(
      /objetivo|intent|contrato|outcome/i
    );
    await page.getByTestId("map-filter-risk").click();
    await expect(page.getByTestId("map-visible-count")).toBeVisible();
  });

  test("APP-30 Operations mostra incidentes, follow-ups, SLO e trabalho operacional", async ({
    page,
    request,
  }) => {
    pendingContract("APP-30");

    await openWorkspace(page, request, "demo-acme", "/operations", "sandbox-demo");
    await expect(page.getByTestId("incident-lifecycle")).toContainText(
      /declare|mitigate|resolve|postmortem/i
    );
    await expect(page.getByTestId("incident-followups")).toContainText(/standalone|proposal/i);
    await expect(page.getByTestId("slo-panel")).toContainText(/derived|source|window/i);
  });

  test("APP-31 Audit mostra trilha de decisoes e break-glass", async ({ page, request }) => {
    pendingContract("APP-31");

    await openWorkspace(page, request, "demo-acme", "/audit", "sandbox-demo");
    await expect(page.getByTestId("audit-event-list")).toContainText(/actor|authority|revision/i);
    await page.getByTestId("audit-filter-break-glass").click();
    await expect(page.getByTestId("break-glass-event")).toContainText(/reason|ttl|review/i);
  });

  test("APP-32 Console tecnico existe, mas nao substitui UX principal", async ({
    page,
    request,
  }) => {
    pendingContract("APP-32");

    await openWorkspace(page, request, "demo-acme", "/console", "sandbox-demo");
    await expect(page.getByTestId("technical-console")).toBeVisible();
    await expect(page.getByTestId("console-source-revision")).toBeVisible();
    await page.goto("/");
    await expect(page.getByTestId("home-primary-actions")).not.toContainText(
      /payload|json manual/i
    );
  });
});

import { expect, test } from "@playwright/test";
import { openWorkspace, openWorkspaceAs, pendingContract } from "./support/contract-fixtures.ts";

test.describe("Seguranca, authority e fail-closed", () => {
  test("SEC-01 provider cloud nao ativa sem egress/authority", async ({ page, request }) => {
    pendingContract("SEC-01", "fixme");

    await openWorkspace(page, request, "workspace-controlled", "/integrations");
    await page.getByTestId("integration-card-cloud-assistant").click();
    await page.getByTestId("integration-request-activation").click();
    await expect(page.getByTestId("integration-activation-status")).toContainText(
      /blocked|pending/i
    );
    await expect(page.getByTestId("integration-approval-required")).toContainText(
      /security|egress/i
    );
  });

  test("SEC-02 read-model derivado nao autoriza acao stale", async ({ page, request }) => {
    pendingContract("SEC-02", "fixme");

    await openWorkspace(page, request, "acme-demo", "/map", "sandbox-demo");
    await page.getByTestId("map-node-outcome").click();
    await page.getByTestId("derived-action-open").click();
    await page.getByTestId("simulate-stale-revision").click();
    await page.getByTestId("derived-action-confirm").click();
    await expect(page.getByTestId("command-error")).toContainText(/stale|revision|refresh/i);
  });

  test("SEC-03 authority nunca deriva apenas de login externo", async ({ page, request }) => {
    pendingContract("SEC-03", "fixme");

    // persona member: login externo identifica, mas nao concede authority
    await openWorkspaceAs(page, request, "workspace-shared-github", "member", "/settings");
    await expect(page.getByTestId("identity-provider-status")).toContainText(/GitHub/i);
    await expect(page.getByTestId("effective-authority-panel")).not.toContainText(
      /sponsor|security-owner/i
    );
    await page.goto("/integrations");
    await expect(page.getByTestId("github-authority-warning")).toContainText(
      /nao concede authority/i
    );
  });

  test("SEC-04 event-log apagado ou reescrito vira integridade bloqueante", async ({
    page,
    request,
  }) => {
    pendingContract("SEC-04", "fixme");

    await openWorkspace(page, request, "workspace-host-local", "/audit");
    await page.getByTestId("integrity-simulate-eventlog-rewrite").click();
    await expect(page.getByTestId("integrity-status")).toContainText(
      /blocked|quarantine|integridade/i
    );
  });

  test("SEC-05 bump de sourceTrust exige evidencia independente", async ({ page, request }) => {
    pendingContract("SEC-05", "fixme");

    await openWorkspace(page, request, "workspace-cloud-synced-folder", "/sources");
    await page.getByTestId("source-src-drive").click();
    await expect(page.getByTestId("source-trust")).toContainText(/cloud-sync-unverified/i);
    await page.getByTestId("source-promote-trust").click();
    await expect(page.getByTestId("source-trust-blocked")).toContainText(
      /evidencia|adapter|independente/i
    );
  });

  test("SEC-06 downgrade de classificacao exige aprovador separado", async ({ page, request }) => {
    pendingContract("SEC-06", "fixme");

    await openWorkspace(page, request, "workspace-controlled", "/settings");
    await page.getByTestId("classification-policy").click();
    await page.getByTestId("classification-downgrade-to-public").click();
    await expect(page.getByTestId("classification-policy-result")).toContainText(
      /approver|security|separado/i
    );
  });

  test("SEC-07 ultimo admin ou security-owner nao e removido silenciosamente", async ({
    page,
    request,
  }) => {
    pendingContract("SEC-07", "fixme");

    await openWorkspace(page, request, "workspace-shared-convites", "/settings");
    await page.getByTestId("person-local-ana").click();
    await page.getByTestId("role-admin-remove").click();
    await expect(page.getByTestId("role-removal-result")).toContainText(
      /ultimo admin|break-glass|bloqueado/i
    );
  });

  test("SEC-08 outcome sem evidencia minima nao entra no rollup", async ({ page, request }) => {
    pendingContract("SEC-08", "fixme");

    await openWorkspace(page, request, "acme-demo", "/results", "sandbox-demo");
    await page.getByTestId("outcome-without-evidence").click();
    await expect(page.getByTestId("outcome-confidence")).toContainText(
      /sem evidencia|autodeclarado/i
    );
    await expect(page.getByTestId("rollup-primary-status")).not.toContainText(/valid/i);
  });

  test("SEC-09 adapter nao grava estado autoritativo sem contrato", async ({ page, request }) => {
    pendingContract("SEC-09", "fixme");

    await openWorkspace(page, request, "workspace-with-integration-statuses", "/integrations");
    await page.getByTestId("integration-card-observability").click();
    await expect(page.getByTestId("integration-write-authority")).toContainText(
      /read-only|contrato|autoridade/i
    );
  });

  test("SEC-10 break-glass precisa de motivo TTL e revisao", async ({ page, request }) => {
    pendingContract("SEC-10", "fixme");

    await openWorkspace(page, request, "workspace-compact-policy", "/settings");
    await page.getByTestId("break-glass-create").click();
    await expect(page.getByTestId("break-glass-form")).toContainText(/motivo|ttl|revisao/i);
    await page.goto("/");
    await expect(page.getByTestId("home-security-pending")).toContainText(/excecao|venc/i);
  });
});

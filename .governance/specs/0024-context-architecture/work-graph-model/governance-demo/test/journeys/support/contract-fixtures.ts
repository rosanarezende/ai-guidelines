import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { MOCK_API_URL } from "../../playwright.config.ts";

const APP_URL = "http://127.0.0.1:3024";
const SESSION_COOKIE = "governance-local-session";
export type PendingContractMode = "fixme" | "expected-fail";

export function pendingContract(
  id: string,
  mode: PendingContractMode,
  reason = "produto-alvo ainda nao implementado"
): void {
  if (mode === "fixme") {
    test.fixme(true, `${id}: ${reason}`);
    return;
  }

  test.fail(true, `${id}: ${reason}`);
}

export async function resetSeed(request: APIRequestContext, seed: string): Promise<void> {
  const reset = await request.post(`${MOCK_API_URL}/__reset`, { data: { seed } });
  expect(reset.ok(), `reset seed ${seed}`).toBeTruthy();
}

export async function signInAs(
  page: Page,
  workspaceId = "acme-honey",
  principalId = "local-ana"
): Promise<void> {
  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: JSON.stringify({ principalId, workspaceId }),
      url: APP_URL,
      sameSite: "Lax",
      httpOnly: true,
    },
  ]);
}

export async function openWorkspace(
  page: Page,
  request: APIRequestContext,
  seed: string,
  route = "/",
  workspaceId = "acme-honey"
): Promise<void> {
  await resetSeed(request, seed);
  await signInAs(page, workspaceId);
  await page.goto(route);
}

export async function expectVisibleTestIds(page: Page, ids: string[]): Promise<void> {
  for (const id of ids) {
    await expect(page.getByTestId(id), `expected test id ${id}`).toBeVisible();
  }
}

export async function expectConsistentText(
  page: Page,
  routes: string[],
  text: string | RegExp
): Promise<void> {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByText(text)).toBeVisible();
  }
}

export async function expectNoAcmeDemoLeak(page: Page): Promise<void> {
  await expect(page.getByText(/intent-cta-upgrade|checkout-stack|acme-user-context/i)).toHaveCount(
    0
  );
}

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { MOCK_API_URL } from "../../playwright.config.ts";

const APP_URL = "http://127.0.0.1:3024";
const SESSION_COOKIE = "governance-local-session";
export type PendingContractMode = "fixme" | "expected-fail";
export type ContractPersona =
  | "admin"
  | "member"
  | "no-authority"
  | "proposed-role"
  | "security-owner"
  | "sponsor"
  | "stakeholder";

type ExpectedFailContract = { id: string; reason: string };

let pendingExpectedFail: ExpectedFailContract | null = null;

const personaPrincipalIds: Record<ContractPersona, string> = {
  admin: "local-ana",
  member: "local-eva",
  "no-authority": "local-eva",
  "proposed-role": "local-eva",
  "security-owner": "local-bia",
  sponsor: "local-caio",
  stakeholder: "local-eva",
};

export function pendingContract(
  id: string,
  mode: PendingContractMode,
  reason = "produto-alvo ainda nao implementado"
): void {
  if (mode === "fixme") {
    test.fixme(true, `${id}: ${reason}`);
    return;
  }

  pendingExpectedFail = { id, reason };
}

export async function armExpectedFailAfterArrival(
  page: Page,
  route: string,
  responseStatus: number | null
): Promise<void> {
  const contract = pendingExpectedFail;
  if (!contract) return;
  pendingExpectedFail = null;

  if (responseStatus !== null) {
    expect(
      responseStatus,
      `${contract.id}: rota-sentinela ${route} precisa responder antes do expected-fail`
    ).toBeLessThan(400);
  }
  await expect(
    page.locator("body"),
    `${contract.id}: DOM precisa renderizar antes do expected-fail`
  ).toBeVisible();

  test.fail(true, `${contract.id}: ${contract.reason}`);
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

export async function signInAsPersona(
  page: Page,
  persona: ContractPersona,
  workspaceId = "acme-honey"
): Promise<void> {
  await signInAs(page, workspaceId, personaPrincipalIds[persona]);
}

export const asAdmin = (page: Page, workspaceId?: string): Promise<void> =>
  signInAsPersona(page, "admin", workspaceId);
export const asMember = (page: Page, workspaceId?: string): Promise<void> =>
  signInAsPersona(page, "member", workspaceId);
export const asNoAuthority = (page: Page, workspaceId?: string): Promise<void> =>
  signInAsPersona(page, "no-authority", workspaceId);
export const asProposedRole = (page: Page, workspaceId?: string): Promise<void> =>
  signInAsPersona(page, "proposed-role", workspaceId);
export const asSecurityOwner = (page: Page, workspaceId?: string): Promise<void> =>
  signInAsPersona(page, "security-owner", workspaceId);
export const asSponsor = (page: Page, workspaceId?: string): Promise<void> =>
  signInAsPersona(page, "sponsor", workspaceId);
export const asStakeholder = (page: Page, workspaceId?: string): Promise<void> =>
  signInAsPersona(page, "stakeholder", workspaceId);

export async function openWorkspace(
  page: Page,
  request: APIRequestContext,
  seed: string,
  route = "/",
  workspaceId = "acme-honey"
): Promise<void> {
  await resetSeed(request, seed);
  await signInAs(page, workspaceId);
  const response = await page.goto(route);
  await armExpectedFailAfterArrival(page, route, response?.status() ?? null);
}

// Igual a openWorkspace, mas autentica como uma persona não-admin declarada
// pelo contrato. Mantém a sentinela: contrato de UI só arma test.fail depois de
// a rota responder. Usar quando o contrato testa authority/permissão por papel.
export async function openWorkspaceAs(
  page: Page,
  request: APIRequestContext,
  seed: string,
  persona: ContractPersona,
  route = "/",
  workspaceId = "acme-honey"
): Promise<void> {
  await resetSeed(request, seed);
  await signInAsPersona(page, persona, workspaceId);
  const response = await page.goto(route);
  await armExpectedFailAfterArrival(page, route, response?.status() ?? null);
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

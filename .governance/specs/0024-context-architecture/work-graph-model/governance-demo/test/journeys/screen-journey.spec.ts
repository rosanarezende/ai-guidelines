// screen-journey.spec.ts — provas E2E por tela.
// As seeds provam estados; estes testes provam que as telas humanas conseguem
// ler esses estados e conduzir decisões sem cair no console tecnico.
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { MOCK_API_URL } from "../playwright.config.ts";

const APP_URL = "http://127.0.0.1:3024";
const SESSION_COOKIE = "governance-local-session";

async function resetSeed(request: APIRequestContext, seed: string): Promise<void> {
  const reset = await request.post(`${MOCK_API_URL}/__reset`, { data: { seed } });
  expect(reset.ok(), `reset seed ${seed}`).toBeTruthy();
}

async function signIn(page: Page, workspaceId = "acme-honey"): Promise<void> {
  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: JSON.stringify({ principalId: "local-ana", workspaceId }),
      url: APP_URL,
      sameSite: "Lax",
      httpOnly: true,
    },
  ]);
}

async function openSeedWorkspace(
  page: Page,
  request: APIRequestContext,
  seed: string,
  workspaceId = "acme-honey"
): Promise<void> {
  await resetSeed(request, seed);
  await signIn(page, workspaceId);
}

async function startDiagnosis(page: Page): Promise<void> {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(
    page.getByText("Quantas pessoas participam das decisões e da execução?")
  ).toBeVisible();
}

async function chooseCompactWithReview(page: Page): Promise<void> {
  await page.getByText("Até 5 pessoas").click();
  await page.getByText("Quase tudo fica nas mesmas pessoas").click();
  await page.getByText("Avisar e revisar depois").click();
  await expect(page.getByText("Time enxuto", { exact: true })).toBeVisible();
  await expect(page.getByText("Segue com pendência")).toBeVisible();
}

async function next(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Continuar" }).click();
}

test("settings lê host vinculado e expõe warnings do fit-check", async ({ page, request }) => {
  await openSeedWorkspace(page, request, "workspace-host-local");

  await page.goto("/settings");

  await expect(page.getByText("Configurações — Acme Honey")).toBeVisible();
  await expect(page.getByText("Host vinculado: acme-honey-governance")).toBeVisible();
  await expect(page.getByText(/pasta local sem Git/)).toBeVisible();
  await expect(page.getByText("revisão: seed00000001")).toBeVisible();
});

test("settings permite declarar sandbox sem fingir governança real", async ({ page, request }) => {
  await openSeedWorkspace(page, request, "workspace-sem-host");

  await page.goto("/settings");

  await expect(page.getByText("Escolha onde a governança vai morar")).toBeVisible();
  await page.getByRole("button", { name: "Continuar como sandbox" }).click();
  await expect(page.getByText("Sandbox declarado — sem governança real.")).toBeVisible();
});

// QRD-34: a tela de Settings/Sources esta sendo redesenhada. O contrato segue
// registrado, mas o teste antigo dependia da UX anterior e fica fixme ate a
// suite alvo reativar APP-06/APP-08.
test.fixme("settings gerencia pessoas, papéis e fontes sem console técnico", async ({
  page,
  request,
}) => {
  await openSeedWorkspace(page, request, "empty-workspace");

  await page.goto("/settings");

  await expect(page.getByText("Pessoas, times e convites")).toBeVisible();
  await page.getByLabel("Nome da pessoa").fill("Bia Produto");
  await page.getByLabel("E-mail opcional").fill("bia@acme.example");
  await page.getByRole("button", { name: "Criar convite" }).click();
  await expect(page.getByText(/Token do convite criado:/)).toBeVisible();
  await expect(page.getByText("Bia Produto")).toBeVisible();

  await page.getByLabel("Nome do time/grupo").fill("Time Produto");
  await page.getByLabel("IDs de pessoas separados por vírgula").fill("person-ana");
  await page.getByRole("button", { name: "Criar grupo" }).click();
  await expect(page.getByText("Time Produto")).toBeVisible();

  await expect(page.getByText("Papéis e autoridade")).toBeVisible();
  await page.getByLabel("Papel").click();
  await page.getByRole("option", { name: "Atesta resultados" }).click();
  await page.getByRole("button", { name: "Registrar papel" }).click();
  await expect(page.getByText("Autoridade efetiva", { exact: true })).toBeVisible();
  await expect(page.getByText("Atesta resultados").first()).toBeVisible();

  await expect(page.getByRole("heading", { name: "Fontes de trabalho" })).toBeVisible();
  await page.getByLabel("Nome legível").fill("Repo checkout");
  await page.getByLabel("Caminho ou URL").fill("C:/acme/acme-checkout");
  await page.getByRole("button", { name: "Adicionar fonte" }).click();
  await expect(page.getByText("Repo checkout")).toBeVisible();
  await page.getByRole("button", { name: "Escanear" }).click();
  await expect(page.getByText("hash: mock000000")).toBeVisible();
  await expect(page.getByText("arquivos: 42")).toBeVisible();
});

test("onboarding diagnostica time enxuto e leva para papéis sem autoridade fake", async ({
  page,
  request,
}) => {
  await openSeedWorkspace(page, request, "empty-workspace");

  await startDiagnosis(page);
  await chooseCompactWithReview(page);
  await next(page);

  await expect(page.getByText("Quem responde pelo quê?")).toBeVisible();
  await expect(page.getByText(/ainda não tem pessoas\/autoridades cadastradas/)).toBeVisible();
  await expect(
    page.getByText(/papéis ficam como contrato de responsabilidade declarado/)
  ).toBeVisible();
});

// QRD-34: o onboarding sera revalidado por contratos da suite alvo. Este
// teste antigo exercia copy/ordem intermediaria que ja nao e o alvo.
test.fixme("onboarding percorre fontes, assistente, integrações e revisão honesta", async ({
  page,
  request,
}) => {
  await openSeedWorkspace(page, request, "empty-workspace");

  await startDiagnosis(page);
  await chooseCompactWithReview(page);
  await next(page);
  await expect(page.getByText("Quem responde pelo quê?")).toBeVisible();

  await next(page);
  await expect(page.getByText("Conectar fontes de trabalho")).toBeVisible();
  await expect(page.getByText(/Evidência automática habilitada para 1 tipo/)).toBeVisible();
  await page.getByText("Pasta local").click();
  await expect(page.getByText(/Evidência automática habilitada para 2 tipo/)).toBeVisible();

  await next(page);
  await expect(page.getByText("Quer um assistente? É opcional.")).toBeVisible();
  await page.getByText("Na nuvem").click();
  await expect(page.getByText(/aprovação de egress/)).toBeVisible();

  await next(page);
  await expect(page.getByText("Integrações potencializam — não são requisito.")).toBeVisible();
  await expect(page.getByText("assistant-runtime-local-cloud")).toBeVisible();
  await expect(page.getByText(/Nenhuma integração escreve o estado autoritativo/)).toBeVisible();

  await next(page);
  await expect(page.getByText("Pronto. Eis o retrato honesto.")).toBeVisible();
  await expect(page.getByText("Já funciona")).toBeVisible();
  await expect(page.getByText("Pendente — avisa, não trava")).toBeVisible();
  await expect(page.getByText(/Esta configuração ainda não é persistida/)).toBeVisible();
});

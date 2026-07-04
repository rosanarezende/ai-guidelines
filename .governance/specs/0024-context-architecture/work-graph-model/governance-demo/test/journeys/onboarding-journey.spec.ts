// onboarding-journey.spec.ts — primeira jornada e2e (QRD-06 jornada 1 + 6):
// signup → criar workspace → onboarding parcial → Home com card de continuar.
// Roda contra mock-api com seed resetada; valida EXPERIÊNCIA, não governança.
import { expect, test } from "@playwright/test";
import { MOCK_API_URL } from "../playwright.config.ts";

test.beforeEach(async ({ request }) => {
  const reset = await request.post(`${MOCK_API_URL}/__reset`, { data: { seed: "blank" } });
  expect(reset.ok()).toBeTruthy();
});

test("signup → workspace → onboarding parcial → Home com continuar", async ({ page }) => {
  // sem principal, a raiz redireciona para /signup (gate server-side)
  await page.goto("/");
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByText("Quem está governando?")).toBeVisible();

  await page.getByLabel("Seu nome").fill("Ana E2E");
  await page.getByRole("button", { name: "Criar identidade local" }).click();

  // sem organização, o fluxo segue para /organizations
  await expect(page).toHaveURL(/\/organizations$/);
  await page.getByLabel("Nome da organização").fill("Acme Honey");
  await page.getByText("Uma empresa/time").click();
  await page.getByRole("button", { name: "Criar e continuar" }).click();

  // organização nova sem onboarding → /onboarding
  await expect(page).toHaveURL(/\/onboarding$/);

  // avançar UM passo (boas-vindas → diagnóstico) marca o onboarding como
  // parcial — persistido na fonte de dados, não em estado de tela
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByRole("button", { name: "Voltar" })).toBeVisible();

  // a Home da organização mostra o card de continuar de onde parou
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Onboarding em andamento")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continuar onboarding" })).toBeVisible();

  // reload preserva o estado (persistência real na fonte de dados)
  await page.reload();
  await expect(page.getByText("Onboarding em andamento")).toBeVisible();
});

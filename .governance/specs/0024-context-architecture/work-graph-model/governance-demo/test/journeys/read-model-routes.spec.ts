// read-model-routes.spec.ts — casca de GATE das rotas de read-model, via
// Playwright `request` (HTTP, sem browser). O que só o handler real prova:
// sessão ausente → 401, workspace não selecionado → 404, workspace real não-demo
// → 200 com read-model indisponível (governance-host-not-linked). O conteúdo
// derivado (rollup/grafo) é provado em node:test (read-model-regression).
import { expect, test } from "@playwright/test";
import { MOCK_API_URL } from "../playwright.config.ts";

// cada rota carrega o read-model derivado numa chave própria do payload
const READ_MODEL_ROUTES = [
  { route: "/api/results/dashboard", payloadKey: "dashboard" },
  { route: "/api/work/items", payloadKey: "work" },
  { route: "/api/map/governance", payloadKey: "maps" },
] as const;

test.beforeEach(async ({ request }) => {
  const reset = await request.post(`${MOCK_API_URL}/__reset`, { data: { seed: "blank" } });
  expect(reset.ok()).toBeTruthy();
});

test("read-model routes sem sessão retornam 401 signup-required", async ({ request }) => {
  for (const { route } of READ_MODEL_ROUTES) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(401);
    const body = (await response.json()) as { ok: boolean; error?: string };
    expect(body.ok, route).toBe(false);
    expect(body.error, route).toBe("signup-required");
  }
});

test("read-model routes com sessão mas sem workspace retornam 404", async ({ request }) => {
  const signup = await request.post("/api/local/signup", { data: { displayName: "Ana Admin" } });
  expect(signup.ok()).toBeTruthy();

  for (const { route } of READ_MODEL_ROUTES) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(404);
    const body = (await response.json()) as { ok: boolean; error?: string };
    expect(body.error, route).toBe("workspace-required");
  }
});

test("read-model routes em workspace real não-demo expõem indisponível, não vazam demo", async ({
  request,
}) => {
  const signup = await request.post("/api/local/signup", { data: { displayName: "Ana Admin" } });
  expect(signup.ok()).toBeTruthy();
  const org = await request.post("/api/local/organizations", {
    data: { name: "Mundo da Mel", kind: "company" },
  });
  expect(org.ok()).toBeTruthy();

  for (const { route, payloadKey } of READ_MODEL_ROUTES) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    const body = (await response.json()) as {
      ok: boolean;
      workspace?: { demo?: boolean };
      unavailableReason?: string;
    } & Record<string, unknown>;
    expect(body.ok, route).toBe(true);
    expect(body.workspace?.demo, route).toBe(false);
    expect(body.unavailableReason, route).toBe("governance-host-not-linked");
    // sem host, o read-model derivado da acme NAO vaza para o workspace real
    expect(body[payloadKey], route).toBeNull();
  }
});

// authority-model.spec.ts — contratos de MECANISMO (sem UI) sobre a resolução
// de authority do domínio. Provam a garantia de segurança "proposed/revoked
// nunca geram autoridade; só accepted/self-assigned (direto ou herdado)".
// São `active` porque o mecanismo já existe em backend/src/domain; a UI que
// expõe isso (APP-07) segue fixme até a tela de pessoas/papéis existir.
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  personAuthority,
  type AdoptionState,
  type Workspace,
} from "../../backend/src/domain/index.ts";
import { MOCK_API_URL } from "../playwright.config.ts";

async function loadSeed(request: APIRequestContext, name: string): Promise<AdoptionState> {
  const reset = await request.post(`${MOCK_API_URL}/__reset`, { data: { seed: name } });
  expect(reset.ok(), `reset seed ${name}`).toBeTruthy();
  const state = await request.get(`${MOCK_API_URL}/api/shell/state`);
  expect(state.ok(), `state seed ${name}`).toBeTruthy();
  return (await state.json()) as AdoptionState;
}

function workspace(state: AdoptionState, id = "acme-honey"): Workspace {
  const found = state.workspaces.find((item) => item.id === id);
  expect(found, `workspace ${id}`).toBeTruthy();
  return found as Workspace;
}

test.describe("Modelo de authority (mecanismo derivado, sem UI)", () => {
  test("SEC-11 papel proposto nunca gera authority efetiva", async ({ request }) => {
    const ws = workspace(await loadSeed(request, "workspace-authority-personas"));

    await test.step("Eva tem source-owner apenas como proposed no estado", async () => {
      const assignment = ws.roleAssignments.find((item) => item.id === "role-eva-source-owner");
      expect(assignment?.roleId).toBe("source-owner");
      expect(assignment?.status).toBe("proposed");
    });

    await test.step("authority efetiva de Eva nao inclui o papel proposto", async () => {
      const grants = personAuthority(ws, "person-eva");
      expect(grants.map((grant) => grant.roleId)).not.toContain("source-owner");
      expect(grants, "papel apenas proposto nao concede nenhuma autoridade").toHaveLength(0);
    });
  });

  test("SEC-12 papel aceito gera authority direta; sem aceite nao ha authority", async ({
    request,
  }) => {
    const ws = workspace(await loadSeed(request, "workspace-authority-personas"));

    await test.step("Bia (security-owner) e Caio (sponsor) aceitos tem authority direta", async () => {
      const bia = personAuthority(ws, "person-bia");
      const caio = personAuthority(ws, "person-caio");
      expect(bia.map((grant) => grant.roleId)).toContain("security-owner");
      expect(caio.map((grant) => grant.roleId)).toContain("sponsor");
      expect(bia.every((grant) => grant.origin === "direct")).toBeTruthy();
    });

    await test.step("papel aceito de outra pessoa nao vira self-assigned", async () => {
      const bia = personAuthority(ws, "person-bia");
      expect(bia.some((grant) => grant.origin === "self-assigned")).toBeFalsy();
    });
  });
});

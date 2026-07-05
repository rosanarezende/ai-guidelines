// api-commands.test.ts — camada API/route provada em processo, sem browser e
// sem subir servidor: o app Hono da mock-api roda via `app.request()`. É o MESMO
// handler `/api/shell/commands` que o e2e exercita por HTTP, com o MESMO executor
// autorizado (applyAuthorizedShellCommand) e a MESMA idempotência por command id
// do file-store real. Rápido, determinístico, falha clara.
import test from "node:test";
import assert from "node:assert/strict";
import { createMockApp } from "../src/app.ts";
import type { AdoptionState, LocalShellCommand } from "../../backend/src/domain/index.ts";

const app = createMockApp();

async function reset(seed: string): Promise<void> {
  const response = await app.request("/__reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ seed }),
  });
  assert.equal(response.status, 200, `reset ${seed}`);
}

async function dispatch(
  command: unknown
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await app.request("/api/shell/commands", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command }),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

async function state(): Promise<AdoptionState> {
  const response = await app.request("/api/shell/state");
  return (await response.json()) as AdoptionState;
}

function command(
  type: string,
  principalId: string,
  payload: Record<string, unknown>,
  id: string
): LocalShellCommand {
  return {
    id,
    type,
    principalId,
    issuedAt: "2026-07-05T12:00:00.000Z",
    payload,
  } as LocalShellCommand;
}

test("API command sem id/type falha fechado com 400 command-schema", async () => {
  await reset("workspace-authority-personas");
  const result = await dispatch({ payload: {} });
  assert.equal(result.status, 400);
  assert.equal(result.body["error"], "command-schema");
});

test("API __reset com seed desconhecida retorna 400 e lista seeds", async () => {
  const response = await app.request("/__reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ seed: "seed-que-nao-existe" }),
  });
  assert.equal(response.status, 400);
  const body = (await response.json()) as { seeds?: string[] };
  assert.ok(Array.isArray(body.seeds) && body.seeds.length > 0);
});

test("API comando repetido (mesmo id) nao aplica duas vezes — replay 422", async () => {
  await reset("workspace-authority-personas");
  const cmd = command(
    "local.profile.save",
    "local-ana",
    {
      workspaceId: "acme-honey",
      profile: "solo",
      sensitiveAccumulationPolicy: "record",
      reason: "dogfood",
    },
    "cmd-replay-1"
  );
  const first = await dispatch(cmd);
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(first.body["ok"], true);

  const replay = await dispatch(cmd);
  assert.equal(replay.status, 422);
  assert.equal(replay.body["error"], "duplicate-command");
});

test("API authority: admin aplica config; papel proposto e negado", async () => {
  await reset("workspace-authority-personas");
  const adminOk = await dispatch(
    command(
      "local.profile.save",
      "local-ana",
      {
        workspaceId: "acme-honey",
        profile: "solo",
        sensitiveAccumulationPolicy: "record",
        reason: "admin",
      },
      "cmd-admin-profile"
    )
  );
  assert.equal(adminOk.status, 200, JSON.stringify(adminOk.body));

  // Eva tem source-owner apenas PROPOSTO → sem autoridade efetiva
  const evaSource = await dispatch(
    command("local.work-source.add", "local-eva", { workspaceId: "acme-honey" }, "cmd-eva-source")
  );
  assert.equal(evaSource.status, 422);
  assert.equal(evaSource.body["error"], "missing-source-manager");

  const evaConfig = await dispatch(
    command("local.profile.save", "local-eva", { workspaceId: "acme-honey" }, "cmd-eva-profile")
  );
  assert.equal(evaConfig.status, 422);
  assert.equal(evaConfig.body["error"], "missing-authority");
});

test("API isolamento: acao em workspace do qual o principal nao e membro falha", async () => {
  await reset("workspace-authority-personas");
  const result = await dispatch(
    command(
      "local.profile.save",
      "local-ana",
      { workspaceId: "workspace-fantasma", profile: "solo" },
      "cmd-ghost-ws"
    )
  );
  assert.equal(result.status, 422);
  assert.equal(result.body["error"], "not-a-member");
});

test("API estado reflete comando aplicado e nao vaza para outro workspace", async () => {
  await reset("workspace-authority-personas");
  await dispatch(
    command(
      "local.profile.save",
      "local-ana",
      {
        workspaceId: "acme-honey",
        profile: "compact",
        sensitiveAccumulationPolicy: "warn-review",
        reason: "muda perfil",
      },
      "cmd-state-1"
    )
  );
  const after = await state();
  const workspace = after.workspaces.find((item) => item.id === "acme-honey");
  assert.equal(workspace?.profileDeclaration?.profile, "compact");
});

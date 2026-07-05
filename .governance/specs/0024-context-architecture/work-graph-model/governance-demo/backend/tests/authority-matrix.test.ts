// authority-matrix.test.ts — matriz de autorização papel × comando, provada no
// mesmo kernel (authorizeShellCommand) que backend real e mock-api usam.
// É teste de DOMÍNIO: roda em milissegundos, sem browser/Next. Substitui a
// tentacao de gastar Playwright para provar "quem pode o quê".
import test from "node:test";
import assert from "node:assert/strict";
import { authorizeShellCommand } from "../src/domain/index.ts";
import type {
  AdoptionState,
  LocalShellCommand,
  LocalShellCommandType,
} from "../src/domain/index.ts";
import { buildSeed } from "../../mock-api/src/seeds/index.ts";

const WORKSPACE_ID = "acme-honey";

function state(): AdoptionState {
  const built = buildSeed("workspace-authority-personas");
  assert.ok(built, "seed workspace-authority-personas deve existir");
  return built;
}

function decide(
  base: AdoptionState,
  type: LocalShellCommandType,
  principalId: string
): { ok: boolean; error?: string } {
  const command: LocalShellCommand = {
    id: `cmd-${type}-${principalId}`,
    type,
    principalId,
    issuedAt: "2026-07-05T12:00:00.000Z",
    payload: { workspaceId: WORKSPACE_ID },
  };
  return authorizeShellCommand(base, command);
}

type Outcome = { ok: true } | { ok: false; error: string };

// local-ana = workspace-admin (membership admin) → tudo autorizado.
// local-bia = security-owner ACEITO → autoridade efetiva, menos SOURCE.
// local-eva = source-owner apenas PROPOSTO → sem autoridade efetiva → tudo negado.
const MATRIX: Array<{
  type: LocalShellCommandType;
  ana: Outcome;
  bia: Outcome;
  eva: Outcome;
}> = [
  {
    type: "local.profile.save",
    ana: { ok: true },
    bia: { ok: true },
    eva: { ok: false, error: "missing-authority" },
  },
  {
    type: "local.workspace-mode.save",
    ana: { ok: true },
    bia: { ok: true },
    eva: { ok: false, error: "missing-authority" },
  },
  {
    type: "local.workspace-stack.save",
    ana: { ok: true },
    bia: { ok: true },
    eva: { ok: false, error: "missing-authority" },
  },
  {
    type: "local.member.invite",
    ana: { ok: true },
    bia: { ok: true },
    eva: { ok: false, error: "missing-membership-manager" },
  },
  {
    type: "local.group.create",
    ana: { ok: true },
    bia: { ok: true },
    eva: { ok: false, error: "missing-membership-manager" },
  },
  {
    type: "local.host.link",
    ana: { ok: true },
    bia: { ok: true },
    eva: { ok: false, error: "missing-host-manager" },
  },
  {
    type: "local.sandbox.declare",
    ana: { ok: true },
    bia: { ok: true },
    eva: { ok: false, error: "missing-host-manager" },
  },
  {
    type: "local.work-source.add",
    ana: { ok: true },
    bia: { ok: false, error: "missing-source-manager" },
    eva: { ok: false, error: "missing-source-manager" },
  },
  {
    type: "local.assistant.save-provider",
    ana: { ok: true },
    bia: { ok: true },
    eva: { ok: false, error: "missing-assistant-manager" },
  },
  {
    type: "local.integration.set-status",
    ana: { ok: true },
    bia: { ok: true },
    eva: { ok: false, error: "missing-integration-manager" },
  },
];

for (const row of MATRIX) {
  test(`authority-matrix ${row.type}`, () => {
    const base = state();
    assert.deepEqual(decide(base, row.type, "local-ana"), row.ana, `admin @ ${row.type}`);
    assert.deepEqual(decide(base, row.type, "local-bia"), row.bia, `security-owner @ ${row.type}`);
    assert.deepEqual(decide(base, row.type, "local-eva"), row.eva, `proposed-role @ ${row.type}`);
  });
}

test("authority-matrix: papel apenas proposto nunca autoriza comando de fonte", () => {
  const base = state();
  // Eva tem source-owner PROPOSED; nao pode agir como source-owner.
  assert.deepEqual(decide(base, "local.work-source.add", "local-eva"), {
    ok: false,
    error: "missing-source-manager",
  });
});

test("authority-matrix: principal fora do workspace nao passa authority", () => {
  const base = state();
  assert.deepEqual(decide(base, "local.profile.save", "principal-inexistente"), {
    ok: false,
    error: "unknown-principal",
  });
});

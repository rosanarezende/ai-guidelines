// seed-invariants.test.ts — invariantes de PROPRIEDADE sobre TODAS as seeds da
// mock-api. Roda em node:test (sem browser). Prova regras centrais do produto
// de uma vez em todo o corpus de estados, em vez de um caso por vez no e2e.
// Também garante fidelidade do mock: as seeds respeitam os mesmos invariantes
// do domínio real (mesmas funções).
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_WORKSPACE_ID,
  normalizeWorkspace,
  resolveWorkspaceAuthority,
} from "@demo/domain/server";
import type { AdoptionState, Workspace } from "@demo/domain/server";
import { seedNames, buildSeed } from "@demo/test-fixtures";

function eachWorkspace(
  callback: (seed: string, workspace: Workspace, state: AdoptionState) => void
): void {
  for (const seed of seedNames()) {
    const state = buildSeed(seed);
    assert.ok(state, `seed ${seed} deve construir`);
    for (const workspace of state.workspaces) {
      callback(seed, normalizeWorkspace(workspace), state);
    }
  }
}

test("INV-1 authority efetiva nunca vem de papel proposed/rejected/revoked", () => {
  eachWorkspace((seed, workspace) => {
    const byId = new Map(
      workspace.roleAssignments.map((assignment) => [assignment.id, assignment])
    );
    for (const grant of resolveWorkspaceAuthority(workspace)) {
      const backing = byId.get(grant.assignmentId);
      assert.ok(backing, `${seed}: grant sem assignment (${grant.assignmentId})`);
      assert.ok(
        backing.status === "accepted" || backing.status === "self-assigned",
        `${seed}: authority efetiva de status invalido (${backing.status})`
      );
    }
  });
});

test("INV-2 onboarding finished exige host valido ou sandbox explicito", () => {
  eachWorkspace((seed, workspace) => {
    if (workspace.onboardingStatus !== "finished") return;
    const hasHost = Boolean(workspace.governanceHost);
    const isSandbox = Boolean(workspace.sandboxDeclared);
    assert.ok(
      hasHost || isSandbox,
      `${seed}: workspace ${workspace.id} finished sem host nem sandbox`
    );
  });
});

test("INV-3 isolamento demo: so o workspace demo e sandbox-demo", () => {
  eachWorkspace((seed, workspace) => {
    const isDemoId = workspace.id === DEMO_WORKSPACE_ID;
    if (workspace.kind === "sandbox-demo") {
      assert.equal(
        isDemoId,
        true,
        `${seed}: workspace ${workspace.id} e sandbox-demo mas nao e o id demo`
      );
    }
    if (isDemoId) {
      assert.equal(workspace.kind, "sandbox-demo", `${seed}: workspace demo com kind inesperado`);
    }
    if (workspace.id === "acme-honey") {
      assert.notEqual(
        workspace.kind,
        "sandbox-demo",
        `${seed}: acme-honey nao pode ser sandbox-demo`
      );
    }
  });
});

test("INV-4 sourceTrust rebaixado nao infla: cloud-sync nunca vira provider-*", () => {
  eachWorkspace((seed, workspace) => {
    for (const source of workspace.workSources) {
      if (source.kind === "cloud-synced-folder") {
        assert.equal(
          source.sourceTrust,
          "cloud-sync-unverified",
          `${seed}: fonte cloud-synced ${source.id} com trust inflado (${source.sourceTrust})`
        );
      }
      if (source.kind === "local-folder") {
        assert.notEqual(
          source.sourceTrust,
          "provider-audited",
          `${seed}: fonte local ${source.id} nao pode ser provider-audited`
        );
      }
    }
  });
});

test("INV-5 seed matrix nao esta vazia e toda seed constroi estado tipado", () => {
  const names = seedNames();
  assert.ok(names.length >= 20, `esperado corpus rico de seeds, veio ${names.length}`);
  for (const seed of names) {
    const state = buildSeed(seed);
    assert.ok(state, `seed ${seed} constroi`);
    assert.ok(Array.isArray(state.workspaces), `seed ${seed} tem workspaces`);
  }
});

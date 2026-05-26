/**
 * [BR-CLI-WORKSPACE-IDEMPOTENCY] Migração idempotente e determinística.
 *
 * Garante que `AdoptWorkspace`:
 *  - cria `.governance/` + reservas canônicas a partir de pristine ou legacy
 *  - rodado duas vezes não duplica, não reescreve e não gera churn
 *  - falha cedo em estado ambíguo (antes de qualquer escrita)
 *
 * Âncora: [DEC-0021-A03].
 */
import { GovernanceError } from "../../domain/shared/errors.js";
import {
  GOVERNANCE_SCAFFOLD_FILES,
  GOVERNANCE_SPECS_SCAFFOLD_DIRS,
  RESERVED_GOVERNANCE_DIRS,
} from "../../domain/workspace/MigrationPlan.js";
import { FakeWorkspaceProvisioner } from "../../test-utils/doubles.js";
import { AdoptWorkspace } from "./AdoptWorkspace.js";

function expectedDirPaths(): string[] {
  return [
    ".governance",
    ...RESERVED_GOVERNANCE_DIRS.map((d) => `.governance/${d}`),
    ...GOVERNANCE_SPECS_SCAFFOLD_DIRS.map((d) => `.governance/${d}`),
  ];
}

function expectedFilePaths(): string[] {
  return GOVERNANCE_SCAFFOLD_FILES.map((f) => `.governance/${f.path}`);
}

function expectedCreateEvents(): string[] {
  return [
    ...expectedDirPaths().map((p) => `ensure-create:${p}`),
    ...expectedFilePaths().map((p) => `ensure-file-create:${p}`),
  ];
}

describe("Use case — AdoptWorkspace idempotência [BR-CLI-WORKSPACE-IDEMPOTENCY]", () => {
  it("DADO estado 'pristine' ENTÃO cria '.governance/' e reservas canônicas em ordem determinística", () => {
    const provisioner = new FakeWorkspaceProvisioner();
    const result = new AdoptWorkspace({ provisioner }).execute({
      state: { kind: "pristine" },
    });

    expect([...result.applied]).toEqual(expectedDirPaths());
    expect([...result.appliedFiles]).toEqual(expectedFilePaths());
    expect(provisioner.events).toEqual(expectedCreateEvents());
    expect(result.idempotentNoop).toBe(false);
  });

  it("DADO estado 'legacy' ENTÃO cria '.governance/' + reservas (sem mexer no legado)", () => {
    const provisioner = new FakeWorkspaceProvisioner();
    const result = new AdoptWorkspace({ provisioner }).execute({
      state: { kind: "legacy", sources: [".specify"] },
    });

    expect([...result.applied]).toEqual(expectedDirPaths());
    expect(result.plan.noticedLegacy).toEqual([".specify"]);
  });

  it("DADO segunda execução sobre estado 'governance' ENTÃO não cria nada novo (idempotência)", () => {
    const provisioner = new FakeWorkspaceProvisioner(expectedDirPaths(), expectedFilePaths());
    const result = new AdoptWorkspace({ provisioner }).execute({
      state: { kind: "governance" },
    });

    expect(provisioner.events).toEqual([
      ...expectedDirPaths().map((p) => `ensure-noop:${p}`),
      ...expectedFilePaths().map((p) => `ensure-file-noop:${p}`),
    ]);
    expect(result.idempotentNoop).toBe(true);
  });

  it("DADO estado 'mixed' SEM bridge ENTÃO falha ANTES de qualquer IO", () => {
    const provisioner = new FakeWorkspaceProvisioner();
    expect(() =>
      new AdoptWorkspace({ provisioner }).execute({
        state: { kind: "mixed", legacySources: [".specify"] },
      })
    ).toThrow(GovernanceError);
    expect(provisioner.events).toEqual([]);
  });

  it("DADO duas execuções consecutivas a partir de 'pristine' ENTÃO segunda passada é no-op", () => {
    const provisioner = new FakeWorkspaceProvisioner();
    const uc = new AdoptWorkspace({ provisioner });
    uc.execute({ state: { kind: "pristine" } });
    const eventsAfterFirst = provisioner.events.length;
    uc.execute({ state: { kind: "governance" } });
    const second = provisioner.events.slice(eventsAfterFirst);
    expect(
      second.every((e) => e.startsWith("ensure-noop:") || e.startsWith("ensure-file-noop:"))
    ).toBe(true);
  });
});

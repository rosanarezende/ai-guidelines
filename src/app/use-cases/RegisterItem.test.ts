/**
 * [BR-CLI-APP-01] Fluxo de Registro de Item — atomicidade policy-first.
 */
import { GovernancePolicies } from "../../domain/policy/GovernancePolicies.js";
import { GovernanceError } from "../../domain/shared/errors.js";
import {
  FakeWorkspaceStore,
  FixedClock,
  SeqIdGenerator,
  SpyRegistryStore,
} from "../../test-utils/doubles.js";
import { RegisterWorkItem } from "./RegisterWorkItem.js";

function setup() {
  const policy = new GovernancePolicies();
  const registry = new SpyRegistryStore();
  const workspace = new FakeWorkspaceStore();
  const clock = new FixedClock("2026-05-10T12:00:00.000Z");
  const ids = new SeqIdGenerator("wi");
  const useCase = new RegisterWorkItem({ policy, registry, workspace, clock, ids });
  return { useCase, registry, workspace, clock };
}

describe("Aplicação — Caso de Uso: RegisterWorkItem [BR-CLI-APP]", () => {
  it("DADO draft inválido pela policy ENTÃO falha ANTES de tocar registry/filesystem [BR-CLI-APP-01]", () => {
    const { useCase, registry, workspace } = setup();
    expect(() =>
      useCase.execute({
        kind: "incident",
        title: "Sem severity",
        workspacePath: ".governance/incidents/01",
      })
    ).toThrow(GovernanceError);
    expect(registry.calls).toEqual([]);
    expect(workspace.created).toEqual([]);
  });

  it("DADO draft válido ENTÃO registry add precede workspace create [BR-CLI-APP-01]", () => {
    const { useCase, registry, workspace } = setup();
    useCase.execute({
      kind: "spec",
      title: "Spec válida",
      workspacePath: ".governance/specs/0001",
    });
    expect(registry.calls[0]).toMatch(/^add:/);
    expect(workspace.created).toEqual([".governance/specs/0001"]);
  });

  it("DADO falha do workspace ENTÃO faz rollback do registry [BR-CLI-APP-01]", () => {
    const { useCase, registry, workspace } = setup();
    workspace.failOnCreate = true;
    expect(() =>
      useCase.execute({
        kind: "spec",
        title: "Spec válida",
        workspacePath: ".governance/specs/0001",
      })
    ).toThrow(/Falha simulada/);
    expect(registry.list()).toEqual([]);
    expect(registry.calls).toEqual(["add:wi-0001", "remove:wi-0001"]);
  });

  it("DADO falha do registry ENTÃO NÃO cria workspace [BR-CLI-APP-01]", () => {
    const { useCase, registry, workspace } = setup();
    registry.failOnAddId = "wi-0001";
    expect(() =>
      useCase.execute({
        kind: "spec",
        title: "Spec válida",
        workspacePath: ".governance/specs/0001",
      })
    ).toThrow(/Falha simulada/);
    expect(workspace.created).toEqual([]);
  });

  it("DADO item virtual ('proposal') ENTÃO NÃO toca workspace [BR-CLI-APP-01]", () => {
    const { useCase, workspace } = setup();
    useCase.execute({ kind: "proposal", title: "Proposta xpto" });
    expect(workspace.created).toEqual([]);
  });

  // [SKIP-REASON: Living Documentation chega na Fase 3 (PR3) [DEC-0021-C01]]
  it.skip("DADO registro bem-sucedido ENTÃO aciona extrator de Living Documentation [DEC-0021-C01]", () => {});
});

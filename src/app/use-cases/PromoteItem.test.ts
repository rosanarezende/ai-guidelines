/**
 * [BR-CLI-APP-02] Fluxo de Promoção de Item — orquestração segura.
 */
import { GovernancePolicies } from "../../domain/policy/GovernancePolicies.js";
import { GovernanceError } from "../../domain/shared/errors.js";
import { isDenseItem } from "../../domain/work-item/WorkItem.js";
import {
  FakeWorkspaceStore,
  FixedClock,
  SeqIdGenerator,
  SpyRegistryStore,
} from "../../test-utils/doubles.js";
import { PromoteWorkItem } from "./PromoteWorkItem.js";
import { RegisterWorkItem } from "./RegisterWorkItem.js";

function setup() {
  const policy = new GovernancePolicies();
  const registry = new SpyRegistryStore();
  const workspace = new FakeWorkspaceStore();
  const clock = new FixedClock("2026-05-10T00:00:00.000Z");
  const ids = new SeqIdGenerator("wi");
  const register = new RegisterWorkItem({
    policy,
    registry,
    workspace,
    clock,
    ids,
  });
  const promote = new PromoteWorkItem({ policy, registry, workspace, clock });
  return { register, promote, registry, workspace, clock };
}

describe("Aplicação — Caso de Uso: PromoteWorkItem [BR-CLI-APP]", () => {
  it("DADO uma 'proposal' madura QUANDO promovida a 'spec' ENTÃO atualiza metadados E cria workspace [BR-CLI-APP-02]", () => {
    const { register, promote, registry, workspace, clock } = setup();
    const proposal = register.execute({
      kind: "proposal",
      title: "Proposta promovível",
      status: "review",
    });
    clock.set("2026-05-11T00:00:00.000Z");

    const promoted = promote.execute({
      id: proposal.id,
      target: "spec",
      workspacePath: ".governance/specs/0001",
    });

    expect(promoted.kind).toBe("spec");
    if (!isDenseItem(promoted)) throw new Error("esperado dense após promoção a 'spec'");
    expect(promoted.workspacePath).toBe(".governance/specs/0001");
    expect(promoted.updatedAt).toBe("2026-05-11T00:00:00.000Z");
    expect(workspace.created).toContain(".governance/specs/0001");
    expect(registry.find(proposal.id)?.kind).toBe("spec");
  });

  it("DADO um 'experiment' won QUANDO promovido a 'spec' ENTÃO herda hypothesis e métricas [BR-CLI-APP-02]", () => {
    const { register, promote } = setup();
    const exp = register.execute({
      kind: "experiment",
      title: "Experimento de growth",
      hypothesis: "Aumentaremos a conversão em 10%",
      successMetrics: ["ctr", "rev"],
      workspacePath: ".governance/experiments/01",
      status: "done",
      outcome: "won",
    });

    const promoted = promote.execute({
      id: exp.id,
      target: "spec",
      workspacePath: ".governance/specs/from-exp",
    });
    expect(promoted.kind).toBe("spec");
    if (!isDenseItem(promoted)) throw new Error("esperado dense após promoção a 'spec'");
    expect(promoted.hypothesis).toBe("Aumentaremos a conversão em 10%");
    expect(promoted.successMetrics).toEqual(["ctr", "rev"]);
  });

  it("DADO uma 'proposal' em status inválido ENTÃO aborta com mensagem clara de maturidade [BR-CLI-APP-02]", () => {
    const { register, promote } = setup();
    const proposal = register.execute({
      kind: "proposal",
      title: "Proposta imatura",
      status: "draft",
    });
    try {
      promote.execute({
        id: proposal.id,
        target: "spec",
        workspacePath: ".governance/specs/0099",
      });
      fail("deveria ter lançado");
    } catch (e) {
      expect((e as GovernanceError).code).toBe("POLICY_PROPOSAL_NOT_MATURE");
    }
  });
});

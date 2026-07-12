import { DecisionRegistry, buildDecisionRegistry } from "./registry.js";
import { CloseDispositionsDefinition } from "./closeDispositions.js";
import { FinishStepDefinition } from "./finishStep.js";
import { MarkReadinessDefinition } from "./markReadiness.js";
import { HumanGateDefinition } from "./humanGate.js";
import { OpenNextTopologyNodeDefinition } from "./openNextTopologyNode.js";

describe("DecisionRegistry [decide]", () => {
  it("[1] registry contém os tipos na ordem do ciclo de vida", () => {
    expect(buildDecisionRegistry().ids()).toEqual([
      "close-dispositions",
      "finish-step",
      "mark-readiness",
      "advance-step",
      "human-gate",
      "open-next-topology-node",
    ]);
  });

  it("[2] tipo duplicado falha alto e cedo", () => {
    const r = new DecisionRegistry();
    r.register(new CloseDispositionsDefinition());
    expect(() => r.register(new CloseDispositionsDefinition())).toThrow(/duplicada/);
  });

  it("[4] decisões ordenadas deterministicamente (ordem de registro)", () => {
    expect(
      buildDecisionRegistry()
        .definitions()
        .map((d) => d.id)
    ).toEqual([
      "close-dispositions",
      "finish-step",
      "mark-readiness",
      "advance-step",
      "human-gate",
      "open-next-topology-node",
    ]);
  });

  it("[3] resolve por id; desconhecido = undefined", () => {
    const r = buildDecisionRegistry();
    expect(r.resolve("finish-step")).toBeInstanceOf(FinishStepDefinition);
    expect(r.resolve("mark-readiness")).toBeInstanceOf(MarkReadinessDefinition);
    expect(r.resolve("human-gate")).toBeInstanceOf(HumanGateDefinition);
    expect(r.resolve("open-next-topology-node")).toBeInstanceOf(OpenNextTopologyNodeDefinition);
    expect(r.resolve("nope")).toBeUndefined();
  });
});

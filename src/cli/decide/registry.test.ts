import { DecisionRegistry, buildDecisionRegistry } from "./registry.js";
import { CloseDispositionsDefinition } from "./closeDispositions.js";
import { FinishSubcheckpointDefinition } from "./finishSubcheckpoint.js";
import { MarkReadinessDefinition } from "./markReadiness.js";
import { HumanGateDefinition } from "./humanGate.js";
import { OpenNextNodeDefinition } from "./openNextNode.js";

describe("DecisionRegistry [decide]", () => {
  it("[1] registry contém os tipos na ordem do ciclo de vida", () => {
    expect(buildDecisionRegistry().ids()).toEqual([
      "close-dispositions",
      "finish-subcheckpoint",
      "mark-readiness",
      "advance-subcheckpoint",
      "human-gate",
      "open-next-node",
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
      "finish-subcheckpoint",
      "mark-readiness",
      "advance-subcheckpoint",
      "human-gate",
      "open-next-node",
    ]);
  });

  it("[3] resolve por id; desconhecido = undefined", () => {
    const r = buildDecisionRegistry();
    expect(r.resolve("finish-subcheckpoint")).toBeInstanceOf(FinishSubcheckpointDefinition);
    expect(r.resolve("mark-readiness")).toBeInstanceOf(MarkReadinessDefinition);
    expect(r.resolve("human-gate")).toBeInstanceOf(HumanGateDefinition);
    expect(r.resolve("open-next-node")).toBeInstanceOf(OpenNextNodeDefinition);
    expect(r.resolve("nope")).toBeUndefined();
  });
});

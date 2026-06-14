import { DecisionRegistry, buildDecisionRegistry } from "./registry.js";
import { CloseDispositionsDefinition } from "./closeDispositions.js";
import { HumanGateDefinition } from "./humanGate.js";

describe("DecisionRegistry [decide]", () => {
  it("[1] registry contém os dois tipos obrigatórios", () => {
    expect(buildDecisionRegistry().ids()).toEqual(["close-dispositions", "human-gate"]);
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
    ).toEqual(["close-dispositions", "human-gate"]);
  });

  it("[3] resolve por id; desconhecido = undefined", () => {
    const r = buildDecisionRegistry();
    expect(r.resolve("human-gate")).toBeInstanceOf(HumanGateDefinition);
    expect(r.resolve("nope")).toBeUndefined();
  });
});

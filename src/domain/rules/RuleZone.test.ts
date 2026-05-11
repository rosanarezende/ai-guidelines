import { GovernanceError } from "../shared/errors.js";
import { OPT_IN_FEATURE_LAYOUT, pathToZone, scopeToZone } from "./ruleZone.js";

describe("ruleZone — scope→zone (puro)", () => {
  it("DADO scope=universal ENTÃO zona = top", () => {
    expect(scopeToZone({ scope: "universal" })).toBe("top");
  });

  it("DADO scope=adapter ENTÃO zona = adapter", () => {
    expect(scopeToZone({ scope: "adapter" })).toBe("adapter");
  });

  it("DADO scope=opt-in + feature tdd|bdd ENTÃO zona = center", () => {
    expect(scopeToZone({ scope: "opt-in", opt_in_feature: "tdd" })).toBe("center");
    expect(scopeToZone({ scope: "opt-in", opt_in_feature: "bdd" })).toBe("center");
  });

  it("DADO scope=opt-in + feature quality-gates ENTÃO zona = base", () => {
    expect(scopeToZone({ scope: "opt-in", opt_in_feature: "quality-gates" })).toBe("base");
  });

  it("DADO scope=opt-in sem feature ENTÃO lança RULE_OPT_IN_MISSING_FEATURE", () => {
    expect(() => scopeToZone({ scope: "opt-in" })).toThrow(GovernanceError);
    try {
      scopeToZone({ scope: "opt-in" });
    } catch (err) {
      expect((err as GovernanceError).code).toBe("RULE_OPT_IN_MISSING_FEATURE");
    }
  });

  it("DADO opt_in_feature desconhecida ENTÃO lança RULE_OPT_IN_UNKNOWN_FEATURE", () => {
    expect(() => scopeToZone({ scope: "opt-in", opt_in_feature: "unknown" })).toThrow(
      /RULE_OPT_IN_UNKNOWN_FEATURE|desconhecida/
    );
  });

  it("OPT_IN_FEATURE_LAYOUT cobre tdd/bdd (center) e quality-gates (base)", () => {
    expect(OPT_IN_FEATURE_LAYOUT.tdd).toBe("center");
    expect(OPT_IN_FEATURE_LAYOUT.bdd).toBe("center");
    expect(OPT_IN_FEATURE_LAYOUT["quality-gates"]).toBe("base");
  });
});

describe("ruleZone — pathToZone (classificação física)", () => {
  it("classifica paths top/center/base/adapters", () => {
    expect(pathToZone("top/global-rules.md")).toBe("top");
    expect(pathToZone("center/methodologies/tdd-en.md")).toBe("center");
    expect(pathToZone("base/quality/quality-gates.md")).toBe("base");
    expect(pathToZone("adapters/claude.md")).toBe("adapter");
  });

  it("retorna null para paths fora da topologia", () => {
    expect(pathToZone("global-rules.md")).toBeNull();
    expect(pathToZone("opt-in/tdd-pt.md")).toBeNull();
    expect(pathToZone("")).toBeNull();
  });
});

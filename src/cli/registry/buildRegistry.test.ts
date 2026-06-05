import { buildRegistry } from "./buildRegistry.js";

describe("buildRegistry", () => {
  it("DADO o registry montado QUANDO resolve os verbos migrados ENTÃO encontra cada um", () => {
    const registry = buildRegistry();
    expect(registry.resolve("continue")?.name).toBe("continue");
    expect(registry.resolve("insight")?.name).toBe("insight");
    expect(registry.resolve("triage")?.name).toBe("triage");
    expect(registry.resolve("release-prep")?.name).toBe("release-prep");
    expect(registry.resolve("workflow")?.name).toBe("workflow");
    expect(registry.resolve("specs")?.name).toBe("specs");
    expect(registry.resolve("drift")?.name).toBe("drift");
    expect(registry.resolve("visual-prompt")?.name).toBe("visual-prompt");
    expect(registry.resolve("pr-visual")?.name).toBe("pr-visual");
  });

  it("DADO o alias transitório 'review' QUANDO resolve ENTÃO cai no comando 'triage'", () => {
    const registry = buildRegistry();
    expect(registry.resolve("review")?.name).toBe("triage");
  });

  it("DADO o registry montado QUANDO commandNames ENTÃO lista os canônicos (sem o alias 'review')", () => {
    const registry = buildRegistry();
    const names = registry.commandNames();
    expect(names).toEqual(
      expect.arrayContaining([
        "continue",
        "insight",
        "triage",
        "release-prep",
        "workflow",
        "specs",
        "drift",
        "visual-prompt",
        "pr-visual",
      ])
    );
    expect(names).not.toContain("review");
  });
});

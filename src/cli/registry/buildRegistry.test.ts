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
    expect(registry.resolve("handoff")?.name).toBe("handoff");
    expect(registry.resolve("init")?.name).toBe("init");
    expect(registry.resolve("adopt")?.name).toBe("adopt");
    expect(registry.resolve("update")?.name).toBe("update");
    expect(registry.resolve("check-budget")?.name).toBe("check-budget");
    expect(registry.resolve("providers")).toBeUndefined();
  });

  it("DADO o verbo 'review' QUANDO resolve ENTÃO cai no ReviewCommand (briefing por lane; numérico delega ao triage)", () => {
    const registry = buildRegistry();
    expect(registry.resolve("review")?.name).toBe("review");
  });

  it("DADO o registry montado QUANDO commandNames ENTÃO lista os canônicos (review incluso)", () => {
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
        "handoff",
        "init",
        "adopt",
        "update",
        "check-budget",
      ])
    );
    expect(names).not.toContain("providers");
    expect(names).toContain("review");
  });

  it("DADO o registry QUANDO inspeciona os comandos ENTÃO cada um declara description não-vazia (help derivável; auditoria #35 #2)", () => {
    const registry = buildRegistry();
    for (const command of registry.commands()) {
      expect(command.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("DADO o registry QUANDO renderHelp ENTÃO deriva o help com os canônicos (review é comando próprio)", () => {
    const help = buildRegistry().renderHelp();
    expect(help).toContain("triage");
    expect(help).toContain("review technical-audit");
    expect(help).toContain("specs");
    expect(help).toContain("visual-prompt");
    expect(help).toContain("handoff");
    expect(help).toContain("init");
    expect(help).toContain("update --providers claude,openai");
    expect(help).toContain("check-budget");
    expect(help).not.toMatch(/^\s+providers\s*$/m);
    expect(help).toContain("Ex.: npx ai-guidelines");
  });
});

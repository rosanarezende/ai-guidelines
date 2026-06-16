import { assertInitSafe, INIT_GUARDED_PATHS } from "./InitGuard.js";

describe("domain/provisioning/InitGuard (paridade com assertSafeInitTarget)", () => {
  it("DADO nenhum conflito ENTÃO não lança", () => {
    expect(() => assertInitSafe([], false)).not.toThrow();
  });

  it("DADO conflitos sem force ENTÃO lança listando os paths e apontando adopt", () => {
    expect(() => assertInitSafe(["AGENTS.md", "package.json"], false)).toThrow(
      /AGENTS\.md, package\.json/
    );
    expect(() => assertInitSafe(["AGENTS.md"], false)).toThrow(/adopt/);
  });

  it("DADO conflitos COM force ENTÃO não lança", () => {
    expect(() => assertInitSafe(["AGENTS.md"], true)).not.toThrow();
  });

  it("INIT_GUARDED_PATHS cobre os baselines protegidos do init", () => {
    expect(INIT_GUARDED_PATHS).toContain("AGENTS.md");
    expect(INIT_GUARDED_PATHS).toContain(".gitattributes");
    expect(INIT_GUARDED_PATHS).toContain("package.json");
    expect(INIT_GUARDED_PATHS).toContain(".github/workflows/ai-guidelines-ci.yml");
    expect(INIT_GUARDED_PATHS.every((p) => !p.includes("\\"))).toBe(true);
  });
});

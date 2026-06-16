import { formatSurfaceRef, parseSurfaceRef, SurfaceRef } from "./SurfaceRef.js";

describe("SurfaceRef · superfície namespaced [BR-CO-ENFORCEMENT-SURFACE]", () => {
  it("npm-script: parse preserva os `:` internos do nome", () => {
    const ref = parseSurfaceRef("npm-script:gate-decidability:check");
    expect(ref).toEqual<SurfaceRef>({ namespace: "npm-script", name: "gate-decidability:check" });
    expect(formatSurfaceRef(ref)).toBe("npm-script:gate-decidability:check");
  });

  it("registry-command: parse com subcomando", () => {
    const ref = parseSurfaceRef("registry-command:workflow/publish-state");
    expect(ref).toEqual<SurfaceRef>({
      namespace: "registry-command",
      name: "workflow/publish-state",
    });
    expect(formatSurfaceRef(ref)).toBe("registry-command:workflow/publish-state");
  });

  it("namespace ausente (sem `:`) falha", () => {
    expect(() => parseSurfaceRef("gate-decidability-check")).toThrow(
      /SURFACE_NAMESPACE_MISSING|sem namespace/i
    );
  });

  it("namespace não-suportado falha", () => {
    expect(() => parseSurfaceRef("hook:pre-push")).toThrow(/não-suportado|UNSUPPORTED/i);
    expect(() => parseSurfaceRef("github-workflow:repo-validation.yml")).toThrow(
      /não-suportado|UNSUPPORTED/i
    );
  });

  it("nome vazio após o namespace falha", () => {
    expect(() => parseSurfaceRef("npm-script:")).toThrow(/vazio|EMPTY/i);
  });
});

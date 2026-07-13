/**
 * [BR-CLI-WORKSPACE-DISCOVERY] Orquestracao do discovery via port de filesystem.
 */
import { FakeFileSystemProbe } from "../../test-utils/doubles.js";
import { DiscoverWorkspace } from "./DiscoverWorkspace.js";

describe("Aplicacao — DiscoverWorkspace [BR-CLI-WORKSPACE-DISCOVERY]", () => {
  it("DADO probe sem nenhuma raiz ENTÃO resolução é 'needs-init'", () => {
    const probe = new FakeFileSystemProbe();
    const result = new DiscoverWorkspace({ probe }).execute();
    expect(result.state).toEqual({ kind: "pristine" });
    expect(result.resolution).toEqual({ kind: "needs-init" });
  });

  it("DADO probe com '.governance/' ENTÃO resolução é 'governance-ssot'", () => {
    const probe = new FakeFileSystemProbe([".governance"]);
    const result = new DiscoverWorkspace({ probe }).execute();
    expect(result.resolution).toEqual({ kind: "governance-ssot" });
  });

  it("DADO probe com '.specify/' ENTÃO resolução é 'needs-adoption' com fonte explícita", () => {
    const probe = new FakeFileSystemProbe([".specify"]);
    const result = new DiscoverWorkspace({ probe }).execute();
    expect(result.resolution.kind).toBe("needs-adoption");
    if (result.resolution.kind === "needs-adoption") {
      expect([...result.resolution.sources]).toEqual([".specify"]);
    }
  });

  it("DADO '.governance/' E '.specify/' ENTÃO resolução é 'ambiguous'", () => {
    const probe = new FakeFileSystemProbe([".governance", ".specify"]);
    const result = new DiscoverWorkspace({ probe }).execute();
    expect(result.resolution.kind).toBe("ambiguous");
  });

  it("DADO mesmo probe rodado duas vezes ENTÃO retorna resultados determinísticos", () => {
    const probe = new FakeFileSystemProbe([".governance"]);
    const discovery = new DiscoverWorkspace({ probe });
    expect(discovery.execute()).toEqual(discovery.execute());
  });
});

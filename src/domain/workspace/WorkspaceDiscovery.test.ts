/**
 * [BR-CLI-WORKSPACE-DISCOVERY] Discovery contract do GovernanceWorkspace.
 *
 * Garante que a derivação de {@link WorkspaceState} a partir de um
 * {@link RootsSnapshot} é total, determinística e cobre os 4 quadrantes
 * (pristine/governance/legacy/mixed) sem heurística silenciosa.
 *
 * Âncora: [DEC-0021-A03].
 */
import { DiscoverWorkspace } from "../../app/use-cases/DiscoverWorkspace.js";
import { FakeFileSystemProbe } from "../../test-utils/doubles.js";
import { deriveWorkspaceState, RootsSnapshot } from "./WorkspaceState.js";

describe("Domínio — WorkspaceDiscovery [BR-CLI-WORKSPACE-DISCOVERY]", () => {
  describe("deriveWorkspaceState (puro)", () => {
    it("DADO nenhuma raiz presente ENTÃO retorna 'pristine'", () => {
      const snap: RootsSnapshot = {
        hasGovernance: false,
        hasSpecify: false,
        hasAiGuidelines: false,
      };
      expect(deriveWorkspaceState(snap)).toEqual({ kind: "pristine" });
    });

    it("DADO apenas '.governance/' ENTÃO retorna 'governance'", () => {
      expect(
        deriveWorkspaceState({
          hasGovernance: true,
          hasSpecify: false,
          hasAiGuidelines: false,
        })
      ).toEqual({ kind: "governance" });
    });

    it("DADO apenas legado ENTÃO retorna 'legacy' com fontes ordenadas", () => {
      const state = deriveWorkspaceState({
        hasGovernance: false,
        hasSpecify: true,
        hasAiGuidelines: true,
      });
      expect(state.kind).toBe("legacy");
      if (state.kind === "legacy") {
        expect([...state.sources]).toEqual([".specify", ".ai-guidelines"]);
      }
    });

    it("DADO '.governance/' coexistindo com legado ENTÃO retorna 'mixed' (sem heurística silenciosa)", () => {
      const state = deriveWorkspaceState({
        hasGovernance: true,
        hasSpecify: true,
        hasAiGuidelines: false,
      });
      expect(state.kind).toBe("mixed");
      if (state.kind === "mixed") {
        expect([...state.legacySources]).toEqual([".specify"]);
      }
    });
  });

  describe("DiscoverWorkspace (use case)", () => {
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

    it("DADO probe com '.governance/' E '.specify/' ENTÃO resolução é 'ambiguous' (não decide silenciosamente)", () => {
      const probe = new FakeFileSystemProbe([".governance", ".specify"]);
      const result = new DiscoverWorkspace({ probe }).execute();
      expect(result.resolution.kind).toBe("ambiguous");
    });

    it("DADO mesmo probe rodado duas vezes ENTÃO retorna resultados estruturalmente iguais (determinístico)", () => {
      const probe = new FakeFileSystemProbe([".governance"]);
      const dw = new DiscoverWorkspace({ probe });
      expect(dw.execute()).toEqual(dw.execute());
    });
  });
});

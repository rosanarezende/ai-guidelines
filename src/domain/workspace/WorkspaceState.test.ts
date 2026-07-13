/**
 * [BR-CLI-WORKSPACE-DISCOVERY] Derivacao pura do GovernanceWorkspace.
 *
 * Garante que a derivação de {@link WorkspaceState} a partir de um
 * {@link RootsSnapshot} é total, determinística e cobre os 4 quadrantes
 * (pristine/governance/legacy/mixed) sem heurística silenciosa.
 *
 * Âncora: [DEC-0021-A03].
 */
import { deriveWorkspaceState, RootsSnapshot } from "./WorkspaceState.js";

describe("Domínio — WorkspaceState [BR-CLI-WORKSPACE-DISCOVERY]", () => {
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

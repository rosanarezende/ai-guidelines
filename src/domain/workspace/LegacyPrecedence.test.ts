/**
 * [BR-CLI-WORKSPACE-PRECEDENCE] Política de precedência.
 *
 * Regras protegidas:
 *  - `.governance/` é SSOT quando presente sozinho.
 *  - Legado puro exige adoção explícita (não fallback invisível).
 *  - Estado misto falha por padrão; bridge é opt-in consciente.
 *
 * Âncora: [DEC-0021-A03].
 */
import { GovernanceError } from "../shared/errors.js";
import { requireGovernanceSsot, resolvePrecedence } from "./WorkspacePrecedence.js";

describe("Domínio — LegacyPrecedence [BR-CLI-WORKSPACE-PRECEDENCE]", () => {
  it("DADO estado 'governance' ENTÃO resolução é 'governance-ssot'", () => {
    expect(resolvePrecedence({ kind: "governance" })).toEqual({
      kind: "governance-ssot",
    });
  });

  it("DADO estado 'legacy' ENTÃO requer adoção explícita (sem alias mágico)", () => {
    expect(resolvePrecedence({ kind: "legacy", sources: [".specify"] })).toEqual({
      kind: "needs-adoption",
      sources: [".specify"],
    });
  });

  it("DADO estado 'mixed' SEM bridge ENTÃO retorna 'ambiguous'", () => {
    const res = resolvePrecedence({
      kind: "mixed",
      legacySources: [".specify", ".ai-guidelines"],
    });
    expect(res.kind).toBe("ambiguous");
  });

  it("DADO estado 'mixed' COM bridge explícita ENTÃO resolve como 'governance-ssot' (leitura legado só por chamada explícita)", () => {
    const res = resolvePrecedence(
      { kind: "mixed", legacySources: [".specify"] },
      { allowExplicitLegacyBridge: true }
    );
    expect(res).toEqual({ kind: "governance-ssot" });
  });

  describe("requireGovernanceSsot", () => {
    it("DADO 'governance' ENTÃO não lança", () => {
      expect(() => requireGovernanceSsot({ kind: "governance" })).not.toThrow();
    });

    it("DADO 'mixed' sem bridge ENTÃO lança GovernanceError com código estável", () => {
      try {
        requireGovernanceSsot({
          kind: "mixed",
          legacySources: [".specify"],
        });
        fail("Esperava GovernanceError");
      } catch (err) {
        expect(err).toBeInstanceOf(GovernanceError);
        expect((err as GovernanceError).code).toBe("WORKSPACE_AMBIGUOUS_STATE");
      }
    });

    it("DADO 'legacy' ENTÃO lança código 'WORKSPACE_LEGACY_NOT_ADOPTED' (mensagem instrui adoção)", () => {
      try {
        requireGovernanceSsot({ kind: "legacy", sources: [".specify"] });
        fail("Esperava GovernanceError");
      } catch (err) {
        expect((err as GovernanceError).code).toBe("WORKSPACE_LEGACY_NOT_ADOPTED");
        expect((err as Error).message).toContain(".specify");
      }
    });

    it("DADO 'pristine' ENTÃO lança código 'WORKSPACE_NOT_INITIALIZED'", () => {
      try {
        requireGovernanceSsot({ kind: "pristine" });
        fail("Esperava GovernanceError");
      } catch (err) {
        expect((err as GovernanceError).code).toBe("WORKSPACE_NOT_INITIALIZED");
      }
    });
  });
});

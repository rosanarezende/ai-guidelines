/**
 * [BR-CLI-LIVING-DOCS-VERSIONING] Schema version como contrato.
 *
 * Aplica ADR 0002 (.core/governance/adrs/0002-coverage-state-enum.md §6):
 * mudar a cardinalidade do schema exige incremento de schemaVersion +
 * ADR de extensão. Esta suite garante que:
 *
 *  1. `LIVING_DOCS_SCHEMA_VERSION` está cravado como "v0" (versão inicial).
 *  2. Artefato com schemaVersion fora do conjunto suportado é rejeitado
 *     com código estável `LIVING_DOCS_INVALID_SCHEMA_VERSION`.
 *  3. A constante de versão está visível como API pública (exportada)
 *     para consumidores externos pinarem.
 *
 * Anti-objetivo (explícito):
 *  - NÃO implementar migration framework v0→v1 agora. Política, não código.
 *    Quando v1 existir, ADR de extensão decide migração.
 */
import { GovernanceError } from "../shared/errors.js";
import {
  assertValidArtifact,
  LIVING_DOCS_SCHEMA_VERSION,
  LIVING_DOCS_SUPPORTED_SCHEMA_VERSIONS,
} from "./LivingDocsArtifact.js";

const baseEntry = {
  ruleId: "BR-CLI-X",
  title: "exemplo",
  boundedContext: "policy",
  domain: "X",
  evidence: [
    {
      file: "src/x.test.ts",
      lineStart: 1,
      lineEnd: 1,
      testName: "exemplo",
      coverageState: "covered" as const,
    },
  ],
  tags: [],
  coverageState: "covered" as const,
};

describe("LivingDocs — Schema version contract [BR-CLI-LIVING-DOCS-VERSIONING]", () => {
  describe("Constante canônica", () => {
    it("DADO a versão inicial ENTÃO é exportada como 'v0' [BR-CLI-LIVING-DOCS-VERSIONING-01]", () => {
      expect(LIVING_DOCS_SCHEMA_VERSION).toBe("v0");
    });

    it("DADO o conjunto de versões suportadas ENTÃO inclui ao menos a versão corrente [BR-CLI-LIVING-DOCS-VERSIONING-02]", () => {
      expect(LIVING_DOCS_SUPPORTED_SCHEMA_VERSIONS).toContain(LIVING_DOCS_SCHEMA_VERSION);
    });

    it("DADO o conjunto ENTÃO é imutável em runtime (readonly array) [BR-CLI-LIVING-DOCS-VERSIONING-03]", () => {
      // Object.isFrozen é o sinal idiomático de "não-mexa-em-runtime".
      expect(Object.isFrozen(LIVING_DOCS_SUPPORTED_SCHEMA_VERSIONS)).toBe(true);
    });
  });

  describe("Rejeição de versões fora do conjunto suportado", () => {
    it.each(["v1", "v99", "1.0", "v0.1", ""])(
      "DADO schemaVersion='%s' (não-suportada) ENTÃO LIVING_DOCS_INVALID_SCHEMA_VERSION [BR-CLI-LIVING-DOCS-VERSIONING-04]",
      (bad) => {
        try {
          assertValidArtifact({
            schemaVersion: bad,
            entries: [baseEntry],
          });
          fail("deveria ter lançado");
        } catch (e) {
          expect(e).toBeInstanceOf(GovernanceError);
          const err = e as GovernanceError;
          expect(err.code).toBe("LIVING_DOCS_INVALID_SCHEMA_VERSION");
          // Mensagem nomeia o conjunto suportado (ADR 0002 §3)
          expect(err.message).toContain(LIVING_DOCS_SCHEMA_VERSION);
        }
      }
    );

    it("DADO schemaVersion não-string ENTÃO LIVING_DOCS_INVALID_SCHEMA_VERSION [BR-CLI-LIVING-DOCS-VERSIONING-05]", () => {
      try {
        assertValidArtifact({ schemaVersion: 0, entries: [baseEntry] });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_SCHEMA_VERSION");
      }
    });
  });

  describe("Compatibilidade futura (documentada por convenção)", () => {
    it("DADO schemaVersion === LIVING_DOCS_SCHEMA_VERSION ENTÃO aceita [BR-CLI-LIVING-DOCS-VERSIONING-06]", () => {
      expect(() =>
        assertValidArtifact({
          schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
          entries: [baseEntry],
        })
      ).not.toThrow();
    });
  });
});

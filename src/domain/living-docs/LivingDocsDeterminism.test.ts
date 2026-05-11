/**
 * [BR-CLI-LIVING-DOCS-DETERMINISM] Canonicalização determinística.
 *
 * Aplica ADR 0004 (.core/governance/adrs/0004-ast-only-extraction.md):
 * mesma árvore + mesma versão do extractor + mesma versão do schema →
 * artefato byte-a-byte idêntico. Domain expõe `canonicalizeArtifact` que
 * normaliza ordem; a serialização YAML literal vive em infrastructure.
 *
 * Contratos cobertos:
 *  - entries ordenadas alfabeticamente por ruleId
 *  - tags de cada entry ordenadas alfabeticamente
 *  - canonicalize é idempotente (canonicalize(canonicalize(x)) === canonicalize(x))
 *  - sem timestamps no artefato (determinismo absoluto, ADR 0004 §2)
 */
import { canonicalizeArtifact, LIVING_DOCS_SCHEMA_VERSION } from "./LivingDocsArtifact.js";
import { LivingDocsEntry } from "./LivingDocsEntry.js";

const baseEntry: Omit<LivingDocsEntry, "ruleId" | "tags"> = {
  title: "regra base",
  boundedContext: "policy",
  domain: "WorkItemPolicy",
  source: { file: "src/x.test.ts", lineStart: 1, lineEnd: 5 },
  coverageState: "covered",
};

describe("LivingDocs — Canonicalização determinística [BR-CLI-LIVING-DOCS-DETERMINISM]", () => {
  describe("Ordenação alfabética por ruleId", () => {
    it("DADO entries em ordem aleatória ENTÃO canonicalize ordena alfa por ruleId [BR-CLI-LIVING-DOCS-DETERMINISM-01]", () => {
      const unordered = [
        { ...baseEntry, ruleId: "BR-CLI-Z", tags: ["a"] },
        { ...baseEntry, ruleId: "BR-CLI-A", tags: ["b"] },
        { ...baseEntry, ruleId: "BR-CLI-M", tags: ["c"] },
      ];
      const result = canonicalizeArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: unordered,
      });
      expect(result.entries.map((e) => e.ruleId)).toEqual(["BR-CLI-A", "BR-CLI-M", "BR-CLI-Z"]);
    });

    it("DADO ruleIds com sufixos numéricos ENTÃO ordenação é lexicográfica estável (POLICY-1 antes de POLICY-10 antes de POLICY-2) [BR-CLI-LIVING-DOCS-DETERMINISM-02]", () => {
      // Lexicográfica pura — não tentar "natural sort". Decisão consciente:
      // ordenação estável e previsível > "intuitiva mas variável por locale".
      const ids = ["BR-CLI-POLICY-2", "BR-CLI-POLICY-10", "BR-CLI-POLICY-1"];
      const result = canonicalizeArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: ids.map((ruleId) => ({ ...baseEntry, ruleId, tags: [] })),
      });
      expect(result.entries.map((e) => e.ruleId)).toEqual([
        "BR-CLI-POLICY-1",
        "BR-CLI-POLICY-10",
        "BR-CLI-POLICY-2",
      ]);
    });
  });

  describe("Ordenação alfabética de tags por entry", () => {
    it("DADO entry com tags em ordem aleatória ENTÃO canonicalize ordena alfa [BR-CLI-LIVING-DOCS-DETERMINISM-03]", () => {
      const result = canonicalizeArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [
          {
            ...baseEntry,
            ruleId: "BR-CLI-X",
            tags: ["zebra", "alpha", "mango"],
          },
        ],
      });
      expect(result.entries[0].tags).toEqual(["alpha", "mango", "zebra"]);
    });

    it("DADO tags vazias ENTÃO canonicalize preserva array vazio [BR-CLI-LIVING-DOCS-DETERMINISM-04]", () => {
      const result = canonicalizeArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [{ ...baseEntry, ruleId: "BR-CLI-X", tags: [] }],
      });
      expect(result.entries[0].tags).toEqual([]);
    });

    it("DADO tags duplicadas ENTÃO canonicalize deduplica preservando alfa [BR-CLI-LIVING-DOCS-DETERMINISM-05]", () => {
      const result = canonicalizeArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [
          {
            ...baseEntry,
            ruleId: "BR-CLI-X",
            tags: ["alpha", "alpha", "mango", "alpha"],
          },
        ],
      });
      expect(result.entries[0].tags).toEqual(["alpha", "mango"]);
    });
  });

  describe("Idempotência", () => {
    it("DADO canonicalize aplicado duas vezes ENTÃO resultado é idêntico [BR-CLI-LIVING-DOCS-DETERMINISM-06]", () => {
      const artifact = {
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [
          { ...baseEntry, ruleId: "BR-CLI-Z", tags: ["zebra", "alpha"] },
          { ...baseEntry, ruleId: "BR-CLI-A", tags: ["mango", "alpha"] },
        ],
      };
      const once = canonicalizeArtifact(artifact);
      const twice = canonicalizeArtifact(once);
      expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
    });
  });

  describe("Ausência de timestamps (ADR 0004 §2)", () => {
    it("DADO canonicalize ENTÃO o artifact NÃO contém campos temporais (generatedAt, timestamp, etc) [BR-CLI-LIVING-DOCS-DETERMINISM-07]", () => {
      const result = canonicalizeArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [{ ...baseEntry, ruleId: "BR-CLI-X", tags: [] }],
      });
      const json = JSON.stringify(result);
      expect(json).not.toContain("generatedAt");
      expect(json).not.toContain("timestamp");
      expect(json).not.toContain("createdAt");
      expect(json).not.toContain("updatedAt");
    });
  });

  describe("Estabilidade byte-a-byte", () => {
    it("DADO duas execuções com mesma entrada ENTÃO JSON.stringify produz a mesma string [BR-CLI-LIVING-DOCS-DETERMINISM-08]", () => {
      const input = {
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [
          { ...baseEntry, ruleId: "BR-CLI-B", tags: ["x", "a"] },
          { ...baseEntry, ruleId: "BR-CLI-A", tags: ["m", "a"] },
        ],
      };
      const a = JSON.stringify(canonicalizeArtifact(input));
      const b = JSON.stringify(canonicalizeArtifact(input));
      expect(a).toBe(b);
    });
  });
});

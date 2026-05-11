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
  evidence: [
    {
      file: "src/x.test.ts",
      lineStart: 1,
      lineEnd: 5,
      testName: "regra base",
      coverageState: "covered",
    },
  ],
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

describe("LivingDocs — Agregação por ruleId [BR-CLI-LIVING-DOCS-DETERMINISM]", () => {
  const baseSource = {
    file: "src/x.test.ts",
    lineStart: 1,
    lineEnd: 1,
    testName: "t",
    coverageState: "covered" as const,
  };
  const baseAgg: Omit<LivingDocsEntry, "ruleId" | "tags" | "evidence"> = {
    title: "regra",
    boundedContext: "policy",
    domain: "X",
    coverageState: "covered",
  };

  describe("Agregação cross-entry mesmo ruleId/mesmo file", () => {
    it("DADO 3 entries com mesmo ruleId/mesmo file ENTÃO 1 entry com evidence[]=3 e tags união [BR-CLI-LIVING-DOCS-DETERMINISM-09]", () => {
      const result = canonicalizeArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [
          {
            ...baseAgg,
            ruleId: "BR-CLI-Y",
            evidence: [{ ...baseSource, lineStart: 30, lineEnd: 32, testName: "WHEN" }],
            tags: ["b"],
          },
          {
            ...baseAgg,
            ruleId: "BR-CLI-Y",
            evidence: [{ ...baseSource, lineStart: 10, lineEnd: 12, testName: "GIVEN" }],
            tags: ["a"],
          },
          {
            ...baseAgg,
            ruleId: "BR-CLI-Y",
            evidence: [{ ...baseSource, lineStart: 50, lineEnd: 55, testName: "THEN" }],
            tags: ["c"],
          },
        ],
      });
      expect(result.entries).toHaveLength(1);
      const agg = result.entries[0];
      expect(agg.evidence).toHaveLength(3);
      // Ordenado por lineStart ascendente
      expect(agg.evidence.map((ev) => ev.testName)).toEqual(["GIVEN", "WHEN", "THEN"]);
      expect(agg.tags).toEqual(["a", "b", "c"]);
    });

    it("DADO entries com evidence duplicada (mesmo file+lineStart+lineEnd+testName) ENTÃO dedup preserva 1 [BR-CLI-LIVING-DOCS-DETERMINISM-10]", () => {
      const dup = { ...baseSource, lineStart: 10, lineEnd: 12, testName: "WHEN" };
      const result = canonicalizeArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [
          { ...baseAgg, ruleId: "BR-CLI-X", evidence: [dup], tags: [] },
          { ...baseAgg, ruleId: "BR-CLI-X", evidence: [dup], tags: [] },
        ],
      });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].evidence).toHaveLength(1);
    });

    it("DADO ruleId em files diferentes ENTÃO LIVING_DOCS_RULE_CROSS_FILE [BR-CLI-LIVING-DOCS-DETERMINISM-11]", () => {
      try {
        canonicalizeArtifact({
          schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
          entries: [
            {
              ...baseAgg,
              ruleId: "BR-CLI-Z",
              evidence: [{ ...baseSource, file: "src/a.test.ts" }],
              tags: [],
            },
            {
              ...baseAgg,
              ruleId: "BR-CLI-Z",
              evidence: [{ ...baseSource, file: "src/b.test.ts" }],
              tags: [],
            },
          ],
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as { code: string }).code).toBe("LIVING_DOCS_RULE_CROSS_FILE");
      }
    });
  });

  describe("Fusão de coverageState (matriz)", () => {
    function aggregate(states: readonly LivingDocsEntry["coverageState"][]): LivingDocsEntry {
      return canonicalizeArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: states.map((state, i) => ({
          ...baseAgg,
          ruleId: "BR-CLI-FUSION",
          coverageState: state,
          evidence: [{ ...baseSource, lineStart: i + 1, lineEnd: i + 1, coverageState: state }],
          tags: [],
        })),
      }).entries[0];
    }

    it("DADO todas evidence='covered' ENTÃO entry.coverageState='covered' [BR-CLI-LIVING-DOCS-DETERMINISM-12]", () => {
      expect(aggregate(["covered", "covered", "covered"]).coverageState).toBe("covered");
    });

    it("DADO todas evidence='pending' ENTÃO entry.coverageState='pending' [BR-CLI-LIVING-DOCS-DETERMINISM-13]", () => {
      expect(aggregate(["pending", "pending"]).coverageState).toBe("pending");
    });

    it("DADO mistura covered+pending ENTÃO entry.coverageState='covered' (cobertura existe, mesmo parcial) [BR-CLI-LIVING-DOCS-DETERMINISM-14]", () => {
      expect(aggregate(["covered", "pending"]).coverageState).toBe("covered");
    });

    it("DADO mistura deprecated+covered ENTÃO LIVING_DOCS_INCONSISTENT_DEPRECATION [BR-CLI-LIVING-DOCS-DETERMINISM-15]", () => {
      try {
        aggregate(["deprecated", "covered"]);
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as { code: string }).code).toBe("LIVING_DOCS_INCONSISTENT_DEPRECATION");
      }
    });
  });

  describe("Bypass convergente vs divergente", () => {
    const bypass = (until: string, ref: string, reason: string) => ({ until, ref, reason });

    function aggregateBypass(
      bypasses: ReadonlyArray<{ until: string; ref: string; reason: string } | undefined>
    ): LivingDocsEntry {
      return canonicalizeArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: bypasses.map((b, i) => ({
          ...baseAgg,
          ruleId: "BR-CLI-DEP-FUSION",
          coverageState: "deprecated" as const,
          evidence: [
            {
              ...baseSource,
              lineStart: i + 1,
              lineEnd: i + 1,
              coverageState: "deprecated" as const,
              ...(b !== undefined ? { bypass: b } : {}),
            },
          ],
          tags: [],
          ...(b !== undefined ? { bypass: b } : {}),
        })),
      }).entries[0];
    }

    it("DADO todas evidence deprecated COM bypass idêntico ENTÃO entry.bypass = bypass único [BR-CLI-LIVING-DOCS-DETERMINISM-16]", () => {
      const b = bypass("2026-12-31", "INC-1", "motivo válido aqui");
      const agg = aggregateBypass([b, b, b]);
      expect(agg.coverageState).toBe("deprecated");
      expect(agg.bypass).toEqual(b);
    });

    it("DADO bypass divergente entre evidence ENTÃO LIVING_DOCS_BYPASS_DIVERGENT [BR-CLI-LIVING-DOCS-DETERMINISM-17]", () => {
      try {
        aggregateBypass([
          bypass("2026-12-31", "INC-1", "motivo válido aqui"),
          bypass("2027-01-15", "INC-1", "motivo válido aqui"),
        ]);
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as { code: string }).code).toBe("LIVING_DOCS_BYPASS_DIVERGENT");
      }
    });

    it("DADO bypass declarado em parte das evidence ENTÃO LIVING_DOCS_BYPASS_DIVERGENT [BR-CLI-LIVING-DOCS-DETERMINISM-18]", () => {
      try {
        aggregateBypass([bypass("2026-12-31", "INC-1", "motivo válido aqui"), undefined]);
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as { code: string }).code).toBe("LIVING_DOCS_BYPASS_DIVERGENT");
      }
    });

    it("DADO todas evidence deprecated SEM bypass ENTÃO entry.bypass omitido [BR-CLI-LIVING-DOCS-DETERMINISM-19]", () => {
      const agg = aggregateBypass([undefined, undefined]);
      expect(agg.coverageState).toBe("deprecated");
      expect(agg.bypass).toBeUndefined();
    });
  });
});

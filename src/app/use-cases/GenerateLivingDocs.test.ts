/**
 * [BR-CLI-LIVING-DOCS-GENERATE] Use case GenerateLivingDocs.
 *
 * Orquestra extractor → canonicalize → assertValidArtifact. Validação
 * do conteúdo (ordem, dedup, schema) é responsabilidade do domain;
 * aqui testamos só a orquestração + invariantes do output.
 */
import { LIVING_DOCS_SCHEMA_VERSION } from "../../domain/living-docs/LivingDocsArtifact.js";
import { LivingDocsEntry } from "../../domain/living-docs/LivingDocsEntry.js";
import type { RuleExtractor } from "../ports/RuleExtractor.js";
import { GenerateLivingDocs } from "./GenerateLivingDocs.js";

function makeEntry(ruleId: string, overrides: Partial<LivingDocsEntry> = {}): LivingDocsEntry {
  return {
    ruleId,
    title: "x",
    boundedContext: "policy",
    domain: "X",
    evidence: [
      {
        file: "src/x.test.ts",
        lineStart: 1,
        lineEnd: 1,
        testName: "x",
        coverageState: "covered",
      },
    ],
    tags: [],
    coverageState: "covered",
    ...overrides,
  };
}

class StubExtractor implements RuleExtractor {
  constructor(private readonly entries: readonly LivingDocsEntry[]) {}
  extract(): readonly LivingDocsEntry[] {
    return this.entries;
  }
}

describe("App — GenerateLivingDocs [BR-CLI-LIVING-DOCS-GENERATE]", () => {
  it("DADO 0 entries ENTÃO produz artifact com schemaVersion canônico e entries=[] [BR-CLI-LIVING-DOCS-GENERATE-01]", () => {
    const useCase = new GenerateLivingDocs({ extractor: new StubExtractor([]) });
    const artifact = useCase.execute({ files: [] });
    expect(artifact.schemaVersion).toBe(LIVING_DOCS_SCHEMA_VERSION);
    expect(artifact.entries).toEqual([]);
  });

  it("DADO entries fora de ordem ENTÃO output está canonicalizado (alfa por ruleId) [BR-CLI-LIVING-DOCS-GENERATE-02]", () => {
    const useCase = new GenerateLivingDocs({
      extractor: new StubExtractor([
        makeEntry("BR-CLI-Z"),
        makeEntry("BR-CLI-A"),
        makeEntry("BR-CLI-M"),
      ]),
    });
    const result = useCase.execute({ files: ["x.test.ts"] });
    expect(result.entries.map((e) => e.ruleId)).toEqual(["BR-CLI-A", "BR-CLI-M", "BR-CLI-Z"]);
  });

  it("DADO entry com bypass ENTÃO preserva bypass block no artifact [BR-CLI-LIVING-DOCS-GENERATE-03]", () => {
    const useCase = new GenerateLivingDocs({
      extractor: new StubExtractor([
        makeEntry("BR-CLI-DEP-01", {
          evidence: [
            {
              file: "src/x.test.ts",
              lineStart: 1,
              lineEnd: 1,
              testName: "deprecated",
              coverageState: "deprecated",
              bypass: { until: "2026-12-31", ref: "INC-1", reason: "motivo válido aqui" },
            },
          ],
          coverageState: "deprecated",
          bypass: { until: "2026-12-31", ref: "INC-1", reason: "motivo válido aqui" },
        }),
      ]),
    });
    const artifact = useCase.execute({ files: ["x.test.ts"] });
    expect(artifact.entries[0].bypass).toEqual({
      until: "2026-12-31",
      ref: "INC-1",
      reason: "motivo válido aqui",
    });
  });

  it("DADO entries cruas com mesmo ruleId/mesmo file ENTÃO agrega em 1 entry (1 rule → N evidências) [BR-CLI-LIVING-DOCS-GENERATE-04]", () => {
    const useCase = new GenerateLivingDocs({
      extractor: new StubExtractor([
        makeEntry("BR-CLI-A", {
          evidence: [
            {
              file: "src/x.test.ts",
              lineStart: 10,
              lineEnd: 12,
              testName: "cenário GIVEN",
              coverageState: "covered",
            },
          ],
          tags: ["alpha"],
        }),
        makeEntry("BR-CLI-A", {
          evidence: [
            {
              file: "src/x.test.ts",
              lineStart: 20,
              lineEnd: 22,
              testName: "cenário WHEN",
              coverageState: "covered",
            },
          ],
          tags: ["beta"],
        }),
      ]),
    });
    const artifact = useCase.execute({ files: ["x.test.ts"] });
    expect(artifact.entries).toHaveLength(1);
    expect(artifact.entries[0].ruleId).toBe("BR-CLI-A");
    expect(artifact.entries[0].evidence).toHaveLength(2);
    expect(artifact.entries[0].evidence.map((ev) => ev.testName)).toEqual([
      "cenário GIVEN",
      "cenário WHEN",
    ]);
    expect(artifact.entries[0].tags).toEqual(["alpha", "beta"]);
  });

  it("DADO entries cruas com mesmo ruleId em arquivos diferentes ENTÃO LIVING_DOCS_RULE_CROSS_FILE [BR-CLI-LIVING-DOCS-GENERATE-06]", () => {
    const useCase = new GenerateLivingDocs({
      extractor: new StubExtractor([
        makeEntry("BR-CLI-A", {
          evidence: [
            {
              file: "src/a.test.ts",
              lineStart: 1,
              lineEnd: 1,
              testName: "em a",
              coverageState: "covered",
            },
          ],
        }),
        makeEntry("BR-CLI-A", {
          evidence: [
            {
              file: "src/b.test.ts",
              lineStart: 1,
              lineEnd: 1,
              testName: "em b",
              coverageState: "covered",
            },
          ],
        }),
      ]),
    });
    expect(() => useCase.execute({ files: ["a.test.ts", "b.test.ts"] })).toThrow(
      /LIVING_DOCS_RULE_CROSS_FILE|cross-file|múltiplos arquivos/i
    );
  });

  it("DADO duas execuções ENTÃO artifact é byte-a-byte idêntico (determinismo) [BR-CLI-LIVING-DOCS-GENERATE-05]", () => {
    const useCase = new GenerateLivingDocs({
      extractor: new StubExtractor([
        makeEntry("BR-CLI-B", { tags: ["x", "a"] }),
        makeEntry("BR-CLI-A", { tags: ["m", "a"] }),
      ]),
    });
    const a = JSON.stringify(useCase.execute({ files: ["x.test.ts"] }));
    const b = JSON.stringify(useCase.execute({ files: ["x.test.ts"] }));
    expect(a).toBe(b);
  });
});

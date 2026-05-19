/**
 * [BR-CLI-LIVING-DOCS-SCHEMA] Schema do artefato de Living Documentation.
 *
 * Valida `LivingDocsSource` (item de `evidence[]`), `LivingDocsEntry` (com
 * `evidence: SourceLocation[]` plural — modelo 1 rule → N evidências) e
 * `LivingDocsArtifact` como contrato.
 *
 * Aplica ADR 0011 (.core/governance/adrs/0011-coverage-state-enum.md):
 * coverageState é enum fechado { covered, pending, deprecated } com
 * mensagens determinísticas nomeando o conjunto válido.
 *
 * Schema canônico v0 — sub-bloco 3.C.4-prep (2026-05-11) evolui v0
 * in-place ganhando `evidence: SourceLocation[]`. Sem bump v0→v1: o
 * artefato nunca foi escrito em produção, não há baseline para migrar.
 */
import { GovernanceError } from "../shared/errors.js";
import { assertValidEntry, assertValidSource } from "./LivingDocsEntry.js";
import { assertValidArtifact, LIVING_DOCS_SCHEMA_VERSION } from "./LivingDocsArtifact.js";

const validSource = {
  file: "src/domain/policy/Pillars.test.ts",
  lineStart: 11,
  lineEnd: 22,
  testName: "Item denso sem workspacePath deve falhar",
  coverageState: "covered" as const,
};

const validEntry = {
  ruleId: "BR-CLI-POLICY-01",
  title: "Item denso sem workspacePath deve falhar",
  boundedContext: "policy",
  domain: "WorkItemPolicy",
  evidence: [validSource],
  tags: ["policy", "dense"],
  coverageState: "covered" as const,
};

describe("LivingDocs — Schema de evidence item [BR-CLI-LIVING-DOCS-SCHEMA]", () => {
  describe("LivingDocsSource válida", () => {
    it("DADO source bem-formada ENTÃO assertValidSource não lança [BR-CLI-LIVING-DOCS-SCHEMA-17]", () => {
      expect(() => assertValidSource(validSource)).not.toThrow();
    });
  });

  describe("Campos obrigatórios de LivingDocsSource", () => {
    it("DADO source SEM file ENTÃO LIVING_DOCS_INVALID_SOURCE [BR-CLI-LIVING-DOCS-SCHEMA-18]", () => {
      const { file: _, ...incomplete } = validSource;
      try {
        assertValidSource(incomplete);
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_SOURCE");
      }
    });

    it("DADO source SEM testName ENTÃO LIVING_DOCS_INVALID_SOURCE [BR-CLI-LIVING-DOCS-SCHEMA-19]", () => {
      const { testName: _, ...incomplete } = validSource;
      try {
        assertValidSource(incomplete);
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_SOURCE");
      }
    });

    it("DADO source COM lineStart > lineEnd ENTÃO LIVING_DOCS_INVALID_SOURCE [BR-CLI-LIVING-DOCS-SCHEMA-20]", () => {
      try {
        assertValidSource({ ...validSource, lineStart: 10, lineEnd: 5 });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_SOURCE");
      }
    });

    it("DADO source COM coverageState fora do enum ENTÃO LIVING_DOCS_INVALID_COVERAGE_STATE [BR-CLI-LIVING-DOCS-SCHEMA-21]", () => {
      try {
        assertValidSource({ ...validSource, coverageState: "wip" });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_COVERAGE_STATE");
      }
    });

    it("DADO source COM bypass mas coverageState != deprecated ENTÃO LIVING_DOCS_BYPASS_REQUIRES_DEPRECATED [BR-CLI-LIVING-DOCS-SCHEMA-22]", () => {
      try {
        assertValidSource({
          ...validSource,
          coverageState: "covered",
          bypass: { until: "2026-12-31", ref: "INC-1", reason: "motivo válido aqui" },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_REQUIRES_DEPRECATED");
      }
    });

    it("DADO source DEPRECATED COM bypass válido ENTÃO aceita [BR-CLI-LIVING-DOCS-SCHEMA-23]", () => {
      expect(() =>
        assertValidSource({
          ...validSource,
          coverageState: "deprecated",
          bypass: {
            until: "2026-12-31",
            ref: "DEC-0021-C01",
            reason: "regra em transição para Living Docs",
          },
        })
      ).not.toThrow();
    });
  });
});

describe("LivingDocs — Schema de Entry com evidence[] [BR-CLI-LIVING-DOCS-SCHEMA]", () => {
  describe("Entry válida", () => {
    it("DADO entrada completa e bem-formada ENTÃO valida sem lançar [BR-CLI-LIVING-DOCS-SCHEMA-01]", () => {
      expect(() => assertValidEntry(validEntry)).not.toThrow();
    });
  });

  describe("coverageState como enum fechado (ADR 0011)", () => {
    it.each(["covered", "pending", "deprecated"] as const)(
      "DADO coverageState='%s' ENTÃO aceita [BR-CLI-LIVING-DOCS-SCHEMA-02]",
      (state) => {
        const evidenceWithState =
          state === "deprecated"
            ? [
                {
                  ...validSource,
                  coverageState: state,
                  bypass: {
                    until: "2026-12-31",
                    ref: "INC-20260511-3",
                    reason: "regra revisada após incidente, aguardando spec",
                  },
                },
              ]
            : [{ ...validSource, coverageState: state }];
        const entryWithBypass =
          state === "deprecated"
            ? {
                ...validEntry,
                evidence: evidenceWithState,
                coverageState: state,
                bypass: {
                  until: "2026-12-31",
                  ref: "INC-20260511-3",
                  reason: "regra revisada após incidente, aguardando spec",
                },
              }
            : { ...validEntry, evidence: evidenceWithState, coverageState: state };
        expect(() => assertValidEntry(entryWithBypass)).not.toThrow();
      }
    );

    it.each(["in-progress", "wip", "todo", "blocked", ""] as const)(
      "DADO coverageState='%s' (fora do enum) ENTÃO LIVING_DOCS_INVALID_COVERAGE_STATE com mensagem nomeando o conjunto [BR-CLI-LIVING-DOCS-SCHEMA-03]",
      (badState) => {
        try {
          assertValidEntry({ ...validEntry, coverageState: badState });
          fail("deveria ter lançado");
        } catch (e) {
          expect(e).toBeInstanceOf(GovernanceError);
          const err = e as GovernanceError;
          expect(err.code).toBe("LIVING_DOCS_INVALID_COVERAGE_STATE");
          expect(err.message).toContain("covered");
          expect(err.message).toContain("pending");
          expect(err.message).toContain("deprecated");
        }
      }
    );
  });

  describe("Campos obrigatórios", () => {
    it.each([
      "ruleId",
      "title",
      "boundedContext",
      "domain",
      "evidence",
      "tags",
      "coverageState",
    ] as const)(
      "DADO entry SEM '%s' ENTÃO LIVING_DOCS_MISSING_FIELD [BR-CLI-LIVING-DOCS-SCHEMA-04]",
      (field) => {
        const { [field]: _omitted, ...incomplete } = validEntry;
        try {
          assertValidEntry(incomplete);
          fail("deveria ter lançado");
        } catch (e) {
          expect(e).toBeInstanceOf(GovernanceError);
          const err = e as GovernanceError;
          expect(err.code).toBe("LIVING_DOCS_MISSING_FIELD");
          expect(err.message).toContain(field);
        }
      }
    );
  });

  describe("evidence[] com cardinalidade e items válidos", () => {
    it("DADO evidence vazio ENTÃO LIVING_DOCS_INVALID_EVIDENCE [BR-CLI-LIVING-DOCS-SCHEMA-24]", () => {
      try {
        assertValidEntry({ ...validEntry, evidence: [] });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_EVIDENCE");
      }
    });

    it("DADO evidence não-array ENTÃO LIVING_DOCS_INVALID_EVIDENCE [BR-CLI-LIVING-DOCS-SCHEMA-25]", () => {
      try {
        assertValidEntry({ ...validEntry, evidence: "not an array" });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_EVIDENCE");
      }
    });

    it("DADO evidence com item malformado ENTÃO LIVING_DOCS_INVALID_SOURCE [BR-CLI-LIVING-DOCS-SCHEMA-26]", () => {
      try {
        assertValidEntry({
          ...validEntry,
          evidence: [validSource, { file: "x.ts" /* faltando campos */ }],
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_SOURCE");
      }
    });

    it("DADO entry com múltiplas evidências válidas ENTÃO aceita [BR-CLI-LIVING-DOCS-SCHEMA-27]", () => {
      expect(() =>
        assertValidEntry({
          ...validEntry,
          evidence: [
            { ...validSource, testName: "cenário GIVEN", lineStart: 11, lineEnd: 15 },
            { ...validSource, testName: "cenário WHEN", lineStart: 17, lineEnd: 21 },
            { ...validSource, testName: "cenário THEN", lineStart: 23, lineEnd: 27 },
          ],
        })
      ).not.toThrow();
    });
  });

  describe("evidence inválido (line range, coverageState)", () => {
    it("DADO evidence[0] SEM file ENTÃO LIVING_DOCS_INVALID_SOURCE [BR-CLI-LIVING-DOCS-SCHEMA-05]", () => {
      const { file: _, ...incomplete } = validSource;
      try {
        assertValidEntry({ ...validEntry, evidence: [incomplete] });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_SOURCE");
      }
    });

    it("DADO evidence[0] COM lineStart > lineEnd ENTÃO LIVING_DOCS_INVALID_SOURCE [BR-CLI-LIVING-DOCS-SCHEMA-06]", () => {
      try {
        assertValidEntry({
          ...validEntry,
          evidence: [{ ...validSource, lineStart: 10, lineEnd: 5 }],
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_SOURCE");
      }
    });

    it("DADO evidence[0] COM lineStart === lineEnd ENTÃO aceita (linha única) [BR-CLI-LIVING-DOCS-SCHEMA-07]", () => {
      expect(() =>
        assertValidEntry({
          ...validEntry,
          evidence: [{ ...validSource, lineStart: 12, lineEnd: 12 }],
        })
      ).not.toThrow();
    });
  });

  describe("Bypass declarado no topo da entry (ADR 0012)", () => {
    it("DADO coverageState='deprecated' COM bypass válido ENTÃO aceita [BR-CLI-LIVING-DOCS-SCHEMA-08]", () => {
      expect(() =>
        assertValidEntry({
          ...validEntry,
          evidence: [
            {
              ...validSource,
              coverageState: "deprecated",
              bypass: {
                until: "2026-12-31",
                ref: "DEC-0021-C01",
                reason: "regra em transição para Living Docs",
              },
            },
          ],
          coverageState: "deprecated",
          bypass: {
            until: "2026-12-31",
            ref: "DEC-0021-C01",
            reason: "regra em transição para Living Docs",
          },
        })
      ).not.toThrow();
    });

    it("DADO bypass SEM 'until' ENTÃO LIVING_DOCS_BYPASS_MALFORMED [BR-CLI-LIVING-DOCS-SCHEMA-09]", () => {
      try {
        assertValidEntry({
          ...validEntry,
          evidence: [{ ...validSource, coverageState: "deprecated" }],
          coverageState: "deprecated",
          bypass: { ref: "DEC-0021-C01", reason: "motivo válido aqui" },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_MALFORMED");
      }
    });

    it("DADO bypass COM 'until' em formato inválido ENTÃO LIVING_DOCS_BYPASS_MALFORMED [BR-CLI-LIVING-DOCS-SCHEMA-10]", () => {
      try {
        assertValidEntry({
          ...validEntry,
          evidence: [{ ...validSource, coverageState: "deprecated" }],
          coverageState: "deprecated",
          bypass: { until: "31/12/2026", ref: "DEC-0021-C01", reason: "motivo válido" },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_MALFORMED");
      }
    });

    it("DADO bypass COM 'reason' curto demais ENTÃO LIVING_DOCS_BYPASS_MALFORMED [BR-CLI-LIVING-DOCS-SCHEMA-11]", () => {
      try {
        assertValidEntry({
          ...validEntry,
          evidence: [{ ...validSource, coverageState: "deprecated" }],
          coverageState: "deprecated",
          bypass: { until: "2026-12-31", ref: "DEC-0021-C01", reason: "curto" },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_MALFORMED");
      }
    });

    it("DADO bypass no topo COM coverageState != 'deprecated' ENTÃO LIVING_DOCS_BYPASS_REQUIRES_DEPRECATED [BR-CLI-LIVING-DOCS-SCHEMA-12]", () => {
      try {
        assertValidEntry({
          ...validEntry,
          coverageState: "covered",
          bypass: {
            until: "2026-12-31",
            ref: "DEC-0021-C01",
            reason: "motivo válido",
          },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_REQUIRES_DEPRECATED");
      }
    });
  });
});

describe("LivingDocs — Schema do Artifact [BR-CLI-LIVING-DOCS-SCHEMA]", () => {
  const validArtifact = {
    schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
    entries: [validEntry],
  };

  it("DADO artifact válido ENTÃO aceita [BR-CLI-LIVING-DOCS-SCHEMA-13]", () => {
    expect(() => assertValidArtifact(validArtifact)).not.toThrow();
  });

  it("DADO artifact com entries não-agregadas (mesmo ruleId) ENTÃO LIVING_DOCS_DUPLICATE_RULE_ID — rede de segurança pós-canonicalize [BR-CLI-LIVING-DOCS-SCHEMA-14]", () => {
    // No modelo agregado o `canonicalizeArtifact` agrupa entries cruas
    // antes de chegar aqui. Esta asserção continua sendo a rede de
    // segurança: se um caller injetar entries pré-validate duplicadas
    // (bug de canonicalize), o erro estável `LIVING_DOCS_DUPLICATE_RULE_ID`
    // dispara. Operacionalmente, este erro NÃO é mais emitido em fluxo
    // normal — o canonicalize garante unicidade por construção.
    try {
      assertValidArtifact({
        ...validArtifact,
        entries: [validEntry, { ...validEntry, title: "outro título mas mesmo ruleId" }],
      });
      fail("deveria ter lançado");
    } catch (e) {
      expect((e as GovernanceError).code).toBe("LIVING_DOCS_DUPLICATE_RULE_ID");
      expect((e as GovernanceError).message).toContain(validEntry.ruleId);
    }
  });

  it("DADO artifact com entries não-array ENTÃO LIVING_DOCS_INVALID_ENTRIES [BR-CLI-LIVING-DOCS-SCHEMA-15]", () => {
    try {
      assertValidArtifact({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: "not an array",
      });
      fail("deveria ter lançado");
    } catch (e) {
      expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_ENTRIES");
    }
  });

  it("DADO artifact SEM schemaVersion ENTÃO LIVING_DOCS_MISSING_FIELD [BR-CLI-LIVING-DOCS-SCHEMA-16]", () => {
    try {
      assertValidArtifact({ entries: [validEntry] });
      fail("deveria ter lançado");
    } catch (e) {
      expect((e as GovernanceError).code).toBe("LIVING_DOCS_MISSING_FIELD");
      expect((e as GovernanceError).message).toContain("schemaVersion");
    }
  });
});

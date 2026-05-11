/**
 * [BR-CLI-LIVING-DOCS-SCHEMA] Schema do artefato de Living Documentation.
 *
 * Valida o tipo `LivingDocsEntry` e `LivingDocsArtifact` como contrato.
 * Aplica ADR 0002 (.core/governance/adrs/0002-coverage-state-enum.md):
 * coverageState é enum fechado { covered, pending, deprecated } com
 * mensagens determinísticas nomeando o conjunto válido.
 *
 * Schema canônico v0 — qualquer alteração exige incremento de schemaVersion
 * + ADR de extensão (ADR 0002 §6).
 */
import { GovernanceError } from "../shared/errors.js";
import { assertValidEntry } from "./LivingDocsEntry.js";
import { assertValidArtifact, LIVING_DOCS_SCHEMA_VERSION } from "./LivingDocsArtifact.js";

const validEntry = {
  ruleId: "BR-CLI-POLICY-01",
  title: "Item denso sem workspacePath deve falhar",
  boundedContext: "policy",
  domain: "WorkItemPolicy",
  source: {
    file: "src/domain/policy/Pillars.test.ts",
    lineStart: 11,
    lineEnd: 22,
  },
  tags: ["policy", "dense"],
  coverageState: "covered" as const,
};

describe("LivingDocs — Schema de entrada [BR-CLI-LIVING-DOCS-SCHEMA]", () => {
  describe("Entry válida", () => {
    it("DADO entrada completa e bem-formada ENTÃO valida sem lançar [BR-CLI-LIVING-DOCS-SCHEMA-01]", () => {
      expect(() => assertValidEntry(validEntry)).not.toThrow();
    });
  });

  describe("coverageState como enum fechado (ADR 0002)", () => {
    it.each(["covered", "pending", "deprecated"] as const)(
      "DADO coverageState='%s' ENTÃO aceita [BR-CLI-LIVING-DOCS-SCHEMA-02]",
      (state) => {
        const entryWithBypass =
          state === "deprecated"
            ? {
                ...validEntry,
                coverageState: state,
                bypass: {
                  until: "2026-12-31",
                  ref: "INC-20260511-3",
                  reason: "regra revisada após incidente, aguardando spec",
                },
              }
            : { ...validEntry, coverageState: state };
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
      "source",
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

  describe("source com line range válido", () => {
    it("DADO source SEM file ENTÃO LIVING_DOCS_INVALID_SOURCE [BR-CLI-LIVING-DOCS-SCHEMA-05]", () => {
      try {
        assertValidEntry({
          ...validEntry,
          source: { lineStart: 1, lineEnd: 5 },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_SOURCE");
      }
    });

    it("DADO lineStart > lineEnd ENTÃO LIVING_DOCS_INVALID_SOURCE [BR-CLI-LIVING-DOCS-SCHEMA-06]", () => {
      try {
        assertValidEntry({
          ...validEntry,
          source: { file: "x.test.ts", lineStart: 10, lineEnd: 5 },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_SOURCE");
      }
    });

    it("DADO lineStart === lineEnd ENTÃO aceita (linha única) [BR-CLI-LIVING-DOCS-SCHEMA-07]", () => {
      expect(() =>
        assertValidEntry({
          ...validEntry,
          source: { file: "x.test.ts", lineStart: 12, lineEnd: 12 },
        })
      ).not.toThrow();
    });
  });

  describe("Bypass declarado (ADR 0003)", () => {
    it("DADO coverageState='deprecated' COM bypass válido ENTÃO aceita [BR-CLI-LIVING-DOCS-SCHEMA-08]", () => {
      expect(() =>
        assertValidEntry({
          ...validEntry,
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
          coverageState: "deprecated",
          bypass: {
            until: "31/12/2026", // não-ISO
            ref: "DEC-0021-C01",
            reason: "motivo válido",
          },
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
          coverageState: "deprecated",
          bypass: { until: "2026-12-31", ref: "DEC-0021-C01", reason: "curto" },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_MALFORMED");
      }
    });

    it("DADO bypass em entry com coverageState != 'deprecated' ENTÃO LIVING_DOCS_BYPASS_REQUIRES_DEPRECATED [BR-CLI-LIVING-DOCS-SCHEMA-12]", () => {
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

  it("DADO artifact com entries duplicadas (mesmo ruleId) ENTÃO LIVING_DOCS_DUPLICATE_RULE_ID [BR-CLI-LIVING-DOCS-SCHEMA-14]", () => {
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

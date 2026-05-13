/**
 * [BR-CLI-LIVING-DOCS-SERIALIZER] Serialização YAML determinística do
 * `LivingDocsArtifact` para `.governance/living-docs.yml`.
 *
 * Aplica ADRs 0002 + 0004: schema fechado + determinismo byte-a-byte.
 * Função pura; sem IO. Consumidor (use case) canonicaliza antes de chamar.
 */
import { GovernanceError } from "../../domain/shared/errors.js";
import { LIVING_DOCS_SCHEMA_VERSION } from "../../domain/living-docs/LivingDocsArtifact.js";
import { LivingDocsEntry } from "../../domain/living-docs/LivingDocsEntry.js";
import { serializeLivingDocs, parseLivingDocs } from "./livingDocsSerializer.js";

const baseEntry: LivingDocsEntry = {
  ruleId: "BR-CLI-A-01",
  title: "descrição",
  boundedContext: "policy",
  domain: "Pillars",
  evidence: [
    {
      file: "src/domain/policy/Pillars.test.ts",
      lineStart: 10,
      lineEnd: 15,
      testName: "descrição",
      coverageState: "covered",
    },
  ],
  tags: ["policy", "dense"],
  coverageState: "covered",
};

describe("Infra — livingDocsSerializer [BR-CLI-LIVING-DOCS-SERIALIZER]", () => {
  describe("Serialização", () => {
    it("DADO artifact mínimo ENTÃO produz YAML com schemaVersion e entries [BR-CLI-LIVING-DOCS-SERIALIZER-01]", () => {
      const yaml = serializeLivingDocs({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [baseEntry],
      });
      expect(yaml).toContain(`schemaVersion: ${LIVING_DOCS_SCHEMA_VERSION}`);
      expect(yaml).toContain("ruleId: BR-CLI-A-01");
      expect(yaml).toContain("coverageState: covered");
    });

    it("DADO artifact com bypass ENTÃO emite bloco bypass na entry [BR-CLI-LIVING-DOCS-SERIALIZER-02]", () => {
      const yaml = serializeLivingDocs({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [
          {
            ...baseEntry,
            ruleId: "BR-CLI-DEP-01",
            evidence: [
              {
                file: "src/domain/policy/Pillars.test.ts",
                lineStart: 10,
                lineEnd: 15,
                testName: "regra deprecated",
                coverageState: "deprecated",
                bypass: {
                  until: "2026-12-31",
                  ref: "INC-20260511-3",
                  reason: "regra em transição",
                },
              },
            ],
            coverageState: "deprecated",
            bypass: {
              until: "2026-12-31",
              ref: "INC-20260511-3",
              reason: "regra em transição",
            },
          },
        ],
      });
      expect(yaml).toContain("coverageState: deprecated");
      expect(yaml).toContain("bypass:");
      expect(yaml).toContain("until:");
      expect(yaml).toContain("2026-12-31");
      expect(yaml).toContain("ref:");
      expect(yaml).toContain("INC-20260511-3");
      expect(yaml).toContain("reason:");
    });
  });

  describe("Determinismo byte-a-byte (ADR 0004)", () => {
    it("DADO duas serializações do mesmo artifact ENTÃO produz a mesma string [BR-CLI-LIVING-DOCS-SERIALIZER-03]", () => {
      const artifact = {
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [
          { ...baseEntry, ruleId: "BR-CLI-B" },
          { ...baseEntry, ruleId: "BR-CLI-A" },
        ],
      };
      const a = serializeLivingDocs(artifact);
      const b = serializeLivingDocs(artifact);
      expect(a).toBe(b);
    });

    it("DADO artifact com entries em ordem aleatória ENTÃO serializa em ordem alfa por ruleId [BR-CLI-LIVING-DOCS-SERIALIZER-04]", () => {
      const yaml = serializeLivingDocs({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [
          { ...baseEntry, ruleId: "BR-CLI-Z" },
          { ...baseEntry, ruleId: "BR-CLI-A" },
          { ...baseEntry, ruleId: "BR-CLI-M" },
        ],
      });
      const posA = yaml.indexOf("BR-CLI-A");
      const posM = yaml.indexOf("BR-CLI-M");
      const posZ = yaml.indexOf("BR-CLI-Z");
      expect(posA).toBeLessThan(posM);
      expect(posM).toBeLessThan(posZ);
    });

    it("DADO entries com tags duplicadas/fora de ordem ENTÃO serializa em ordem alfa deduplicada [BR-CLI-LIVING-DOCS-SERIALIZER-05]", () => {
      const yaml = serializeLivingDocs({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [{ ...baseEntry, tags: ["zebra", "alpha", "alpha", "mango"] }],
      });
      const posA = yaml.indexOf("alpha");
      const posM = yaml.indexOf("mango");
      const posZ = yaml.indexOf("zebra");
      expect(posA).toBeLessThan(posM);
      expect(posM).toBeLessThan(posZ);
      // dedupe — 'alpha' aparece só uma vez (não conta como key do schema)
      expect(yaml.split("- alpha").length - 1).toBe(1);
    });

    it("DADO artifact serializado ENTÃO NÃO contém campos temporais [BR-CLI-LIVING-DOCS-SERIALIZER-06]", () => {
      const yaml = serializeLivingDocs({
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [baseEntry],
      });
      expect(yaml).not.toContain("generatedAt");
      expect(yaml).not.toContain("timestamp");
      expect(yaml).not.toContain("createdAt");
    });
  });

  describe("Round-trip (serialize → parse)", () => {
    it("DADO artifact serializado E re-parseado ENTÃO produz objeto estruturalmente igual [BR-CLI-LIVING-DOCS-SERIALIZER-07]", () => {
      const artifact = {
        schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
        entries: [
          baseEntry,
          {
            ...baseEntry,
            ruleId: "BR-CLI-DEP-01",
            evidence: [
              {
                file: "src/domain/policy/Pillars.test.ts",
                lineStart: 10,
                lineEnd: 15,
                testName: "round trip deprecated",
                coverageState: "deprecated" as const,
                bypass: {
                  until: "2026-12-31",
                  ref: "DEC-0021-C01",
                  reason: "motivo válido aqui",
                },
              },
            ],
            coverageState: "deprecated" as const,
            bypass: {
              until: "2026-12-31",
              ref: "DEC-0021-C01",
              reason: "motivo válido aqui",
            },
          },
        ],
      };
      const yaml = serializeLivingDocs(artifact);
      const parsed = parseLivingDocs(yaml);
      expect(parsed.schemaVersion).toBe(LIVING_DOCS_SCHEMA_VERSION);
      expect(parsed.entries).toHaveLength(2);
      expect(parsed.entries[0].ruleId).toBe("BR-CLI-A-01");
      expect(parsed.entries[1].bypass).toEqual({
        until: "2026-12-31",
        ref: "DEC-0021-C01",
        reason: "motivo válido aqui",
      });
    });

    it("DADO YAML inválido sintaticamente ENTÃO LIVING_DOCS_YAML_PARSE_ERROR [BR-CLI-LIVING-DOCS-SERIALIZER-08]", () => {
      expect(() => parseLivingDocs("[unclosed bracket")).toThrow();
    });

    it("DADO YAML válido mas com schema inválido ENTÃO repropaga erro do assertValidArtifact [BR-CLI-LIVING-DOCS-SERIALIZER-09]", () => {
      const badYaml = `
schemaVersion: v99
entries: []
`;
      try {
        parseLivingDocs(badYaml);
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_INVALID_SCHEMA_VERSION");
      }
    });
  });
});

/**
 * [BR-CLI-LIVING-DOCS-CHECK] Drift guard: compara artifact gerado vs
 * versão commitada.
 *
 * Aplica ADR 0004 (determinismo): comparação é byte-a-byte estável.
 * Aplica ADR 0003 (bypass auditável): se algum bypass expira durante
 * geração, o use case repropaga LIVING_DOCS_BYPASS_EXPIRED — não
 * "passa silencioso".
 *
 * Drift é qualquer divergência entre o conteúdo gerado (canonicalizado
 * + serializado) e o conteúdo lido do disco. Mensagem inclui diff legível.
 */
import {
  canonicalizeArtifact,
  LIVING_DOCS_SCHEMA_VERSION,
} from "../../domain/living-docs/LivingDocsArtifact.js";
import { LivingDocsEntry } from "../../domain/living-docs/LivingDocsEntry.js";
import { serializeLivingDocs } from "../../infrastructure/yaml/livingDocsSerializer.js";
import type { RuleExtractor } from "../ports/RuleExtractor.js";
import { CheckLivingDocs } from "./CheckLivingDocs.js";

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

// Helper: gera o YAML canônico que o "estado commitado" deveria ter
// para um dado conjunto de entries, mesmo passo que o generate produziria.
function generateExpectedYaml(entries: readonly LivingDocsEntry[]): string {
  return serializeLivingDocs(
    canonicalizeArtifact({ schemaVersion: LIVING_DOCS_SCHEMA_VERSION, entries: [...entries] })
  );
}

describe("App — CheckLivingDocs [BR-CLI-LIVING-DOCS-CHECK]", () => {
  describe("Sem drift (committed == generated)", () => {
    it("DADO YAML commitado IDÊNTICO ao gerado ENTÃO drift=false [BR-CLI-LIVING-DOCS-CHECK-01]", () => {
      const entries = [makeEntry("BR-CLI-A"), makeEntry("BR-CLI-B")];
      const committed = generateExpectedYaml(entries);
      const useCase = new CheckLivingDocs({
        serializer: serializeLivingDocs,
        extractor: new StubExtractor(entries),
      });
      const result = useCase.execute({ files: ["x.test.ts"], committedYaml: committed });
      expect(result.drift).toBe(false);
      expect(result.diff).toBe("");
    });
  });

  describe("Drift detectado (committed != generated)", () => {
    it("DADO regra nova adicionada SEM regenerar o artefato ENTÃO drift=true com mensagem nomeando a regra [BR-CLI-LIVING-DOCS-CHECK-02]", () => {
      const committedEntries = [makeEntry("BR-CLI-A")];
      const liveEntries = [makeEntry("BR-CLI-A"), makeEntry("BR-CLI-B-NOVA")];
      const committed = generateExpectedYaml(committedEntries);
      const useCase = new CheckLivingDocs({
        serializer: serializeLivingDocs,
        extractor: new StubExtractor(liveEntries),
      });
      const result = useCase.execute({ files: ["x.test.ts"], committedYaml: committed });
      expect(result.drift).toBe(true);
      expect(result.diff).toContain("BR-CLI-B-NOVA");
    });

    it("DADO regra renomeada SEM regenerar ENTÃO drift=true [BR-CLI-LIVING-DOCS-CHECK-03]", () => {
      const committed = generateExpectedYaml([makeEntry("BR-CLI-OLD")]);
      const useCase = new CheckLivingDocs({
        serializer: serializeLivingDocs,
        extractor: new StubExtractor([makeEntry("BR-CLI-NEW")]),
      });
      const result = useCase.execute({ files: ["x.test.ts"], committedYaml: committed });
      expect(result.drift).toBe(true);
      expect(result.diff).toContain("BR-CLI-NEW");
    });

    it("DADO arquivo commitado vazio E entries reais ENTÃO drift=true [BR-CLI-LIVING-DOCS-CHECK-04]", () => {
      const useCase = new CheckLivingDocs({
        serializer: serializeLivingDocs,
        extractor: new StubExtractor([makeEntry("BR-CLI-A")]),
      });
      const result = useCase.execute({ files: ["x.test.ts"], committedYaml: "" });
      expect(result.drift).toBe(true);
    });

    it("DADO artefato commitado E nenhuma regra extraída ENTÃO drift=true (regra removida do código sem atualizar artefato) [BR-CLI-LIVING-DOCS-CHECK-05]", () => {
      const committed = generateExpectedYaml([makeEntry("BR-CLI-A")]);
      const useCase = new CheckLivingDocs({
        serializer: serializeLivingDocs,
        extractor: new StubExtractor([]),
      });
      const result = useCase.execute({ files: ["x.test.ts"], committedYaml: committed });
      expect(result.drift).toBe(true);
    });
  });

  describe("Output enriquecido (generatedYaml acessível para o caller)", () => {
    it("DADO drift ENTÃO o result expõe generatedYaml para fácil regravação [BR-CLI-LIVING-DOCS-CHECK-06]", () => {
      const liveEntries = [makeEntry("BR-CLI-A"), makeEntry("BR-CLI-B")];
      const committed = generateExpectedYaml([makeEntry("BR-CLI-A")]);
      const useCase = new CheckLivingDocs({
        serializer: serializeLivingDocs,
        extractor: new StubExtractor(liveEntries),
      });
      const result = useCase.execute({ files: ["x.test.ts"], committedYaml: committed });
      expect(result.drift).toBe(true);
      expect(result.generatedYaml).toContain("BR-CLI-A");
      expect(result.generatedYaml).toContain("BR-CLI-B");
    });
  });

  describe("Diff legível por bloco ruleId (review PR #13)", () => {
    it("DADO 1 entry alterada entre N inalteradas ENTÃO diff agrupa só o bloco da ruleId alterada [BR-CLI-LIVING-DOCS-CHECK-08]", () => {
      // Honra contrato do diff "mínimo": humano deve bater o olho e achar a
      // regra alterada. Sem agrupamento por bloco, o diff achatava linhas
      // de N regras juntas (Set-based, sem ordem) — review PR #13.
      const committedEntries = [
        makeEntry("BR-CLI-A", { title: "A original" }),
        makeEntry("BR-CLI-B", { title: "B original" }),
        makeEntry("BR-CLI-C", { title: "C original" }),
      ];
      const liveEntries = [
        makeEntry("BR-CLI-A", { title: "A original" }),
        makeEntry("BR-CLI-B", { title: "B EDITADO" }),
        makeEntry("BR-CLI-C", { title: "C original" }),
      ];
      const committed = generateExpectedYaml(committedEntries);
      const useCase = new CheckLivingDocs({
        serializer: serializeLivingDocs,
        extractor: new StubExtractor(liveEntries),
      });
      const result = useCase.execute({ files: ["x.test.ts"], committedYaml: committed });
      expect(result.drift).toBe(true);
      // O bloco da ruleId alterada deve estar no diff.
      expect(result.diff).toContain("BR-CLI-B");
      // ruleIds inalteradas NÃO aparecem como headers de bloco no diff.
      expect(result.diff).not.toMatch(/@@ BR-CLI-A\b/);
      expect(result.diff).not.toMatch(/@@ BR-CLI-C\b/);
    });

    it("DADO 1 entry adicionada + 1 removida ENTÃO diff mostra ambas com marcadores ± [BR-CLI-LIVING-DOCS-CHECK-09]", () => {
      const committedEntries = [makeEntry("BR-CLI-OLD"), makeEntry("BR-CLI-KEEP")];
      const liveEntries = [makeEntry("BR-CLI-KEEP"), makeEntry("BR-CLI-NEW")];
      const committed = generateExpectedYaml(committedEntries);
      const useCase = new CheckLivingDocs({
        serializer: serializeLivingDocs,
        extractor: new StubExtractor(liveEntries),
      });
      const result = useCase.execute({ files: ["x.test.ts"], committedYaml: committed });
      expect(result.drift).toBe(true);
      expect(result.diff).toContain("BR-CLI-OLD");
      expect(result.diff).toContain("BR-CLI-NEW");
      // Bloco "KEEP" inalterado: não aparece como header de diff.
      expect(result.diff).not.toMatch(/@@ BR-CLI-KEEP\b/);
    });

    it("DADO 2 entries alteradas ENTÃO blocos aparecem em ordem lexicográfica de ruleId (sem embaralhar) [BR-CLI-LIVING-DOCS-CHECK-10]", () => {
      // Substitui o comportamento Set-based anterior, que misturava removed
      // de uma rule com added de outra.
      const committedEntries = [
        makeEntry("BR-CLI-ZED", { title: "Z original" }),
        makeEntry("BR-CLI-ALPHA", { title: "A original" }),
      ];
      const liveEntries = [
        makeEntry("BR-CLI-ZED", { title: "Z EDITADO" }),
        makeEntry("BR-CLI-ALPHA", { title: "A EDITADO" }),
      ];
      const committed = generateExpectedYaml(committedEntries);
      const useCase = new CheckLivingDocs({
        serializer: serializeLivingDocs,
        extractor: new StubExtractor(liveEntries),
      });
      const result = useCase.execute({ files: ["x.test.ts"], committedYaml: committed });
      expect(result.drift).toBe(true);
      const idxAlpha = result.diff.indexOf("BR-CLI-ALPHA");
      const idxZed = result.diff.indexOf("BR-CLI-ZED");
      expect(idxAlpha).toBeGreaterThan(-1);
      expect(idxZed).toBeGreaterThan(-1);
      expect(idxAlpha).toBeLessThan(idxZed);
    });
  });

  describe("Determinismo (sem churn artificial)", () => {
    it("DADO duas execuções de check sobre o mesmo input ENTÃO mesmo result.drift e mesma generatedYaml [BR-CLI-LIVING-DOCS-CHECK-07]", () => {
      const liveEntries = [
        makeEntry("BR-CLI-B", { tags: ["x", "a"] }),
        makeEntry("BR-CLI-A", { tags: ["m", "a"] }),
      ];
      const committed = generateExpectedYaml(liveEntries);
      const useCase = new CheckLivingDocs({
        serializer: serializeLivingDocs,
        extractor: new StubExtractor(liveEntries),
      });
      const r1 = useCase.execute({ files: ["x.test.ts"], committedYaml: committed });
      const r2 = useCase.execute({ files: ["x.test.ts"], committedYaml: committed });
      expect(r1.drift).toBe(false);
      expect(r2.drift).toBe(false);
      expect(r1.generatedYaml).toBe(r2.generatedYaml);
    });
  });
});

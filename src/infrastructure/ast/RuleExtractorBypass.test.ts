/**
 * [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS] Integração extractor × diretiva ADR 0012.
 *
 * Quando um `it`/`test` carrega `[BR-CLI-*]` e tem comentário leading com
 * `// living-docs:allow-drift until=... ref=... reason="..."`, a entry
 * resultante tem `coverageState='deprecated'` e bloco `bypass { until, ref,
 * reason }`. Diretiva expirada ou malformada lança erro estável.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { GovernanceError } from "../../domain/shared/errors.js";
import { assertValidEntry } from "../../domain/living-docs/LivingDocsEntry.js";
import { TypeScriptRuleExtractor } from "./TypeScriptRuleExtractor.js";

const TODAY = "2026-05-11T00:00:00.000Z";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-pr3c-"));
}

function writeFile(root: string, relPath: string, content: string): string {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

describe("Infra — TypeScriptRuleExtractor (bypass) [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS]", () => {
  let root: string;

  beforeEach(() => {
    root = mktmp();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe("Diretiva válida → coverageState=deprecated + bypass block", () => {
    it("DADO it.skip COM diretiva válida ENTÃO coverageState='deprecated' [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-01]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        describe("X", () => {
          // living-docs:allow-drift until=2026-12-31 ref=INC-20260511-3 reason="regra em transição"
          it.skip("[BR-CLI-A-01] regra em transição", () => {});
        });
        `
      );
      const extractor = new TypeScriptRuleExtractor(root, { todayIso: TODAY });
      const [entry] = extractor.extract([file]);
      expect(entry.coverageState).toBe("deprecated");
      expect(entry.bypass).toEqual({
        until: "2026-12-31",
        ref: "INC-20260511-3",
        reason: "regra em transição",
      });
    });

    it("DADO it COM diretiva ENTÃO coverageState='deprecated' (sobrescreve 'covered') [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-02]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        // living-docs:allow-drift until=2026-12-31 ref=DEC-0021-C01 reason="motivo válido"
        it("[BR-CLI-A-01] x", () => {});
        `
      );
      const [entry] = new TypeScriptRuleExtractor(root, { todayIso: TODAY }).extract([file]);
      expect(entry.coverageState).toBe("deprecated");
    });

    it("DADO diretiva em JSDoc precedente ENTÃO reconhece [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-03]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        /** living-docs:allow-drift until=2026-12-31 ref=DEC-0021-C01 reason="motivo válido" */
        it("[BR-CLI-A-01] x", () => {});
        `
      );
      const [entry] = new TypeScriptRuleExtractor(root, { todayIso: TODAY }).extract([file]);
      expect(entry.coverageState).toBe("deprecated");
      expect(entry.bypass?.ref).toBe("DEC-0021-C01");
    });
  });

  describe("Diretiva ausente → comportamento default preservado", () => {
    it("DADO it() SEM diretiva ENTÃO coverageState='covered' (sem bypass) [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-04]", () => {
      const file = writeFile(root, "src/domain/x/Foo.test.ts", `it("[BR-CLI-A-01] x", () => {});`);
      const [entry] = new TypeScriptRuleExtractor(root, { todayIso: TODAY }).extract([file]);
      expect(entry.coverageState).toBe("covered");
      expect(entry.bypass).toBeUndefined();
    });

    it("DADO it.skip() SEM diretiva ENTÃO coverageState='pending' (sem bypass) [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-05]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `it.skip("[BR-CLI-A-01] x", () => {});`
      );
      const [entry] = new TypeScriptRuleExtractor(root, { todayIso: TODAY }).extract([file]);
      expect(entry.coverageState).toBe("pending");
      expect(entry.bypass).toBeUndefined();
    });
  });

  describe("Diretivas inválidas → erros estáveis", () => {
    it("DADO diretiva COM 'until' EXPIRADA ENTÃO LIVING_DOCS_BYPASS_EXPIRED [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-06]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        // living-docs:allow-drift until=2026-01-01 ref=INC-1 reason="motivo válido"
        it.skip("[BR-CLI-A-01] x", () => {});
        `
      );
      try {
        new TypeScriptRuleExtractor(root, { todayIso: TODAY }).extract([file]);
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_EXPIRED");
      }
    });

    it("DADO diretiva MALFORMADA (sem until) ENTÃO LIVING_DOCS_BYPASS_MALFORMED [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-07]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        // living-docs:allow-drift ref=INC-1 reason="motivo válido"
        it.skip("[BR-CLI-A-01] x", () => {});
        `
      );
      try {
        new TypeScriptRuleExtractor(root, { todayIso: TODAY }).extract([file]);
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_MALFORMED");
      }
    });
  });

  describe("Outros guard-ids → ignorados pelo living-docs extractor", () => {
    it("DADO diretiva 'boundary-lock:allow-drift' ENTÃO extractor ignora (não-aplica ao living-docs) [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-08]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        // boundary-lock:allow-drift until=2026-12-31 ref=X reason="autorizado fora-de-living-docs"
        it("[BR-CLI-A-01] x", () => {});
        `
      );
      const [entry] = new TypeScriptRuleExtractor(root, { todayIso: TODAY }).extract([file]);
      expect(entry.coverageState).toBe("covered");
      expect(entry.bypass).toBeUndefined();
    });
  });

  describe("Múltiplos comentários leading → reconhece o match correto", () => {
    it("DADO 3 comentários leading com SÓ UM sendo diretiva living-docs válida ENTÃO reconhece [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-10]", () => {
      // Guard contra regressão do scan de leading comments (review PR #13).
      // O extractor itera *todos* os ranges de comment retornados por
      // ts.getLeadingCommentRanges; encontrar a diretiva no meio do bloco
      // (não primeiro nem último) é cenário concreto em código real.
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        describe("X", () => {
          // contexto 1: linha solta de comentário
          // living-docs:allow-drift until=2026-12-31 ref=INC-1 reason="motivo válido"
          // contexto 2: nota descritiva
          it.skip("[BR-CLI-A-01] x", () => {});
        });
        `
      );
      const [entry] = new TypeScriptRuleExtractor(root, { todayIso: TODAY }).extract([file]);
      expect(entry.coverageState).toBe("deprecated");
      expect(entry.bypass?.ref).toBe("INC-1");
    });

    it("DADO comentário com guard-id divergente + diretiva living-docs ENTÃO ignora o divergente e reconhece o living-docs [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-11]", () => {
      // ADR 0012 §1: cada guard tem sintaxe própria por guard-id. O
      // extractor de living-docs ignora diretivas de outros guards mesmo
      // quando coexistem como leading comments do mesmo node.
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        // boundary-lock:allow-drift until=2026-12-31 ref=X reason="autorizado em outro guard"
        // living-docs:allow-drift until=2026-12-31 ref=DEC-0021-C01 reason="motivo válido"
        it("[BR-CLI-A-01] x", () => {});
        `
      );
      const [entry] = new TypeScriptRuleExtractor(root, { todayIso: TODAY }).extract([file]);
      expect(entry.coverageState).toBe("deprecated");
      expect(entry.bypass?.ref).toBe("DEC-0021-C01");
    });
  });

  describe("Entry com bypass passa pelo schema do domain", () => {
    it("DADO bypass válido produzido pelo extractor ENTÃO assertValidEntry aceita [BR-CLI-LIVING-DOCS-EXTRACTOR-BYPASS-09]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        // living-docs:allow-drift until=2026-12-31 ref=DEC-0021-C01 reason="motivo válido"
        it.skip("[BR-CLI-A-01] x", () => {});
        `
      );
      const [entry] = new TypeScriptRuleExtractor(root, { todayIso: TODAY }).extract([file]);
      expect(() => assertValidEntry(entry)).not.toThrow();
    });
  });
});

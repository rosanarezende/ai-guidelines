/**
 * [BR-CLI-LIVING-DOCS-FALSE-POSITIVES] Filtro estrutural anti-false-positive.
 *
 * IDs `[BR-CLI-*]` aparecem legitimamente em vários lugares do código fora de
 * call sites de teste: comentários (JSDoc, inline), strings de produção
 * (mensagens de erro, docs), template literals, argumentos de funções como
 * `console.log`. Nenhum deles deve virar entry no artefato.
 *
 * O filtro é **estrutural** (decorrência do walker AST que só inspeciona
 * `arguments[0]` de `it`/`test`/`it.skip`/`test.skip`), não baseado em regex
 * sobre o source. Esta suite congela essa garantia em testes negativos
 * explícitos — qualquer regressão futura (ex.: walker que inspeciona mais
 * tipos de node) quebra o pipeline.
 *
 * Tratamento de arquivos `.fixture.ts`:
 *  - Por convenção, `__fixtures__/*` e `*.fixture.ts` contêm dados sintéticos
 *    para alimentar testes. IDs declarados ali não são cobertura real.
 *  - O extractor já ignora qualquer arquivo que não termina em `.test.ts`
 *    (3.B.a); este teste confirma a invariante.
 *
 * Tratamento de template literals com interpolação:
 *  - `it(\`[BR-CLI-${var}]\`, ...)` não pode ser resolvido estaticamente.
 *  - O extractor não tenta resolver — só reconhece literal puro.
 *  - ADR 0004 trade-off: convenção editorial proíbe interpolação no
 *    argumento de `it` que carrega o ID; esta suite documenta o
 *    comportamento (ignorado, não-erro).
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { TypeScriptRuleExtractor } from "./TypeScriptRuleExtractor.js";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-pr3b-fp-"));
}

function writeFile(root: string, relPath: string, content: string): string {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

describe("Infra — TypeScriptRuleExtractor (false positives) [BR-CLI-LIVING-DOCS-FALSE-POSITIVES]", () => {
  let root: string;

  beforeEach(() => {
    root = mktmp();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe("IDs em comentários (JSDoc e linha)", () => {
    it("DADO ID em comentário JSDoc ENTÃO NÃO vira entry [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-01]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        /**
         * Este comentário menciona [BR-CLI-A-99] como referência cruzada.
         * Não deve virar entry.
         */
        it("descrição sem ID válido", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toEqual([]);
    });

    it("DADO ID em comentário inline ENTÃO NÃO vira entry [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-02]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        // veja [BR-CLI-B-99] na spec X
        it("não tem ID na string", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toEqual([]);
    });

    it("DADO ID em comentário JSDoc COM it() válido logo abaixo ENTÃO só o it() vira entry [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-03]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        /** referência: [BR-CLI-X-99] */
        it("[BR-CLI-Y-01] descrição válida", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toHaveLength(1);
      expect(entries[0].ruleId).toBe("BR-CLI-Y-01");
    });
  });

  describe("IDs em strings de produção (não-test)", () => {
    it("DADO ID em string passada a outra função (não it/test) ENTÃO NÃO vira entry [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-04]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        console.log("[BR-CLI-A-99] debug message");
        expect("[BR-CLI-B-99] erro").toBe("x");
        it("[BR-CLI-C-01] válido", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries.map((e) => e.ruleId)).toEqual(["BR-CLI-C-01"]);
    });

    it("DADO ID em variável atribuída a string ENTÃO NÃO vira entry [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-05]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        const REF = "[BR-CLI-A-99] não-coberto";
        it("[BR-CLI-B-01] coberto", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries.map((e) => e.ruleId)).toEqual(["BR-CLI-B-01"]);
    });
  });

  describe("IDs em arquivos fora .test.ts", () => {
    it("DADO ID em arquivo .ts comum (não-test) ENTÃO arquivo é IGNORADO inteiro [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-06]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.ts",
        `
        // Production source — mesmo simulando call site de teste
        export function exemplo() {
          it("[BR-CLI-A-99] não-coberto porque não é arquivo de teste", () => {});
        }
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toEqual([]);
    });

    it("DADO ID em arquivo .fixture.ts ENTÃO IGNORADO [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-07]", () => {
      const file = writeFile(
        root,
        "src/domain/x/__fixtures__/Sample.fixture.ts",
        `
        it("[BR-CLI-A-99] fixture, não cobertura real", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toEqual([]);
    });
  });

  describe("Template literals com interpolação", () => {
    it("DADO it() com template literal SEM interpolação (ainda assim string-like) ENTÃO reconhece [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-08]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `it(\`[BR-CLI-A-01] descrição via template puro\`, () => {});`
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toHaveLength(1);
      expect(entries[0].ruleId).toBe("BR-CLI-A-01");
    });

    it("DADO it() com template literal COM interpolação ENTÃO ignorado (não-resolvido estaticamente) [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-09]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        const suffix = "01";
        it(\`[BR-CLI-A-\${suffix}] não-resolvível\`, () => {});
        it("[BR-CLI-B-01] esse vai", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries.map((e) => e.ruleId)).toEqual(["BR-CLI-B-01"]);
    });
  });

  describe("Padrão de ID malformado", () => {
    it("DADO string parecida mas SEM o formato canônico (sem 'BR-CLI-') ENTÃO ignorado [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-10]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        it("[BR-OTHER-A-01] outro framework", () => {});
        it("[A-01] sem prefixo", () => {});
        it("[BR-CLI-Z-01] esse vai", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries.map((e) => e.ruleId)).toEqual(["BR-CLI-Z-01"]);
    });
  });

  describe("Mix realista (cobertura combinada)", () => {
    it("DADO arquivo com comentários + strings de produção + it() válidos ENTÃO só os it() válidos viram entries [BR-CLI-LIVING-DOCS-FALSE-POSITIVES-11]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        /**
         * Spec: ver [BR-CLI-DOC-01].
         */
        // veja também [BR-CLI-DOC-02]
        const MSG = "log de [BR-CLI-DOC-03]";

        describe("X", () => {
          it("[BR-CLI-REAL-01] cobertura genuína", () => {
            console.log("[BR-CLI-LOG-01] não-cobertura");
          });
          it.skip("[BR-CLI-REAL-02] pendente real", () => {});
          // [BR-CLI-COMMENT-01] não-coberto
          it("apenas descrição, sem ID", () => {});
        });
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries.map((e) => e.ruleId)).toEqual(["BR-CLI-REAL-01", "BR-CLI-REAL-02"]);
      expect(entries.find((e) => e.ruleId === "BR-CLI-REAL-02")!.coverageState).toBe("pending");
    });
  });
});

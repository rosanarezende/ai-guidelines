/**
 * [BR-CLI-LIVING-DOCS-SOURCEMAP] Source mapping da extração AST.
 *
 * Cada `LivingDocsEntry` carrega `source.file` (path relativo POSIX-style),
 * `source.lineStart` (linha do `it(...)`/`test(...)`) e `source.lineEnd`
 * (linha do `)` final). O range é 1-indexed e inclusivo.
 *
 * `tags` ganham o contexto do `describe` que envolve a chamada (em ordem
 * top-down), permitindo navegação por categoria sem instrumentação adicional.
 * Tags são deduplicadas e ordenadas pela canonicalização do domain, mas o
 * extrator emite na ordem encontrada — o teste foca em *cobertura*, não em
 * ordem (responsabilidade do `canonicalizeArtifact`).
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { TypeScriptRuleExtractor } from "./TypeScriptRuleExtractor.js";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-pr3b-sm-"));
}

function writeFile(root: string, relPath: string, content: string): string {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

describe("Infra — TypeScriptRuleExtractor (source mapping) [BR-CLI-LIVING-DOCS-SOURCEMAP]", () => {
  let root: string;

  beforeEach(() => {
    root = mktmp();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe("source.file (path relativo POSIX-style)", () => {
    it("DADO arquivo em src/domain/policy/Pillars.test.ts ENTÃO source.file usa '/' como separador [BR-CLI-LIVING-DOCS-SOURCEMAP-01]", () => {
      const file = writeFile(
        root,
        "src/domain/policy/Pillars.test.ts",
        `it("[BR-CLI-A-01] x", () => {});`
      );
      const [entry] = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entry.source.file).toBe("src/domain/policy/Pillars.test.ts");
      // Sem backslash mesmo no Windows:
      expect(entry.source.file).not.toContain("\\");
    });
  });

  describe("source.lineStart / source.lineEnd (1-indexed, inclusivo)", () => {
    it("DADO it() em linha única ENTÃO lineStart === lineEnd [BR-CLI-LIVING-DOCS-SOURCEMAP-02]", () => {
      // Linhas 1,2,3 — linha 2 é o `it`.
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `// header\nit("[BR-CLI-A-01] x", () => {});\n// trailer\n`
      );
      const [entry] = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entry.source.lineStart).toBe(2);
      expect(entry.source.lineEnd).toBe(2);
    });

    it("DADO it() multi-linha ENTÃO lineStart é a linha do `it` e lineEnd a do `)` [BR-CLI-LIVING-DOCS-SOURCEMAP-03]", () => {
      const content = [
        "// header",
        "it(",
        '  "[BR-CLI-A-01] multi-linha",',
        "  () => {",
        "    expect(true).toBe(true);",
        "  }",
        ");",
      ].join("\n");
      const file = writeFile(root, "src/domain/x/Foo.test.ts", content);
      const [entry] = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entry.source.lineStart).toBe(2); // linha do `it(`
      expect(entry.source.lineEnd).toBe(7); // linha do `);`
    });

    it("DADO múltiplos it() ENTÃO cada um tem ranges não-sobrepostos e crescentes [BR-CLI-LIVING-DOCS-SOURCEMAP-04]", () => {
      const content = [
        "describe('X', () => {",
        '  it("[BR-CLI-A-01] um", () => {});',
        '  it("[BR-CLI-B-01] dois", () => {});',
        '  it("[BR-CLI-C-01] tres", () => {});',
        "});",
      ].join("\n");
      const file = writeFile(root, "src/domain/x/Foo.test.ts", content);
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toHaveLength(3);
      expect(entries[0].source.lineStart).toBe(2);
      expect(entries[1].source.lineStart).toBe(3);
      expect(entries[2].source.lineStart).toBe(4);
      // ranges crescentes:
      for (let i = 0; i < entries.length - 1; i++) {
        expect(entries[i].source.lineEnd).toBeLessThanOrEqual(entries[i + 1].source.lineStart);
      }
    });
  });

  describe("Contexto de describe → tags", () => {
    it("DADO it() dentro de describe('Categoria X') ENTÃO tags inclui 'Categoria X' [BR-CLI-LIVING-DOCS-SOURCEMAP-05]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        describe("Categoria X", () => {
          it("[BR-CLI-A-01] um", () => {});
        });
        `
      );
      const [entry] = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entry.tags).toContain("Categoria X");
    });

    it("DADO describes aninhados ENTÃO tags inclui todos os nomes (top-down) [BR-CLI-LIVING-DOCS-SOURCEMAP-06]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        describe("Outer", () => {
          describe("Middle", () => {
            describe("Inner", () => {
              it("[BR-CLI-A-01] um", () => {});
            });
          });
        });
        `
      );
      const [entry] = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entry.tags).toEqual(expect.arrayContaining(["Outer", "Middle", "Inner"]));
    });

    it("DADO it() sem describe envolvente ENTÃO tags vazias [BR-CLI-LIVING-DOCS-SOURCEMAP-07]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `it("[BR-CLI-A-01] solto", () => {});`
      );
      const [entry] = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entry.tags).toEqual([]);
    });

    it("DADO IDs em describes irmãos ENTÃO cada entry tem só o describe próprio [BR-CLI-LIVING-DOCS-SOURCEMAP-08]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        describe("Outer", () => {
          describe("Branch A", () => {
            it("[BR-CLI-A-01] um", () => {});
          });
          describe("Branch B", () => {
            it("[BR-CLI-B-01] dois", () => {});
          });
        });
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      const a = entries.find((e) => e.ruleId === "BR-CLI-A-01")!;
      const b = entries.find((e) => e.ruleId === "BR-CLI-B-01")!;
      expect(a.tags).toEqual(expect.arrayContaining(["Outer", "Branch A"]));
      expect(a.tags).not.toContain("Branch B");
      expect(b.tags).toEqual(expect.arrayContaining(["Outer", "Branch B"]));
      expect(b.tags).not.toContain("Branch A");
    });
  });

  describe("Determinismo do source mapping", () => {
    it("DADO duas extrações do mesmo arquivo ENTÃO produz a mesma saída byte-a-byte [BR-CLI-LIVING-DOCS-SOURCEMAP-09]", () => {
      const file = writeFile(
        root,
        "src/domain/x/Foo.test.ts",
        `
        describe("X", () => {
          it("[BR-CLI-A-01] um", () => {});
          it.skip("[BR-CLI-B-01] dois", () => {});
        });
        `
      );
      const extractor = new TypeScriptRuleExtractor(root);
      const a = JSON.stringify(extractor.extract([file]));
      const b = JSON.stringify(extractor.extract([file]));
      expect(a).toBe(b);
    });
  });
});

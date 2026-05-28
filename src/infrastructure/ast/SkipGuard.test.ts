/**
 * [BR-CLI-SKIP-GUARD] Forcing function anti-skip-silencioso (cf. [DEC-0023-O02]).
 *
 * Garante que nenhum teste pulado enterre um ID de decisão arquitetural
 * (`[DEC-*]`/`[ADR-*]`) num TODO invisível ao living-docs — a classe de risco
 * que originou o `[DEC-0023-O01]`. A última seção é o **gate vivo**: varre o
 * `src/` real e falha se algum skip carregar ID de decisão.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { discoverTestFiles } from "../../cli/livingDocs.js";
import { findDecisionTaggedSkips, formatDecisionTaggedSkips } from "./SkipGuard.js";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-skip-guard-"));
}

function writeFile(root: string, relPath: string, content: string): string {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

describe("Infra AST — SkipGuard [BR-CLI-SKIP-GUARD]", () => {
  let root: string;

  beforeEach(() => {
    root = mktmp();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe("Detecção de skip com ID de decisão", () => {
    it("DADO it.skip com [DEC-NNNN-*] no título ENTÃO detecta [BR-CLI-SKIP-GUARD-01]", () => {
      const file = writeFile(
        root,
        "a.test.ts",
        `describe("x", () => { it.skip("[DEC-9999-Z01] pendente", () => {}); });`
      );

      const found = findDecisionTaggedSkips([file]);

      expect(found).toHaveLength(1);
      expect(found[0].tag).toBe("DEC-9999-Z01");
    });

    it("DADO it.skip com [ADR-NNNN] no título ENTÃO detecta [BR-CLI-SKIP-GUARD-02]", () => {
      const file = writeFile(
        root,
        "b.test.ts",
        `it.skip("[ADR-9999] comportamento adiado", () => {});`
      );

      const found = findDecisionTaggedSkips([file]);

      expect(found).toHaveLength(1);
      expect(found[0].tag).toBe("ADR-9999");
    });

    it("DADO describe.skip e xit com [DEC-*] ENTÃO detecta ambos [BR-CLI-SKIP-GUARD-03]", () => {
      const file = writeFile(
        root,
        "c.test.ts",
        [
          `describe.skip("[DEC-9999-A01] bloco", () => {});`,
          `xit("[DEC-9999-B01] solto", () => {});`,
        ].join("\n")
      );

      const found = findDecisionTaggedSkips([file]);

      expect(found.map((f) => f.tag).sort()).toEqual(["DEC-9999-A01", "DEC-9999-B01"]);
    });
  });

  describe("Não-detecção (negativos estruturais)", () => {
    it("DADO it.skip apenas com [BR-CLI-*] ENTÃO NÃO detecta (BR é rastreado via living-docs) [BR-CLI-SKIP-GUARD-04]", () => {
      const file = writeFile(
        root,
        "d.test.ts",
        `it.skip("[BR-CLI-FOO-01] pendente rastreado", () => {});`
      );

      expect(findDecisionTaggedSkips([file])).toEqual([]);
    });

    it("DADO it() (não-skip) com [DEC-*] ENTÃO NÃO detecta (só skips importam) [BR-CLI-SKIP-GUARD-05]", () => {
      const file = writeFile(
        root,
        "e.test.ts",
        `it("[DEC-9999-C01] teste vivo citando decisão", () => { expect(1).toBe(1); });`
      );

      expect(findDecisionTaggedSkips([file])).toEqual([]);
    });

    it("DADO [DEC-*] dentro de template string (fixture) ENTÃO NÃO detecta (guard AST, não regex) [BR-CLI-SKIP-GUARD-06]", () => {
      // O it.skip está DENTRO de um template literal — é dado de fixture, não
      // call site real. O walker AST não percorre o conteúdo do template.
      const file = writeFile(
        root,
        "f.test.ts",
        [
          "const fixture = `",
          `  it.skip("[DEC-9999-D01] dentro de string", () => {});`,
          "`;",
          'it("usa fixture", () => { expect(fixture).toBeTruthy(); });',
        ].join("\n")
      );

      expect(findDecisionTaggedSkips([file])).toEqual([]);
    });
  });

  describe("Gate vivo — invariante do repositório", () => {
    it("DADO o src/ real ENTÃO nenhum it.skip carrega ID de decisão [DEC-*]/[ADR-*] [BR-CLI-SKIP-GUARD-07]", () => {
      const repoRoot = path.resolve(__dirname, "..", "..", "..");
      const files = discoverTestFiles(repoRoot);

      const skips = findDecisionTaggedSkips(files);

      expect(skips.length === 0 ? "" : formatDecisionTaggedSkips(skips)).toBe("");
    });
  });
});

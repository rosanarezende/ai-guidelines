/**
 * [BR-CLI-LIVING-DOCS-EXTRACTOR] Extração estática de regras `[BR-CLI-*]`.
 *
 * Aplica ADR 0004: AST como SSOT. O extractor reconhece `[BR-CLI-*]` em
 * argumento string de `it(...)`/`test(...)` em arquivos `.test.ts`, deriva
 * `coverageState` sintaticamente (`it.skip` → `pending`; `it` → `covered`)
 * e popula `boundedContext`/`domain` por convenção de path.
 *
 * Determinismo é contrato (ADR 0004 §2): mesma entrada → mesma saída.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { GovernanceError } from "../../domain/shared/errors.js";
import { assertValidEntry } from "../../domain/living-docs/LivingDocsEntry.js";
import { TypeScriptRuleExtractor } from "./TypeScriptRuleExtractor.js";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-pr3b-"));
}

function writeFile(root: string, relPath: string, content: string): string {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

describe("Infra — TypeScriptRuleExtractor (descoberta) [BR-CLI-LIVING-DOCS-EXTRACTOR]", () => {
  let root: string;

  beforeEach(() => {
    root = mktmp();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe("Descoberta básica de IDs", () => {
    it("DADO arquivo .test.ts com it('<fixture-id> desc') ENTÃO retorna 1 entry coverageState='covered' [BR-CLI-LIVING-DOCS-EXTRACTOR-01]", () => {
      const file = writeFile(
        root,
        "src/domain/foo/Foo.test.ts",
        `
        describe("Domínio", () => {
          it("[BR-CLI-X-01] valida algo importante", () => {
            expect(true).toBe(true);
          });
        });
        `
      );

      const extractor = new TypeScriptRuleExtractor(root);
      const entries = extractor.extract([file]);

      expect(entries).toHaveLength(1);
      expect(entries[0].ruleId).toBe("BR-CLI-X-01");
      expect(entries[0].coverageState).toBe("covered");
      expect(entries[0].title).toBe("valida algo importante");
    });

    it("DADO it.skip('<fixture-id>') ENTÃO coverageState='pending' [BR-CLI-LIVING-DOCS-EXTRACTOR-02]", () => {
      const file = writeFile(
        root,
        "src/domain/foo/Foo.test.ts",
        `
        describe("X", () => {
          it.skip("[BR-CLI-Y-01] pendente", () => {});
        });
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toHaveLength(1);
      expect(entries[0].coverageState).toBe("pending");
      expect(entries[0].ruleId).toBe("BR-CLI-Y-01");
    });

    it("DADO test('<fixture-id>') ENTÃO reconhece igual a 'it' [BR-CLI-LIVING-DOCS-EXTRACTOR-03]", () => {
      const file = writeFile(
        root,
        "src/domain/foo/Foo.test.ts",
        `
        test("[BR-CLI-Z-01] descrição via 'test'", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toHaveLength(1);
      expect(entries[0].ruleId).toBe("BR-CLI-Z-01");
      expect(entries[0].coverageState).toBe("covered");
    });

    it("DADO test.skip('<fixture-id>') ENTÃO pending [BR-CLI-LIVING-DOCS-EXTRACTOR-04]", () => {
      const file = writeFile(
        root,
        "src/domain/foo/Foo.test.ts",
        `
        test.skip("[BR-CLI-W-01] skip via test", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries[0].coverageState).toBe("pending");
    });

    it("DADO arquivo sem [BR-CLI-*] ENTÃO retorna array vazio [BR-CLI-LIVING-DOCS-EXTRACTOR-05]", () => {
      const file = writeFile(
        root,
        "src/domain/foo/Foo.test.ts",
        `
        describe("X", () => {
          it("apenas descrição sem ID", () => {});
        });
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toEqual([]);
    });

    it("DADO múltiplos it() com IDs ENTÃO retorna todos em ordem de aparição [BR-CLI-LIVING-DOCS-EXTRACTOR-06]", () => {
      const file = writeFile(
        root,
        "src/domain/foo/Foo.test.ts",
        `
        describe("X", () => {
          it("[BR-CLI-A-01] primeiro", () => {});
          it("[BR-CLI-B-01] segundo", () => {});
          it.skip("[BR-CLI-C-01] terceiro skip", () => {});
        });
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries.map((e) => e.ruleId)).toEqual(["BR-CLI-A-01", "BR-CLI-B-01", "BR-CLI-C-01"]);
      expect(entries.map((e) => e.coverageState)).toEqual(["covered", "covered", "pending"]);
    });
  });

  describe("Convenção de path → boundedContext/domain", () => {
    it("DADO arquivo em src/domain/policy/Pillars.test.ts ENTÃO boundedContext='policy', domain='Pillars' [BR-CLI-LIVING-DOCS-EXTRACTOR-07]", () => {
      const file = writeFile(
        root,
        "src/domain/policy/Pillars.test.ts",
        `it("[BR-CLI-A-01] x", () => {});`
      );
      const [entry] = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entry.boundedContext).toBe("policy");
      expect(entry.domain).toBe("Pillars");
    });

    it("DADO arquivo em src/infrastructure/yaml/Foo.test.ts ENTÃO boundedContext='yaml', domain='Foo' [BR-CLI-LIVING-DOCS-EXTRACTOR-08]", () => {
      const file = writeFile(
        root,
        "src/infrastructure/yaml/Foo.test.ts",
        `it("[BR-CLI-A-01] x", () => {});`
      );
      const [entry] = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entry.boundedContext).toBe("yaml");
      expect(entry.domain).toBe("Foo");
    });

    it("DADO arquivo em src/app/use-cases/Foo.test.ts ENTÃO boundedContext='use-cases', domain='Foo' [BR-CLI-LIVING-DOCS-EXTRACTOR-09]", () => {
      const file = writeFile(
        root,
        "src/app/use-cases/Foo.test.ts",
        `it("[BR-CLI-A-01] x", () => {});`
      );
      const [entry] = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entry.boundedContext).toBe("use-cases");
      expect(entry.domain).toBe("Foo");
    });
  });

  describe("Erros determinísticos", () => {
    it("DADO arquivo inexistente ENTÃO LIVING_DOCS_EXTRACTOR_FILE_NOT_FOUND [BR-CLI-LIVING-DOCS-EXTRACTOR-10]", () => {
      const fake = path.join(root, "src/domain/foo/Nonexistent.test.ts");
      try {
        new TypeScriptRuleExtractor(root).extract([fake]);
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_EXTRACTOR_FILE_NOT_FOUND");
      }
    });

    it("DADO arquivo que não termina em .test.ts ENTÃO é IGNORADO (não-erro, simplesmente vazio) [BR-CLI-LIVING-DOCS-EXTRACTOR-11]", () => {
      const file = writeFile(root, "src/domain/foo/Foo.ts", `// regular source file`);
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      expect(entries).toEqual([]);
    });
  });

  describe("Output validado contra schema do domain", () => {
    it("DADO entries produzidas ENTÃO cada uma passa assertValidEntry [BR-CLI-LIVING-DOCS-EXTRACTOR-12]", () => {
      const file = writeFile(
        root,
        "src/domain/policy/Pillars.test.ts",
        `
        it("[BR-CLI-A-01] um", () => {});
        it.skip("[BR-CLI-B-01] dois", () => {});
        `
      );
      const entries = new TypeScriptRuleExtractor(root).extract([file]);
      for (const entry of entries) {
        expect(() => assertValidEntry(entry)).not.toThrow();
      }
    });
  });

  describe("Invariante: 1 it/test = exatamente 1 rule (ADR 0002 §4 + ADR 0004 §3)", () => {
    it("DADO título com 2 tags [BR-CLI-*] ENTÃO LIVING_DOCS_AMBIGUOUS_RULE_ID com mensagem listando os IDs [BR-CLI-LIVING-DOCS-EXTRACTOR-13]", () => {
      const file = writeFile(
        root,
        "src/domain/policy/Foo.test.ts",
        `it("[BR-CLI-OLD-ID] referenciada por [BR-CLI-NEW-ID]", () => {});`
      );
      try {
        new TypeScriptRuleExtractor(root).extract([file]);
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("LIVING_DOCS_AMBIGUOUS_RULE_ID");
        expect(err.message).toContain("[BR-CLI-OLD-ID]");
        expect(err.message).toContain("[BR-CLI-NEW-ID]");
      }
    });

    it("DADO título com 3+ tags [BR-CLI-*] ENTÃO LIVING_DOCS_AMBIGUOUS_RULE_ID listando todos [BR-CLI-LIVING-DOCS-EXTRACTOR-14]", () => {
      const file = writeFile(
        root,
        "src/domain/policy/Foo.test.ts",
        `it("[BR-CLI-A] e [BR-CLI-B] e [BR-CLI-C]", () => {});`
      );
      try {
        new TypeScriptRuleExtractor(root).extract([file]);
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_AMBIGUOUS_RULE_ID");
      }
    });
  });
});

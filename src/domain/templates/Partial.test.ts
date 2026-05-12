/**
 * [BR-CLI-PARTIAL] Contrato de Partial para composição atômica.
 *
 * Valida que cada partial é Markdown funcional, autocontido e
 * determinístico. Domain puro — sem parser externo de Markdown.
 *
 * Invariantes (audit pré-3.D §"Contrato de Partial"):
 *  1. Markdown sintaticamente válido (não-vazio, sem estruturas abertas).
 *  2. Não-fragmento (começa com heading # ou bloco autocontido).
 *  3. Self-contained (sem dependência de IDs gerados por outros partials).
 *  4. Determinístico (sem placeholders {{var}} / <%= expr %>).
 *  5. Sem timestamps embutidos (generatedAt, createdAt, updatedAt).
 *
 * Aplica ADR 0004 (.core/governance/adrs/0004-ast-only-extraction.md):
 * determinismo como contrato — partial = conteúdo estável.
 */
import { GovernanceError } from "../shared/errors.js";
import { assertValidPartialMarkdown } from "./Partial.js";

// --- Fixtures ---

const validPartial = `# Fase 0 — Setup

- [ ] Criar branch
- [ ] Configurar ambiente
`;

const validPartialWithSubheading = `## Critérios de Aceite

1. Pipeline verde
2. Testes passando
`;

const validPartialBlockquote = `> **Âncora:** [DEC-0021-D01]
>
> Este bloco define o contrato mínimo.
`;

const validPartialList = `- Item 1
- Item 2
- Item 3
`;

// --- Testes ---

describe("Partial — assertValidPartialMarkdown [BR-CLI-PARTIAL]", () => {
  describe("Partial válido", () => {
    it("DADO partial com heading H1 e conteúdo ENTÃO aceita [BR-CLI-PARTIAL-01]", () => {
      expect(() => assertValidPartialMarkdown(validPartial, "tasks/fase-0-setup.md")).not.toThrow();
    });

    it("DADO partial com heading H2 ENTÃO aceita [BR-CLI-PARTIAL-02]", () => {
      expect(() =>
        assertValidPartialMarkdown(validPartialWithSubheading, "spec/criterios.md")
      ).not.toThrow();
    });

    it("DADO partial começando com blockquote ENTÃO aceita [BR-CLI-PARTIAL-03]", () => {
      expect(() =>
        assertValidPartialMarkdown(validPartialBlockquote, "common/anchor.md")
      ).not.toThrow();
    });

    it("DADO partial começando com lista ENTÃO aceita [BR-CLI-PARTIAL-04]", () => {
      expect(() => assertValidPartialMarkdown(validPartialList, "common/items.md")).not.toThrow();
    });
  });

  describe("Markdown inválido — RECIPE_PARTIAL_INVALID_MARKDOWN", () => {
    it("DADO conteúdo vazio ENTÃO RECIPE_PARTIAL_INVALID_MARKDOWN [BR-CLI-PARTIAL-05]", () => {
      try {
        assertValidPartialMarkdown("", "empty.md");
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_PARTIAL_INVALID_MARKDOWN");
        expect(err.message).toContain("empty.md");
      }
    });

    it("DADO conteúdo apenas whitespace ENTÃO RECIPE_PARTIAL_INVALID_MARKDOWN [BR-CLI-PARTIAL-06]", () => {
      try {
        assertValidPartialMarkdown("   \n\n  \n", "whitespace.md");
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_PARTIAL_INVALID_MARKDOWN");
      }
    });

    it("DADO bloco de código não-fechado ENTÃO RECIPE_PARTIAL_INVALID_MARKDOWN [BR-CLI-PARTIAL-07]", () => {
      const openCode = "# Header\n\n```typescript\nconst x = 1;\n";
      try {
        assertValidPartialMarkdown(openCode, "open-code.md");
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_PARTIAL_INVALID_MARKDOWN");
        expect((e as GovernanceError).message).toContain("open-code.md");
      }
    });
  });

  describe("Placeholders proibidos — RECIPE_PARTIAL_HAS_PLACEHOLDER", () => {
    it("DADO conteúdo com {{variavel}} ENTÃO RECIPE_PARTIAL_HAS_PLACEHOLDER [BR-CLI-PARTIAL-08]", () => {
      const withPlaceholder = "# Header\n\nNome do projeto: {{projectName}}\n";
      try {
        assertValidPartialMarkdown(withPlaceholder, "with-placeholder.md");
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_PARTIAL_HAS_PLACEHOLDER");
        expect(err.message).toContain("with-placeholder.md");
        expect(err.message).toContain("{{");
      }
    });

    it("DADO conteúdo com <%= expr %> ENTÃO RECIPE_PARTIAL_HAS_PLACEHOLDER [BR-CLI-PARTIAL-09]", () => {
      const withErb = "# Header\n\nValor: <%= config.value %>\n";
      try {
        assertValidPartialMarkdown(withErb, "with-erb.md");
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_PARTIAL_HAS_PLACEHOLDER");
      }
    });

    it("DADO conteúdo com ${interpolacao} ENTÃO RECIPE_PARTIAL_HAS_PLACEHOLDER [BR-CLI-PARTIAL-10]", () => {
      const withInterp = "# Header\n\nPath: ${basePath}/file.md\n";
      try {
        assertValidPartialMarkdown(withInterp, "with-interp.md");
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_PARTIAL_HAS_PLACEHOLDER");
      }
    });

    it("DADO {{ dentro de bloco de código ENTÃO aceita (código legítimo) [BR-CLI-PARTIAL-11]", () => {
      const codeBlock = "# Exemplo\n\n```yaml\ntemplate: {{value}}\n```\n";
      expect(() => assertValidPartialMarkdown(codeBlock, "code-with-braces.md")).not.toThrow();
    });
  });

  describe("Timestamps proibidos — RECIPE_PARTIAL_HAS_TIMESTAMP", () => {
    it("DADO conteúdo com generatedAt ENTÃO RECIPE_PARTIAL_HAS_TIMESTAMP [BR-CLI-PARTIAL-12]", () => {
      const withTs = "# Header\n\ngeneratedAt: 2026-05-12T10:00:00Z\n";
      try {
        assertValidPartialMarkdown(withTs, "with-timestamp.md");
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_PARTIAL_HAS_TIMESTAMP");
        expect(err.message).toContain("with-timestamp.md");
      }
    });

    it("DADO conteúdo com createdAt ENTÃO RECIPE_PARTIAL_HAS_TIMESTAMP [BR-CLI-PARTIAL-13]", () => {
      const withTs = "# Header\n\ncreatedAt: 2026-01-01\n";
      try {
        assertValidPartialMarkdown(withTs, "with-created.md");
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_PARTIAL_HAS_TIMESTAMP");
      }
    });

    it("DADO conteúdo com updatedAt ENTÃO RECIPE_PARTIAL_HAS_TIMESTAMP [BR-CLI-PARTIAL-14]", () => {
      const withTs = "# Header\n\nupdatedAt: 2026-05-12\n";
      try {
        assertValidPartialMarkdown(withTs, "with-updated.md");
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_PARTIAL_HAS_TIMESTAMP");
      }
    });

    it("DADO timestamp mencionado em texto descritivo (não campo) ENTÃO aceita [BR-CLI-PARTIAL-15]", () => {
      const descriptive = "# Política\n\nO campo `createdAt` do registry é imutável.\n";
      expect(() => assertValidPartialMarkdown(descriptive, "docs-about-ts.md")).not.toThrow();
    });
  });
});

/**
 * [BR-CLI-ASSEMBLE] Use case AssembleArtifact — composição determinística.
 *
 * Testa a orquestração completa: load recipe → validate → load partials →
 * validate → compose na ordem dos slots.
 *
 * Determinismo é contrato (ADR 0004): mesma recipe + mesmos partials
 * → mesmo output byte-a-byte, verificado por asserção de igualdade estrita.
 *
 * Aplica Q2 (first-wins): quando slot tem >1 partial, usa o primeiro.
 * Port `RecipeStore` é stubado — sem IO real.
 */
import { GovernanceError } from "../../domain/shared/errors.js";
import type { RecipeStore } from "../ports/RecipeStore.js";
import { AssembleArtifact } from "./AssembleArtifact.js";

// --- Fixtures ---

const partialHeader = `# Fase 0 — Setup

- [ ] Criar branch
- [ ] Configurar ambiente
`;

const partialCore = `## Fase 1 — Core

- [ ] Implementar domain
- [ ] Testes TDD
`;

const partialOptional = `## Fase Extra

- [ ] Item opcional
`;

const validRecipe = {
  schemaVersion: "v0" as const,
  artifactKind: "tasks" as const,
  workflowType: "evidence-driven" as const,
  language: "pt-BR" as const,
  slots: [
    {
      id: "header",
      required: true,
      minOccurrences: 1,
      maxOccurrences: 1,
      partials: ["tasks/header.md"],
    },
    {
      id: "core",
      required: true,
      minOccurrences: 1,
      maxOccurrences: 1,
      partials: ["tasks/core.md"],
    },
  ],
  invariants: {
    canonicalOrder: "slots" as const,
    forbiddenHeadings: [],
  },
};

const recipeWithOptional = {
  ...validRecipe,
  slots: [
    ...validRecipe.slots,
    {
      id: "extra",
      required: false,
      minOccurrences: 0,
      maxOccurrences: 1,
      partials: ["tasks/extra.md"],
    },
  ],
};

const recipeWithMultiplePartials = {
  ...validRecipe,
  slots: [
    {
      id: "header",
      required: true,
      minOccurrences: 1,
      maxOccurrences: 1,
      partials: ["tasks/header-v2.md", "tasks/header-v1.md"],
    },
    validRecipe.slots[1],
  ],
};

function createStubStore(
  recipes: Record<string, unknown>,
  partials: Record<string, string>
): RecipeStore {
  return {
    loadRecipe(name: string) {
      const recipe = recipes[name];
      if (!recipe) {
        throw new GovernanceError("RECIPE_NOT_FOUND", `Recipe '${name}' não encontrada.`);
      }
      return recipe as ReturnType<RecipeStore["loadRecipe"]>;
    },
    loadPartial(ref: string) {
      const content = partials[ref];
      if (content === undefined) {
        throw new GovernanceError("RECIPE_PARTIAL_NOT_FOUND", `Partial '${ref}' não encontrado.`);
      }
      return content;
    },
  };
}

// --- Testes ---

describe("AssembleArtifact — composição determinística [BR-CLI-ASSEMBLE]", () => {
  describe("Happy path", () => {
    it("DADO recipe com 2 slots ENTÃO compõe Markdown na ordem dos slots [BR-CLI-ASSEMBLE-01]", () => {
      const store = createStubStore(
        { "tasks-evidence-driven": validRecipe },
        {
          "tasks/header.md": partialHeader,
          "tasks/core.md": partialCore,
        }
      );
      const uc = new AssembleArtifact({ store });
      const result = uc.execute({ recipeName: "tasks-evidence-driven" });

      expect(result.content).toBe(partialHeader.trimEnd() + "\n\n" + partialCore.trimEnd() + "\n");
    });

    it("DADO recipe com 3 slots ENTÃO compõe todos na ordem [BR-CLI-ASSEMBLE-02]", () => {
      const store = createStubStore(
        { "tasks-with-extra": recipeWithOptional },
        {
          "tasks/header.md": partialHeader,
          "tasks/core.md": partialCore,
          "tasks/extra.md": partialOptional,
        }
      );
      const uc = new AssembleArtifact({ store });
      const result = uc.execute({ recipeName: "tasks-with-extra" });

      const expected =
        partialHeader.trimEnd() +
        "\n\n" +
        partialCore.trimEnd() +
        "\n\n" +
        partialOptional.trimEnd() +
        "\n";
      expect(result.content).toBe(expected);
    });

    it("DADO recipe válida ENTÃO metadata reflete artifactKind, workflowType, language [BR-CLI-ASSEMBLE-03]", () => {
      const store = createStubStore(
        { recipe: validRecipe },
        {
          "tasks/header.md": partialHeader,
          "tasks/core.md": partialCore,
        }
      );
      const uc = new AssembleArtifact({ store });
      const result = uc.execute({ recipeName: "recipe" });

      expect(result.metadata).toEqual({
        artifactKind: "tasks",
        workflowType: "evidence-driven",
        language: "pt-BR",
        composedSlots: ["header", "core"],
      });
    });

    it("DADO slot com múltiplos partials ENTÃO usa o primeiro (Q2 first-wins) [BR-CLI-ASSEMBLE-04]", () => {
      const headerV2 = "# Header V2\n\nConteúdo atualizado.\n";
      const store = createStubStore(
        { recipe: recipeWithMultiplePartials },
        {
          "tasks/header-v2.md": headerV2,
          "tasks/header-v1.md": partialHeader,
          "tasks/core.md": partialCore,
        }
      );
      const uc = new AssembleArtifact({ store });
      const result = uc.execute({ recipeName: "recipe" });

      // Deve usar header-v2 (primeiro da lista)
      expect(result.content).toContain("Header V2");
      expect(result.content).not.toContain("Fase 0");
    });
  });

  describe("Determinismo — mesma entrada → mesmo output byte-a-byte", () => {
    it("DADO mesma recipe e mesmos partials QUANDO executado 2× ENTÃO output idêntico [BR-CLI-ASSEMBLE-05]", () => {
      const store = createStubStore(
        { recipe: validRecipe },
        {
          "tasks/header.md": partialHeader,
          "tasks/core.md": partialCore,
        }
      );
      const uc = new AssembleArtifact({ store });
      const result1 = uc.execute({ recipeName: "recipe" });
      const result2 = uc.execute({ recipeName: "recipe" });

      expect(result1.content).toBe(result2.content);
      expect(result1.metadata).toEqual(result2.metadata);
    });

    it("DADO output ENTÃO termina com newline único (sem trailing extras) [BR-CLI-ASSEMBLE-06]", () => {
      const store = createStubStore(
        { recipe: validRecipe },
        {
          "tasks/header.md": partialHeader,
          "tasks/core.md": partialCore,
        }
      );
      const uc = new AssembleArtifact({ store });
      const result = uc.execute({ recipeName: "recipe" });

      expect(result.content.endsWith("\n")).toBe(true);
      expect(result.content.endsWith("\n\n")).toBe(false);
    });
  });

  describe("Erros — propagação via ports", () => {
    it("DADO recipe inexistente ENTÃO RECIPE_NOT_FOUND propagado [BR-CLI-ASSEMBLE-07]", () => {
      const store = createStubStore({}, {});
      const uc = new AssembleArtifact({ store });

      try {
        uc.execute({ recipeName: "inexistente" });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("RECIPE_NOT_FOUND");
      }
    });

    it("DADO partial inexistente ENTÃO RECIPE_PARTIAL_NOT_FOUND propagado [BR-CLI-ASSEMBLE-08]", () => {
      const store = createStubStore(
        { recipe: validRecipe },
        { "tasks/header.md": partialHeader }
        // core.md missing
      );
      const uc = new AssembleArtifact({ store });

      try {
        uc.execute({ recipeName: "recipe" });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("RECIPE_PARTIAL_NOT_FOUND");
      }
    });

    it("DADO recipe inválida no store ENTÃO assertValidRecipe lança [BR-CLI-ASSEMBLE-09]", () => {
      const invalidRecipe = { ...validRecipe, schemaVersion: "v99" };
      const store = createStubStore(
        { recipe: invalidRecipe },
        {
          "tasks/header.md": partialHeader,
          "tasks/core.md": partialCore,
        }
      );
      const uc = new AssembleArtifact({ store });

      try {
        uc.execute({ recipeName: "recipe" });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("RECIPE_INVALID_SCHEMA_VERSION");
      }
    });

    it("DADO partial com placeholder ENTÃO assertValidPartialMarkdown lança [BR-CLI-ASSEMBLE-10]", () => {
      const badPartial = "# Header\n\nNome: {{name}}\n";
      const store = createStubStore(
        { recipe: validRecipe },
        {
          "tasks/header.md": badPartial,
          "tasks/core.md": partialCore,
        }
      );
      const uc = new AssembleArtifact({ store });

      try {
        uc.execute({ recipeName: "recipe" });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        expect((e as GovernanceError).code).toBe("RECIPE_PARTIAL_HAS_PLACEHOLDER");
      }
    });
  });
});

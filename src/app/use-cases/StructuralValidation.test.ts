/**
 * [BR-CLI-STRUCT] Validação estrutural de artefatos compostos.
 *
 * Valida que um `ComposedArtifact` respeita as invariantes declaradas
 * na Recipe que o gerou. Recipe = contrato de validação (ADR 0005).
 *
 * Invariantes validadas:
 *  1. forbiddenHeadings — nenhum heading no output coincide com lista proibida.
 *  2. Slot completeness — slots required presentes na composição.
 *  3. Self-consistency — recipe que monta artefato que ela mesma rejeitaria.
 *
 * Aplica ADR 0005 (.core/governance/adrs/0005-structural-validation.md):
 * Recipe é o contrato de validação — não objeto auxiliar.
 */
import { GovernanceError } from "../../domain/shared/errors.js";
import { validateComposedArtifact } from "../../domain/templates/StructuralValidation.js";
import type { Recipe } from "../../domain/templates/Recipe.js";
import type { ComposedArtifact } from "../../domain/templates/ComposedArtifact.js";

// --- Fixtures ---

const baseRecipe: Recipe = {
  schemaVersion: "v0",
  artifactKind: "tasks",
  workflowType: "evidence-driven",
  language: "pt-BR",
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
    {
      id: "extra",
      required: false,
      minOccurrences: 0,
      maxOccurrences: 1,
      partials: ["tasks/extra.md"],
    },
  ],
  invariants: {
    canonicalOrder: "slots",
    forbiddenHeadings: [],
  },
};

const validArtifact: ComposedArtifact = {
  content:
    "# Fase 0 — Setup\n\n- Tarefa 1\n\n## Fase 1 — Core\n\n- Tarefa 2\n\n## Extras\n\n- Item\n",
  metadata: {
    artifactKind: "tasks",
    workflowType: "evidence-driven",
    language: "pt-BR",
    composedSlots: ["header", "core", "extra"],
  },
};

// --- Testes ---

describe("StructuralValidation — validateComposedArtifact [BR-CLI-STRUCT]", () => {
  describe("Happy path", () => {
    it("DADO artefato válido com recipe sem forbiddenHeadings ENTÃO retorna vazio [BR-CLI-STRUCT-01]", () => {
      const errors = validateComposedArtifact(validArtifact, baseRecipe);
      expect(errors).toEqual([]);
    });

    it("DADO artefato com todos os slots required presentes ENTÃO sem erro de completude [BR-CLI-STRUCT-02]", () => {
      const errors = validateComposedArtifact(validArtifact, baseRecipe);
      const missingSlots = errors.filter((e) => e.code === "STRUCT_MISSING_SLOT");
      expect(missingSlots).toEqual([]);
    });
  });

  describe("ForbiddenHeadings — STRUCT_FORBIDDEN_SECTION", () => {
    it("DADO recipe com forbiddenHeadings e artefato contendo heading proibido ENTÃO STRUCT_FORBIDDEN_SECTION [BR-CLI-STRUCT-03]", () => {
      const recipe: Recipe = {
        ...baseRecipe,
        invariants: {
          canonicalOrder: "slots",
          forbiddenHeadings: ["🛰️ Stage 1 / Stage 2"],
        },
      };
      const artifact: ComposedArtifact = {
        content: "# Header\n\n## 🛰️ Stage 1 / Stage 2\n\nConteúdo proibido.\n",
        metadata: { ...validArtifact.metadata, composedSlots: ["header", "core"] },
      };

      const errors = validateComposedArtifact(artifact, recipe);
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]).toBeInstanceOf(GovernanceError);
      expect(errors[0].code).toBe("STRUCT_FORBIDDEN_SECTION");
      expect(errors[0].message).toContain("heading '🛰️ Stage 1 / Stage 2' é proibido");
    });

    it("DADO heading proibido apenas dentro de bloco de código ENTÃO ignora (falso positivo) [BR-CLI-STRUCT-13]", () => {
      const recipe: Recipe = {
        ...baseRecipe,
        invariants: {
          canonicalOrder: "slots",
          forbiddenHeadings: ["NÃO PODE"],
        },
      };
      const artifact: ComposedArtifact = {
        content: "# Header\n\n```md\n## NÃO PODE\n```\n",
        metadata: { ...validArtifact.metadata, composedSlots: ["header", "core"] },
      };

      const errors = validateComposedArtifact(artifact, recipe);
      const forbiddenErrors = errors.filter((e) => e.code === "STRUCT_FORBIDDEN_SECTION");
      expect(forbiddenErrors).toEqual([]);
    });

    it("DADO múltiplos headings proibidos encontrados ENTÃO um erro por heading [BR-CLI-STRUCT-04]", () => {
      const recipe: Recipe = {
        ...baseRecipe,
        invariants: {
          canonicalOrder: "slots",
          forbiddenHeadings: ["Sub-bloco [0.Research]", "Roadmap Interno"],
        },
      };
      const artifact: ComposedArtifact = {
        content:
          "# Header\n\n## Sub-bloco [0.Research]\n\nTexto.\n\n## Roadmap Interno\n\nTexto.\n",
        metadata: { ...validArtifact.metadata, composedSlots: ["header", "core"] },
      };

      const errors = validateComposedArtifact(artifact, recipe);
      const forbidden = errors.filter((e) => e.code === "STRUCT_FORBIDDEN_SECTION");
      expect(forbidden).toHaveLength(2);
    });

    it("DADO heading parecido mas não idêntico (case-sensitive) ENTÃO sem erro [BR-CLI-STRUCT-05]", () => {
      const recipe: Recipe = {
        ...baseRecipe,
        invariants: {
          canonicalOrder: "slots",
          forbiddenHeadings: ["Stage 1"],
        },
      };
      const artifact: ComposedArtifact = {
        content: "# Header\n\n## stage 1\n\nDiferente por case.\n",
        metadata: { ...validArtifact.metadata, composedSlots: ["header", "core"] },
      };

      const errors = validateComposedArtifact(artifact, recipe);
      expect(errors).toEqual([]);
    });
  });

  describe("Slot completeness — STRUCT_MISSING_SLOT", () => {
    it("DADO slot required ausente dos composedSlots ENTÃO STRUCT_MISSING_SLOT [BR-CLI-STRUCT-06]", () => {
      const artifact: ComposedArtifact = {
        content: "# Header\n\nApenas header.\n",
        metadata: {
          ...validArtifact.metadata,
          composedSlots: ["header"], // falta "core" (required)
        },
      };

      const errors = validateComposedArtifact(artifact, baseRecipe);
      const missing = errors.filter((e) => e.code === "STRUCT_MISSING_SLOT");
      expect(missing).toHaveLength(1);
      expect(missing[0]).toBeInstanceOf(GovernanceError);
      expect(missing[0].message).toContain("core");
    });

    it("DADO slot optional ausente ENTÃO sem erro [BR-CLI-STRUCT-07]", () => {
      const artifact: ComposedArtifact = {
        content: "# Header\n\n## Core\n\nConteúdo.\n",
        metadata: {
          ...validArtifact.metadata,
          composedSlots: ["header", "core"], // "extra" (optional) ausente — ok
        },
      };

      const errors = validateComposedArtifact(artifact, baseRecipe);
      const missing = errors.filter((e) => e.code === "STRUCT_MISSING_SLOT");
      expect(missing).toEqual([]);
    });

    it("DADO múltiplos slots required ausentes ENTÃO um erro por slot [BR-CLI-STRUCT-08]", () => {
      const artifact: ComposedArtifact = {
        content: "# Vazio\n",
        metadata: {
          ...validArtifact.metadata,
          composedSlots: [], // faltam "header" e "core"
        },
      };

      const errors = validateComposedArtifact(artifact, baseRecipe);
      const missing = errors.filter((e) => e.code === "STRUCT_MISSING_SLOT");
      expect(missing).toHaveLength(2);
    });
  });

  describe("Self-consistency — STRUCT_RECIPE_SELF_INCONSISTENT", () => {
    it("DADO artifactKind divergente entre recipe e metadata ENTÃO STRUCT_RECIPE_SELF_INCONSISTENT [BR-CLI-STRUCT-09]", () => {
      const artifact: ComposedArtifact = {
        content: "# Header\n\n## Core\n\nOk.\n",
        metadata: {
          artifactKind: "spec", // recipe diz "tasks"
          workflowType: "evidence-driven",
          language: "pt-BR",
          composedSlots: ["header", "core"],
        },
      };

      const errors = validateComposedArtifact(artifact, baseRecipe);
      const inconsistent = errors.filter((e) => e.code === "STRUCT_RECIPE_SELF_INCONSISTENT");
      expect(inconsistent).toHaveLength(1);
      expect(inconsistent[0]).toBeInstanceOf(GovernanceError);
      expect(inconsistent[0].message).toContain("artifactKind");
    });

    it("DADO workflowType divergente ENTÃO STRUCT_RECIPE_SELF_INCONSISTENT [BR-CLI-STRUCT-10]", () => {
      const artifact: ComposedArtifact = {
        content: "# Header\n\n## Core\n\nOk.\n",
        metadata: {
          artifactKind: "tasks",
          workflowType: "deterministic", // recipe diz "evidence-driven"
          language: "pt-BR",
          composedSlots: ["header", "core"],
        },
      };

      const errors = validateComposedArtifact(artifact, baseRecipe);
      const inconsistent = errors.filter((e) => e.code === "STRUCT_RECIPE_SELF_INCONSISTENT");
      expect(inconsistent).toHaveLength(1);
      expect(inconsistent[0].message).toContain("workflowType");
    });

    it("DADO language divergente ENTÃO STRUCT_RECIPE_SELF_INCONSISTENT [BR-CLI-STRUCT-11]", () => {
      const artifact: ComposedArtifact = {
        content: "# Header\n\n## Core\n\nOk.\n",
        metadata: {
          artifactKind: "tasks",
          workflowType: "evidence-driven",
          language: "en-US", // recipe diz "pt-BR"
          composedSlots: ["header", "core"],
        },
      };

      const errors = validateComposedArtifact(artifact, baseRecipe);
      const inconsistent = errors.filter((e) => e.code === "STRUCT_RECIPE_SELF_INCONSISTENT");
      expect(inconsistent).toHaveLength(1);
      expect(inconsistent[0].message).toContain("language");
    });
  });

  describe("Acumulação de erros", () => {
    it("DADO múltiplas violações simultâneas ENTÃO acumula todos os erros [BR-CLI-STRUCT-12]", () => {
      const recipe: Recipe = {
        ...baseRecipe,
        invariants: {
          canonicalOrder: "slots",
          forbiddenHeadings: ["Proibido"],
        },
      };
      const artifact: ComposedArtifact = {
        content: "# Header\n\n## Proibido\n\nConteúdo.\n",
        metadata: {
          artifactKind: "spec", // divergente
          workflowType: "evidence-driven",
          language: "pt-BR",
          composedSlots: ["header"], // falta "core"
        },
      };

      const errors = validateComposedArtifact(artifact, recipe);
      // Deve ter pelo menos 3 erros: forbidden + missing + inconsistent
      expect(errors.length).toBeGreaterThanOrEqual(3);
      const codes = errors.map((e) => e.code);
      expect(codes).toContain("STRUCT_FORBIDDEN_SECTION");
      expect(codes).toContain("STRUCT_MISSING_SLOT");
      expect(codes).toContain("STRUCT_RECIPE_SELF_INCONSISTENT");
    });
  });
});

/**
 * [BR-CLI-RECIPE] Schema de Recipe para composição atômica de artefatos.
 *
 * Valida `Recipe`, `RecipeSlot`, `RecipeInvariants` e enums fechados como
 * contrato do TemplateEngine.
 *
 * Aplica ADR 0011 (.core/governance/adrs/0011-coverage-state-enum.md):
 * enums são fechados com mensagens determinísticas nomeando o conjunto válido.
 *
 * Aplica ADR 0014 (.core/governance/adrs/0014-structural-validation.md):
 * Recipe é o contrato de validação — slots ricos inline + invariants global.
 *
 * Opção (B) cravada no audit pré-3.D (2026-05-11): slots ricos inline +
 * invariants global mínimo. Q1–Q5 confirmadas.
 */
import { GovernanceError } from "../shared/errors.js";
import {
  assertValidRecipe,
  TEMPLATE_SCHEMA_VERSIONS,
  ARTIFACT_KINDS,
  LANGUAGES,
  CANONICAL_ORDERS,
} from "./Recipe.js";

// --- Fixtures ---

const validSlot = {
  id: "header",
  required: true,
  minOccurrences: 1,
  maxOccurrences: 1,
  partials: ["tasks/header-tasks.md"],
};

const validOptionalSlot = {
  id: "fase-extra",
  required: false,
  minOccurrences: 0,
  maxOccurrences: 1,
  partials: ["tasks/fase-extra-condicional.md"],
};

const validRecipe = {
  schemaVersion: "v0",
  artifactKind: "tasks",
  language: "pt-BR",
  slots: [validSlot, validOptionalSlot],
  invariants: {
    canonicalOrder: "slots",
    forbiddenHeadings: [],
  },
};

// --- Testes ---

describe("Recipe — Enums fechados (ADR 0011) [BR-CLI-RECIPE]", () => {
  it("DADO TEMPLATE_SCHEMA_VERSIONS ENTÃO contém apenas 'v0' e é readonly [BR-CLI-RECIPE-13]", () => {
    expect(TEMPLATE_SCHEMA_VERSIONS).toEqual(["v0"]);
    expect(Object.isFrozen(TEMPLATE_SCHEMA_VERSIONS)).toBe(true);
  });

  it("DADO ARTIFACT_KINDS ENTÃO contém 7 valores canônicos e é readonly [BR-CLI-RECIPE-14]", () => {
    expect(ARTIFACT_KINDS).toEqual([
      "spec",
      "plan",
      "tasks",
      "decision-brief",
      "next",
      "research-index",
      "roadmap",
    ]);
    expect(Object.isFrozen(ARTIFACT_KINDS)).toBe(true);
  });

  it("DADO LANGUAGES ENTÃO contém 'pt-BR' e 'en-US' e é readonly [BR-CLI-RECIPE-16]", () => {
    expect(LANGUAGES).toEqual(["pt-BR", "en-US"]);
    expect(Object.isFrozen(LANGUAGES)).toBe(true);
  });

  it("DADO CANONICAL_ORDERS ENTÃO contém apenas 'slots' e é readonly [BR-CLI-RECIPE-17]", () => {
    expect(CANONICAL_ORDERS).toEqual(["slots"]);
    expect(Object.isFrozen(CANONICAL_ORDERS)).toBe(true);
  });
});

describe("Recipe — assertValidRecipe [BR-CLI-RECIPE]", () => {
  describe("Recipe válida", () => {
    it("DADO recipe completa e bem-formada ENTÃO assertValidRecipe não lança [BR-CLI-RECIPE-01]", () => {
      expect(() => assertValidRecipe(validRecipe)).not.toThrow();
    });

    it("DADO recipe com slot sem minOccurrences/maxOccurrences explícitos ENTÃO aceita (defaults implícitos) [BR-CLI-RECIPE-18]", () => {
      const recipe = {
        ...validRecipe,
        slots: [{ id: "header", required: true, partials: ["common/header.md"] }],
      };
      expect(() => assertValidRecipe(recipe)).not.toThrow();
    });

    it("DADO recipe com forbiddenHeadings não-vazio ENTÃO aceita [BR-CLI-RECIPE-19]", () => {
      const recipe = {
        ...validRecipe,
        invariants: {
          canonicalOrder: "slots",
          forbiddenHeadings: ["🛰️ Stage 1 / Stage 2", "Sub-bloco [0.Research]"],
        },
      };
      expect(() => assertValidRecipe(recipe)).not.toThrow();
    });
  });

  describe("Campos obrigatórios — RECIPE_MISSING_FIELD", () => {
    it.each(["schemaVersion", "artifactKind", "language", "slots", "invariants"] as const)(
      "DADO recipe SEM '%s' ENTÃO RECIPE_MISSING_FIELD com mensagem citando o campo [BR-CLI-RECIPE-02]",
      (field) => {
        const { [field]: _omitted, ...incomplete } = validRecipe;
        try {
          assertValidRecipe(incomplete);
          fail("deveria ter lançado");
        } catch (e) {
          expect(e).toBeInstanceOf(GovernanceError);
          const err = e as GovernanceError;
          expect(err.code).toBe("RECIPE_MISSING_FIELD");
          expect(err.message).toContain(field);
        }
      }
    );

    it("DADO entrada não-objeto ENTÃO RECIPE_MISSING_FIELD [BR-CLI-RECIPE-20]", () => {
      try {
        assertValidRecipe("not an object");
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_MISSING_FIELD");
      }
    });

    it("DADO entrada null ENTÃO RECIPE_MISSING_FIELD [BR-CLI-RECIPE-21]", () => {
      try {
        assertValidRecipe(null);
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_MISSING_FIELD");
      }
    });
  });

  describe("Enums inválidos — códigos estáveis por campo", () => {
    it("DADO schemaVersion fora de TEMPLATE_SCHEMA_VERSIONS ENTÃO RECIPE_INVALID_SCHEMA_VERSION nomeando o conjunto [BR-CLI-RECIPE-03]", () => {
      try {
        assertValidRecipe({ ...validRecipe, schemaVersion: "v99" });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_INVALID_SCHEMA_VERSION");
        expect(err.message).toContain("v0");
      }
    });

    it("DADO artifactKind fora de ARTIFACT_KINDS ENTÃO RECIPE_INVALID_ARTIFACT_KIND nomeando o conjunto [BR-CLI-RECIPE-04]", () => {
      try {
        assertValidRecipe({ ...validRecipe, artifactKind: "changelog" });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_INVALID_ARTIFACT_KIND");
        expect(err.message).toContain("spec");
        expect(err.message).toContain("tasks");
      }
    });

    it("DADO language fora de LANGUAGES ENTÃO RECIPE_INVALID_LANGUAGE nomeando o conjunto [BR-CLI-RECIPE-06]", () => {
      try {
        assertValidRecipe({ ...validRecipe, language: "fr-FR" });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_INVALID_LANGUAGE");
        expect(err.message).toContain("pt-BR");
        expect(err.message).toContain("en-US");
      }
    });

    it("DADO canonicalOrder fora de CANONICAL_ORDERS ENTÃO RECIPE_INVALID_CANONICAL_ORDER nomeando o conjunto [BR-CLI-RECIPE-12]", () => {
      try {
        assertValidRecipe({
          ...validRecipe,
          invariants: { canonicalOrder: "alphabetical", forbiddenHeadings: [] },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_INVALID_CANONICAL_ORDER");
        expect(err.message).toContain("slots");
      }
    });
  });

  describe("Slots — validação estrutural", () => {
    it("DADO slots vazio ENTÃO RECIPE_EMPTY_SLOTS [BR-CLI-RECIPE-07]", () => {
      try {
        assertValidRecipe({ ...validRecipe, slots: [] });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_EMPTY_SLOTS");
      }
    });

    it("DADO slots não-array ENTÃO RECIPE_EMPTY_SLOTS [BR-CLI-RECIPE-22]", () => {
      try {
        assertValidRecipe({ ...validRecipe, slots: "not array" });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_EMPTY_SLOTS");
      }
    });

    it("DADO dois slots com mesmo id ENTÃO RECIPE_DUPLICATE_SLOT_ID citando os dois [BR-CLI-RECIPE-08]", () => {
      try {
        assertValidRecipe({
          ...validRecipe,
          slots: [validSlot, { ...validSlot }],
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_DUPLICATE_SLOT_ID");
        expect(err.message).toContain("header");
      }
    });

    it("DADO slot com partials vazio ENTÃO RECIPE_SLOT_NO_PARTIAL [BR-CLI-RECIPE-09]", () => {
      try {
        assertValidRecipe({
          ...validRecipe,
          slots: [{ ...validSlot, partials: [] }],
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_SLOT_NO_PARTIAL");
        expect(err.message).toContain("header");
      }
    });

    it("DADO slot com partials não-array ENTÃO RECIPE_SLOT_NO_PARTIAL [BR-CLI-RECIPE-23]", () => {
      try {
        assertValidRecipe({
          ...validRecipe,
          slots: [{ ...validSlot, partials: "single.md" }],
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_SLOT_NO_PARTIAL");
      }
    });

    it("DADO slot sem id ENTÃO RECIPE_MISSING_FIELD citando 'slot.id' [BR-CLI-RECIPE-24]", () => {
      const { id: _, ...noId } = validSlot;
      try {
        assertValidRecipe({ ...validRecipe, slots: [noId] });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_MISSING_FIELD");
        expect((e as GovernanceError).message).toContain("id");
      }
    });

    it("DADO slot sem required ENTÃO RECIPE_MISSING_FIELD citando 'slot.required' [BR-CLI-RECIPE-25]", () => {
      const { required: _, ...noRequired } = validSlot;
      try {
        assertValidRecipe({ ...validRecipe, slots: [noRequired] });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_MISSING_FIELD");
        expect((e as GovernanceError).message).toContain("required");
      }
    });
  });

  describe("Cardinalidade — coerência required/min/max", () => {
    it("DADO minOccurrences > maxOccurrences ENTÃO RECIPE_INVALID_CARDINALITY [BR-CLI-RECIPE-10]", () => {
      try {
        assertValidRecipe({
          ...validRecipe,
          slots: [{ ...validSlot, minOccurrences: 3, maxOccurrences: 1 }],
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_INVALID_CARDINALITY");
        expect(err.message).toContain("header");
      }
    });

    it("DADO required=true com minOccurrences=0 ENTÃO RECIPE_REQUIRED_INCONSISTENT [BR-CLI-RECIPE-11]", () => {
      try {
        assertValidRecipe({
          ...validRecipe,
          slots: [{ ...validSlot, required: true, minOccurrences: 0 }],
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("RECIPE_REQUIRED_INCONSISTENT");
        expect(err.message).toContain("header");
      }
    });

    it("DADO required=false com minOccurrences=2 ENTÃO RECIPE_REQUIRED_INCONSISTENT [BR-CLI-RECIPE-26]", () => {
      try {
        assertValidRecipe({
          ...validRecipe,
          slots: [{ ...validOptionalSlot, minOccurrences: 2 }],
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_REQUIRED_INCONSISTENT");
      }
    });

    it("DADO required=true sem minOccurrences explícito ENTÃO default min=1 aceito [BR-CLI-RECIPE-27]", () => {
      const slot = { id: "header", required: true, partials: ["x.md"] };
      expect(() => assertValidRecipe({ ...validRecipe, slots: [slot] })).not.toThrow();
    });

    it("DADO required=false sem minOccurrences explícito ENTÃO default min=0 aceito [BR-CLI-RECIPE-28]", () => {
      const slot = { id: "extra", required: false, partials: ["x.md"] };
      expect(() => assertValidRecipe({ ...validRecipe, slots: [slot] })).not.toThrow();
    });
  });

  describe("Invariants — forbiddenHeadings", () => {
    it("DADO invariants sem forbiddenHeadings ENTÃO RECIPE_MISSING_FIELD [BR-CLI-RECIPE-29]", () => {
      try {
        assertValidRecipe({
          ...validRecipe,
          invariants: { canonicalOrder: "slots" },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_MISSING_FIELD");
        expect((e as GovernanceError).message).toContain("forbiddenHeadings");
      }
    });

    it("DADO forbiddenHeadings não-array ENTÃO RECIPE_MISSING_FIELD [BR-CLI-RECIPE-30]", () => {
      try {
        assertValidRecipe({
          ...validRecipe,
          invariants: { canonicalOrder: "slots", forbiddenHeadings: "not array" },
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("RECIPE_MISSING_FIELD");
        expect((e as GovernanceError).message).toContain("forbiddenHeadings");
      }
    });
  });
});

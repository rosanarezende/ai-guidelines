import { GovernanceError } from "../shared/errors.js";
import {
  assertRequiredTemplatesPresent,
  deriveTemplateRecipeName,
  normalizeTemplateContent,
  normalizeTemplateRelativePath,
} from "./TemplateMirror.js";

describe("domain/provisioning/TemplateMirror", () => {
  it("normaliza relative paths para POSIX", () => {
    expect(normalizeTemplateRelativePath("nested\\spec-boilerplate.md")).toBe(
      "nested/spec-boilerplate.md"
    );
  });

  it("deriveTemplateRecipeName replica o contrato legado de filenames boilerplate", () => {
    expect(deriveTemplateRecipeName("tasks-evidence-driven-boilerplate.md")).toBe(
      "tasks-evidence-driven"
    );
    expect(deriveTemplateRecipeName("README.md")).toBeNull();
  });

  it("normalizeTemplateContent replica EOL/trailing-space do engine legado", () => {
    expect(normalizeTemplateContent("a \r\nb\t\n\n")).toBe("a\nb\n");
  });

  it("assertRequiredTemplatesPresent acusa template obrigatório ausente com erro acionável", () => {
    expect(() =>
      assertRequiredTemplatesPresent(
        ["spec-boilerplate.md"],
        ["spec-boilerplate.md", "tasks-boilerplate.md"]
      )
    ).toThrow(GovernanceError);

    try {
      assertRequiredTemplatesPresent(["spec-boilerplate.md"], ["tasks-boilerplate.md"]);
      fail("deveria lançar");
    } catch (error) {
      const err = error as GovernanceError;
      expect(err.code).toBe("PROVISIONING_TEMPLATE_MISSING");
      expect(err.message).toContain(".specify/templates");
      expect(err.message).toContain("tasks-boilerplate.md");
    }
  });
});

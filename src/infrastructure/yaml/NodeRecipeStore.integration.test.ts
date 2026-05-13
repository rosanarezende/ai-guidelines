import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { GovernanceError } from "../../domain/shared/errors.js";
import { AssembleArtifact } from "../../app/use-cases/AssembleArtifact.js";
import { NodeRecipeStore } from "./NodeRecipeStore.js";

function writeFile(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf-8");
}

describe("NodeRecipeStore (integration)", () => {
  it("carrega recipe YAML + partials e compõe artefato determinístico", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-guidelines-pr13-"));

    // paths canônicos
    const recipePath = path.join(root, ".core/governance/recipes/tasks-evidence-driven.recipe.yml");
    const headerPath = path.join(root, ".core/governance/templates/partials/tasks/header.md");
    const corePath = path.join(root, ".core/governance/templates/partials/tasks/core.md");

    const recipeYaml = `schemaVersion: v0
artifactKind: tasks
workflowType: evidence-driven
language: pt-BR
slots:
  - id: header
    required: true
    partials: [tasks/header.md]
  - id: core
    required: true
    partials: [tasks/core.md]
invariants:
  canonicalOrder: slots
  forbiddenHeadings: []
`;

    const header = `# Header

Linha 1
`;
    const core = `## Core

Linha 2
`;

    writeFile(recipePath, recipeYaml);
    writeFile(headerPath, header);
    writeFile(corePath, core);

    const store = new NodeRecipeStore(root);
    const uc = new AssembleArtifact({ store });

    const result = uc.execute({ recipeName: "tasks-evidence-driven" });

    expect(result.content).toBe(header.trimEnd() + "\n\n" + core.trimEnd() + "\n");
    expect(result.metadata).toEqual({
      artifactKind: "tasks",
      workflowType: "evidence-driven",
      language: "pt-BR",
      composedSlots: ["header", "core"],
    });
  });

  it("recipe inexistente → RECIPE_NOT_FOUND", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-guidelines-pr13-"));
    const store = new NodeRecipeStore(root);
    const uc = new AssembleArtifact({ store });

    try {
      uc.execute({ recipeName: "nao-existe" });
      fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(GovernanceError);
      expect((e as GovernanceError).code).toBe("RECIPE_NOT_FOUND");
    }
  });

  it("partial inexistente → RECIPE_PARTIAL_NOT_FOUND", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-guidelines-pr13-"));

    const recipePath = path.join(root, ".core/governance/recipes/tasks-evidence-driven.recipe.yml");
    const recipeYaml = `schemaVersion: v0
artifactKind: tasks
workflowType: evidence-driven
language: pt-BR
slots:
  - id: header
    required: true
    partials: [tasks/header.md]
  - id: core
    required: true
    partials: [tasks/missing.md]
invariants:
  canonicalOrder: slots
  forbiddenHeadings: []
`;
    writeFile(recipePath, recipeYaml);

    const headerPath = path.join(root, ".core/governance/templates/partials/tasks/header.md");
    writeFile(headerPath, "# Header\n");

    const store = new NodeRecipeStore(root);
    const uc = new AssembleArtifact({ store });

    try {
      uc.execute({ recipeName: "tasks-evidence-driven" });
      fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(GovernanceError);
      expect((e as GovernanceError).code).toBe("RECIPE_PARTIAL_NOT_FOUND");
    }
  });
});

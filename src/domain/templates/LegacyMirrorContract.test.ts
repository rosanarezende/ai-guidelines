import * as fs from "node:fs";
import * as path from "node:path";
import YAML from "yaml";

import { assertValidRecipe } from "./Recipe.js";

const ROOT_DIR = process.cwd();

describe("Legacy Mirror Contract [3.F + 4.C.3.b]", () => {
  it("DADO mirror legado depreciado QUANDO verificado ENTÃO boilerplates originais não devem ser removidos enquanto fallback per-kind estiver ativo", () => {
    const legacyTemplates = [
      ".specify/templates/decision-brief-boilerplate.md",
      ".specify/templates/next-boilerplate.md",
      ".specify/templates/plan-boilerplate.md",
      ".specify/templates/project-config-boilerplate.md",
      ".specify/templates/research-index-boilerplate.md",
      ".specify/templates/roadmap-boilerplate.md",
      ".specify/templates/spec-boilerplate.md",
      ".specify/templates/tasks-boilerplate.md",
      ".specify/templates/tasks-deterministic-boilerplate.md",
      ".specify/templates/tasks-evidence-driven-boilerplate.md",
      ".specify/templates/tasks-mixed-boilerplate.md",
    ];

    for (const templatePath of legacyTemplates) {
      const fullPath = path.join(ROOT_DIR, templatePath);
      const exists = fs.existsSync(fullPath);
      expect(exists).toBe(true);

      if (exists) {
        const content = fs.readFileSync(fullPath, "utf-8");
        expect(content.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("DADO recipes materializadas em 4.C QUANDO verificadas ENTÃO recipe YAML + partials referenciados existem e validam", () => {
    const materializedRecipes = ["tasks-evidence-driven"] as const;

    for (const recipeName of materializedRecipes) {
      const recipePath = path.join(
        ROOT_DIR,
        ".core",
        "governance",
        "recipes",
        `${recipeName}.recipe.yml`
      );
      expect(fs.existsSync(recipePath)).toBe(true);

      const raw = fs.readFileSync(recipePath, "utf-8");
      const pojo = YAML.parse(raw);
      assertValidRecipe(pojo);

      for (const slot of pojo.slots) {
        for (const partialRef of slot.partials) {
          const partialPath = path.join(
            ROOT_DIR,
            ".core",
            "governance",
            "templates",
            "partials",
            partialRef
          );
          expect(fs.existsSync(partialPath)).toBe(true);
          const partialContent = fs.readFileSync(partialPath, "utf-8");
          expect(partialContent.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});

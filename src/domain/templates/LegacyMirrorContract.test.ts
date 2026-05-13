import * as fs from "node:fs";
import * as path from "node:path";

const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");

describe("Legacy Mirror Contract [3.F]", () => {
  it("DADO mirror legado depreciado QUANDO verificado ENTÃO boilerplates originais não devem ser removidos antes do PR4", () => {
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
});

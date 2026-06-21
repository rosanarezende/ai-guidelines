import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf-8");
}

describe("internal architecture organization", () => {
  it("mantém o wizard raiz como orquestrador, não como coletor de IO/provisioning", () => {
    const wizard = source("src/cli/flowWizard.ts");

    expect(wizard).not.toContain('from "node:fs"');
    expect(wizard).not.toContain('from "node:path"');
    expect(wizard).not.toContain("reviewPolicyReader");
    expect(wizard).not.toContain("ProviderCatalog");
    expect(wizard).not.toContain("ReviewPolicyBaseline");
    expect(wizard).not.toContain("FormatterContext");
    expect(wizard).not.toContain("PackageJson");
  });

  it("mantém responsabilidades do wizard em módulos navegáveis", () => {
    const modules = [
      "src/cli/experience/wizard/provisioning.ts",
      "src/cli/experience/wizard/specWork.ts",
      "src/testing/bdd/maintainerScenarioCatalog.ts",
    ];

    for (const module of modules) {
      expect(existsSync(path.join(repoRoot, module))).toBe(true);
    }
  });
});

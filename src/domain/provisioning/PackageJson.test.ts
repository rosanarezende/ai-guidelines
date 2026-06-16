import {
  detectNewDevDeps,
  hasDependency,
  hasScriptToken,
  mergeHuskyPackageJson,
  mergePrettierPackageJson,
  serializePackageJson,
} from "./PackageJson.js";

describe("domain/provisioning/PackageJson (paridade com package-context legado)", () => {
  it("mergePrettierPackageJson injeta script format e devDependency prettier", () => {
    const merged = mergePrettierPackageJson({ name: "consumer" });

    expect(merged).toEqual({
      name: "consumer",
      scripts: { format: "prettier --write ." },
      devDependencies: { prettier: "^3.0.0" },
    });
  });

  it("mergePrettierPackageJson preserva scripts/deps existentes", () => {
    const merged = mergePrettierPackageJson({
      scripts: { test: "node --test", format: "custom format" },
      devDependencies: { prettier: "^3.2.0", jest: "^30.0.0" },
    });

    expect(merged).toEqual({
      scripts: { test: "node --test", format: "custom format" },
      devDependencies: { prettier: "^3.2.0", jest: "^30.0.0" },
    });
  });

  it("mergeHuskyPackageJson injeta prepare e devDependency husky preservando existentes", () => {
    const merged = mergeHuskyPackageJson({
      scripts: { test: "node --test" },
      devDependencies: { prettier: "^3.0.0" },
    });

    expect(merged).toEqual({
      scripts: { test: "node --test", prepare: "husky" },
      devDependencies: { prettier: "^3.0.0", husky: "^9.0.0" },
    });
  });

  it("detectNewDevDeps reporta apenas dependências novas", () => {
    expect(
      detectNewDevDeps(
        { devDependencies: { jest: "^30.0.0" } },
        { devDependencies: { jest: "^30.0.0", prettier: "^3.0.0" } }
      )
    ).toEqual(["prettier"]);
  });

  it("hasDependency e hasScriptToken detectam sinais usados pelo formatter snapshot", () => {
    const packageJson = {
      dependencies: { "@biomejs/biome": "^1.0.0" },
      scripts: { format: "biome format ." },
    };

    expect(hasDependency(packageJson, "@biomejs/biome")).toBe(true);
    expect(hasScriptToken(packageJson, /\bbiome\b/i)).toBe(true);
  });

  it("serializePackageJson usa indentação de 2 espaços e newline final", () => {
    expect(serializePackageJson({ name: "consumer" })).toBe(
      `${JSON.stringify({ name: "consumer" }, null, 2)}\n`
    );
  });
});

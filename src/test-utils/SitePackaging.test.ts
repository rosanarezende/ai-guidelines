import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(".");

function readPackageJson(): any {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf-8"));
}

describe("governed documentation site packaging", () => {
  it("mantem site fora do payload publicado no npm", () => {
    const pkg = readPackageJson();
    const files = JSON.stringify(pkg.files ?? []);

    expect(files).not.toContain('"site"');
    expect(files).not.toContain("site/");
  });

  it("mantem React/Vite e otimizacao de imagem como ferramentas de desenvolvimento", () => {
    const pkg = readPackageJson();
    const runtimeDeps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.optionalDependencies ?? {}),
    };
    const devDeps = pkg.devDependencies ?? {};

    for (const name of ["react", "react-dom", "vite", "@vitejs/plugin-react", "sharp"]) {
      expect(runtimeDeps).not.toHaveProperty(name);
      expect(devDeps).toHaveProperty(name);
    }
  });

  it("expoe build governado do site e valida o build na cadeia completa", () => {
    const pkg = readPackageJson();

    expect(pkg.scripts["site:assets:sync"]).toBe("node site/scripts/optimize-assets.mjs sync");
    expect(pkg.scripts["site:assets:check"]).toBe("node site/scripts/optimize-assets.mjs check");
    expect(pkg.scripts["site:build"]).toBe(
      "npm run site:flow:check && npm run site:assets:check && vite build --config site/vite.config.ts"
    );
    expect(pkg.scripts["site:dev"]).toBe("vite --config site/vite.config.ts --host 127.0.0.1");
    expect(pkg.scripts.validate).toContain("npm run site:build");
  });

  it("mantem a home como pagina de produto sem instrucoes de deploy", () => {
    const appSource = fs.readFileSync(path.join(REPO_ROOT, "site/src/App.tsx"), "utf-8");

    expect(appSource).not.toMatch(/Cloudflare/i);
    expect(appSource).not.toContain("../../docs/assets/");
    expect(appSource).toContain("Automação absorve o mecânico");
    expect(appSource).toContain("./assets/generated/ai-guidelines-flow.webp");
    expect(appSource).toContain("npx ai-guidelines init");
    expect(appSource).toContain("/flow/");
  });
});

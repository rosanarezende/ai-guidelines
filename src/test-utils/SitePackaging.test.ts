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

  it("mantem React/Vite como ferramentas de desenvolvimento, nao runtime do pacote", () => {
    const pkg = readPackageJson();
    const runtimeDeps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.optionalDependencies ?? {}),
    };
    const devDeps = pkg.devDependencies ?? {};

    for (const name of ["react", "react-dom", "vite", "@vitejs/plugin-react"]) {
      expect(runtimeDeps).not.toHaveProperty(name);
      expect(devDeps).toHaveProperty(name);
    }
  });

  it("expoe build governado do site e valida o build na cadeia completa", () => {
    const pkg = readPackageJson();

    expect(pkg.scripts["site:build"]).toBe(
      "npm run site:flow:check && vite build --config site/vite.config.ts"
    );
    expect(pkg.scripts["site:dev"]).toBe("vite --config site/vite.config.ts --host 127.0.0.1");
    expect(pkg.scripts.validate).toContain("npm run site:build");
  });

  it("mantem a home como pagina de produto sem instrucoes de deploy", () => {
    const appSource = fs.readFileSync(path.join(REPO_ROOT, "site/src/App.tsx"), "utf-8");

    expect(appSource).not.toMatch(/Cloudflare/i);
    expect(appSource).toContain("Automação absorve o mecânico");
    expect(appSource).toContain("npx ai-guidelines init");
    expect(appSource).toContain("/flow/");
  });
});

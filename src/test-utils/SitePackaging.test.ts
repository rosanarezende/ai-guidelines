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
    // Transcripts reais do site também são gateados na cadeia de build (B2).
    expect(pkg.scripts["site:scenarios:check"]).toBe(
      "npm run build && node dist/cli/bin.js site-scenarios check"
    );
    expect(pkg.scripts["site:build"]).toBe(
      "npm run site:flow:check && npm run site:scenarios:check && npm run site:assets:check && vite build --config site/vite.config.ts"
    );
    expect(pkg.scripts["site:dev"]).toBe("vite --config site/vite.config.ts --host 127.0.0.1");
    expect(pkg.scripts.validate).toContain("npm run site:build");
  });

  it("mantem a home como simulador da CLI sem instrucoes de deploy", () => {
    const appSource = fs.readFileSync(path.join(REPO_ROOT, "site/src/app/App.tsx"), "utf-8");
    const homeSource = fs.readFileSync(
      path.join(REPO_ROOT, "site/src/pages/home/HomePage/HomePage.tsx"),
      "utf-8"
    );
    const flowData = fs.readFileSync(path.join(REPO_ROOT, "site/src/content/flowData.ts"), "utf-8");
    const viteConfig = fs.readFileSync(path.join(REPO_ROOT, "site/vite.config.ts"), "utf-8");

    expect(appSource).not.toMatch(/Cloudflare/i);
    expect(appSource).not.toContain("../../docs/assets/");
    // A home É o simulador da CLI: começa por npx ai-guidelines, não por deploy.
    expect(homeSource).toContain("ScenarioChooser");
    expect(homeSource).toContain("CliSimulator");
    expect(homeSource).toContain("npx ai-guidelines");
    // O comando do consumidor é DERIVADO (binCommand), não literal no JSX.
    expect(flowData).toContain('binCommand("init", "--dry-run")');
    expect(viteConfig).not.toContain("copyFlowSite");
  });

  it("publica o site como SPA navegavel; links antigos /flow/* continuam validos", () => {
    const redirects = fs.readFileSync(path.join(REPO_ROOT, "site/public/_redirects"), "utf-8");
    const routeSource = fs.readFileSync(
      path.join(REPO_ROOT, "site/src/content/flowData.ts"),
      "utf-8"
    );

    expect(redirects.trim()).toBe("/* /index.html 200");
    // Rotas canônicas do formato simulador.
    expect(routeSource).toContain('path: "/"');
    expect(routeSource).toContain('"/atalhos"');
    // Links do formato anterior resolvem para o simulador (sem soft-404 perdido).
    expect(routeSource).toContain('startsWith("/flow/")');
    expect(routeSource).toContain('"/flow/reference"');
    // Rota desconhecida vira 404 explícito.
    expect(routeSource).toContain('return "notFound";');
  });
});

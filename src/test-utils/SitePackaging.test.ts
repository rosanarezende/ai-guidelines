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
    // A máquina de prompts (sequência real do wizard) também é gateada na cadeia.
    expect(pkg.scripts["site:prompts:check"]).toBe(
      "npm run build && node dist/cli/bin.js site-prompts check"
    );
    expect(pkg.scripts["site:real-package"]).toBe(
      "npm run build:all && node site/scripts/prepare-real-cli-package.mjs"
    );
    expect(pkg.scripts["site:build"]).toBe(
      "npm run site:flow:check && npm run site:scenarios:check && npm run site:prompts:check && npm run site:assets:check && npm run site:real-package && vite build --config site/vite.config.ts"
    );
    expect(pkg.scripts["site:dev"]).toBe(
      "npm run site:real-package && vite --config site/vite.config.ts --host 127.0.0.1"
    );
    expect(pkg.scripts.validate).toContain("npm run site:build");
  });

  it("home institucional aponta para o /cli, que monta o simulador projetado", () => {
    const appSource = fs.readFileSync(path.join(REPO_ROOT, "site/src/app/App.tsx"), "utf-8");
    const homeSource = fs.readFileSync(
      path.join(REPO_ROOT, "site/src/pages/home/HomePage/HomePage.tsx"),
      "utf-8"
    );
    const cliSource = fs.readFileSync(
      path.join(REPO_ROOT, "site/src/pages/cli/CliPage/CliPage.tsx"),
      "utf-8"
    );
    const flowData = fs.readFileSync(path.join(REPO_ROOT, "site/src/content/flowData.ts"), "utf-8");
    const viteConfig = fs.readFileSync(path.join(REPO_ROOT, "site/vite.config.ts"), "utf-8");

    expect(appSource).not.toMatch(/Cloudflare/i);
    expect(appSource).not.toContain("../../docs/assets/");
    // A home explica o produto e leva ao simulador — não monta mais o terminal.
    expect(homeSource).toContain('route="cliStart"');
    expect(homeSource).toContain('route="cliDaily"');
    expect(homeSource).toContain("BIN_WIZARD");
    expect(homeSource).not.toContain("CliTerminal");
    // O simulador projetado vive no /cli: terminal derivado da projeção real.
    expect(cliSource).toContain("CliTerminal");
    expect(cliSource).toContain("promptFlows");
    // O comando do consumidor é DERIVADO (binCommand), não literal no JSX.
    expect(flowData).toContain('binCommand("init", "--dry-run")');
    expect(viteConfig).not.toContain("copyFlowSite");
  });

  it("publica o site como SPA navegavel apenas nas rotas públicas atuais", () => {
    const redirects = fs.readFileSync(path.join(REPO_ROOT, "site/public/_redirects"), "utf-8");
    const routeSource = fs.readFileSync(
      path.join(REPO_ROOT, "site/src/content/flowData.ts"),
      "utf-8"
    );

    expect(redirects.trim()).toBe("/* /index.html 200");
    // Rotas canônicas do formato simulador.
    expect(routeSource).toContain('path: "/"');
    expect(routeSource).toContain('path: "/cli"');
    expect(routeSource).toContain('path: "/cli/comecar"');
    expect(routeSource).toContain('path: "/cli/dia-a-dia"');
    expect(routeSource).toContain('path: "/cli/avancado"');
    expect(routeSource).toContain('"/atalhos"');
    // Rota desconhecida vira 404 explícito.
    expect(routeSource).toContain('return "notFound";');
  });
});

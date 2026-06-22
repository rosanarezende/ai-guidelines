import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Guards de navegação e layout do site atual.
 *
 * O módulo do site vive fora do rootDir do tsc (`src`), então auditamos via fonte.
 * As asserções são falsificáveis: remover o 404 explícito, as rotas atuais ou o
 * layout mobile-first do terminal quebra o teste.
 */

const REPO_ROOT = process.cwd();

function readSite(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

describe("rotas do site (formato simulador)", () => {
  const flowData = readSite("site/src/content/flowData.ts");

  it("home (/), simuladores (/cli/*), casos avançados e atalhos são rotas canônicas", () => {
    expect(flowData).toContain('path: "/"');
    expect(flowData).toContain('path: "/cli"');
    expect(flowData).toContain('path: "/cli/comecar"');
    expect(flowData).toContain('path: "/cli/dia-a-dia"');
    expect(flowData).toContain('path: "/cli/avancado"');
    expect(flowData).toContain('"/atalhos"');
  });

  it("tem rota secundária de contribuidor fora da nav principal", () => {
    expect(flowData).toContain('"/contribute"');
    expect(flowData).toContain('return "contribute"');
    expect(flowData).toContain("contributeRoute");
  });

  it("rota inexistente vira 404 explícito, não soft-404 (req. 14)", () => {
    expect(flowData).toContain("notFound");
    // O fallback final de routeFromPath é notFound, não home.
    expect(flowData).toMatch(/return "notFound";\s*\n\}/);
  });

  it("expõe título por rota (SEO/a11y) e 404 com texto próprio", () => {
    expect(flowData).toContain("export function routeTitle");
    expect(flowData).toContain("começar com o framework");
    expect(flowData).toContain("uso no dia a dia");
    expect(flowData).toContain("casos avançados");
    expect(flowData.toLowerCase()).toContain("não encontrada");
    const appShell = readSite("site/src/app/shell/AppShell/AppShell.tsx");
    const activePage = readSite("site/src/app/routing/ActivePage/ActivePage.tsx");
    expect(appShell).toContain("document.title = routeTitle(route)");
    expect(activePage).toContain("NotFoundPage");
    expect(activePage).toContain("AdvancedPage");
  });
});

describe("layout mobile-first não quebra (req. 13)", () => {
  const cliCss = readSite("site/src/pages/cli/CliPage/CliPage.css");
  const terminalCss = readSite("site/src/features/cli-simulator/CliTerminal/CliTerminal.css");

  it("o grid começa em coluna única e expande por breakpoint", () => {
    expect(cliCss).toContain("grid-template-columns: 1fr");
    expect(cliCss).toContain("@media (min-width:");
    expect(terminalCss).toContain("@media (min-width:");
  });

  it("não há largura fixa em px que estoure o mobile", () => {
    expect(cliCss).not.toMatch(/width:\s*\d{4,}px/);
    expect(terminalCss).not.toMatch(/width:\s*\d{4,}px/);
  });
});

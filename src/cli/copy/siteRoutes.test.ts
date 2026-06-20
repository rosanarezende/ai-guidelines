import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Guards de navegação e de procedência do simulador (req. 13,14,15 + render).
 *
 * O módulo do site vive fora do rootDir do tsc (`src`), então auditamos via fonte.
 * As asserções são falsificáveis: remover o 404 explícito, o simulador ou o
 * layout mobile-first quebra o teste.
 */

const REPO_ROOT = process.cwd();

function readSite(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

describe("rotas do site (formato simulador)", () => {
  const flowData = readSite("site/src/content/flowData.ts");

  it("home (/), índice do simulador (/cli) e atalhos (/atalhos) são rotas canônicas", () => {
    expect(flowData).toContain('path: "/"');
    expect(flowData).toContain('path: "/cli"');
    expect(flowData).toContain('path: "/cli/comecar"');
    expect(flowData).toContain('path: "/cli/dia-a-dia"');
    expect(flowData).toContain('"/atalhos"');
  });

  it("tem rota secundária de contribuidor fora da nav principal", () => {
    expect(flowData).toContain('"/contribute"');
    expect(flowData).toContain('return "contribute"');
    expect(flowData).toContain("contributeRoute");
  });

  it("links antigos /flow/* resolvem para o simulador ou atalhos (sem soft-404 perdido)", () => {
    expect(flowData).toContain('startsWith("/flow/")');
    expect(flowData).toContain('return "cli"');
    expect(flowData).toContain('return "cliStart"');
    expect(flowData).toContain('return "cliDaily"');
    // A referência antiga continua válida e aponta para os atalhos.
    expect(flowData).toContain('"/flow/reference"');
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
    expect(flowData.toLowerCase()).toContain("não encontrada");
    const appShell = readSite("site/src/app/shell/AppShell/AppShell.tsx");
    const activePage = readSite("site/src/app/routing/ActivePage/ActivePage.tsx");
    expect(appShell).toContain("document.title = routeTitle(route)");
    expect(activePage).toContain("NotFoundPage");
  });
});

describe("simulador renderiza cenários com procedência visível", () => {
  const chooser = readSite(
    "site/src/features/scenario-catalog/ScenarioChooser/ScenarioChooser.tsx"
  );
  const player = readSite("site/src/features/scenario-player/ScenarioPlayer/ScenarioPlayer.tsx");
  const terminalFrame = readSite("site/src/features/terminal/TerminalFrame/TerminalFrame.tsx");

  it("o chooser lê o catálogo e mostra o badge de procedência", () => {
    expect(chooser).toContain("scenarioCatalog");
    expect(chooser).toContain("PROVENANCE_LABEL");
  });

  it("o player mostra procedência por saída e usa o TerminalFrame com badge", () => {
    expect(player).toContain("ORIGIN_LABEL");
    expect(player).toContain("resolveOutput");
    expect(player).toContain("TerminalFrame");
    expect(terminalFrame).toContain("terminalBadge");
  });
});

describe("layout mobile-first não quebra (req. 13)", () => {
  const chooserCss = readSite(
    "site/src/features/scenario-catalog/ScenarioChooser/ScenarioChooser.css"
  );
  const simulatorCss = readSite("site/src/features/cli-simulator/CliSimulator/CliSimulator.css");

  it("o grid começa em coluna única e expande por breakpoint", () => {
    expect(chooserCss).toContain("grid-template-columns: 1fr");
    expect(chooserCss).toContain("@media (min-width:");
    expect(simulatorCss).toContain("grid-template-columns: 1fr");
    expect(simulatorCss).toContain("@media (min-width:");
  });

  it("não há largura fixa em px que estoure o mobile", () => {
    expect(simulatorCss).not.toMatch(/width:\s*\d{4,}px/);
    expect(chooserCss).not.toMatch(/width:\s*\d{4,}px/);
  });
});

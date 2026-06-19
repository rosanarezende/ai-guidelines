import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Guards de navegação e de surface de cenários do site (Fase 2 / itens 7,14,15).
 *
 * O módulo do site vive fora do rootDir do tsc (`src`), então auditamos via
 * fonte (mesmo padrão dos demais guards de site). As asserções são falsificáveis:
 * remover o 404 explícito ou o painel de cenário quebra o teste.
 */

const REPO_ROOT = process.cwd();

function readSite(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

describe("rotas navegáveis do site", () => {
  const flowData = readSite("site/src/content/flowData.ts");

  it("expõe as rotas canônicas EN do /flow/*", () => {
    for (const route of [
      "/flow/start",
      "/flow/daily",
      "/flow/team",
      "/flow/review",
      "/flow/reference",
    ]) {
      expect(flowData).toContain(route);
    }
  });

  it("tem rota secundária de contribuidor fora da nav principal", () => {
    expect(flowData).toContain('"/contribute"');
    expect(flowData).toContain('return "contribute"');
    expect(flowData).toContain("contributeRoute");
  });

  it("mantém os paths PT antigos como aliases (links existentes seguem válidos)", () => {
    for (const alias of [
      "/flow/comecar",
      "/flow/uso-diario",
      "/flow/time",
      "/flow/review-entre-pares",
      "/flow/referencia",
    ]) {
      expect(flowData).toContain(alias);
    }
  });

  it("rota inexistente vira 404 explícito, não soft-404", () => {
    // routeFromPath deve devolver notFound no fallback — nunca cair em "flow".
    expect(flowData).toContain('return "notFound";');
    expect(flowData).not.toMatch(/return "flow";\s*\n\}/);
    expect(flowData).toContain("notFound");
  });

  it("expõe título por rota (SEO/a11y) e 404 com texto próprio", () => {
    expect(flowData).toContain("export function routeTitle");
    expect(flowData.toLowerCase()).toContain("não encontrada");
    const appShell = readSite("site/src/app/shell/AppShell/AppShell.tsx");
    const activePage = readSite("site/src/app/routing/ActivePage/ActivePage.tsx");
    expect(appShell).toContain("document.title = routeTitle(route)");
    expect(activePage).toContain("NotFoundPage");
  });
});

describe("jornadas surface transcripts verídicos", () => {
  const flowData = readSite("site/src/content/flowData.ts");
  const journeySection = readSite("site/src/features/journey/JourneySection/JourneySection.tsx");
  const scenarioTerminal = readSite(
    "site/src/features/terminal/ScenarioTerminal/ScenarioTerminal.tsx"
  );
  const terminalFrame = readSite("site/src/features/terminal/TerminalFrame/TerminalFrame.tsx");

  it("liga jornadas a cenários gerados (real/guiado)", () => {
    expect(flowData).toContain("AI_GUIDELINES_FLOW_SCENARIOS");
    expect(flowData).toContain("scenarioById");
    for (const id of ["consumer-empty-entry", "consumer-existing-entry", "peer-review"]) {
      expect(flowData).toContain(`scenarioId: "${id}"`);
    }
  });

  it("renderiza o painel de cenário com procedência visível", () => {
    expect(journeySection).toContain("ScenarioPanel");
    expect(scenarioTerminal).toContain("ScenarioTerminal");
    expect(terminalFrame).toContain("terminalBadge");
  });
});

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
  const flowData = readSite("site/src/flowData.ts");

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
    const app = readSite("site/src/App.tsx");
    expect(app).toContain("document.title = routeTitle(route)");
    expect(app).toContain("NotFoundPage");
  });
});

describe("jornadas surface transcripts verídicos", () => {
  const flowData = readSite("site/src/flowData.ts");
  const app = readSite("site/src/App.tsx");

  it("liga jornadas a cenários gerados (real/guiado)", () => {
    expect(flowData).toContain("AI_GUIDELINES_FLOW_SCENARIOS");
    expect(flowData).toContain("scenarioById");
    for (const id of ["new-project", "existing-repo", "peer-review"]) {
      expect(flowData).toContain(`scenarioId: "${id}"`);
    }
  });

  it("renderiza o painel de cenário com procedência visível", () => {
    expect(app).toContain("ScenarioPanel");
    expect(app).toContain("ScenarioTerminal");
    expect(app).toContain("terminalBadge");
  });
});

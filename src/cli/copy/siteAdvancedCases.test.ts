import { readFileSync } from "node:fs";
import path from "node:path";

import { siteCommandSurface } from "../siteFlowCopy.js";

const REPO_ROOT = process.cwd();

function readSite(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

describe("casos avançados do site", () => {
  const casesSource = readSite("site/src/content/advancedCases.ts");
  const pageSource = readSite("site/src/pages/advanced/AdvancedPage/AdvancedPage.tsx");
  const localeSource = readSite("site/src/pages/advanced/AdvancedPage/locales/pt-BR.json");

  it("publica um laboratório de desencontros com 8 mini projetos", () => {
    const scenarioCount = casesSource.match(/number:\s*\d,/g)?.length ?? 0;

    expect(scenarioCount).toBe(8);
    expect(pageSource).toContain("desencontroScenarios");
    expect(pageSource).toContain("TerminalFrame");
    expect(localeSource).toContain("Laboratório de desencontros");
    expect(localeSource).toContain("Oito mini projetos");
  });

  it("mostra o diagnóstico que a pessoa ou a LLM roda no terminal", () => {
    expect(casesSource).toContain("npx ai-guidelines drift");
    expect(casesSource).toContain("# Diagnóstico de governança");
    expect(casesSource).toContain("Classificação do reparo");
    expect(casesSource).toContain("decisão humana");
  });

  it("cita apenas comandos existentes no registry real para diagnóstico e reparo", () => {
    const commandNames = new Set(siteCommandSurface().map((command) => command.name));

    expect(commandNames.has("drift")).toBe(true);
    expect(commandNames.has("repair")).toBe(true);
  });
});

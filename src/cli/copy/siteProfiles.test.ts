import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Separação de perfis do site (consumidor × contribuidor) no formato simulador.
 *
 * Contrato:
 *  - a superfície PÚBLICA (consumidor) usa `npx ai-guidelines …` e começa pelo guia;
 *  - `npm run flow` (alias local deste repo) só aparece na seção de contribuidor;
 *  - identificadores internos (PR/Spec/CO-/sub-checkpoint) não vazam no público;
 *  - a home É o simulador — a pessoa não precisa decorar comandos.
 */

const REPO_ROOT = process.cwd();
const MARKER = "CONTRIBUTOR SURFACE";

function readSite(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

function splitAtMarker(source: string): { publicPart: string; contributorPart: string } {
  const index = source.indexOf(MARKER);
  expect(index).toBeGreaterThan(-1);
  return { publicPart: source.slice(0, index), contributorPart: source.slice(index) };
}

const INTERNAL_PATTERNS: readonly RegExp[] = [
  /npm run flow/,
  /Spec 0024/,
  /CO-10/,
  /sub-checkpoint/i,
  /#43\b/,
  /\b0024\b/,
  /\b0023\b/,
];

describe("flowData separa consumidor e contribuidor", () => {
  const flowData = readSite("site/src/content/flowData.ts");
  const { publicPart, contributorPart } = splitAtMarker(flowData);

  it("a superfície pública não usa `npm run flow`", () => {
    expect(publicPart).not.toContain("npm run flow");
  });

  it("a superfície pública não vaza identificadores internos", () => {
    for (const pattern of INTERNAL_PATTERNS) {
      expect(publicPart).not.toMatch(pattern);
    }
  });

  it("init/adopt/update aparecem como comandos públicos (npx, derivados)", () => {
    expect(publicPart).toContain('binCommand("init"');
    expect(publicPart).toContain('binCommand("adopt"');
    expect(publicPart).toContain('binCommand("update"');
    expect(publicPart).toContain("BIN_WIZARD");
  });

  it("`npm run flow` vive apenas na seção de contribuidor", () => {
    expect(contributorPart).toContain("npm run flow");
    expect(contributorPart).toContain("flowCommand");
  });
});

describe("home explica o produto; o simulador vive em /cli (req. 1)", () => {
  const home = readSite("site/src/pages/home/HomePage/HomePage.tsx");
  const homeLocale = readSite("site/src/pages/home/HomePage/locales/pt-BR.json");
  const cli = readSite("site/src/pages/cli/CliPage/CliPage.tsx");
  const cliLocale = readSite("site/src/pages/cli/CliPage/locales/pt-BR.json");

  it("a home apresenta o produto e leva ao simulador, sem montar o terminal", () => {
    expect(home).toContain('route="cli"');
    expect(home).toContain("npx ai-guidelines");
    // A home não é mais o simulador: não monta o terminal interativo.
    expect(home).not.toContain("CliTerminal");
    expect(home).not.toContain("ScenarioChooser");
  });

  it("o /cli monta o simulador projetado e não exige decorar comandos", () => {
    expect(cli).toContain("CliTerminal");
    expect(cli).toContain("promptFlows");
    expect(cli).toContain("npx ai-guidelines");
    expect(`${homeLocale}\n${cliLocale}`).toMatch(
      /não precisa decorar|sem decorar|por experiência/i
    );
  });
});

describe("superfície pública × contribuidor nos componentes", () => {
  const publicFiles = [
    "site/src/pages/home/HomePage/HomePage.tsx",
    "site/src/features/cli-simulator/CliSimulator/CliSimulator.tsx",
    "site/src/features/scenario-catalog/ScenarioChooser/ScenarioChooser.tsx",
    "site/src/features/scenario-player/ScenarioPlayer/ScenarioPlayer.tsx",
    "site/src/features/effect-preview/EffectPreview/EffectPreview.tsx",
    "site/src/features/governance-explainer/GovernanceExplainer/GovernanceExplainer.tsx",
    "site/src/content/scenarios/catalog.ts",
    "site/src/app/App.tsx",
  ];

  it("nenhum arquivo público menciona `npm run flow` (req. 6)", () => {
    for (const file of publicFiles) {
      expect(readSite(file)).not.toContain("npm run flow");
    }
  });

  it("o atalho direto fica recolhido como automação, não caminho obrigatório (req. 5)", () => {
    const simulator = readSite("site/src/features/cli-simulator/CliSimulator/CliSimulator.tsx");
    const simulatorLocale = readSite(
      "site/src/features/cli-simulator/CliSimulator/locales/pt-BR.json"
    );
    expect(simulator).toContain("<details");
    expect(simulatorLocale).toContain("Atalho para automação");
    expect(simulatorLocale).toContain("O caminho principal");
  });

  it("a seção de contribuidor é uma página separada e discreta", () => {
    const contributePage = readSite("site/src/pages/contribute/ContributePage/ContributePage.tsx");
    const siteFooter = readSite("site/src/shared/layout/SiteFooter/SiteFooter.tsx");
    expect(contributePage).toContain("contributorBlock");
    expect(siteFooter).toContain('route="contribute"');
  });
});

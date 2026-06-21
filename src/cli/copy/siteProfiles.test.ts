import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Separação de perfis do site (consumidor × contribuidor) no formato simulador.
 *
 * Contrato:
 *  - a superfície PÚBLICA (consumidor) usa `npx ai-guidelines …` e começa pelo guia;
 *  - identificadores internos (PR/Spec/CO-/sub-checkpoint) não vazam no público;
 *  - a home aponta para experiências do simulador — a pessoa não precisa decorar comandos.
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

  it("a seção de contribuidor expõe o alias local do repositório", () => {
    expect(contributorPart).toContain("flowCommand");
  });
});

describe("home explica o produto; o simulador se divide por experiência (req. 1)", () => {
  const home = readSite("site/src/pages/home/HomePage/HomePage.tsx");
  const homeLocale = readSite("site/src/pages/home/HomePage/locales/pt-BR.json");
  const cli = readSite("site/src/pages/cli/CliPage/CliPage.tsx");
  const cliLocale = readSite("site/src/pages/cli/CliPage/locales/pt-BR.json");

  it("a home apresenta o produto e leva às experiências do simulador, sem montar o terminal", () => {
    expect(home).toContain('route="cliStart"');
    expect(home).toContain('route="cliDaily"');
    expect(home).toContain("BIN_WIZARD");
    // A home não é mais o simulador: não monta o terminal interativo.
    expect(home).not.toContain("CliTerminal");
  });

  it("o /cli oferece duas portas de entrada e as rotas internas montam o terminal", () => {
    expect(cli).toContain("CliTerminal");
    expect(cli).toContain("promptFlows");
    expect(cli).toContain('route="cliStart"');
    expect(cli).toContain('route="cliDaily"');
    expect(cli).toContain("npx ai-guidelines");
    expect(`${homeLocale}\n${cliLocale}`).toMatch(
      /não precisa decorar|sem decorar|comando decorado|sem exigir que você saiba o comando/i
    );
  });
});

describe("superfície pública × contribuidor nos componentes", () => {
  const publicFiles = [
    "site/src/pages/home/HomePage/HomePage.tsx",
    "site/src/pages/cli/CliPage/CliPage.tsx",
    "site/src/pages/reference/ReferencePage/ReferencePage.tsx",
    "site/src/features/cli-simulator/CliTerminal/CliTerminal.tsx",
    "site/src/features/cli-simulator/RealCliRunner/RealCliRunner.tsx",
    "site/src/content/promptFlows.ts",
    "site/src/app/App.tsx",
  ];

  it("arquivos públicos principais existem e são auditáveis", () => {
    for (const file of publicFiles) {
      expect(readSite(file).length).toBeGreaterThan(0);
    }
  });

  it("atalhos diretos ficam em página secundária, não como caminho obrigatório", () => {
    const reference = readSite("site/src/pages/reference/ReferencePage/ReferencePage.tsx");
    const flowData = readSite("site/src/content/flowData.ts");
    expect(reference).toContain("referenceGroups");
    expect(flowData).toContain("Atalhos diretos (avançado)");
    expect(flowData).toContain("O caminho principal é `npx ai-guidelines`");
  });

  it("a seção de contribuidor é uma página separada e discreta", () => {
    const contributePage = readSite("site/src/pages/contribute/ContributePage/ContributePage.tsx");
    const siteFooter = readSite("site/src/shared/layout/SiteFooter/SiteFooter.tsx");
    expect(contributePage).toContain("contributorBlock");
    expect(siteFooter).toContain('route="contribute"');
  });
});

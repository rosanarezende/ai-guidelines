import { readFileSync } from "node:fs";
import path from "node:path";

import { buildRegistry } from "../registry/buildRegistry.js";

/**
 * Separação de perfis do site (consumidor × contribuidor).
 *
 * Contrato:
 *  - a superfície PÚBLICA (consumidor) usa `npx ai-guidelines …`;
 *  - `npm run flow` (alias local deste repo) só aparece na seção de contribuidor;
 *  - identificadores internos (PR/Spec/CO-/sub-checkpoint) não vazam no público;
 *  - os cenários consumidos nas páginas públicas têm `surface: "public"`.
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

function generatedScenarios(): Array<{ id: string; surface: string; command: string }> {
  const source = readSite("site/src/generated/flow-scenarios.generated.ts");
  const match = source.match(/AI_GUIDELINES_FLOW_SCENARIOS = (\[[\s\S]*\]) as const/);
  expect(match).toBeTruthy();
  return JSON.parse((match as RegExpMatchArray)[1]);
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
  const flowData = readSite("site/src/flowData.ts");
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

  it("a superfície pública apresenta o guia interativo como caminho principal", () => {
    expect(publicPart).toContain("publicWizardDemo");
    expect(publicPart).toContain("command: BIN_WIZARD");
    expect(publicPart).toContain("Atalhos diretos públicos");
    expect(publicPart).toContain("O caminho principal é `npx ai-guidelines`");
  });

  it("`npm run flow` vive apenas na seção de contribuidor", () => {
    expect(contributorPart).toContain("npm run flow");
    expect(contributorPart).toContain("flowCommand");
  });
});

describe("App separa consumidor e contribuidor", () => {
  const app = readSite("site/src/App.tsx");

  it("App.tsx não contém o alias `npm run flow`", () => {
    expect(app).not.toContain("npm run flow");
  });

  it("App.tsx diferencia caminho principal de atalhos diretos", () => {
    expect(app).toContain("WizardDemoPanel");
    expect(app).toContain("Caminho principal");
    expect(app).toContain("Atalho direto");
    expect(app).toContain("Para automação ou para quem já sabe exatamente o que quer.");
  });

  it("a seção de contribuidor é uma página separada e discreta", () => {
    expect(app).toContain("ContributePage");
    expect(app).toContain('route="contribute"');
    expect(app).toContain("Uso interno");
  });
});

describe("cenários consumidos no público têm surface public", () => {
  const byId = new Map(generatedScenarios().map((scenario) => [scenario.id, scenario]));

  const publicIds = [
    "new-project",
    "existing-repo",
    "governed-repo",
    "update-providers",
    "daily-work",
    "multi-spec",
    "peer-review",
  ];

  for (const id of publicIds) {
    it(`${id} é público e usa npx ai-guidelines`, () => {
      const scenario = byId.get(id);
      expect(scenario).toBeDefined();
      expect(scenario?.surface).toBe("public");
      expect(scenario?.command.startsWith("npx ai-guidelines")).toBe(true);
    });
  }

  it("o fluxo interno (npm run flow / --help) é surface contributor", () => {
    expect(byId.get("contributor-flow")?.surface).toBe("contributor");
    expect(byId.get("cli-help")?.surface).toBe("contributor");
  });

  it("todo comando público exibido existe no registry real", () => {
    const names = new Set(buildRegistry().commandNames());
    for (const id of publicIds) {
      const command = byId.get(id)?.command ?? "";
      const verb = command.replace(/^npx ai-guidelines\s+/, "").split(" ")[0];
      if (verb && /^[a-z-]+$/.test(verb)) {
        expect(names.has(verb)).toBe(true);
      }
    }
  });
});

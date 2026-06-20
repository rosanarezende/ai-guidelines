import { readFileSync } from "node:fs";
import path from "node:path";

import { buildRegistry } from "../registry/buildRegistry.js";

/**
 * Guard do catálogo de cenários do simulador (Spec 0024 / CO-10.7).
 *
 * O catálogo vive fora do rootDir do tsc (`src`), então auditamos via TEXTO —
 * o array `SCENARIO_CATALOG` é JSON válido e parseável. As asserções operacionalizam
 * a correção SSOT da owner:
 *  - o arquivo gerado é PROJEÇÃO, não fonte de verdade;
 *  - `real` exige que TODA saída do passo seja `transcript:<id>` (sem texto autoral);
 *  - saída `transcript:<id>` NÃO duplica `lines` (o renderer resolve do gerado);
 *  - `lines` só existe em `simulado`/`gap`.
 */

const REPO_ROOT = process.cwd();

interface CatalogOutput {
  readonly source: string;
  readonly lines?: readonly string[];
}
interface CatalogStep {
  readonly id: string;
  readonly prompt: string;
  readonly options?: readonly string[];
  readonly outputs: readonly CatalogOutput[];
  readonly why: string;
}
interface CatalogEffect {
  readonly label: string;
  readonly status: string;
  readonly detail?: string;
}
interface CatalogScenario {
  readonly id: string;
  readonly name: string;
  readonly audience: string;
  readonly provenance: string;
  readonly realAnchors: readonly string[];
  readonly entryCommand: string;
  readonly context: string;
  readonly steps: readonly CatalogStep[];
  readonly effects: readonly CatalogEffect[];
  readonly blocks: readonly string[];
  readonly shortcuts: readonly string[];
  readonly gaps: readonly string[];
}

function readSite(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

function parseCatalog(): readonly CatalogScenario[] {
  const source = readSite("site/src/content/scenarios/catalog.ts");
  const match = source.match(/SCENARIO_CATALOG = (\[[\s\S]*?\]) as const;/);
  expect(match).toBeTruthy();
  return JSON.parse((match as RegExpMatchArray)[1]);
}

function parseGenerated(): Map<string, { surface: string; command: string }> {
  const source = readSite("site/src/generated/flow-scenarios.generated.ts");
  const match = source.match(/AI_GUIDELINES_FLOW_SCENARIOS = (\[[\s\S]*\]) as const;/);
  expect(match).toBeTruthy();
  const list = JSON.parse((match as RegExpMatchArray)[1]) as Array<{
    id: string;
    surface: string;
    command: string;
  }>;
  return new Map(list.map((scenario) => [scenario.id, scenario]));
}

const MANDATORY_IDS = [
  "empty-project",
  "existing-repo",
  "formatter-conflict",
  "governed-solo",
  "governed-team",
  "five-specs",
  "resume-handoff",
  "review-finding",
  "readiness",
  "pr-ready-human-gate",
  "peer-review",
  "offline-degraded",
] as const;

const catalog = parseCatalog();
const byId = new Map(catalog.map((scenario) => [scenario.id, scenario]));
const generated = parseGenerated();

function isTranscript(source: string): boolean {
  return source.startsWith("transcript:");
}

describe("catálogo do simulador — cenários obrigatórios e procedência", () => {
  it("contém exatamente os 12 cenários obrigatórios (req. 3)", () => {
    expect([...byId.keys()].sort()).toEqual([...MANDATORY_IDS].sort());
  });

  it("todo cenário começa pelo guia `npx ai-guidelines` (req. 2)", () => {
    for (const scenario of catalog) {
      expect(scenario.entryCommand).toBe("npx ai-guidelines");
    }
  });

  it("todo cenário declara procedência válida e cada saída declara source (req. 4)", () => {
    for (const scenario of catalog) {
      expect(["real", "simulado", "gap"]).toContain(scenario.provenance);
      for (const step of scenario.steps) {
        for (const output of step.outputs) {
          expect(typeof output.source).toBe("string");
          expect(output.source.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("saída `transcript:<id>` não duplica linhas; o id existe no gerado e é público npx (SSOT 3,6,7)", () => {
    for (const scenario of catalog) {
      for (const step of scenario.steps) {
        for (const output of step.outputs) {
          if (isTranscript(output.source)) {
            // Sem duplicação: o catálogo não copia o transcript.
            expect(output.lines).toBeUndefined();
            const id = output.source.slice("transcript:".length);
            const generatedScenario = generated.get(id);
            expect(generatedScenario).toBeDefined();
            expect(generatedScenario?.surface).toBe("public");
            expect(generatedScenario?.command.startsWith("npx ai-guidelines")).toBe(true);
          } else {
            // Autoral: só `simulado`/`gap`, sempre com linhas próprias.
            expect(["simulado", "gap"]).toContain(output.source);
            expect(Array.isArray(output.lines)).toBe(true);
            expect((output.lines as readonly string[]).length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("`real` só quando TODA saída é transcript e há âncora real; o resto é simulado/gap (regra dura)", () => {
    for (const scenario of catalog) {
      const allTranscript = scenario.steps.every((step) =>
        step.outputs.every((output) => isTranscript(output.source))
      );
      const anyAuthored = scenario.steps.some((step) =>
        step.outputs.some((output) => !isTranscript(output.source))
      );
      if (scenario.provenance === "real") {
        expect(allTranscript).toBe(true);
        expect(anyAuthored).toBe(false);
        expect(scenario.realAnchors.length).toBeGreaterThan(0);
        expect(scenario.gaps.length).toBe(0);
      } else {
        // simulado/gap: tem passo autoral e declara gaps ou nota não-vazia.
        expect(anyAuthored).toBe(true);
        expect(scenario.gaps.length).toBeGreaterThan(0);
      }
      // Toda âncora declarada existe no gerado e é pública.
      for (const anchor of scenario.realAnchors) {
        expect(generated.get(anchor)).toBeDefined();
        expect(generated.get(anchor)?.command.startsWith("npx ai-guidelines")).toBe(true);
      }
    }
  });

  it("classificação conservadora: real = 1–4; restante simulado/gap", () => {
    const real = catalog.filter((s) => s.provenance === "real").map((s) => s.id);
    expect(real.sort()).toEqual(
      ["empty-project", "existing-repo", "formatter-conflict", "governed-solo"].sort()
    );
    expect(byId.get("review-finding")?.provenance).toBe("gap");
  });
});

describe("catálogo — comandos diretos como atalho, providers não é comando (req. 5,7)", () => {
  const registryNames = new Set(buildRegistry().commandNames());

  it("todo verbo público de atalho/entrada existe no registry real", () => {
    for (const scenario of catalog) {
      const commands = [scenario.entryCommand, ...scenario.shortcuts];
      for (const command of commands) {
        const tail = command.replace(/^npx ai-guidelines(?:\s+)?/, "").trim();
        if (!tail) continue;
        const verb = tail.split(" ")[0];
        if (verb && !verb.startsWith("-") && /^[a-z-]+$/.test(verb)) {
          expect(registryNames.has(verb)).toBe(true);
        }
      }
    }
  });

  it("`providers`/`practices`/`collaboration` nunca aparecem como verbo público", () => {
    const corpus = JSON.stringify(catalog);
    for (const verb of ["providers", "practices", "collaboration"]) {
      expect(corpus).not.toMatch(new RegExp(`npx ai-guidelines\\s+${verb}\\b`));
    }
  });

  it("o catálogo público não menciona `npm run flow` (req. 6)", () => {
    expect(readSite("site/src/content/scenarios/catalog.ts")).not.toContain("npm run flow");
  });

  it("o simulador apresenta atalhos diretos como `<details>` recolhido (req. 5)", () => {
    const simulator = readSite("site/src/features/cli-simulator/CliSimulator/CliSimulator.tsx");
    const locale = readSite("site/src/features/cli-simulator/CliSimulator/locales/pt-BR.json");
    expect(simulator).toContain("<details");
    expect(locale).toContain("Atalho para automação");
    expect(locale).toContain("npx ai-guidelines");
  });
});

describe("catálogo — invariantes por cenário (req. 8,9,10,11,12)", () => {
  it("cinco specs exige escolha explícita e bloqueia sem foco (req. 8)", () => {
    const scenario = byId.get("five-specs");
    expect(scenario).toBeDefined();
    expect(scenario?.blocks.length).toBeGreaterThan(0);
    const hasChoice = scenario?.steps.some((step) => step.options && step.options.length > 0);
    expect(hasChoice).toBe(true);
    expect(scenario?.effects.some((effect) => effect.status === "blocked")).toBe(true);
  });

  it("conflito de formatter não aplica sem confirmação (req. 9)", () => {
    const scenario = byId.get("formatter-conflict");
    expect(scenario?.blocks.length).toBeGreaterThan(0);
    expect(scenario?.effects.some((effect) => effect.status === "blocked")).toBe(true);
  });

  it("offline/degradado não libera decisão insegura (req. 10)", () => {
    const scenario = byId.get("offline-degraded");
    const unsafe = scenario?.effects.filter(
      (effect) => effect.status === "forbidden" || effect.status === "blocked"
    );
    expect((unsafe ?? []).length).toBeGreaterThan(0);
  });

  it("review de colega preserva o contexto atual (req. 11)", () => {
    const scenario = byId.get("peer-review");
    expect(JSON.stringify(scenario)).toMatch(/worktree|checkout|preserv/i);
  });

  it("Human Gate é só briefing — o site nunca executa o gate (req. 12)", () => {
    const scenario = byId.get("pr-ready-human-gate");
    const corpus = JSON.stringify(scenario);
    expect(corpus).toMatch(/brief-only/);
    // Não pode haver execução confirmada da decisão pelo site.
    expect(corpus).not.toMatch(/--confirm/);
    expect(scenario?.effects.some((effect) => effect.status === "forbidden")).toBe(true);
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";

import { siteCommandSurface } from "../siteFlowCopy.js";

/**
 * Guards de FIDELIDADE do simulador projetado (/cli).
 *
 * Operacionaliza as regras da owner para o simulador:
 *  - a superfície pública não usa `npm run flow`;
 *  - o /cli começa por `npx ai-guidelines`;
 *  - as operações exibidas existem no registry real (nada inventado);
 *  - a simulação é declarada como tal — nunca apresentada como execução real.
 *
 * O módulo do site vive fora do rootDir do tsc; auditamos via fonte/projeção.
 */

const REPO_ROOT = process.cwd();

function readSite(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

interface GeneratedFlow {
  readonly id: string;
  readonly operation: string;
  readonly command: string;
  readonly steps: readonly { readonly kind: string; readonly message: string }[];
}

function generatedFlows(): readonly GeneratedFlow[] {
  const source = readSite("site/src/generated/flow-prompts.generated.ts");
  const match = source.match(/AI_GUIDELINES_FLOW_PROMPTS = (\{[\s\S]*\}) as const;/);
  if (!match)
    throw new Error("flow-prompts.generated.ts: bloco AI_GUIDELINES_FLOW_PROMPTS ausente");
  return (JSON.parse(match[1]) as { scenarios: readonly GeneratedFlow[] }).scenarios;
}

const PUBLIC_SIM_FILES = [
  "site/src/pages/cli/CliPage/CliPage.tsx",
  "site/src/features/cli-simulator/CliTerminal/CliTerminal.tsx",
  "site/src/content/promptFlows.ts",
];

describe("fidelidade do simulador projetado (/cli)", () => {
  it("nenhum arquivo público do simulador menciona `npm run flow`", () => {
    for (const file of PUBLIC_SIM_FILES) {
      expect(readSite(file)).not.toContain("npm run flow");
    }
  });

  it("todo cenário projetado começa pela porta pública `npx ai-guidelines`", () => {
    const flows = generatedFlows();
    expect(flows.length).toBeGreaterThan(0);
    for (const flow of flows) {
      expect(flow.command).toBe("npx ai-guidelines");
    }
  });

  it("as operações exibidas existem no registry real da CLI (nada inventado)", () => {
    const realCommands = new Set(siteCommandSurface().map((command) => command.name));
    for (const flow of generatedFlows()) {
      expect(realCommands.has(flow.operation)).toBe(true);
    }
  });

  it("o /cli é a porta do simulador e parte de `npx ai-guidelines`", () => {
    const cli = readSite("site/src/pages/cli/CliPage/CliPage.tsx");
    expect(cli).toContain("CliTerminal");
    expect(cli).toContain("npx ai-guidelines");
  });

  it("a simulação é declarada como simulação, nunca como execução real", () => {
    const locale = JSON.parse(
      readSite("site/src/features/cli-simulator/CliTerminal/locales/pt-BR.json")
    ) as Record<string, string>;
    // O modo padrão é explicitamente uma simulação fiel — não execução ao vivo.
    expect(locale.modeProjected).toMatch(/simula/i);
    expect(locale.modeProjected).not.toMatch(/real rodando/i);
    // A saída é declarada como transcript real de dry-run, não efeito ao vivo.
    expect(locale.outcomeBadge).toMatch(/transcript/i);
    // O modo "CLI real no navegador" existe, mas só como enhancement opcional.
    expect(locale.modeReal).toMatch(/real/i);
    expect(locale.runRealNote).toMatch(/opcional|progressiv|WebContainer/i);
  });

  it("o terminal resolve a saída por transcript real, não por texto autoral", () => {
    const terminal = readSite("site/src/features/cli-simulator/CliTerminal/CliTerminal.tsx");
    // A saída vem de flowOutcome → scenarioById(transcriptId), o transcript gerado.
    expect(terminal).toContain("flowOutcome");
    expect(terminal).toContain("TerminalFrame");
  });
});

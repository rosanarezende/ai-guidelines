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
  readonly steps: readonly {
    readonly kind: string;
    readonly message: string;
    readonly requiresSelection?: { readonly stepId: string; readonly includes: string };
  }[];
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
  "site/src/features/cli-simulator/RealCliRunner/RealCliRunner.tsx",
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
      if (flow.operation === "root") {
        expect(flow.command).toBe("npx ai-guidelines");
        continue;
      }
      expect(realCommands.has(flow.operation)).toBe(true);
    }
  });

  it("o /cli é a porta do simulador e parte de `npx ai-guidelines`", () => {
    const cli = readSite("site/src/pages/cli/CliPage/CliPage.tsx");
    expect(cli).toContain("CliTerminal");
    expect(cli).toContain("npx ai-guidelines");
  });

  it("a experiência diária escolhe um cenário antes de montar o simulador", () => {
    const cli = readSite("site/src/pages/cli/CliPage/CliPage.tsx");
    const locale = readSite("site/src/pages/cli/CliPage/locales/pt-BR.json");
    const flows = generatedFlows();

    expect(cli).toContain("DAILY_FLOW");
    expect(cli).toContain('"daily-resume"');
    expect(cli).toContain('"daily-focus"');
    expect(cli).toContain('"daily-peer"');
    expect(cli).toContain("CliTerminal");
    expect(cli).not.toContain("DailyTerminal");
    expect(cli).not.toContain("dailyTerminalOption");
    expect(locale).not.toContain("Repo governado detectado: uma spec ativa em andamento.");
    expect(locale).not.toContain("Repo governado detectado: três specs abertas ao mesmo tempo.");
    expect(locale).not.toContain("Review isolado evita misturar contextos.");
    expect(locale).toContain("Retomar meu trabalho");
    expect(locale).toContain("Escolher a frente certa");
    expect(locale).toContain("Revisar PR de colega");
    expect(flows.map((flow) => flow.id)).toEqual(
      expect.arrayContaining(["daily-resume", "daily-focus", "daily-peer"])
    );
    for (const flow of flows.filter((item) => item.id.startsWith("daily-"))) {
      expect(flow.operation).toBe("root");
      expect(flow.command).toBe("npx ai-guidelines");
      expect(flow.steps.some((step) => step.message === "O que você quer fazer agora?")).toBe(true);
    }
  });

  it("os mini-projetos do simulador alimentam a simulação e o WebContainer", () => {
    const projects = readSite("site/src/content/simulatorProjects.ts");
    const runner = readSite("site/src/features/cli-simulator/RealCliRunner/RealCliRunner.tsx");

    expect(projects).toContain("daily-resume");
    expect(projects).toContain("daily-focus");
    expect(projects).toContain("daily-peer");
    expect(projects).toContain("active_specs:");
    expect(projects).toContain("0024-demo");
    expect(projects).toContain("0025-docs");
    expect(projects).toContain("unsupportedRealModeReason");
    expect(runner).toContain("simulatorProjectById");
    expect(runner).not.toContain("function filesFor");
  });

  it("a simulação é declarada como simulação, nunca como execução real", () => {
    const locale = JSON.parse(
      readSite("site/src/features/cli-simulator/CliTerminal/locales/pt-BR.json")
    ) as Record<string, string>;
    // O modo padrão é explicitamente uma simulação fiel — não execução ao vivo.
    expect(locale.modeProjected).toMatch(/simula/i);
    expect(locale.modeProjected).not.toMatch(/real rodando/i);
    // A saída projetada respeita as escolhas da sessão e não se apresenta como execução ao vivo.
    expect(locale.outcomeBadge).toMatch(/simulad/i);
    // O modo "CLI real no navegador" existe, mas só como enhancement opcional.
    expect(locale.modeReal).toMatch(/real/i);
    expect(locale.runRealNote).toMatch(/opcional|progressiv|WebContainer/i);
  });

  it("o terminal monta preview e saída projetada a partir das respostas da sessão", () => {
    const terminal = readSite("site/src/features/cli-simulator/CliTerminal/CliTerminal.tsx");
    expect(terminal).toContain("buildSimulatedPlan");
    expect(terminal).toContain("answers");
    expect(terminal).toContain("TerminalFrame");
  });

  it("os controles abaixo do terminal mantêm contraste explícito", () => {
    const css = readSite("site/src/features/cli-simulator/CliTerminal/CliTerminal.css");
    expect(css).toContain(".cliGhostButton");
    expect(css).toContain("color: #111827");
    expect(css).toContain("background: #ffffff");
    expect(css).toContain("border: 1px solid #475569");
    expect(css).toContain(".cliRealButton");
    expect(css).toContain("background: #67e8f9");
    expect(css).toContain("color: #052e35");
  });

  it("force-prettier no simulador depende da seleção da feature Prettier", () => {
    const flows = generatedFlows();
    const withForcePrettier = flows
      .filter((flow) => flow.operation !== "update")
      .flatMap((flow) =>
        flow.steps.filter(
          (step) => step.message === "Forçar Prettier mesmo se houver formatter rival?"
        )
      );
    expect(withForcePrettier.length).toBeGreaterThan(0);
    for (const step of withForcePrettier) {
      expect(step.requiresSelection).toEqual(expect.objectContaining({ includes: "prettier" }));
    }
  });

  it("notas do Clack são informativas e não viram botão/prompt de continuar", () => {
    const terminal = readSite("site/src/features/cli-simulator/CliTerminal/CliTerminal.tsx");
    const locale = readSite("site/src/features/cli-simulator/CliTerminal/locales/pt-BR.json");

    expect(terminal).toContain('step.kind !== "note"');
    expect(terminal).not.toContain("copy.continueLabel");
    expect(locale).not.toContain("continueLabel");
  });
});

describe("WebContainer é enhancement opcional, com fallback obrigatório", () => {
  it("o modo real é carregado lazy e nunca bloqueia o simulador projetado", () => {
    const terminal = readSite("site/src/features/cli-simulator/CliTerminal/CliTerminal.tsx");
    // lazy() => o WebContainer/xterm ficam num chunk separado, fora do caminho padrão.
    expect(terminal).toContain("lazy(");
    expect(terminal).toContain("RealCliRunner");
    // o modo real é gateado por capacidade; sem ela, cai no simulador projetado.
    expect(terminal).toContain("crossOriginIsolated");
    expect(terminal).toContain("realModeCapable");
  });

  it("os headers de cross-origin isolation existem para o WebContainer", () => {
    const headers = readSite("site/public/_headers");
    expect(headers).toContain("Cross-Origin-Embedder-Policy: require-corp");
    expect(headers).toContain("Cross-Origin-Opener-Policy: same-origin");
  });

  it("a clientId vem de env (com fallback), e auth.init fica protegido por singleton", () => {
    const runner = readSite("site/src/features/cli-simulator/RealCliRunner/RealCliRunner.tsx");
    expect(runner).toContain("VITE_WEBCONTAINER_CLIENT_ID");
    expect(runner).toContain("auth.init");
    expect(runner).toContain("webContainerAuthPromise");
    expect(runner).toContain("ensureWebContainerAuth");
    expect(runner).toContain("isAlreadyInitializedError");
    expect(runner).toContain("await ensureWebContainerAuth()");
  });

  it("o modo real executa a entrada pública raiz, sem pular para init/adopt/update", () => {
    const runner = readSite("site/src/features/cli-simulator/RealCliRunner/RealCliRunner.tsx");
    expect(runner).toContain("displayCommand");
    expect(runner).toContain("npx ai-guidelines");
    expect(runner).toContain("loadRealCliPackageManifest");
    expect(runner).toContain("/real-cli-package.json");
    expect(runner).toContain("FALLBACK_MANIFEST");
    expect(runner).toContain('"ai-guidelines@latest"');
    expect(runner).toContain("container.spawn(");
    expect(runner).toContain('"npm",');
    expect(runner).toContain('"exec"');
    expect(runner).toContain('"--package"');
    expect(runner).not.toContain("operationFor");
    expect(runner).not.toContain("term.writeln(`$ npx ai-guidelines ${operation}`)");
    expect(runner).not.toContain('"init" | "adopt" | "update"');
  });

  it("preview/local empacotam a branch atual e produção pode usar o pacote publicado", () => {
    const script = readSite("site/scripts/prepare-real-cli-package.mjs");
    const contract = readSite(".core/governance/script-contracts.yml");
    const ignore = readSite(".gitignore");

    expect(script).toContain("AI_GUIDELINES_REAL_CLI_SOURCE");
    expect(script).toContain("CF_PAGES_BRANCH");
    expect(script).toContain("CF_PAGES");
    expect(script).toContain('"latest"');
    expect(script).toContain('"current"');
    expect(script).toContain("npm");
    expect(script).toContain("pack");
    expect(script).toContain("real-cli-package.json");
    expect(script).toContain("ai-guidelines-current-");
    expect(contract).toContain("site:real-package");
    expect(contract).toContain("prepare-real-cli-package.mjs");
    expect(contract).toContain("site:build");
    expect(contract).toContain("npm run site:real-package && vite build");
    expect(ignore).toContain("site/public/packages/");
    expect(ignore).toContain("site/public/real-cli-package.json");
  });
});

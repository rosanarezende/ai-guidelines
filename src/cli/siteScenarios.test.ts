import { readFileSync } from "node:fs";
import path from "node:path";

import { buildSiteScenarios, checkSiteScenarios } from "./siteScenarios.js";

/**
 * Guard dos cenários de terminal do site (fecha B2).
 *
 * Garante que: (1) os transcripts REAIS vêm de execução de verdade (init/adopt/
 * update dry-run); (2) os exemplos GUIADOS são derivados do contrato do comando
 * e marcados como tal; (3) o site renderiza procedência VISÍVEL (badge), não só
 * aria-label; (4) o módulo gerado está em sync com o runtime.
 */

const REPO_ROOT = process.cwd();

function readSite(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

describe("cenários de terminal do site (B2)", () => {
  it("captura transcripts REAIS de init/adopt/update via execução dry-run", async () => {
    const scenarios = await buildSiteScenarios();
    const real = scenarios.filter((scenario) => scenario.kind === "real");
    const ids = real.map((scenario) => scenario.id);
    expect(ids).toEqual(expect.arrayContaining(["new-project", "existing-repo", "governed-repo"]));

    for (const scenario of real) {
      expect(scenario.lines.length).toBeGreaterThan(0);
      expect(typeof scenario.exitCode).toBe("number");
    }

    const initScenario = real.find((scenario) => scenario.id === "new-project");
    expect(initScenario?.exitCode).toBe(0);
    expect(initScenario?.lines.join("\n")).toContain("[dry-run] write CLAUDE.md");
  }, 60000);

  it("não vaza caminhos temporários nos transcripts reais", async () => {
    const scenarios = await buildSiteScenarios();
    for (const scenario of scenarios) {
      for (const line of scenario.lines) {
        expect(line).not.toMatch(/\/tmp\/|aig-scenario-/);
      }
    }
  }, 60000);

  it("exemplos GUIADOS são marcados (guiado público / uso interno) e não-vazios", async () => {
    const scenarios = await buildSiteScenarios();
    const guided = scenarios.filter((scenario) => scenario.kind === "guided");
    expect(guided.length).toBeGreaterThan(0);
    for (const scenario of guided) {
      const note = scenario.note.toLowerCase();
      const marked = note.includes("guiado") || note.includes("interno");
      expect(marked).toBe(true);
      expect(scenario.lines.length).toBeGreaterThan(0);
    }
    // peer-review é guiado (depende de git/gh): nunca apresentado como saída literal.
    expect(guided.some((scenario) => scenario.id === "peer-review")).toBe(true);
  }, 60000);

  it("separa superfícies: público usa npx, contribuidor usa npm run flow", async () => {
    const scenarios = await buildSiteScenarios();
    const publicScenarios = scenarios.filter((scenario) => scenario.surface === "public");
    const contributor = scenarios.filter((scenario) => scenario.surface === "contributor");

    expect(publicScenarios.length).toBeGreaterThan(0);
    for (const scenario of publicScenarios) {
      // Nenhum cenário público usa o alias local `npm run flow`.
      expect(scenario.command).not.toContain("npm run flow");
      for (const line of scenario.lines) {
        expect(line).not.toContain("npm run flow");
      }
    }
    // O alias `npm run flow` só aparece na superfície de contribuidor.
    expect(contributor.some((scenario) => scenario.command.includes("npm run flow"))).toBe(true);
    expect(publicScenarios.some((scenario) => scenario.id === "cli-help")).toBe(true);
  }, 60000);

  it("o módulo gerado está em sync com o runtime", async () => {
    const violations = await checkSiteScenarios(REPO_ROOT);
    expect(violations).toEqual([]);
  }, 60000);

  it("o site mostra procedência VISÍVEL do terminal (não só aria-label)", () => {
    const terminalFrame = readSite("site/src/features/terminal/TerminalFrame/TerminalFrame.tsx");
    const terminalFrameLocale = readSite(
      "site/src/features/terminal/TerminalFrame/locales/pt-BR.json"
    );
    expect(terminalFrame).toContain("terminalBadge");
    expect(terminalFrame).toContain("TERMINAL_BADGE");
    expect(terminalFrameLocale).toContain("Exemplo gerado");
    expect(terminalFrameLocale).toContain("Exemplo guiado");
    expect(terminalFrameLocale).toContain("Exemplo ilustrativo");
    const styles = readSite("site/src/features/terminal/TerminalFrame/TerminalFrame.css");
    expect(styles).toContain(".terminalBadge");
  });
});

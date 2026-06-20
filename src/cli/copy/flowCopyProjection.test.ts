import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { FEATURE_OPTIONS } from "../../domain/provisioning/FeatureCatalog.js";
import { getSupportedProviders } from "../../domain/provisioning/ProviderCatalog.js";
import { FLOW_COPY, featureCopy, providerCopy } from "./flowCopy.js";

const REPO_ROOT = process.cwd();

function readSiteSource(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

function readSiteSources(relativePaths: readonly string[]): string {
  return relativePaths.map((relativePath) => readSiteSource(relativePath)).join("\n");
}

describe("flow copy catalog", () => {
  it("descreve providers e práticas em linguagem humana", () => {
    expect(providerCopy("claude")).toMatchObject({
      label: "Claude",
      hint: "cria CLAUDE.md para sessões com Claude Code",
    });
    expect(providerCopy("openai")).toMatchObject({
      label: "OpenAI/Codex",
      hint: "prepara contexto e comandos para sessões com Codex",
    });
    expect(featureCopy("husky")).toMatchObject({
      label: "Hooks locais com Husky",
      hint: "roda checagens antes do commit",
    });
    expect(featureCopy("ci")).toMatchObject({
      label: "CI no GitHub Actions",
      hint: "valida o PR automaticamente no GitHub",
    });
  });

  it("projeta textos críticos da CLI para o módulo React do Flow", () => {
    const generatedCopy = readSiteSource("site/src/generated/flow-copy.generated.ts");
    const flowData = readSiteSource("site/src/content/flowData.ts");

    expect(generatedCopy).toContain(FLOW_COPY.provisioning.providerGroups.primary);
    expect(generatedCopy).toContain(FLOW_COPY.provisioning.featureGroups.infrastructure);
    expect(flowData).toContain("AI_GUIDELINES_FLOW_COPY");
    for (const provider of getSupportedProviders()) {
      expect(generatedCopy).toContain(providerCopy(provider).htmlHint);
    }
    for (const feature of FEATURE_OPTIONS) {
      expect(generatedCopy).toContain(featureCopy(feature).htmlLabel);
    }
    expect(generatedCopy).toContain(FLOW_COPY.provisioning.flow.prompts.language);
    expect(generatedCopy).toContain(FLOW_COPY.provisioning.flow.language.ptHint);
    expect(generatedCopy).toContain(FLOW_COPY.provisioning.flow.language.enHint);
    expect(generatedCopy).toContain(FLOW_COPY.provisioning.flow.prompts.forcePrettier);
    expect(generatedCopy).toContain(FLOW_COPY.provisioning.flow.prompts.prune);
  });

  it("mantém o simulador como páginas React navegáveis e mobile-first", () => {
    const components = readSiteSources([
      "site/src/features/scenario-player/ScenarioPlayer/ScenarioPlayer.tsx",
      "site/src/features/terminal/ScenarioTerminal/ScenarioTerminal.tsx",
      "site/src/features/terminal/TerminalFrame/TerminalFrame.tsx",
    ]);
    const data = readSiteSource("site/src/content/flowData.ts");
    const styles = readSiteSources([
      "site/src/features/scenario-catalog/ScenarioChooser/ScenarioChooser.css",
      "site/src/features/cli-simulator/CliSimulator/CliSimulator.css",
    ]);

    expect(components).toContain("aria-current");
    expect(components).toContain("ScenarioTerminal");
    expect(components).toContain("terminalBadge");
    // Links do formato anterior continuam resolvendo (sem soft-404).
    expect(data).toContain('startsWith("/flow/")');
    expect(data).toContain('"/atalhos"');
    expect(styles).toContain("@media (min-width:");
    expect(styles).toContain("grid-template-columns: 1fr");
  });

  it("o catálogo cobre os cenários-chave (entrada, time, review entre pares)", () => {
    const catalog = readSiteSource("site/src/content/scenarios/catalog.ts");
    const data = readSiteSource("site/src/content/flowData.ts");

    for (const id of ["empty-project", "existing-repo", "five-specs", "peer-review"]) {
      expect(catalog).toContain(`"id": "${id}"`);
    }
    // Review entre pares preserva contexto: worktree/checkout aparecem no cenário.
    expect(catalog).toContain("worktree");
    expect(catalog).toContain("checkout");
    // Invocações continuam DERIVADAS do registry (B1), validadas por siteCommandSurface.
    expect(data).toContain('binCommand("peer-review"');
  });

  it("remove o Flow HTML legado e não cria catálogo textual paralelo", () => {
    expect(existsSync(path.join(REPO_ROOT, "site/flow/index.html"))).toBe(false);
    expect(existsSync(path.join(REPO_ROOT, "site/flow/assets/flow-site.js"))).toBe(false);
    expect(existsSync(path.join(REPO_ROOT, "site/flow/assets/flow-copy.generated.js"))).toBe(false);
    expect(existsSync(path.join(REPO_ROOT, "src/cli/copy/locales/pt-BR/flowHtml.json"))).toBe(
      false
    );
    expect(existsSync(path.join(REPO_ROOT, "FLOW.html"))).toBe(false);
  });
});

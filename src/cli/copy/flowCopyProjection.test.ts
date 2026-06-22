import { readFileSync } from "node:fs";
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
  it("mantém paridade entre locale, providers suportados e features suportadas", () => {
    expect(Object.keys(FLOW_COPY.providers).sort()).toEqual(getSupportedProviders().sort());
    expect(Object.keys(FLOW_COPY.features).sort()).toEqual([...FEATURE_OPTIONS].sort());

    for (const provider of getSupportedProviders()) {
      expect(providerCopy(provider).label).toBeTruthy();
      expect(providerCopy(provider).hint).toBeTruthy();
      expect(providerCopy(provider).htmlHint).toBeTruthy();
    }
    for (const feature of FEATURE_OPTIONS) {
      expect(featureCopy(feature).label).toBeTruthy();
      expect(featureCopy(feature).hint).toBeTruthy();
      expect(featureCopy(feature).htmlLabel).toBeTruthy();
    }
  });

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

  it("centraliza textos operacionais do Governance Doctor no catálogo de copy", () => {
    expect(FLOW_COPY.governanceDoctor.heading).toBe("Diagnóstico de governança");
    expect(FLOW_COPY.governanceDoctor.labels.safeRepair).toBe("Reparo seguro");
    expect(FLOW_COPY.governanceDoctor.status.ok).toContain("Nenhum drift");
    expect(FLOW_COPY.governancePreflight.heading).toBe("Verificação de governança");
    expect(FLOW_COPY.governancePreflight.commands.diagnose).toContain("npx ai-guidelines drift");
    expect(FLOW_COPY.governancePreflight.status.blocked).toContain("ação é sensível");
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
      "site/src/pages/cli/CliPage/CliPage.tsx",
      "site/src/pages/advanced/AdvancedPage/AdvancedPage.tsx",
      "site/src/features/cli-simulator/CliTerminal/CliTerminal.tsx",
      "site/src/features/cli-simulator/RealCliRunner/RealCliRunner.tsx",
      "site/src/features/terminal/TerminalFrame/TerminalFrame.tsx",
    ]);
    const data = readSiteSource("site/src/content/flowData.ts");
    const styles = readSiteSources([
      "site/src/pages/cli/CliPage/CliPage.css",
      "site/src/features/cli-simulator/CliTerminal/CliTerminal.css",
    ]);

    expect(components).toContain("CliTerminal");
    expect(components).toContain("RealCliRunner");
    expect(components).toContain("terminalBadge");
    expect(data).toContain('"/cli/comecar"');
    expect(data).toContain('"/cli/dia-a-dia"');
    expect(data).toContain('"/cli/avancado"');
    expect(data).toContain('"/atalhos"');
    expect(styles).toContain("@media (min-width:");
    expect(styles).toContain("grid-template-columns: 1fr");
  });

  it("os fluxos projetados cobrem entrada, uso diário e review entre pares", () => {
    const prompts = readSiteSource("site/src/generated/flow-prompts.generated.ts");
    const data = readSiteSource("site/src/content/flowData.ts");

    for (const id of ["empty", "existing", "daily-resume", "daily-focus", "daily-peer"]) {
      expect(prompts).toContain(`"${id}"`);
    }
    // Invocações continuam derivadas do registry (B1), validadas por siteCommandSurface.
    expect(data).toContain('binCommand("peer-review"');
  });
});

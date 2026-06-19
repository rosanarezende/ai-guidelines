import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { FEATURE_OPTIONS } from "../../domain/provisioning/FeatureCatalog.js";
import { getSupportedProviders } from "../../domain/provisioning/ProviderCatalog.js";
import { FLOW_COPY, featureCopy, providerCopy } from "./flowCopy.js";

const REPO_ROOT = process.cwd();

function readSiteSource(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
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
    const flowData = readSiteSource("site/src/flowData.ts");

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

  it("mantém o Flow como páginas React navegáveis e mobile-first", () => {
    const app = readSiteSource("site/src/App.tsx");
    const data = readSiteSource("site/src/flowData.ts");
    const styles = readSiteSource("site/src/styles.css");

    expect(app).toContain("StepNavigator");
    expect(app).toContain("aria-current");
    expect(app).toContain("ScenarioTerminal");
    expect(app).toContain("terminalBadge");
    expect(data).toContain("/flow/comecar");
    expect(data).toContain("/flow/uso-diario");
    expect(data).toContain("/flow/time");
    expect(data).toContain("/flow/review-entre-pares");
    expect(styles).toContain("@media (min-width: 760px)");
    expect(styles).toContain("grid-template-columns");
  });

  it("mantém entrada inicial, uso diário, time e review entre pares como jornadas distintas", () => {
    const data = readSiteSource("site/src/flowData.ts");

    expect(data).toContain("Inicializar um projeto governado");
    expect(data).toContain("Adotar sem apagar o que já existe");
    expect(data).toContain("Operar o dia a dia sem lembrar a sequência de comandos");
    expect(data).toContain("Escolher a frente certa antes de trabalhar");
    expect(data).toContain("Revisar PR de outra pessoa sem perder sua branch");
    // Invocações agora são DERIVADAS do registry (B1): em vez do literal, o site
    // chama flowCommand("peer-review", …). A fidelidade do nome de comando é
    // garantida por siteCommandSurface.test.ts (guard que valida contra o registry).
    expect(data).toContain('flowCommand("peer-review"');
    expect(data).toContain("Worktree separado");
    expect(data).toContain("Checkout guiado");
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

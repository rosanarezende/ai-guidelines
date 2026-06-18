import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { FEATURE_OPTIONS } from "../../domain/provisioning/FeatureCatalog.js";
import { getSupportedProviders } from "../../domain/provisioning/ProviderCatalog.js";
import { FLOW_COPY, featureCopy, providerCopy } from "./flowCopy.js";

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

  it("mantém FLOW.html alinhado aos textos críticos do wizard", () => {
    const html = readFileSync(path.join(process.cwd(), "site/flow/index.html"), "utf-8");
    const generatedCopy = readFileSync(
      path.join(process.cwd(), "site/flow/assets/flow-copy.generated.js"),
      "utf-8"
    );

    expect(html).toContain(FLOW_COPY.provisioning.providerGroups.primary);
    expect(html).toContain(FLOW_COPY.provisioning.featureGroups.infrastructure);
    expect(generatedCopy).toContain(FLOW_COPY.provisioning.providerGroups.primary);
    expect(generatedCopy).toContain(FLOW_COPY.provisioning.featureGroups.infrastructure);
    for (const provider of getSupportedProviders()) {
      expect(html).toContain(providerCopy(provider).htmlHint);
      expect(generatedCopy).toContain(providerCopy(provider).htmlHint);
    }
    for (const feature of FEATURE_OPTIONS) {
      expect(html).toContain(featureCopy(feature).htmlLabel);
      expect(generatedCopy).toContain(featureCopy(feature).htmlLabel);
    }
    expect(html).toContain(FLOW_COPY.provisioning.flow.prompts.language);
    expect(html).toContain(FLOW_COPY.provisioning.flow.language.ptHint);
    expect(html).toContain(FLOW_COPY.provisioning.flow.language.enHint);
    expect(html).toContain(FLOW_COPY.provisioning.flow.prompts.forcePrettier);
    expect(html).toContain('data-copy="provisioning.flow.prompts.prune"');
  });

  it("mantém mini-carrosséis nos painéis demonstrativos densos", () => {
    const html = readFileSync(path.join(process.cwd(), "site/flow/index.html"), "utf-8");
    const siteScript = readFileSync(
      path.join(process.cwd(), "site/flow/assets/flow-site.js"),
      "utf-8"
    );

    expect(html.match(/data-mini-carousel/g)?.length).toBeGreaterThanOrEqual(6);
    expect(html).toContain('data-mini-slide="assistants"');
    expect(html).toContain('data-mini-slide="formatter"');
    expect(html).toContain('data-mini-slide="runtime"');
    expect(html).toContain('data-mini-slide="checks"');
    expect(siteScript).toContain("initMiniCarousels");
    expect(siteScript).toContain("[data-mini-carousel]");
  });

  it("não cria catálogo separado para FLOW.html", () => {
    expect(existsSync(path.join(process.cwd(), "src/cli/copy/locales/pt-BR/flowHtml.json"))).toBe(
      false
    );
    expect(existsSync(path.join(process.cwd(), "FLOW.html"))).toBe(false);
  });
});

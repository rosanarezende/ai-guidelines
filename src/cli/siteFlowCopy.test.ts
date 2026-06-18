import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  checkSiteFlowCopy,
  renderSiteFlowCopyScript,
  siteFlowCopyOutputPath,
  syncSiteFlowCopy,
} from "./siteFlowCopy.js";

describe("site flow copy projection", () => {
  it("gera um módulo estático a partir do catálogo real da CLI", () => {
    const script = renderSiteFlowCopyScript();

    expect(script).toContain("window.AI_GUIDELINES_FLOW_COPY");
    expect(script).toContain("// prettier-ignore");
    expect(script).toContain("Assistentes principais do repositório");
    expect(script).toContain("Infraestrutura do repositório");
    expect(script).toContain("CLAUDE.md para Claude Code");
    expect(script).toContain("GEMINI.md para Gemini");
    expect(script).toContain("Hooks locais com Husky - checagens antes do commit");
    expect(script).toContain("Quality Gates - critérios objetivos para avançar");
    expect(script).toContain("Idioma do baseline e das práticas TDD/BDD");
    expect(script).not.toContain("flowHtml");
  });

  it("sincroniza e checa o arquivo gerado no site", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "flow-site-"));

    syncSiteFlowCopy(repoRoot);

    const generated = readFileSync(siteFlowCopyOutputPath(repoRoot), "utf-8");
    expect(generated).toBe(renderSiteFlowCopyScript());
    expect(checkSiteFlowCopy(repoRoot)).toEqual([]);
  });
});

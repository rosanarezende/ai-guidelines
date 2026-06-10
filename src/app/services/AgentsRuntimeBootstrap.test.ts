import { buildAgentsRuntimeStub, buildRuntimeBootstrapContent } from "./AgentsRuntimeBootstrap.js";

describe("AgentsRuntimeBootstrap", () => {
  it("DADO conteudo sem bloco QUANDO compor bootstrap ENTÃO preserva conteudo humano e adiciona stub", () => {
    const result = buildRuntimeBootstrapContent("# AGENTS.md\n\n## Local\n\nTexto local.\n", {
      sddDir: ".custom",
    });

    expect(result).toContain("## Local");
    expect(result).toContain("<AI_GUIDELINES>");
    expect(result).toContain("Consumer-local ai-guidelines assets live under `.custom/`.");
    expect(result).toContain("</AI_GUIDELINES>");
  });

  it("DADO bloco existente QUANDO compor bootstrap ENTÃO substitui apenas o bloco governado", () => {
    const current = [
      "# AGENTS.md",
      "",
      "Antes",
      "",
      "<AI_GUIDELINES>",
      "",
      "conteudo antigo",
      "",
      "</AI_GUIDELINES>",
      "",
      "Depois",
      "",
    ].join("\n");

    const result = buildRuntimeBootstrapContent(current);

    expect(result).toContain("Antes");
    expect(result).toContain("Depois");
    expect(result).not.toContain("conteudo antigo");
    expect(result).toContain("This file is the AI-channel bootstrap");
  });

  it("DADO stub QUANDO construir ENTÃO nao injeta regras CORE completas", () => {
    const stub = buildAgentsRuntimeStub();

    expect(stub).toContain("Runtime Bootstrap");
    expect(stub).not.toContain("### [CORE-01]");
  });
});

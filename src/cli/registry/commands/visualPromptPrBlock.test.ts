import {
  VISUAL_PROMPT_BLOCK_BEGIN,
  VISUAL_PROMPT_BLOCK_END,
  upsertVisualPromptBlock,
} from "./visualPromptPrBlock.js";

describe("upsertVisualPromptBlock — bloco <details> do prompt visual no body do PR (idempotente)", () => {
  it("DADO body sem o bloco QUANDO upsert ENTÃO anexa o bloco entre marcadores com <details>", () => {
    const out = upsertVisualPromptBlock("Resumo do PR.", "PROMPT-AQUI");
    expect(out).toContain("Resumo do PR.");
    expect(out).toContain(VISUAL_PROMPT_BLOCK_BEGIN);
    expect(out).toContain(VISUAL_PROMPT_BLOCK_END);
    expect(out).toContain("<details>");
    expect(out).toContain("<summary>");
    expect(out).toContain("PROMPT-AQUI");
  });

  it("DADO body que já contém o bloco QUANDO upsert com prompt novo ENTÃO SUBSTITUI no lugar (não duplica)", () => {
    const first = upsertVisualPromptBlock("Resumo.", "PROMPT-V1");
    const second = upsertVisualPromptBlock(first, "PROMPT-V2");
    expect(second).toContain("PROMPT-V2");
    expect(second).not.toContain("PROMPT-V1");
    // um único par de marcadores (sem duplicação)
    expect(second.match(new RegExp(VISUAL_PROMPT_BLOCK_BEGIN, "g"))?.length).toBe(1);
    expect(second.match(new RegExp(VISUAL_PROMPT_BLOCK_END, "g"))?.length).toBe(1);
  });

  it("DADO o mesmo prompt QUANDO upsert duas vezes ENTÃO é idempotente (body estável)", () => {
    const once = upsertVisualPromptBlock("Resumo.", "PROMPT");
    const twice = upsertVisualPromptBlock(once, "PROMPT");
    expect(twice).toBe(once);
  });

  it("DADO prompt com cerca de código interna (```) QUANDO upsert ENTÃO usa cerca externa maior (não quebra)", () => {
    const rendered = "antes\n```yaml\nstage: x\n```\ndepois";
    const out = upsertVisualPromptBlock("Resumo.", rendered);
    expect(out).toContain("````"); // cerca externa de 4 backticks
    expect(out).toContain("```yaml"); // cerca interna preservada
  });

  it("DADO body vazio QUANDO upsert ENTÃO produz só o bloco (e segue idempotente)", () => {
    const once = upsertVisualPromptBlock("", "PROMPT");
    expect(once).toContain(VISUAL_PROMPT_BLOCK_BEGIN);
    expect(upsertVisualPromptBlock(once, "PROMPT")).toBe(once);
  });
});

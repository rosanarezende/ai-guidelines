/**
 * Bloco do prompt visual no body do PR (Spec 0024 — automação do passo manual do
 * wizard no momento "PR pronto para review"). O agente que prepara o PR roda o
 * comando `pr-visual`; o prompt do `value-delivered` (mesmo que o wizard gera) é
 * embutido aqui, dentro de um `<details>`, entre marcadores — para o humano só
 * copiar e colar no gerador de imagem.
 *
 * Mesmo mecanismo de marcador do disclosure (`<!-- fatos-derivados -->`): upsert
 * IDEMPOTENTE — reexecutar substitui o bloco no lugar, nunca duplica.
 */
export const VISUAL_PROMPT_BLOCK_BEGIN = "<!-- visual-prompt:início -->";
export const VISUAL_PROMPT_BLOCK_END = "<!-- visual-prompt:fim -->";

/**
 * Cerca externa com 4 backticks: tolera cercas internas de 3 (` ``` `) que o
 * `collectLocalContext` pode injetar (ex.: blocos ```yaml de spec context),
 * sem quebrar o fence do `<details>`.
 */
function fenced(rendered: string): string {
  return ["````text", rendered.trim(), "````"].join("\n");
}

/** Monta o bloco completo (marcadores + `<details>` + prompt cercado). */
export function buildVisualPromptBlock(rendered: string): string {
  return [
    VISUAL_PROMPT_BLOCK_BEGIN,
    "<details>",
    "<summary>🎨 Prompt para geração de imagem (valor entregue) — copie e cole num gerador (Midjourney, GPT Image, Flux, Ideogram…)</summary>",
    "",
    fenced(rendered),
    "",
    "</details>",
    VISUAL_PROMPT_BLOCK_END,
  ].join("\n");
}

/**
 * Insere ou atualiza o bloco no `body`. Se os marcadores já existem, substitui o
 * conteúdo ENTRE eles (no lugar); senão, anexa ao final separado por linha em
 * branco. Idempotente para o mesmo `rendered`.
 */
export function upsertVisualPromptBlock(body: string, rendered: string): string {
  const block = buildVisualPromptBlock(rendered);
  const begin = body.indexOf(VISUAL_PROMPT_BLOCK_BEGIN);
  const end = body.indexOf(VISUAL_PROMPT_BLOCK_END);

  if (begin !== -1 && end !== -1 && end > begin) {
    const before = body.slice(0, begin);
    const after = body.slice(end + VISUAL_PROMPT_BLOCK_END.length);
    return before + block + after;
  }

  const trimmed = body.replace(/\s+$/, "");
  return trimmed === "" ? `${block}\n` : `${trimmed}\n\n${block}\n`;
}

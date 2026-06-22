/**
 * Catálogo dos prompts visuais disponíveis em `.governance/visual-prompts/`.
 *
 * Extraído de `workflow.ts` na etapa 3 do #35 para ser SSOT compartilhada entre
 * o `VisualPromptCommand` (superfície de execução) e o wizard legado transitório
 * (que ainda referencia este catálogo até a remoção da seção "Operações
 * avançadas"). Editorial, não derivado.
 *
 * - `prompt`: wizard imprime 1 prompt; `targetLabel` descreve onde colar.
 *
 * Todos os fluxos hoje são **two-stage**: o prompt gerado vai para uma IA
 * conversacional com acesso ao repo, que devolve o prompt de imagem JÁ PRONTO
 * para o gerador (Midjourney, DALL-E, etc.). Variáveis `{{nome}}` são
 * substituídas no render com base nos inputs do usuário.
 */
export type VisualPromptMode = "prompt";
export type VisualPromptValue = "architecture" | "pr-intended-vision" | "value-delivered";

export interface VisualPromptOption {
  readonly value: VisualPromptValue;
  readonly label: string;
  readonly mode: VisualPromptMode;
  /** Slug do arquivo `.prompt.md` em `.governance/visual-prompts/`. */
  readonly slug: string;
  readonly needsContext: boolean;
  /** Destino curto exibido no header (ex.: "IA conversacional..."). */
  readonly targetLabel: string;
  /** Linhas de instrução exibidas antes do prompt (numeradas). */
  readonly instructions: ReadonlyArray<string>;
}

export const VISUAL_PROMPT_OPTIONS: ReadonlyArray<VisualPromptOption> = [
  {
    value: "architecture",
    label: "Arquitetura do framework (visão geral do projeto atual)",
    mode: "prompt",
    slug: "architecture-end-to-end",
    needsContext: false,
    targetLabel: "IA conversacional com acesso ao repositório",
    instructions: [
      "1. Abra uma IA conversacional COM ACESSO AO REPO (Claude com tool use,",
      "   ChatGPT com browsing, Antigravity, Cursor com o projeto aberto).",
      "2. Cole o conteúdo do clipboard (Ctrl+V / Cmd+V) — o prompt já foi copiado",
      "   automaticamente. A IA vai investigar a estrutura do repositório atual.",
      "3. A IA devolverá um prompt de imagem JÁ PRONTO — copie esse output e cole",
      "   no seu gerador de imagem (Midjourney, DALL-E, etc.).",
    ],
  },
  {
    value: "pr-intended-vision",
    label: "Visão pretendida de um Draft PR (baseline antes da implementação)",
    mode: "prompt",
    slug: "pr-intended-vision",
    needsContext: true,
    targetLabel: "IA conversacional com acesso ao repositório",
    instructions: [
      "1. Abra uma IA conversacional COM ACESSO AO REPO (Claude com tool use,",
      "   ChatGPT com browsing, Antigravity, Cursor com o projeto aberto).",
      "2. Cole o conteúdo do clipboard (Ctrl+V / Cmd+V) — o prompt já foi copiado",
      "   automaticamente. A IA vai investigar a intenção do Draft PR sem tratar",
      "   a visão pretendida como valor já entregue.",
      "3. A IA devolverá um prompt de imagem JÁ PRONTO — copie esse output e cole",
      "   no seu gerador de imagem (Midjourney, DALL-E, etc.).",
    ],
  },
  {
    value: "value-delivered",
    label: "Valor entregue por um PR ou spec (comparativo antes/depois)",
    mode: "prompt",
    slug: "value-delivered",
    needsContext: true,
    targetLabel: "IA conversacional com acesso ao repositório",
    instructions: [
      "1. Abra uma IA conversacional COM ACESSO AO REPO (Claude com tool use,",
      "   ChatGPT com browsing, Antigravity, Cursor com o projeto aberto).",
      "2. Cole o conteúdo do clipboard (Ctrl+V / Cmd+V) — o prompt já foi copiado",
      "   automaticamente. Se o PR/spec tiver descrição esparsa, complemente com",
      "   o contexto que faltar (a IA não pode adivinhar o que não está nos artifacts).",
      "3. A IA devolverá um prompt de imagem JÁ PRONTO — copie esse output e cole",
      "   no seu gerador de imagem (Midjourney, DALL-E, etc.).",
    ],
  },
];

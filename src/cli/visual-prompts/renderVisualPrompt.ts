import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";

/**
 * Lê o template do prompt visual e substitui variáveis {{context}} e {{localContext}}.
 * Se localContext estiver vazio ou ausente, remove o bloco "PRE-COLLECTED LOCAL CONTEXT"
 * para evitar linhas órfãs ou seções vazias.
 *
 * Retorna null em caso de erro de leitura (fail-graceful).
 */
export function renderVisualPrompt(
  fs: WorkflowFileSystem,
  templateSlug: string,
  vars: { readonly context: string; readonly localContext?: string }
): string | null {
  const path = `.governance/visual-prompts/${templateSlug}.prompt.md`;
  try {
    let raw = fs.readTextFile(path);

    // Substitui {{context}} globalmente
    raw = raw.replace(/\{\{context\}\}/g, vars.context);

    const localCtx = vars.localContext?.trim() ?? "";

    if (localCtx === "") {
      // Se não há contexto local, removemos a seção "PRE-COLLECTED LOCAL CONTEXT" inteira.
      // O bloco no arquivo é:
      // PRE-COLLECTED LOCAL CONTEXT (when available, the CLI wizard injects deterministic data here; treat as authoritative starting point and complement only if needed):
      //
      // {{localContext}}
      const sectionRegex =
        /\n*PRE-COLLECTED LOCAL CONTEXT \([^)]+\):\s*\n*\{\{localContext\}\}\s*\n*/g;
      raw = raw.replace(sectionRegex, "\n\n");
    } else {
      // Se há, substituímos a tag pelo conteúdo
      raw = raw.replace(/\{\{localContext\}\}/g, localCtx);
    }

    return raw;
  } catch {
    return null;
  }
}

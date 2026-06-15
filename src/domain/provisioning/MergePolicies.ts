/**
 * Políticas de merge não-destrutivo dos arquivos baseline do consumidor.
 *
 * Migrado de `cli/fs/merge-utils.mjs` (Spec 0024 · CO-3.5 — colapso integral do
 * runtime CLI). Funções **puras**, sem IO: união conservadora de linhas baseline
 * que preserva o conteúdo pré-existente do consumidor. Paridade comportamental
 * com o legado é coberta por `MergePolicies.test.ts` (mesmos casos do antigo
 * `cli/fs/merge-utils.test.mjs`).
 */

/**
 * União conservadora de linhas: anexa apenas as linhas baseline ausentes,
 * ignorando comentários (`#`) do baseline, sob um cabeçalho atribuído.
 * Não-destrutivo: o conteúdo existente do consumidor é preservado integralmente.
 */
function mergeBaselineLines(
  existingContent: string | null | undefined,
  baselineContent: string,
  header: string
): string {
  if (!existingContent) {
    return baselineContent;
  }

  const requiredLines = baselineContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"));

  const existingLines = new Set(existingContent.split(/\r?\n/).map((line) => line.trim()));
  const missingLines = requiredLines.filter((line) => !existingLines.has(line));

  if (missingLines.length === 0) {
    return existingContent;
  }

  return `${existingContent.trimEnd()}\n\n${header}\n${missingLines.join("\n")}\n`;
}

export function mergeGitattributesContent(
  existingContent: string | null | undefined,
  baselineContent: string
): string {
  return mergeBaselineLines(existingContent, baselineContent, "# ai-guidelines baseline");
}

export function mergePrettierIgnoreContent(
  existingContent: string | null | undefined,
  baselineContent: string
): string {
  return mergeBaselineLines(existingContent, baselineContent, "# ai-guidelines prettier baseline");
}

/**
 * Detecta shapes de hook (shell control-flow, shebang, encadeamento) que o merge
 * conservador NÃO sabe combinar com segurança. Quando presente, o caller deve
 * exigir `--force` em vez de mesclar às cegas.
 */
export function isUnsupportedHookShape(content: string): boolean {
  const unsupportedTokens = [
    "#!",
    "husky.sh",
    "if ",
    " then",
    "fi",
    "for ",
    "while ",
    "case ",
    "$(",
    "&&",
    "||",
    ";",
  ];

  return unsupportedTokens.some((token) => content.includes(token));
}

export function mergeHookContent(
  existingContent: string | null | undefined,
  desiredCommand: string,
  force: boolean,
  hookName: string
): string {
  if (!existingContent || force) {
    return `${desiredCommand}\n`;
  }

  if (existingContent.includes(desiredCommand)) {
    return existingContent.endsWith("\n") ? existingContent : `${existingContent}\n`;
  }

  if (isUnsupportedHookShape(existingContent)) {
    throw new Error(
      `Hook ${hookName} possui shape não suportado para merge conservador. Use --force para sobrescrever.`
    );
  }

  return `${existingContent.trimEnd()}\n${desiredCommand}\n`;
}

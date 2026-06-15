/**
 * Modelo do bloco gerenciado `ai-guidelines:managed-*` injetado nos provider
 * entrypoints do consumidor (AGENTS.md, CLAUDE.md, .claudeignore, …).
 *
 * Migrado de `cli/features/core/managed-block.mjs` (Spec 0024 · CO-3.5 — colapso
 * integral do runtime CLI). Puro, sem IO: recebe o conteúdo atual do arquivo (ou
 * `null`) e o novo bloco, e DERIVA o próximo conteúdo + o estado da operação.
 * `node:path` é usado só para `basename` (string puro, determinístico).
 */
import path from "node:path";

export const MANAGED_BLOCK_VERSION = 1;

export type ManagedBlockSyntax = "markdown" | "hash";

const HASH_SYNTAX_FILES = new Set([".claudeignore", ".aiexclude", ".gptignore", ".aiderignore"]);

const MARKDOWN_LEGACY_NOTE = [
  "<!--",
  "👤 Atenção, mantenedor humano: o conteúdo abaixo já existia neste arquivo",
  "   antes da adoção do ai-guidelines e foi preservado. Revise se ainda faz",
  "   sentido conviver com o bloco gerenciado acima — em geral, conteúdo",
  "   redundante pode ser removido com segurança. Esta nota some quando você",
  "   apagar o conteúdo legado.",
  "-->",
].join("\n");

const HASH_LEGACY_NOTE = [
  "# 👤 Atenção, mantenedor humano: as linhas abaixo já existiam neste arquivo",
  "# antes da adoção do ai-guidelines e foram preservadas. Revise se ainda",
  "# fazem sentido conviver com o bloco gerenciado acima — em geral, entradas",
  "# redundantes podem ser removidas com segurança. Esta nota some quando",
  "# você apagar o conteúdo legado.",
].join("\n");

interface SyntaxDefinition {
  readonly start: (version: number) => string;
  readonly end: string;
  readonly startRegex: RegExp;
  readonly endRegex: RegExp;
  readonly legacyNote: string;
}

const SYNTAXES: Record<ManagedBlockSyntax, SyntaxDefinition> = {
  markdown: {
    start: (version) => `<!-- ai-guidelines:managed-start v=${version} -->`,
    end: "<!-- ai-guidelines:managed-end -->",
    startRegex: /<!--\s*ai-guidelines:managed-start\s+v=(\d+)\s*-->/,
    endRegex: /<!--\s*ai-guidelines:managed-end\s*-->/,
    legacyNote: MARKDOWN_LEGACY_NOTE,
  },
  hash: {
    start: (version) => `# ai-guidelines:managed-start v=${version}`,
    end: "# ai-guidelines:managed-end",
    startRegex: /^[ \t]*#\s*ai-guidelines:managed-start\s+v=(\d+)\s*$/m,
    endRegex: /^[ \t]*#\s*ai-guidelines:managed-end\s*$/m,
    legacyNote: HASH_LEGACY_NOTE,
  },
};

function getSyntax(name: ManagedBlockSyntax): SyntaxDefinition {
  const syntax = SYNTAXES[name];
  if (!syntax) {
    throw new Error(`Unsupported managed-block syntax: ${name}`);
  }
  return syntax;
}

export function inferSyntaxFromPath(relativePath: string): ManagedBlockSyntax {
  const basename = path.basename(relativePath).toLowerCase();
  if (HASH_SYNTAX_FILES.has(basename)) {
    return "hash";
  }
  return "markdown";
}

export function buildManagedBlock(
  innerContent: string,
  syntaxName: ManagedBlockSyntax = "markdown",
  version: number = MANAGED_BLOCK_VERSION
): string {
  const syntax = getSyntax(syntaxName);
  const trimmed = innerContent.replace(/^\n+|\n+$/g, "");
  return [syntax.start(version), trimmed, syntax.end].join("\n");
}

export type ParsedManagedFile =
  | { readonly hasManagedBlock: false }
  | {
      readonly hasManagedBlock: true;
      readonly version: number;
      readonly before: string;
      readonly block: string;
      readonly after: string;
    };

export function parseManagedFile(
  fileContent: string,
  syntaxName: ManagedBlockSyntax = "markdown"
): ParsedManagedFile {
  const syntax = getSyntax(syntaxName);
  const startMatch = fileContent.match(syntax.startRegex);
  const endMatch = fileContent.match(syntax.endRegex);

  if (
    !startMatch ||
    !endMatch ||
    startMatch.index === undefined ||
    endMatch.index === undefined ||
    endMatch.index < startMatch.index
  ) {
    return { hasManagedBlock: false };
  }

  const blockStart = startMatch.index;
  const blockEnd = endMatch.index + endMatch[0].length;

  return {
    hasManagedBlock: true,
    version: Number.parseInt(startMatch[1], 10),
    before: fileContent.slice(0, blockStart),
    block: fileContent.slice(blockStart, blockEnd),
    after: fileContent.slice(blockEnd),
  };
}

function ensureTrailingNewline(text: string): string {
  return text.endsWith("\n") ? text : `${text}\n`;
}

function trimEdgeBlankLines(text: string): string {
  return text.replace(/^\s*\n/, "").replace(/\s+$/, "");
}

export type ManagedBlockState =
  | "unchanged"
  | "created"
  | "block-updated"
  | "legacy-prepended"
  | "legacy-overwritten";

export interface ApplyManagedBlockResult {
  /** Próximo conteúdo do arquivo, ou `null` quando nada muda (`unchanged`). */
  readonly content: string | null;
  readonly state: ManagedBlockState;
  /** Versão anterior do marcador, quando o arquivo já tinha bloco gerenciado. */
  readonly previousVersion?: number;
}

export interface ApplyManagedBlockOptions {
  readonly syntax?: ManagedBlockSyntax;
  readonly force?: boolean;
  readonly version?: number;
}

/**
 * Computa o próximo conteúdo de um arquivo gerenciado dado o conteúdo atual (ou
 * `null` se não existir) e o novo bloco interno. Ver {@link ManagedBlockState}
 * para a semântica de cada estado.
 */
export function applyManagedBlock(
  currentContent: string | null | undefined,
  newInnerContent: string,
  options: ApplyManagedBlockOptions = {}
): ApplyManagedBlockResult {
  const {
    syntax: syntaxName = "markdown",
    force = false,
    version = MANAGED_BLOCK_VERSION,
  } = options;
  const block = buildManagedBlock(newInnerContent, syntaxName, version);

  if (currentContent === null || currentContent === undefined) {
    return { content: ensureTrailingNewline(block), state: "created" };
  }

  const parsed = parseManagedFile(currentContent, syntaxName);

  if (parsed.hasManagedBlock) {
    const next = ensureTrailingNewline(`${parsed.before}${block}${parsed.after}`);
    if (next === currentContent) {
      return { content: null, state: "unchanged" };
    }
    return { content: next, state: "block-updated", previousVersion: parsed.version };
  }

  const legacyTrimmed = trimEdgeBlankLines(currentContent);

  if (!legacyTrimmed) {
    const next = ensureTrailingNewline(block);
    if (next === currentContent) {
      return { content: null, state: "unchanged" };
    }
    return { content: next, state: "created" };
  }

  if (force) {
    const next = ensureTrailingNewline(block);
    if (next === currentContent) {
      return { content: null, state: "unchanged" };
    }
    return { content: next, state: "legacy-overwritten" };
  }

  const syntax = getSyntax(syntaxName);
  const next = ensureTrailingNewline([block, "", syntax.legacyNote, "", legacyTrimmed].join("\n"));
  return { content: next, state: "legacy-prepended" };
}

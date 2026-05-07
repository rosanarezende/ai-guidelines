import path from "node:path";

export const MANAGED_BLOCK_VERSION = 1;

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

const SYNTAXES = {
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

function getSyntax(name) {
  const syntax = SYNTAXES[name];
  if (!syntax) {
    throw new Error(`Unsupported managed-block syntax: ${name}`);
  }
  return syntax;
}

export function inferSyntaxFromPath(relativePath) {
  const basename = path.basename(relativePath).toLowerCase();
  if (HASH_SYNTAX_FILES.has(basename)) {
    return "hash";
  }
  return "markdown";
}

export function buildManagedBlock(
  innerContent,
  syntaxName = "markdown",
  version = MANAGED_BLOCK_VERSION
) {
  const syntax = getSyntax(syntaxName);
  const trimmed = innerContent.replace(/^\n+|\n+$/g, "");
  return [syntax.start(version), trimmed, syntax.end].join("\n");
}

export function parseManagedFile(fileContent, syntaxName = "markdown") {
  const syntax = getSyntax(syntaxName);
  const startMatch = fileContent.match(syntax.startRegex);
  const endMatch = fileContent.match(syntax.endRegex);

  if (!startMatch || !endMatch || endMatch.index < startMatch.index) {
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

function ensureTrailingNewline(text) {
  return text.endsWith("\n") ? text : `${text}\n`;
}

function trimEdgeBlankLines(text) {
  return text.replace(/^\s*\n/, "").replace(/\s+$/, "");
}

/**
 * Compute the next content of a managed file given its current content (or
 * `null` if it does not exist) and the new inner block.
 *
 * Returns an object describing what should be written:
 *   - `state: "unchanged"`        — current content already matches; skip write.
 *   - `state: "created"`          — file did not exist; write fresh managed block.
 *   - `state: "block-updated"`    — file already had markers; only the inner
 *                                   block changed.
 *   - `state: "legacy-prepended"` — file existed without markers; managed block
 *                                   prepended and a human note flags the legacy
 *                                   content kept below.
 *   - `state: "legacy-overwritten"` — `force: true` discarded the legacy content.
 *
 * The `version` propagates as the marker's `v=N`. Callers may detect a stale
 * version on existing files via `parsed.version` and decide to warn.
 */
export function applyManagedBlock(currentContent, newInnerContent, options = {}) {
  const { syntax: syntaxName, force = false, version = MANAGED_BLOCK_VERSION } = options;
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

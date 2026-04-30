export function mergeGitattributesContent(existingContent, baselineContent) {
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

  return `${existingContent.trimEnd()}\n\n# ai-guidelines baseline\n${missingLines.join("\n")}\n`;
}

export function isUnsupportedHookShape(content) {
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

export function mergeHookContent(existingContent, desiredCommand, force, hookName) {
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

export function mergePrettierIgnoreContent(existingContent, baselineContent) {
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

  return `${existingContent.trimEnd()}\n\n# ai-guidelines prettier baseline\n${missingLines.join("\n")}\n`;
}

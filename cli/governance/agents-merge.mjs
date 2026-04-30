const CORE_BEGIN = "<!-- BEGIN:ai-guidelines-core -->";
const CORE_END = "<!-- END:ai-guidelines-core -->";
const AI_GUIDELINES_OPEN = "<AI_GUIDELINES>";
const AI_GUIDELINES_CLOSE = "</AI_GUIDELINES>";

export function extractCoreBlock(content) {
  const start = content.indexOf(CORE_BEGIN);
  const end = content.indexOf(CORE_END);

  if (start === -1 || end === -1) {
    throw new Error("Bloco canônico do AGENTS template não encontrado.");
  }

  return content.slice(start, end + CORE_END.length);
}

export function assertValidAiGuidelinesBlock(content) {
  const opens = findTagLines(content, AI_GUIDELINES_OPEN);
  const closes = findTagLines(content, AI_GUIDELINES_CLOSE);
  const hasOpen = opens.length > 0;
  const hasClose = closes.length > 0;

  if (hasOpen !== hasClose) {
    throw new Error("Bloco <AI_GUIDELINES> malformado em AGENTS.md.");
  }

  if (!hasOpen) {
    return;
  }

  if (opens.length > 1 || closes.length > 1) {
    throw new Error("AGENTS.md possui múltiplos blocos <AI_GUIDELINES>.");
  }

  if (opens[0].index > closes[0].index) {
    throw new Error("Bloco <AI_GUIDELINES> malformado em AGENTS.md.");
  }
}

export function wrapAiGuidelinesBlock(content) {
  return [AI_GUIDELINES_OPEN, content.trim(), AI_GUIDELINES_CLOSE].join("\n\n");
}

export function mergeAgentsContent(existingContent, fullTemplate) {
  const managedBlock = wrapAiGuidelinesBlock(fullTemplate);

  if (!existingContent) {
    return `${managedBlock}\n`;
  }

  assertValidAiGuidelinesBlock(existingContent);

  const existingBlock = findAiGuidelinesBlock(existingContent);
  if (existingBlock) {
    const { start, end } = existingBlock;
    return `${existingContent.slice(0, start)}${managedBlock}${existingContent.slice(end)}`;
  }

  const legacyContent = stripLegacyCoreBlock(existingContent).trimEnd();

  if (!legacyContent) {
    return `${managedBlock}\n`;
  }

  return `${legacyContent}\n\n${managedBlock}\n`;
}

function stripLegacyCoreBlock(content) {
  if (!content.includes(CORE_BEGIN) || !content.includes(CORE_END)) {
    return content;
  }

  const start = content.indexOf(CORE_BEGIN);
  const end = content.indexOf(CORE_END) + CORE_END.length;
  return `${content.slice(0, start)}${content.slice(end)}`;
}

function findAiGuidelinesBlock(content) {
  const opens = findTagLines(content, AI_GUIDELINES_OPEN);
  const closes = findTagLines(content, AI_GUIDELINES_CLOSE);

  if (opens.length === 0 || closes.length === 0) {
    return null;
  }

  return {
    start: opens[0].index,
    end: closes[0].index + closes[0].text.length,
  };
}

function findTagLines(content, tag) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagPattern = new RegExp(`^${escapedTag}[ \\t]*$`, "gm");
  const matches = [];
  let match;

  while ((match = tagPattern.exec(content)) !== null) {
    matches.push({ index: match.index, text: match[0] });
  }

  return matches;
}

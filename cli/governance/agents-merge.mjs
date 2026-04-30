import { stripLegacyCoreBlock } from "./migrations/legacy-core-block.mjs";

const CORE_BEGIN = "<!-- BEGIN:ai-guidelines-core -->";
const CORE_END = "<!-- END:ai-guidelines-core -->";
const AI_GUIDELINES_OPEN = "<AI_GUIDELINES>";
const AI_GUIDELINES_CLOSE = "</AI_GUIDELINES>";

export function assertSafeInitTarget(conflicts, force) {
  if (conflicts.length > 0 && !force) {
    throw new Error(
      `init encontrou arquivos já presentes (${conflicts.join(", ")}). Use --force ou adote o repositório com o comando "adopt".`
    );
  }
}

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

  // Garantir que o arquivo comece com o título correto (fora do bloco governado)
  const ensureHeading = (text) => {
    if (!text || !/^#\s+AGENTS\.md/i.test(text)) {
      return `# AGENTS.md\n\n${(text || "").trimStart()}`;
    }
    return text;
  };

  if (!existingContent) {
    return `${ensureHeading("")}${managedBlock}\n`;
  }

  const contentWithHeading = ensureHeading(existingContent);

  assertValidAiGuidelinesBlock(contentWithHeading);

  const existingBlock = findAiGuidelinesBlock(contentWithHeading);
  if (existingBlock) {
    const { start, end } = existingBlock;
    return `${contentWithHeading.slice(0, start)}${managedBlock}${contentWithHeading.slice(end)}`;
  }

  const legacyContent = stripLegacyCoreBlock(contentWithHeading).trimEnd();

  if (!legacyContent) {
    return `${managedBlock}\n`;
  }

  return `${legacyContent}\n\n${managedBlock}\n`;
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

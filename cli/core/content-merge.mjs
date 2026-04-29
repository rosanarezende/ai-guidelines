const CORE_BEGIN = "<!-- BEGIN:ai-guidelines-core -->";
const CORE_END = "<!-- END:ai-guidelines-core -->";
const SECTION_SEPARATOR = "\n\n---\n\n";

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

export function mergeAgentsContent(existingContent, fullTemplate, force) {
  const coreBlock = extractCoreBlock(fullTemplate);

  if (!existingContent || force) {
    return fullTemplate;
  }

  if (existingContent.includes(CORE_BEGIN) && existingContent.includes(CORE_END)) {
    const start = existingContent.indexOf(CORE_BEGIN);
    const end = existingContent.indexOf(CORE_END) + CORE_END.length;
    return `${existingContent.slice(0, start)}${coreBlock}${existingContent.slice(end)}`;
  }

  return `${existingContent.trimEnd()}\n\n## AI Guidelines Core\n\n${coreBlock}\n`;
}

export function buildFeatureTag(featureName) {
  return `FEATURE_${featureName
    .replace(/\.md$/i, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()}`;
}

export function wrapFeatureModule(featureName, content) {
  const tag = buildFeatureTag(featureName);
  return [`<${tag}>`, content.trim(), `</${tag}>`].join("\n\n");
}

export function normalizePointerForMonolith(pointerTemplate) {
  return pointerTemplate
    .replace(
      /Para ler a Prime Directive[\s\S]*?<!-- END:ai-guidelines-core -->/,
      [
        "O AGENTS.md da raiz atua como ponteiro tático para este baseline compilado.",
        "Mantenha referências específicas do repositório apenas fora do bloco canônico da raiz.",
        "<!-- END:ai-guidelines-core -->",
      ].join("\n")
    )
    .trim();
}

function buildSection(title, parts) {
  const visibleParts = parts.map((part) => part?.trim()).filter(Boolean);

  if (visibleParts.length === 0) {
    return "";
  }

  return [`## ${title}`, ...visibleParts].join("\n\n");
}

export function compileMonolithicAgentsContent({
  coreTemplate,
  globalRules,
  providerRules = [],
  optInRules = [],
  pointerTemplate,
}) {
  const topBuffer = buildSection("Zona Topo: Diretivas Primarias", [
    coreTemplate,
    globalRules,
    ...providerRules.map(({ name, content }) =>
      buildSection(`Regras do Provedor: ${name}`, [content])
    ),
  ]);

  const centerBuffer = buildSection(
    "Zona Centro: Metodologias Opt-in",
    optInRules.map(({ name, content }) => wrapFeatureModule(name, content))
  );

  const baseBuffer = buildSection("Zona Base: Contexto Tatico", [
    normalizePointerForMonolith(pointerTemplate),
  ]);

  return [topBuffer, centerBuffer, baseBuffer].filter(Boolean).join(SECTION_SEPARATOR) + "\n";
}

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

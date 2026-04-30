const SECTION_SEPARATOR = "\n\n---\n\n";

export function buildFeatureTag(featureName) {
  return `FEATURE_${featureName
    .trim()
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
    .replace(/^#\s+AGENTS\.md\s*\n+/, "")
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

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
  // O pointerTemplate agora é "headless" por design.
  // Mantemos apenas o suporte a remover o bloco legado caso ele exista.
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

function buildSection(title, buffers, level = 2) {
  const content = buffers.filter(Boolean).join("\n\n");
  if (!content) return "";
  const hashes = "#".repeat(level);
  return [`${hashes} ${title}`, content].join("\n\n");
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
    ...providerRules.map(({ content }) => content),
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

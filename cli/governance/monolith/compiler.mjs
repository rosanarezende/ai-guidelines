import { promises as fs } from "node:fs";

const SECTION_SEPARATOR = "\n\n---\n\n";

// ============================================================================
// Rules-Driven Compiler (5.B3.5 — new functionality)
// ============================================================================

/**
 * Load rules catalog from rules.json
 * @param {string} rulesJsonPath
 * @returns {Promise<{rules: Array, by_scope: Object, by_feature: Object, generated_at: string, schema_version: string}>}
 */
export async function loadRulesCatalog(rulesJsonPath) {
  const content = await fs.readFile(rulesJsonPath, "utf-8");
  return JSON.parse(content);
}

/**
 * Filter rules by scope and options
 * @param {Array} rules
 * @param {Object} options - { includeAdapters: [...], optInFeatures: [...] }
 * @returns {Object} - { universal: [...], adapters: {...}, optIn: {...} }
 */
export function filterRulesByScope(rules, options = {}) {
  const {
    includeAdapters = ["claude", "codex", "gemini"],
    optInFeatures = [],
    lang = "pt",
  } = options;

  const universal = [];
  const adapters = {};
  const optIn = {};

  for (const rule of rules) {
    if (!rule.scope) continue;

    if (rule.scope === "universal") {
      universal.push(rule);
    } else if (rule.scope === "adapter") {
      if (!rule.adapter || !includeAdapters.includes(rule.adapter)) {
        continue;
      }
      if (!adapters[rule.adapter]) {
        adapters[rule.adapter] = [];
      }
      adapters[rule.adapter].push(rule);
    } else if (rule.scope === "opt-in") {
      if (!rule.opt_in_feature || !optInFeatures.includes(rule.opt_in_feature)) {
        continue;
      }

      if (rule.file) {
        if (lang === "en" && rule.file.endsWith("-pt.md")) continue;
        if (lang === "pt" && rule.file.endsWith("-en.md")) continue;
      }

      if (!optIn[rule.opt_in_feature]) {
        optIn[rule.opt_in_feature] = [];
      }
      optIn[rule.opt_in_feature].push(rule);
    }
  }

  return { universal, adapters, optIn };
}

/**
 * Extract Instruction (en) block from rule
 * @param {Object} rule
 * @returns {string} - Instruction (en) content or empty string
 */
export function extractInstructionEn(rule) {
  if (!rule) return "";

  // Try field instruction_en first
  if (rule.instruction_en && typeof rule.instruction_en === "string") {
    return rule.instruction_en.trim();
  }

  // Try parsing instructions block
  if (rule.instructions && typeof rule.instructions === "string") {
    const match = rule.instructions.match(/```en\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: try instructions field as direct string
  if (rule.instructions) {
    return rule.instructions.trim();
  }

  return "";
}

/**
 * Format a single rule with ID and instruction
 * @param {Object} rule
 * @returns {string}
 */
export function formatRuleInstruction(rule) {
  const instruction = extractInstructionEn(rule);
  if (!instruction) return "";

  // Format: ### [ID] {instruction}
  const title = rule.id ? `### [${rule.id}]` : "### Rule";
  return [title, instruction].filter(Boolean).join("\n\n");
}

/**
 * Group rules by feature and format instructions
 * @param {Object} optInRules - { featureName: [rules...] }
 * @returns {string}
 */
export function formatOptInRules(optInRules) {
  const sections = [];

  for (const [feature, rules] of Object.entries(optInRules)) {
    const featureRules = rules.map(formatRuleInstruction).filter(Boolean).join("\n\n");

    if (featureRules) {
      sections.push(`#### Feature: ${feature}\n\n${featureRules}`);
    }
  }

  return sections.join("\n\n");
}

function hasAnyTag(rule, tags) {
  return tags.some((tag) => Array.isArray(rule.tags) && rule.tags.includes(tag));
}

function classifyUniversalRule(rule) {
  if (!rule) {
    return "primary";
  }

  if (rule.id === "GR-0203") {
    return "git";
  }

  if (
    rule.category === "security" ||
    rule.category === "correctness" ||
    rule.category === "maintainability" ||
    hasAnyTag(rule, ["engineering", "security", "typing", "immutability", "errors", "concurrency"])
  ) {
    return "engineering";
  }

  if (
    hasAnyTag(rule, [
      "git",
      "branch",
      "commit",
      "pr",
      "github",
      "gate",
      "hygiene",
      "safety",
      "harness_lock",
    ])
  ) {
    return "git";
  }

  if (
    hasAnyTag(rule, [
      "sdd",
      "planning",
      "checkpoint",
      "lifecycle",
      "workflow",
      "spec",
      "tokens",
      "ai_efficiency",
    ])
  ) {
    return "lifecycle";
  }

  return "primary";
}

export function groupUniversalRulesByZone(rules) {
  const grouped = {
    primary: [],
    lifecycle: [],
    git: [],
    engineering: [],
  };

  for (const rule of rules) {
    const zone = classifyUniversalRule(rule);
    grouped[zone].push(rule);
  }

  return {
    primaryDirectives: grouped.primary.map(formatRuleInstruction).filter(Boolean).join("\n\n"),
    lifecycleRules: grouped.lifecycle.map(formatRuleInstruction).filter(Boolean).join("\n\n"),
    gitRules: grouped.git.map(formatRuleInstruction).filter(Boolean).join("\n\n"),
    engineeringRules: grouped.engineering.map(formatRuleInstruction).filter(Boolean).join("\n\n"),
  };
}

/**
 * Compile rules from catalog into <AI_GUIDELINES> content
 * @param {Object} catalog - rules.json content
 * @param {Object} options - { includeAdapters, optInFeatures }
 * @returns {string} - Compiled content ready for injection
 */
export function compileRulesContent(catalog, options = {}) {
  if (!catalog || !catalog.rules || !Array.isArray(catalog.rules)) {
    return "";
  }

  const filtered = filterRulesByScope(catalog.rules, options);
  const sections = [];

  // Universal rules
  if (filtered.universal.length > 0) {
    const universalContent = filtered.universal
      .map(formatRuleInstruction)
      .filter(Boolean)
      .join("\n\n");

    if (universalContent) {
      sections.push(["#### Universal Rules", universalContent].join("\n\n"));
    }
  }

  // Adapter rules
  if (Object.keys(filtered.adapters).length > 0) {
    for (const [adapter, rules] of Object.entries(filtered.adapters)) {
      const adapterContent = rules.map(formatRuleInstruction).filter(Boolean).join("\n\n");

      if (adapterContent) {
        sections.push([`#### Adapter: ${adapter}`, adapterContent].join("\n\n"));
      }
    }
  }

  // Opt-in rules
  if (Object.keys(filtered.optIn).length > 0) {
    const optInContent = formatOptInRules(filtered.optIn);
    if (optInContent) {
      sections.push(optInContent);
    }
  }

  return sections.join("\n\n");
}

/**
 * Compile only CORE-tagged universal rules into a content block suitable to
 * replace the static `AGENTS-core.md.tmpl` baseline (5.B3.1.5.5 cutover).
 *
 * Filters: rule.scope === "universal" AND rule.tags includes "core".
 * Output: concatenation of `Instruction (en)` per rule, prefixed by `### [ID]`.
 * Empty string if catalog is missing/invalid or no core rules exist (caller
 * decides fallback).
 *
 * @param {Object} catalog - rules.json content
 * @returns {string}
 */
export function compileCoreRulesContent(catalog) {
  if (!catalog || !Array.isArray(catalog.rules)) return "";

  const coreRules = catalog.rules.filter(
    (rule) =>
      rule && rule.scope === "universal" && Array.isArray(rule.tags) && rule.tags.includes("core")
  );

  if (coreRules.length === 0) return "";

  return coreRules.map(formatRuleInstruction).filter(Boolean).join("\n\n");
}

/**
 * Main entry: compile from rules.json file
 * @param {string} rulesJsonPath - path to rules.json
 * @param {Object} options
 * @returns {Promise<{content: string, errors: string[], success: boolean}>}
 */
export async function compileRulesFromCatalog(rulesJsonPath, options = {}) {
  const errors = [];

  try {
    const catalog = await loadRulesCatalog(rulesJsonPath);

    const compiled = compileRulesContent(catalog, options);

    return {
      content: compiled,
      errors: [],
      success: true,
      rulesCount: catalog.rules ? catalog.rules.length : 0,
      generatedAt: catalog.generated_at,
    };
  } catch (err) {
    errors.push(`[COMPILER_ERROR] Failed to compile rules: ${err.message}`);
    return {
      content: "",
      errors,
      success: false,
    };
  }
}

// ============================================================================
// Template-based Compiler (legacy, preserved for compatibility)
// ============================================================================

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
  primaryDirectives,
  lifecycleRules,
  gitRules,
  engineeringRules,
  coreTemplate,
  globalRules,
  providerRules = [],
  optInRules = [],
  tacticalContext,
  pointerTemplate,
}) {
  if (
    primaryDirectives !== undefined ||
    lifecycleRules !== undefined ||
    gitRules !== undefined ||
    engineeringRules !== undefined ||
    tacticalContext !== undefined
  ) {
    return [
      buildSection("Top Zone: Primary Directives", [
        primaryDirectives,
        buildSection(
          "Provider Adapters",
          providerRules.map(({ content }) => content),
          3
        ),
      ]),
      buildSection("Lifecycle & Spec System", [lifecycleRules]),
      buildSection("Git & PR Workflow", [gitRules]),
      buildSection("Engineering Principles", [engineeringRules]),
      buildSection(
        "Center Zone: Opt-in Methodologies",
        optInRules.map(({ name, content }) => wrapFeatureModule(name, content))
      ),
      buildSection("Base Zone: Tactical Context", [tacticalContext]),
    ]
      .filter(Boolean)
      .join(SECTION_SEPARATOR)
      .concat("\n");
  }

  const topBuffer = buildSection("Top Zone: Primary Directives", [
    coreTemplate,
    globalRules,
    ...providerRules.map(({ content }) => content),
  ]);

  const centerBuffer = buildSection(
    "Center Zone: Opt-in Methodologies",
    optInRules.map(({ name, content }) => wrapFeatureModule(name, content))
  );

  const baseBuffer = buildSection("Base Zone: Tactical Context", [
    normalizePointerForMonolith(pointerTemplate),
  ]);

  return [topBuffer, centerBuffer, baseBuffer].filter(Boolean).join(SECTION_SEPARATOR) + "\n";
}

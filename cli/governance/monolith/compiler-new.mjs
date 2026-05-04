/**
 * Rules Compiler (Rules-Driven)
 * Consumes rules.json from rules-builder.mjs
 * Extracts Instruction (en) blocks para <AI_GUIDELINES> injeção
 * Zero dependências externas.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const SECTION_SEPARATOR = "\n\n---\n\n";

/**
 * Load rules catalog from rules.json
 * @param {string} rulesJsonPath
 * @returns {Promise<{rules: Array, by_id: Object, by_scope: Object, by_feature: Object, generated_at: string, schema_version: string}>}
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
  const { includeAdapters = ["claude", "codex", "gemini"], optInFeatures = [] } = options;

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
      if (
        !rule.opt_in_feature ||
        (optInFeatures.length > 0 && !optInFeatures.includes(rule.opt_in_feature))
      ) {
        continue;
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
 * Rule structure: { id, instructions: "PT-BR\n\n```en\n...\n```\n\nDocumentação..." }
 * or: { id, instruction_en: "...", documentation_pt: "..." }
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

  // Format: [ID] Title\n\n{instruction}
  const title = rule.id ? `### [${rule.id}] ${rule.id}` : "### Rule";
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

  // Universal rules (Zona Topo)
  if (filtered.universal.length > 0) {
    const universalContent = filtered.universal
      .map(formatRuleInstruction)
      .filter(Boolean)
      .join("\n\n");

    if (universalContent) {
      sections.push(["#### Universal Rules", universalContent].join("\n\n"));
    }
  }

  // Adapter rules (Zona Topo - continuação)
  if (Object.keys(filtered.adapters).length > 0) {
    for (const [adapter, rules] of Object.entries(filtered.adapters)) {
      const adapterContent = rules.map(formatRuleInstruction).filter(Boolean).join("\n\n");

      if (adapterContent) {
        sections.push([`#### Adapter: ${adapter}`, adapterContent].join("\n\n"));
      }
    }
  }

  // Opt-in rules (Zona Centro)
  if (Object.keys(filtered.optIn).length > 0) {
    const optInContent = formatOptInRules(filtered.optIn);
    if (optInContent) {
      sections.push(optInContent);
    }
  }

  return sections.join("\n\n");
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

// === Original template-based functions (preserved for compatibility) ===

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

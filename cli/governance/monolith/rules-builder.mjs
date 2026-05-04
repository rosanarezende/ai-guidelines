/**
 * Rules Builder — Catalog Serialization & Ledger Generation
 *
 * Consolidates parser output into structured catalog (rules.json) with 4 indices
 * + generates ledger for core rules. No external dependencies.
 *
 * Usage:
 *   const builder = new RulesBuilder('./.core/rules');
 *   const { catalogJson, ledgerMarkdown, errors } = await builder.build();
 *
 * Or standalone:
 *   node rules-builder.mjs
 */

import { parseRulesFromDirectory } from "#governance/monolith/rules-parser";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Constants
const RULES_OUTPUT_PATH = resolve(".core/rules/rules.json");
const LEDGER_OUTPUT_PATH = resolve(".core/rules/_meta/agents-core-ledger.md");
const LEDGER_DIR = dirname(LEDGER_OUTPUT_PATH);

// Valid values for enum fields
const VALID_SCOPES = new Set(["universal", "adapter", "opt-in"]);
const VALID_CATEGORIES = new Set([
  "correctness",
  "security",
  "maintainability",
  "process",
  "editorial",
]);
const VALID_EVIDENCE_STRENGTHS = new Set(["strong", "medium", "emerging", "declared_heuristic"]);

// Category & Evidence Strength combinations that require `sources` field
const REQUIRES_SOURCES = new Set([
  "correctness:strong",
  "correctness:medium",
  "security:strong",
  "security:medium",
]);

/**
 * Build complete catalog with 4 indices from rules directory
 * @param {string} sourceRulesDir Path to .core/rules/
 * @param {Object} options Filter options
 * @param {string[]} options.tags Filter by tags (include only rules with all tags)
 * @param {string[]} options.scopes Filter by scope
 * @returns {Promise<{catalogJson: Object, ledgerMarkdown: string, errors: string[], success: boolean}>}
 */
export async function buildRulesCatalog(sourceRulesDir, options = {}) {
  const errors = [];

  try {
    // Step 1: Parse all rules from directory
    const { rules: allRules, errors: parseErrors } = await parseRulesFromDirectory(sourceRulesDir);

    if (parseErrors && parseErrors.length > 0) {
      errors.push(...parseErrors);
      return { catalogJson: null, ledgerMarkdown: null, errors, success: false };
    }

    // Step 2: Apply filters if options provided
    let rules = allRules;
    if (options.tags && Array.isArray(options.tags) && options.tags.length > 0) {
      rules = rules.filter((rule) =>
        options.tags.every((tag) => rule.tags && rule.tags.includes(tag))
      );
    }
    if (options.scopes && Array.isArray(options.scopes) && options.scopes.length > 0) {
      rules = rules.filter((rule) => options.scopes.includes(rule.scope));
    }

    // Step 3: Build indices
    const by_id = buildById(rules, errors);
    const by_scope = buildByScope(rules);
    const by_feature = buildByFeature(rules);

    if (errors.length > 0) {
      return { catalogJson: null, ledgerMarkdown: null, errors, success: false };
    }

    // Step 4: Create catalog object
    const catalogJson = {
      rules,
      by_id,
      by_scope,
      by_feature,
      generated_at: new Date().toISOString(),
      schema_version: "1.0",
    };

    // Step 5: Validate catalog integrity
    const validationResult = validateBuildOutput(catalogJson);
    if (!validationResult.valid) {
      errors.push(...validationResult.errors);
      return { catalogJson: null, ledgerMarkdown: null, errors, success: false };
    }

    // Step 6: Generate core agents ledger (optional)
    const coreRules = rules.filter((r) => r.tags && r.tags.includes("core"));
    const ledgerMarkdown = generateCoreAgentsLedger(coreRules);

    return { catalogJson, ledgerMarkdown, errors: [], success: true };
  } catch (err) {
    errors.push(`[BUILDER_ERROR] ${err.message}`);
    return { catalogJson: null, ledgerMarkdown: null, errors, success: false };
  }
}

/**
 * Build by_id index (ID -> Rule)
 * @param {Array} rules
 * @param {Array} errors Accumulator
 * @returns {Object}
 */
function buildById(rules, errors) {
  const by_id = {};
  const seenIds = new Set();

  for (const rule of rules) {
    if (!rule.id) {
      errors.push(`[INDEX_ERROR] Rule missing 'id' field`);
      continue;
    }

    if (seenIds.has(rule.id)) {
      errors.push(`[INDEX_ERROR] Duplicate rule ID: ${rule.id}`);
      continue;
    }

    seenIds.add(rule.id);
    by_id[rule.id] = rule;
  }

  return by_id;
}

/**
 * Build by_scope index (scope -> Array<Rule>)
 * @param {Array} rules
 * @returns {Object}
 */
function buildByScope(rules) {
  const by_scope = {
    universal: [],
    adapter: [],
    "opt-in": [],
  };

  for (const rule of rules) {
    if (VALID_SCOPES.has(rule.scope)) {
      by_scope[rule.scope].push(rule);
    }
  }

  return by_scope;
}

/**
 * Build by_feature index (opt_in_feature -> Array<Rule>)
 * Only includes opt-in rules with valid opt_in_feature field
 * @param {Array} rules
 * @returns {Object}
 */
function buildByFeature(rules) {
  const by_feature = {};

  for (const rule of rules) {
    if (rule.scope === "opt-in" && rule.opt_in_feature) {
      if (!by_feature[rule.opt_in_feature]) {
        by_feature[rule.opt_in_feature] = [];
      }
      by_feature[rule.opt_in_feature].push(rule);
    }
  }

  return by_feature;
}

/**
 * Validate catalog integrity (cross-index consistency)
 * @param {Object} catalog Result from buildRulesCatalog
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateBuildOutput(catalog) {
  const errors = [];

  if (!catalog || typeof catalog !== "object") {
    return { valid: false, errors: ["[VALIDATE_ERROR] Catalog is not an object"] };
  }

  const { rules, by_id, by_scope, by_feature } = catalog;

  // Check 1: rules[] count matches by_id count
  if (!Array.isArray(rules)) {
    errors.push("[VALIDATE_ERROR] Catalog.rules is not an array");
  } else if (!by_id || Object.keys(by_id).length !== rules.length) {
    errors.push(
      `[VALIDATE_ERROR] by_id size (${by_id ? Object.keys(by_id).length : 0}) != rules length (${rules.length})`
    );
  }

  // Check 2: All rules in rules[] are in by_id
  if (Array.isArray(rules) && by_id) {
    for (const rule of rules) {
      if (!by_id[rule.id]) {
        errors.push(`[VALIDATE_ERROR] Rule ID ${rule.id} in rules[] but not in by_id`);
      }
    }
  }

  // Check 3: by_scope entries are valid subsets
  if (by_scope && typeof by_scope === "object") {
    for (const [scope, scopeRules] of Object.entries(by_scope)) {
      if (!Array.isArray(scopeRules)) {
        errors.push(`[VALIDATE_ERROR] by_scope[${scope}] is not an array`);
        continue;
      }
      for (const rule of scopeRules) {
        if (!by_id || !by_id[rule.id]) {
          errors.push(`[VALIDATE_ERROR] Rule ${rule.id} in by_scope[${scope}] but not in by_id`);
        }
      }
    }
  }

  // Check 4: by_feature entries are valid subsets
  if (by_feature && typeof by_feature === "object") {
    for (const [feature, featureRules] of Object.entries(by_feature)) {
      if (!Array.isArray(featureRules)) {
        errors.push(`[VALIDATE_ERROR] by_feature[${feature}] is not an array`);
        continue;
      }
      for (const rule of featureRules) {
        if (!by_id || !by_id[rule.id]) {
          errors.push(
            `[VALIDATE_ERROR] Rule ${rule.id} in by_feature[${feature}] but not in by_id`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generate markdown table for core rules (tags: core)
 * Sorted by ID for stability
 * @param {Array} rules Filtered rules with tags: [core]
 * @returns {string} Markdown table
 */
export function generateCoreAgentsLedger(rules) {
  // Sort by ID
  const sorted = [...rules].sort((a, b) => a.id.localeCompare(b.id));

  // Build header
  let markdown = `# Agents Core Ledger

> Automatically generated ledger of CORE rules (tags: core).
> Generated at: ${new Date().toISOString()}
> **DO NOT EDIT MANUALLY** — regenerate via \`yarn build:rules\`.

## Rules Table

| ID | Scope | Category | Evidence Strength | Adapters | Chars | Lines |
|----|-------|----------|-------------------|----------|-------|-------|
`;

  // Build rows
  for (const rule of sorted) {
    const id = rule.id || "?";
    const scope = rule.scope || "?";
    const category = rule.category || "?";
    const strength = rule.evidence_strength || "?";
    const adapters = rule.adapter ? rule.adapter : "—";
    // Rough estimation: count chars in Instruction (en)
    const chars = rule.instruction_en ? rule.instruction_en.length : 0;
    // Rough estimation: count lines (split by \n)
    const lines = rule.instruction_en ? rule.instruction_en.split("\n").length : 0;

    markdown += `| ${id} | ${scope} | ${category} | ${strength} | ${adapters} | ${chars} | ${lines} |\n`;
  }

  return markdown;
}

/**
 * Serialize catalog to JSON with formatting
 * @param {Object} catalog
 * @returns {string} JSON string (indented, 2 spaces)
 */
function serializeToJson(catalog) {
  // Add a comment header (non-standard JSON, will be stripped if needed)
  return JSON.stringify(catalog, null, 2);
}

/**
 * Save catalog and ledger to disk
 * @param {Object} catalogJson
 * @param {string} ledgerMarkdown
 * @returns {Promise<{success: boolean, errors: string[]}>}
 */
export async function saveCatalogArtifacts(catalogJson, ledgerMarkdown) {
  const errors = [];

  try {
    // Save rules.json
    const jsonContent = serializeToJson(catalogJson);
    writeFileSync(RULES_OUTPUT_PATH, jsonContent, "utf-8");
  } catch (err) {
    errors.push(`[SAVE_ERROR] Failed to write ${RULES_OUTPUT_PATH}: ${err.message}`);
  }

  try {
    // Ensure _meta/ directory exists
    mkdirSync(LEDGER_DIR, { recursive: true });
    // Save ledger markdown
    writeFileSync(LEDGER_OUTPUT_PATH, ledgerMarkdown, "utf-8");
  } catch (err) {
    errors.push(`[SAVE_ERROR] Failed to write ${LEDGER_OUTPUT_PATH}: ${err.message}`);
  }

  return { success: errors.length === 0, errors };
}

// Standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const { catalogJson, ledgerMarkdown, errors, success } =
        await buildRulesCatalog("./.core/rules");

      if (!success) {
        console.error("❌ Build failed:");
        errors.forEach((err) => console.error(`  - ${err}`));
        process.exit(1);
      }

      // Save artifacts
      const saveResult = await saveCatalogArtifacts(catalogJson, ledgerMarkdown);
      if (!saveResult.success) {
        console.error("❌ Save failed:");
        saveResult.errors.forEach((err) => console.error(`  - ${err}`));
        process.exit(1);
      }

      console.log("✅ rules.json built successfully");
      console.log(`   - ${catalogJson.rules.length} rules indexed`);
      console.log(`   - by_id: ${Object.keys(catalogJson.by_id).length} entries`);
      console.log(`   - by_scope: ${JSON.stringify(Object.keys(catalogJson.by_scope))}`);
      console.log(`   - Ledger: ${LEDGER_OUTPUT_PATH}`);
    } catch (err) {
      console.error(`❌ Unexpected error: ${err.message}`);
      process.exit(1);
    }
  })();
}

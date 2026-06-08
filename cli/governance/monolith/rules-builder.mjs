/**
 * Rules Builder — Catalog Serialization & Ledger Generation
 *
 * Consolidates parser output into structured catalog (rules.json) with 3 indices
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
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { analyzeBudget } from "./token-budget.mjs";

// Defaults — overridable via options.outputDir for tests
const DEFAULT_META_DIR = resolve(".core/rules/_meta");
const RULES_OUTPUT_PATH = resolve(DEFAULT_META_DIR, "rules.json");
const LEDGER_OUTPUT_PATH = resolve(DEFAULT_META_DIR, "agents-core-ledger.md");
const CATALOG_OUTPUT_PATH = resolve(DEFAULT_META_DIR, "..", "catalog.md");
const LEDGER_DIR = DEFAULT_META_DIR;

function resolveArtifactPaths(outputDir) {
  if (!outputDir) {
    return {
      rulesPath: RULES_OUTPUT_PATH,
      ledgerPath: LEDGER_OUTPUT_PATH,
      catalogPath: CATALOG_OUTPUT_PATH,
      dir: LEDGER_DIR,
    };
  }
  const dir = resolve(outputDir);
  return {
    rulesPath: resolve(dir, "rules.json"),
    ledgerPath: resolve(dir, "agents-core-ledger.md"),
    catalogPath: resolve(dir, "..", "catalog.md"),
    dir,
  };
}

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
  let oldGeneratedAt = null;
  const { rulesPath } = resolveArtifactPaths(options.outputDir);

  // Attempt to read existing catalog to preserve generated_at (deterministic build).
  if (existsSync(rulesPath)) {
    try {
      const oldContent = readFileSync(rulesPath, "utf-8");
      const oldCatalog = JSON.parse(oldContent);
      if (oldCatalog.generated_at) {
        oldGeneratedAt = oldCatalog.generated_at;
      }
    } catch (e) {
      // Ignore if file is invalid, will be overwritten
    }
  }

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
    const by_scope = buildByScope(rules);
    const by_feature = buildByFeature(rules);

    if (errors.length > 0) {
      return { catalogJson: null, ledgerMarkdown: null, errors, success: false };
    }

    // Step 4: Create catalog object
    const catalogJson = {
      rules,
      by_scope,
      by_feature,
      generated_at: oldGeneratedAt || new Date().toISOString(),
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

    // Step 7: Generate human catalog
    const humanCatalogMarkdown = generateCatalogMarkdown(rules, resolve(sourceRulesDir));

    return { catalogJson, ledgerMarkdown, humanCatalogMarkdown, errors: [], success: true };
  } catch (err) {
    errors.push(`[BUILDER_ERROR] ${err.message}`);
    return {
      catalogJson: null,
      ledgerMarkdown: null,
      humanCatalogMarkdown: null,
      errors,
      success: false,
    };
  }
}

/**
 * Generate human-readable catalog markdown
 * @param {Array} rules
 * @param {string} baseDir Base directory for relative paths
 * @returns {string}
 */
export function generateCatalogMarkdown(rules, baseDir) {
  const sorted = [...rules].sort((a, b) => a.id.localeCompare(b.id));

  let markdown = `# Rules Catalog\n\n> Índice navegável gerado automaticamente.\n> **NÃO EDITE ESTE ARQUIVO** — ele é reconstruído via \`yarn build:rules\`.\n\n| ID | Title | Scope | Category | Link |\n|----|-------|-------|----------|------|\n`;

  for (const rule of sorted) {
    const id = rule.id || "?";
    const title = (rule.title || "—").replace(/\|/g, "\\|");
    const scope = rule.scope || "?";
    const category = rule.category || "?";

    let link = "—";
    if (rule.file) {
      const relPath = relative(baseDir, rule.file).replace(/\\/g, "/");
      const anchor = id.toLowerCase().replace(/[^a-z0-9]+/g, "");
      link = `[Ver](${relPath}#${anchor})`;
    }

    markdown += `| **${id}** | ${title} | \`${scope}\` | \`${category}\` | ${link} |\n`;
  }

  return markdown;
}

/**
 * Build by_scope index (scope -> Array<Rule ID>)
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
      by_scope[rule.scope].push(rule.id);
    }
  }

  return by_scope;
}

/**
 * Build by_feature index (opt_in_feature -> Array<Rule ID>)
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
      by_feature[rule.opt_in_feature].push(rule.id);
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

  const { rules, by_scope, by_feature } = catalog;

  // Check 1: rules[] is an array
  if (!Array.isArray(rules)) {
    errors.push("[VALIDATE_ERROR] Catalog.rules is not an array");
    return { valid: false, errors };
  }

  // Build ID set from rules[] for cross-index validation
  const ruleIds = new Set(rules.map((r) => r.id));

  // Check 2: no duplicate IDs in rules[]
  if (ruleIds.size !== rules.length) {
    errors.push(
      `[VALIDATE_ERROR] Duplicate IDs in rules[] (${rules.length} rules, ${ruleIds.size} unique IDs)`
    );
  }

  // Check 3: by_scope entries reference valid rule IDs
  if (by_scope && typeof by_scope === "object") {
    for (const [scope, scopeIds] of Object.entries(by_scope)) {
      if (!Array.isArray(scopeIds)) {
        errors.push(`[VALIDATE_ERROR] by_scope[${scope}] is not an array`);
        continue;
      }
      for (const id of scopeIds) {
        if (!ruleIds.has(id)) {
          errors.push(`[VALIDATE_ERROR] Rule ID ${id} in by_scope[${scope}] but not in rules[]`);
        }
      }
    }
  }

  // Check 4: by_feature entries reference valid rule IDs
  if (by_feature && typeof by_feature === "object") {
    for (const [feature, featureIds] of Object.entries(by_feature)) {
      if (!Array.isArray(featureIds)) {
        errors.push(`[VALIDATE_ERROR] by_feature[${feature}] is not an array`);
        continue;
      }
      for (const id of featureIds) {
        if (!ruleIds.has(id)) {
          errors.push(
            `[VALIDATE_ERROR] Rule ID ${id} in by_feature[${feature}] but not in rules[]`
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
  // Filter to core-tagged rules only (defensive: caller may pass full rules[])
  const coreOnly = rules.filter((r) => Array.isArray(r.tags) && r.tags.includes("core"));

  // Sort by ID (stable string compare)
  const sorted = [...coreOnly].sort((a, b) => a.id.localeCompare(b.id));

  // Header is timestamp-free for determinism (no churn on rebuild)
  let markdown = `# Agents Core Ledger

> Automatically generated ledger of CORE rules (tags: core).
> **DO NOT EDIT MANUALLY** — regenerate via \`yarn build:rules\`.

## Rules Table

| ID | Title | Category | Evidence Strength | Sources | Chars | Lines |
|----|-------|----------|-------------------|---------|-------|-------|
`;

  for (const rule of sorted) {
    const id = rule.id || "?";
    const title = (rule.title || "—").replace(/\|/g, "\\|");
    const category = rule.category || "?";
    const strength = rule.evidence_strength || "?";
    const sourcesCount = Array.isArray(rule.sources) ? rule.sources.length : 0;
    const chars = rule.instruction_en ? rule.instruction_en.length : 0;
    const lines = rule.instruction_en ? rule.instruction_en.split("\n").length : 0;

    markdown += `| ${id} | ${title} | ${category} | ${strength} | ${sourcesCount} | ${chars} | ${lines} |\n`;
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
 * @param {string} humanCatalogMarkdown
 * @param {Object} options
 * @returns {Promise<{success: boolean, errors: string[]}>}
 */
export async function saveCatalogArtifacts(
  catalogJson,
  ledgerMarkdown,
  humanCatalogMarkdown,
  options = {}
) {
  const errors = [];
  const { rulesPath, ledgerPath, catalogPath, dir } = resolveArtifactPaths(options.outputDir);

  // Ensure target dir exists before any write attempt.
  try {
    mkdirSync(dir, { recursive: true });
  } catch (err) {
    errors.push(`[SAVE_ERROR] Failed to create ${dir}: ${err.message}`);
    return { success: false, errors };
  }

  try {
    // Save rules.json, but only if content changed (avoids HARNESS_LOCK churn)
    const jsonContent = serializeToJson(catalogJson);
    if (existsSync(rulesPath)) {
      const oldContent = readFileSync(rulesPath, "utf-8");
      if (oldContent !== jsonContent) {
        writeFileSync(rulesPath, jsonContent, "utf-8");
      }
    } else {
      writeFileSync(rulesPath, jsonContent, "utf-8");
    }
  } catch (err) {
    errors.push(`[SAVE_ERROR] Failed to write ${rulesPath}: ${err.message}`);
  }

  try {
    // Save ledger only if content changed (deterministic + no churn).
    if (existsSync(ledgerPath)) {
      const oldContent = readFileSync(ledgerPath, "utf-8");
      if (oldContent !== ledgerMarkdown) {
        writeFileSync(ledgerPath, ledgerMarkdown, "utf-8");
      }
    } else {
      writeFileSync(ledgerPath, ledgerMarkdown, "utf-8");
    }
  } catch (err) {
    errors.push(`[SAVE_ERROR] Failed to write ${ledgerPath}: ${err.message}`);
  }

  try {
    if (humanCatalogMarkdown && catalogPath) {
      if (existsSync(catalogPath)) {
        const oldContent = readFileSync(catalogPath, "utf-8");
        if (oldContent !== humanCatalogMarkdown) {
          writeFileSync(catalogPath, humanCatalogMarkdown, "utf-8");
        }
      } else {
        writeFileSync(catalogPath, humanCatalogMarkdown, "utf-8");
      }
    }
  } catch (err) {
    errors.push(`[SAVE_ERROR] Failed to write ${catalogPath}: ${err.message}`);
  }

  // Auto-format generated artifacts to prevent Prettier check failures
  try {
    const prettierTargets = [`"${rulesPath}"`, `"${ledgerPath}"`, `"${catalogPath}"`];
    execSync(`yarn prettier --write ${prettierTargets.join(" ")}`, {
      stdio: "ignore",
    });
  } catch (err) {
    // Non-fatal if prettier fails (e.g., in a test environment without yarn)
  }

  return { success: errors.length === 0, errors };
}

// Standalone execution
const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  (async () => {
    try {
      const { catalogJson, ledgerMarkdown, humanCatalogMarkdown, errors, success } =
        await buildRulesCatalog("./.core/rules");

      if (!success) {
        console.error("❌ Build failed:");
        errors.forEach((err) => console.error(`  - ${err}`));
        process.exit(1);
      }

      // Save artifacts
      const saveResult = await saveCatalogArtifacts(
        catalogJson,
        ledgerMarkdown,
        humanCatalogMarkdown
      );
      if (!saveResult.success) {
        console.error("❌ Save failed:");
        saveResult.errors.forEach((err) => console.error(`  - ${err}`));
        process.exit(1);
      }

      console.log("✅ rules.json built successfully");
      console.log(`   - ${catalogJson.rules.length} rules indexed`);
      console.log(`   - by_scope: ${JSON.stringify(Object.keys(catalogJson.by_scope))}`);
      console.log(`   - Ledger: ${LEDGER_OUTPUT_PATH}`);

      const budget = analyzeBudget(catalogJson);
      if (budget.warnings.length > 0) {
        console.log("\n⚠️ Token Budget Warnings:");
        budget.warnings.forEach((w) => console.log(`   ${w}`));
      }
    } catch (err) {
      console.error(`❌ Unexpected error: ${err.message}`);
      process.exit(1);
    }
  })();
}

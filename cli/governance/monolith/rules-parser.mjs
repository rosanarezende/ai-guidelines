/**
 * Rules Parser (Caseiro)
 * Parse regras YAML em formato #### [ID] Title + bloco ```yaml
 * Subset YAML restrito: strings, arrays inline/multi-linha, comentários
 * Sem dependências externas. Parser estrito (fail-fast).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Enum validations
const VALID_SCOPES = ["universal", "adapter", "opt-in"];
const VALID_CATEGORIES = ["correctness", "security", "maintainability", "process", "editorial"];
const VALID_EVIDENCE_STRENGTHS = ["strong", "medium", "emerging", "declared_heuristic"];
const REQUIRED_FIELDS = [
  "id",
  "scope",
  "category",
  "evidence_strength",
  "sources",
  "applicable_languages",
  "tags",
];
const ADAPTER_VALUES = ["claude", "codex", "gemini"];

/**
 * Parse all rules from a directory recursively.
 * Respects ignore list: _meta/*, catalog.md, *-ledger.md, files starting with _
 */
export async function parseRulesFromDirectory(dirPath, options = {}) {
  const rules = [];
  const errors = [];
  const seenIds = new Set();

  try {
    await walkDirectory(dirPath, async (filePath) => {
      // Check ignore list
      if (shouldIgnoreFile(filePath)) {
        return;
      }

      try {
        const content = await fs.readFile(filePath, "utf-8");
        const fileResult = parseRuleFile(filePath, content);

        // Accumulate results
        for (const rule of fileResult.rules) {
          // Check for duplicate IDs across files
          if (seenIds.has(rule.id)) {
            errors.push(
              `[DUPLICATE_ID] ID "${rule.id}" is duplicated across files. ` +
                `First seen in previous file, now in ${path.relative(dirPath, filePath)}`
            );
          } else {
            seenIds.add(rule.id);
            rules.push(rule);
          }
        }

        // Accumulate file-level errors
        errors.push(...fileResult.errors);
      } catch (err) {
        errors.push(
          `[FILE_READ_ERROR] Failed to read file ${path.relative(dirPath, filePath)}: ${err.message}`
        );
      }
    });
  } catch (err) {
    errors.push(`[DIRECTORY_ERROR] Failed to read directory ${dirPath}: ${err.message}`);
  }

  return { rules, errors };
}

/**
 * Parse rules from a single file content (synchronous).
 * Returns { rules: [], errors: [] }
 */
export function parseRuleFile(filePath, content) {
  const rules = [];
  const errors = [];

  // Find all rule headings: #### [ID] Title (exactly 4 hashes)
  const headingRegex = /^####\s+\[([^\]]+)\]\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const ruleId = match[1];
    const ruleTitle = match[2];
    const headingIndex = match.index;

    // Find the next YAML block (```yaml ... ```)
    const yamlBlockRegex = /```yaml\s*\n([\s\S]*?)```/;
    const afterHeading = content.slice(headingIndex + match[0].length);
    const yamlMatch = yamlBlockRegex.exec(afterHeading);

    if (!yamlMatch) {
      errors.push(
        `[MISSING_YAML_BLOCK] Rule [${ruleId}] in ${path.basename(filePath)}: ` +
          `No \`\`\`yaml block found after heading.`
      );
      continue;
    }

    const yamlContent = yamlMatch[1];

    // Parse the YAML block
    let parsedYaml;
    try {
      parsedYaml = parseYamlSubset(yamlContent);
    } catch (err) {
      errors.push(
        `[YAML_PARSE_ERROR] Rule [${ruleId}] in ${path.basename(filePath)}: ` + `${err.message}`
      );
      continue;
    }

    // Validate the rule
    const validation = validateRule(parsedYaml);
    if (!validation.valid) {
      errors.push(
        `[SCHEMA_VALIDATION_ERROR] Rule [${ruleId}] in ${path.basename(filePath)}: ` +
          validation.errors.join("; ")
      );
      continue;
    }

    // Add to results
    rules.push({
      ...parsedYaml,
      file: filePath,
      title: ruleTitle,
    });
  }

  return { rules, errors };
}

/**
 * Validate a parsed rule against schema.
 * Returns { valid: bool, errors: [] }
 */
export function validateRule(rule) {
  const errors = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in rule)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate scope enum
  if (rule.scope && !VALID_SCOPES.includes(rule.scope)) {
    errors.push(`Invalid scope "${rule.scope}". Allowed: ${VALID_SCOPES.join(", ")}`);
  }

  // Validate category enum
  if (rule.category && !VALID_CATEGORIES.includes(rule.category)) {
    errors.push(`Invalid category "${rule.category}". Allowed: ${VALID_CATEGORIES.join(", ")}`);
  }

  // Validate evidence_strength enum
  if (rule.evidence_strength && !VALID_EVIDENCE_STRENGTHS.includes(rule.evidence_strength)) {
    errors.push(
      `Invalid evidence_strength "${rule.evidence_strength}". ` +
        `Allowed: ${VALID_EVIDENCE_STRENGTHS.join(", ")}`
    );
  }

  // Special validation: correctness/security + strong/medium requires non-empty sources
  if (
    ["correctness", "security"].includes(rule.category) &&
    ["strong", "medium"].includes(rule.evidence_strength)
  ) {
    if (!Array.isArray(rule.sources) || rule.sources.length === 0) {
      errors.push(
        `Category "${rule.category}" with evidence_strength "${rule.evidence_strength}" ` +
          `requires non-empty "sources" field.`
      );
    }
  }

  // Special validation: process/editorial + declared_heuristic can have empty sources
  // (already valid if sources is present, even if empty array)

  // Special validation: scope:opt-in requires opt_in_feature
  if (rule.scope === "opt-in" && !rule.opt_in_feature) {
    errors.push(`Scope "opt-in" requires "opt_in_feature" field.`);
  }

  // Special validation: scope:adapter requires adapter field
  if (rule.scope === "adapter" && !rule.adapter) {
    errors.push(`Scope "adapter" requires "adapter" field.`);
  }

  // Validate adapter value if present
  if (rule.adapter && !ADAPTER_VALUES.includes(rule.adapter)) {
    errors.push(`Invalid adapter "${rule.adapter}". Allowed: ${ADAPTER_VALUES.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Check if a file should be ignored
 */
function shouldIgnoreFile(filePath) {
  const basename = path.basename(filePath);
  const normalized = filePath.replace(/\\/g, "/");

  // Ignore files in _meta/ directory
  if (normalized.includes("/_meta/")) {
    return true;
  }

  // Ignore catalog.md
  if (basename === "catalog.md") {
    return true;
  }

  // Ignore *-ledger.md files
  if (basename.endsWith("-ledger.md")) {
    return true;
  }

  // Ignore files starting with _
  if (basename.startsWith("_")) {
    return true;
  }

  // Only process .md files
  if (!basename.endsWith(".md")) {
    return true;
  }

  return false;
}

/**
 * Recursively walk directory and call callback for each .md file
 */
async function walkDirectory(dirPath, callback) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip certain directories
      if (entry.name !== "node_modules" && entry.name !== ".git") {
        await walkDirectory(fullPath, callback);
      }
    } else if (entry.isFile()) {
      await callback(fullPath);
    }
  }
}

/**
 * Parse YAML subset.
 * Subset: strings, arrays (inline/multi-line), comments
 * Strict parsing: fail fast on indentation issues
 */
function parseYamlSubset(yamlContent) {
  const result = {};
  const lines = yamlContent.split("\n");
  let currentArray = null;
  let currentKey = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.replace(/#.*$/, "").trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Detect indentation level
    const match = line.match(/^( *)/);
    const leadingSpaces = match ? match[1].length : 0;

    // Check for consistent indentation (multiple of 2)
    if (leadingSpaces > 0 && leadingSpaces % 2 !== 0) {
      throw new Error(
        `YAML indentation error at line ${i + 1}: expected 2-space indent, got ${leadingSpaces} spaces`
      );
    }

    const indentLevel = leadingSpaces / 2;

    // Array item: - value
    if (trimmed.startsWith("- ")) {
      if (!currentArray) {
        throw new Error(`Unexpected array item at line ${i + 1}: no array started`);
      }

      const arrayValue = trimmed.slice(2).trim();
      currentArray.push(parseScalar(arrayValue));
    } else if (trimmed.includes(":")) {
      // Key: value pair
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();

      // If we had an array, store it
      if (currentArray) {
        result[currentKey] = currentArray;
        currentArray = null;
        currentKey = null;
      }

      // Parse value
      if (value.startsWith("[") && value.endsWith("]")) {
        // Inline array: [a, b, c]
        const inner = value.slice(1, -1);
        result[key] = inner
          .split(",")
          .map((s) => s.trim())
          .map(parseScalar)
          .filter((v) => v !== null);
      } else if (value === "") {
        // Start of multi-line array
        currentKey = key;
        currentArray = [];
      } else {
        // Scalar value
        result[key] = parseScalar(value);
      }
    } else {
      throw new Error(`Unexpected YAML at line ${i + 1}: "${trimmed}"`);
    }
  }

  // Finalize any pending array
  if (currentArray) {
    result[currentKey] = currentArray;
  }

  return result;
}

/**
 * Parse a scalar YAML value (string or number)
 * Handles quotes and basic types
 */
function parseScalar(value) {
  const trimmed = value.trim();

  // Return null for empty strings (filtered later)
  if (!trimmed) {
    return null;
  }

  // Remove surrounding quotes
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  // Return as-is for unquoted values
  return trimmed;
}

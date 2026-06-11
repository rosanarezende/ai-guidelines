import { Rule, RuleScope, RulesCatalogJson, RULE_SCOPES } from "../../domain/rules/Rule.js";
import { RulesMarkdownSource } from "../ports/RulesMarkdownSource.js";

export interface BuildRulesCatalogOptions {
  readonly tags?: readonly string[];
  readonly scopes?: readonly RuleScope[];
  readonly generatedAt?: string;
  readonly baseDir: string;
}

export interface BuildRulesCatalogResult {
  readonly catalogJson: RulesCatalogJson | null;
  readonly ledgerMarkdown: string | null;
  readonly humanCatalogMarkdown: string | null;
  readonly errors: readonly string[];
  readonly success: boolean;
}

export interface BuildOutputValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export async function buildRulesCatalog(
  source: RulesMarkdownSource,
  options: BuildRulesCatalogOptions
): Promise<BuildRulesCatalogResult> {
  const errors: string[] = [];

  try {
    const parsed = await source.load();
    if (parsed.errors.length > 0) {
      return {
        catalogJson: null,
        ledgerMarkdown: null,
        humanCatalogMarkdown: null,
        errors: parsed.errors,
        success: false,
      };
    }

    let rules = [...parsed.rules];
    if (options.tags && options.tags.length > 0) {
      rules = rules.filter((rule) => options.tags?.every((tag) => rule.tags.includes(tag)));
    }
    if (options.scopes && options.scopes.length > 0) {
      rules = rules.filter((rule) => options.scopes?.includes(rule.scope));
    }

    const catalogJson: RulesCatalogJson = {
      rules,
      by_scope: buildByScope(rules),
      by_feature: buildByFeature(rules),
      generated_at: options.generatedAt ?? new Date().toISOString(),
      schema_version: "1.0",
    };

    const validation = validateBuildOutput(catalogJson);
    if (!validation.valid) {
      return {
        catalogJson: null,
        ledgerMarkdown: null,
        humanCatalogMarkdown: null,
        errors: validation.errors,
        success: false,
      };
    }

    return {
      catalogJson,
      ledgerMarkdown: generateCoreAgentsLedger(rules),
      humanCatalogMarkdown: generateCatalogMarkdown(rules, options.baseDir),
      errors,
      success: true,
    };
  } catch (err) {
    errors.push(`[BUILDER_ERROR] ${(err as Error).message}`);
    return {
      catalogJson: null,
      ledgerMarkdown: null,
      humanCatalogMarkdown: null,
      errors,
      success: false,
    };
  }
}

function buildByScope(rules: ReadonlyArray<Rule>): Record<RuleScope, string[]> {
  const byScope: Record<RuleScope, string[]> = {
    universal: [],
    adapter: [],
    "opt-in": [],
  };

  for (const rule of rules) {
    if (RULE_SCOPES.includes(rule.scope)) {
      byScope[rule.scope].push(rule.id);
    }
  }

  return byScope;
}

function buildByFeature(rules: ReadonlyArray<Rule>): Record<string, string[]> {
  const byFeature: Record<string, string[]> = {};

  for (const rule of rules) {
    if (rule.scope === "opt-in" && rule.opt_in_feature) {
      byFeature[rule.opt_in_feature] ??= [];
      byFeature[rule.opt_in_feature].push(rule.id);
    }
  }

  return byFeature;
}

export function validateBuildOutput(catalog: unknown): BuildOutputValidationResult {
  const errors: string[] = [];

  if (!catalog || typeof catalog !== "object") {
    return { valid: false, errors: ["[VALIDATE_ERROR] Catalog is not an object"] };
  }

  const candidate = catalog as Partial<RulesCatalogJson>;
  const { rules, by_scope: byScope, by_feature: byFeature } = candidate;
  if (!Array.isArray(rules)) {
    return { valid: false, errors: ["[VALIDATE_ERROR] Catalog.rules is not an array"] };
  }

  const ruleIds = new Set(rules.map((rule) => rule.id));
  if (ruleIds.size !== rules.length) {
    errors.push(
      `[VALIDATE_ERROR] Duplicate IDs in rules[] (${rules.length} rules, ${ruleIds.size} unique IDs)`
    );
  }

  if (byScope && typeof byScope === "object") {
    for (const [scope, scopeIds] of Object.entries(byScope)) {
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

  if (byFeature && typeof byFeature === "object") {
    for (const [feature, featureIds] of Object.entries(byFeature)) {
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

export function generateCatalogMarkdown(rules: ReadonlyArray<Rule>, baseDir: string): string {
  const sorted = [...rules].sort((a, b) => a.id.localeCompare(b.id));

  let markdown =
    "# Rules Catalog\n\n" +
    "> Índice navegável gerado automaticamente.\n" +
    "> **NÃO EDITE ESTE ARQUIVO** — ele é reconstruído via `npm run build:rules`.\n\n" +
    "| ID | Title | Scope | Category | Link |\n" +
    "|----|-------|-------|----------|------|\n";

  for (const rule of sorted) {
    const id = rule.id || "?";
    const title = (rule.title || "—").replace(/\|/g, "\\|");
    const scope = rule.scope || "?";
    const category = rule.category || "?";
    const relPath = catalogLinkPath(baseDir, rule.file);
    const anchor = id.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const link = `[Ver](${relPath}#${anchor})`;
    markdown += `| **${id}** | ${title} | \`${scope}\` | \`${category}\` | ${link} |\n`;
  }

  return markdown;
}

export function generateCoreAgentsLedger(rules: ReadonlyArray<Rule>): string {
  const sorted = rules
    .filter((rule) => Array.isArray(rule.tags) && rule.tags.includes("core"))
    .sort((a, b) => a.id.localeCompare(b.id));

  let markdown = `# Agents Core Ledger

> Automatically generated ledger of CORE rules (tags: core).
> **DO NOT EDIT MANUALLY** — regenerate via \`npm run build:rules\`.

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

function relativePath(fromDir: string, filePath: string): string {
  const from = fromDir.split(/[\\/]+/).filter(Boolean);
  const to = filePath.split(/[\\/]+/).filter(Boolean);
  while (from.length > 0 && to.length > 0 && from[0] === to[0]) {
    from.shift();
    to.shift();
  }
  return [...from.map(() => ".."), ...to].join("/") || ".";
}

function catalogLinkPath(baseDir: string, filePath: string): string {
  const normalizedFile = filePath.replace(/\\/g, "/");
  const normalizedBase = baseDir.replace(/\\/g, "/").replace(/\/$/, "");
  if (normalizedFile.startsWith(`${normalizedBase}/`)) {
    return normalizedFile.slice(normalizedBase.length + 1);
  }
  const coreRulesPrefix = ".core/rules/";
  if (normalizedFile.startsWith(coreRulesPrefix)) {
    return normalizedFile.slice(coreRulesPrefix.length);
  }
  return relativePath(baseDir, filePath).replace(/\\/g, "/");
}

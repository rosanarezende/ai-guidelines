import { Rule, RuleAdapter, RulesCatalogJson } from "../../domain/rules/Rule.js";

export const SUPPORTED_RULE_ADAPTERS: readonly RuleAdapter[] = ["claude", "codex", "gemini"];

export interface RuntimeRulesFilter {
  readonly includeAdapters?: readonly string[];
  readonly optInFeatures?: readonly string[];
  readonly lang?: string;
}

export interface FilteredRules {
  readonly universal: readonly Rule[];
  readonly adapters: Readonly<Record<string, readonly Rule[]>>;
  readonly optIn: Readonly<Record<string, readonly Rule[]>>;
}

export function normalizeAdapterSelection(input: unknown): readonly RuleAdapter[] {
  if (!input || input === "all") {
    return SUPPORTED_RULE_ADAPTERS;
  }

  const items = Array.isArray(input) ? input : String(input).split(",");
  const normalized = items
    .map((item) => String(item).trim().toLowerCase().replace(/\.md$/i, ""))
    .filter((item): item is RuleAdapter =>
      (SUPPORTED_RULE_ADAPTERS as readonly string[]).includes(item)
    );

  return [...new Set(normalized)];
}

export function filterRulesByScope(
  rules: readonly Rule[],
  options: RuntimeRulesFilter = {}
): FilteredRules {
  const includeAdapters = new Set(
    normalizeAdapterSelection(options.includeAdapters ?? SUPPORTED_RULE_ADAPTERS)
  );
  const optInFeatures = new Set(options.optInFeatures ?? []);
  const lang = options.lang ?? "pt";
  const universal: Rule[] = [];
  const adapters: Record<string, Rule[]> = {};
  const optIn: Record<string, Rule[]> = {};

  for (const rule of rules) {
    if (rule.scope === "universal") {
      universal.push(rule);
      continue;
    }

    if (rule.scope === "adapter") {
      if (!rule.adapter || !includeAdapters.has(rule.adapter)) continue;
      adapters[rule.adapter] ??= [];
      adapters[rule.adapter].push(rule);
      continue;
    }

    if (rule.scope === "opt-in") {
      if (!rule.opt_in_feature || !optInFeatures.has(rule.opt_in_feature)) continue;
      if (lang === "en" && rule.file.endsWith("-pt.md")) continue;
      if (lang === "pt" && rule.file.endsWith("-en.md")) continue;
      optIn[rule.opt_in_feature] ??= [];
      optIn[rule.opt_in_feature].push(rule);
    }
  }

  return { universal, adapters, optIn };
}

export function formatRuleInstruction(rule: Rule | null | undefined): string {
  if (!rule) return "";
  const instruction = rule.instruction_en?.trim() ?? "";
  if (!instruction) return "";
  return [`### [${rule.id}]`, instruction].join("\n\n");
}

export function compileAdapterRulesByName(
  catalog: RulesCatalogJson,
  options: RuntimeRulesFilter
): Readonly<Record<string, string>> {
  const filtered = filterRulesByScope(catalog.rules, options);
  const byName: Record<string, string> = {};

  for (const [adapter, rules] of Object.entries(filtered.adapters)) {
    const content = rules.map(formatRuleInstruction).filter(Boolean).join("\n\n");
    if (content) {
      byName[adapter] = `### Adapter: ${adapter}\n\n${content}`;
    }
  }

  return byName;
}

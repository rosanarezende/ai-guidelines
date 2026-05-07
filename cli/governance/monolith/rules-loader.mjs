import fs from "node:fs/promises";
import path from "node:path";

const SUPPORTED_ADAPTERS = ["claude", "codex", "gemini"];
const OPT_IN_RULE_RELATIVE_PATHS = {
  bdd: {
    en: path.join("opt-in", "methodologies", "bdd-en.md"),
    pt: path.join("opt-in", "methodologies", "bdd-pt.md"),
  },
  tdd: {
    en: path.join("opt-in", "methodologies", "tdd-en.md"),
    pt: path.join("opt-in", "methodologies", "tdd-pt.md"),
  },
  "quality-gates": {
    default: path.join("opt-in", "quality", "quality-gates.md"),
  },
};

export function getOptInRuleRelativePath(feature, lang = "pt") {
  const rulePath = OPT_IN_RULE_RELATIVE_PATHS[feature];
  if (!rulePath) {
    return null;
  }

  if (feature === "bdd" || feature === "tdd") {
    return rulePath[lang] ?? rulePath.pt;
  }

  return rulePath.default;
}

export function normalizeAdapterSelection(provider) {
  if (!provider || provider === "all") {
    return SUPPORTED_ADAPTERS;
  }

  const providers = Array.isArray(provider) ? provider : String(provider).split(",");
  return providers
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => item.replace(/\.md$/i, ""))
    .filter((item) => SUPPORTED_ADAPTERS.includes(item));
}

export function normalizeProviderSelection(provider) {
  return normalizeAdapterSelection(provider);
}

export async function readRulesByName(sourceRulesDir, fileNames) {
  const rules = [];

  for (const fileName of fileNames) {
    const normalizedName = fileName.replace(/\.md$/i, "");
    const content = await fs.readFile(path.join(sourceRulesDir, `${normalizedName}.md`), "utf8");
    rules.push({ name: normalizedName, content });
  }

  return rules;
}

export async function readOptInRules({ sourceRulesDir, editorialFeatures, features, lang }) {
  const activeEditorialFeatures = editorialFeatures.filter((feature) => features.includes(feature));
  const rules = [];

  for (const feature of activeEditorialFeatures) {
    const relativePath = getOptInRuleRelativePath(feature, lang);
    if (!relativePath) {
      continue;
    }

    const content = await fs.readFile(path.join(sourceRulesDir, relativePath), "utf8");
    rules.push({ name: `${feature}.md`, content });
  }

  return rules;
}

import fs from "node:fs/promises";
import path from "node:path";

const PROVIDER_RULE_FILES = ["claude.md", "codex.md", "gemini.md"];
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

export function normalizeProviderSelection(provider) {
  if (!provider || provider === "all") {
    return PROVIDER_RULE_FILES;
  }

  const providers = Array.isArray(provider) ? provider : String(provider).split(",");
  return providers
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => (item.endsWith(".md") ? item : `${item}.md`))
    .filter((item) => PROVIDER_RULE_FILES.includes(item));
}

export async function readRulesByName(sourceRulesDir, fileNames) {
  const rules = [];

  for (const fileName of fileNames) {
    const content = await fs.readFile(path.join(sourceRulesDir, fileName), "utf8");
    rules.push({ name: fileName.replace(/\.md$/i, ""), content });
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

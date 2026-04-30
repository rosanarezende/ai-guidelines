import fs from "node:fs/promises";
import path from "node:path";

const PROVIDER_RULE_FILES = ["claude.md", "codex.md", "gemini.md"];

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
  const activeEditorialFeatures = editorialFeatures.filter((feature) =>
    features.includes(feature)
  );
  const rules = [];

  for (const feature of activeEditorialFeatures) {
    const sourceName =
      feature === "tdd" || feature === "bdd" ? `${feature}-${lang}.md` : `${feature}.md`;
    const content = await fs.readFile(path.join(sourceRulesDir, "opt-in", sourceName), "utf8");
    rules.push({ name: `${feature}.md`, content });
  }

  return rules;
}

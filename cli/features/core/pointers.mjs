import fs from "node:fs/promises";
import path from "node:path";
import { EDITORIAL_FEATURES } from "#cli/args";
import { ROOT_DIR } from "#fs/file-system";
import { mergeAgentsContent } from "#governance/agents-merge";
import {
  compileCoreRulesContent,
  compileMonolithicAgentsContent,
  loadRulesCatalog,
  filterRulesByScope,
  formatRuleInstruction,
} from "#governance/monolith/compiler";
import {
  normalizeProviderSelection,
  readOptInRules,
  readRulesByName,
} from "#governance/monolith/rules-loader";

/**
 * Aplica o runtime monolítico governado no AGENTS.md da raiz.
 * Esta feature é considerada CORE e mandatória para a governança.
 */
export async function applyPointers(targetDir, options, actions) {
  const dryRun = Boolean(options?.["dry-run"]);
  // Pointers são CORE e mandatórios.

  const rootAgentsPath = path.join(targetDir, "AGENTS.md");

  // Ler conteúdo atual ou criar vazio
  let currentContent = "";
  try {
    currentContent = await fs.readFile(rootAgentsPath, "utf8");
  } catch {
    // Arquivo não existe, tudo bem
  }

  // Mesclar conteúdo para criar/atualizar o runtime governado na raiz
  const pointerTemplatePath = path.join(ROOT_DIR, ".core", "templates", "AGENTS-pointer.md.tmpl");
  const coreTemplatePath = path.join(ROOT_DIR, ".core", "templates", "AGENTS-core.md.tmpl");
  const sourceRulesDir = path.join(ROOT_DIR, ".core", "rules");

  const pointerTemplate = await fs.readFile(pointerTemplatePath, "utf8");

  // 5.B3.1.5.5 cutover: prefer compiled core rules from rules.json catalog;
  // fall back to the legacy static template only if the catalog is missing.
  // No double injection: when the catalog provides core, the .tmpl is ignored.
  const rulesJsonPath = path.join(sourceRulesDir, "_meta", "rules.json");
  let coreBaseline = "";
  let catalog = null;
  try {
    catalog = await loadRulesCatalog(rulesJsonPath);
    coreBaseline = compileCoreRulesContent(catalog);
  } catch {
    // Catalog absent or unreadable; fall back below.
  }
  if (!coreBaseline) {
    coreBaseline = await fs.readFile(coreTemplatePath, "utf8");
  }

  let globalRules = "";
  let providerRules = [];
  let optInRules = [];

  const providerSelection = normalizeProviderSelection(options.provider);
  const features = options.features ?? [];

  if (catalog) {
    const filtered = filterRulesByScope(catalog.rules, {
      includeAdapters: providerSelection,
      optInFeatures: features,
      lang: options.lang ?? "pt",
    });

    const nonCoreUniversal = filtered.universal.filter(
      (rule) => !(Array.isArray(rule.tags) && rule.tags.includes("core"))
    );
    globalRules = nonCoreUniversal.map(formatRuleInstruction).filter(Boolean).join("\n\n");

    for (const [adapter, rules] of Object.entries(filtered.adapters)) {
      const content = rules.map(formatRuleInstruction).filter(Boolean).join("\n\n");
      if (content) {
        providerRules.push({ name: adapter, content: `### Adapter: ${adapter}\n\n${content}` });
      }
    }

    for (const [feature, rules] of Object.entries(filtered.optIn)) {
      const content = rules.map(formatRuleInstruction).filter(Boolean).join("\n\n");
      if (content) {
        optInRules.push({ name: feature, content });
      }
    }
  } else {
    globalRules = await fs.readFile(path.join(sourceRulesDir, "global-rules.md"), "utf8");
    providerRules = await readRulesByName(sourceRulesDir, providerSelection);
    optInRules = await readOptInRules({
      sourceRulesDir,
      editorialFeatures: EDITORIAL_FEATURES,
      features,
      lang: options.lang ?? "pt",
    });
  }

  const monolithicBaseline = compileMonolithicAgentsContent({
    coreTemplate: coreBaseline,
    globalRules,
    providerRules,
    optInRules,
    pointerTemplate,
  });

  // O mergeAgentsContent injeta/substitui apenas o bloco <AI_GUIDELINES>
  // e preserva regras próprias do consumidor fora dele.
  const rootContent = mergeAgentsContent(currentContent, monolithicBaseline);

  // Escrever na raiz (runtime monolítico)
  if (currentContent !== rootContent) {
    if (dryRun) {
      actions.push("[dry-run] write AGENTS.md (ai-guidelines runtime updated)");
      return;
    }

    await fs.writeFile(rootAgentsPath, rootContent);
    actions.push(`write ${path.basename(rootAgentsPath)} (ai-guidelines runtime updated)`);
  }
}

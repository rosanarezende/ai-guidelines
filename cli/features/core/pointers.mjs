import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "#fs/file-system";
import { mergeAgentsContent } from "#governance/agents-merge";
import {
  buildAgentsRuntimeStub,
  loadRulesCatalog,
  filterRulesByScope,
  formatRuleInstruction,
} from "#governance/monolith/compiler";
import { normalizeAdapterSelection, readRulesByName } from "#governance/monolith/rules-loader";
import {
  deriveAdaptersFromProviders,
  resolveAiGuidelinesConfig,
  writeAiGuidelinesConfig,
} from "#features/core/config";
import { syncConsumerTemplates } from "#features/core/templates";
import { syncProviderEntrypoints } from "#features/core/provider-entrypoints";

function buildTacticalContext(sddDir) {
  return [
    "> [!IMPORTANT]",
    "> This project uses the **ai-guidelines** framework for AI governance.",
    "> Operational guidelines and engineering rules are indexed in `.core/rules/**`; `AGENTS.md` is only a short runtime bootstrap.",
    "",
    "### Centralized Governance",
    "",
    "The root `AGENTS.md` is the channel bootstrap. Project-specific content must remain outside of the `<AI_GUIDELINES>` block.",
    "",
    "### Consumer Bootstrap",
    "",
    `Consumer-local ai-guidelines assets live under \`${sddDir}/\`. Templates mirrored by the CLI live in \`${sddDir}/templates/\`. Specs and roadmap remain under \`.specify/specs/\`.`,
  ].join("\n");
}

async function loadCompiledRules(config) {
  const sourceRulesDir = path.join(ROOT_DIR, ".core", "rules");
  const rulesJsonPath = path.join(sourceRulesDir, "_meta", "rules.json");

  let catalog = null;
  try {
    catalog = await loadRulesCatalog(rulesJsonPath);
  } catch {
    // Catalog absent or unreadable; fall back below.
  }

  const adapterSelection = normalizeAdapterSelection(deriveAdaptersFromProviders(config.providers));
  const adapterRulesByName = {};

  if (catalog) {
    const filtered = filterRulesByScope(catalog.rules, {
      includeAdapters: adapterSelection,
      optInFeatures: config.features,
      lang: config.lang,
    });

    for (const [adapter, rules] of Object.entries(filtered.adapters)) {
      const content = rules.map(formatRuleInstruction).filter(Boolean).join("\n\n");
      if (content) {
        adapterRulesByName[adapter] = `### Adapter: ${adapter}\n\n${content}`;
      }
    }
  } else {
    const fallbackAdapters = await readRulesByName(sourceRulesDir, adapterSelection);
    for (const { name, content } of fallbackAdapters) {
      adapterRulesByName[name] = content;
    }
  }

  return {
    adapterRulesByName,
  };
}

/**
 * Aplica o bootstrap runtime governado no AGENTS.md da raiz.
 * Esta feature é considerada CORE e mandatória para a governança.
 */
export async function applyPointers(targetDir, options, actions) {
  const dryRun = Boolean(options?.["dry-run"]);
  const force = Boolean(options?.force);
  const prune = Boolean(options?.prune);

  const rootAgentsPath = path.join(targetDir, "AGENTS.md");
  const config = await resolveAiGuidelinesConfig(targetDir, options);

  await writeAiGuidelinesConfig(targetDir, config, dryRun, actions);

  // Templates SDD operam em modo `mirror` (overwrite total). `--prune` só é
  // propagado a partir de init/adopt/update — nunca via comando providers.
  await syncConsumerTemplates(
    targetDir,
    config,
    { dryRun, prune: prune && options?.mode !== "providers" },
    actions
  );

  const compiled = await loadCompiledRules(config);

  await syncProviderEntrypoints(
    targetDir,
    { ...config, adapterRulesByName: compiled.adapterRulesByName },
    { dryRun, prune, force },
    actions
  );

  // Ler conteúdo atual ou criar vazio
  let currentContent = "";
  try {
    currentContent = await fs.readFile(rootAgentsPath, "utf8");
  } catch {
    // Arquivo não existe, tudo bem
  }

  const monolithicBaseline = buildAgentsRuntimeStub(config.sdd_dir);

  // O mergeAgentsContent injeta/substitui apenas o bloco <AI_GUIDELINES>
  // e preserva regras próprias do consumidor fora dele.
  const rootContent = mergeAgentsContent(currentContent, monolithicBaseline);

  if (currentContent !== rootContent) {
    if (dryRun) {
      actions.push("[dry-run] write AGENTS.md (ai-guidelines runtime updated)");
      return;
    }

    await fs.writeFile(rootAgentsPath, rootContent);
    actions.push(`write ${path.basename(rootAgentsPath)} (ai-guidelines runtime updated)`);
  }
}

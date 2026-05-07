import fs from "node:fs/promises";
import path from "node:path";
import { EDITORIAL_FEATURES } from "#cli/args";
import { ROOT_DIR } from "#fs/file-system";
import { mergeAgentsContent } from "#governance/agents-merge";
import {
  compileMonolithicAgentsContent,
  loadRulesCatalog,
  filterRulesByScope,
  formatRuleInstruction,
  groupUniversalRulesByZone,
} from "#governance/monolith/compiler";
import {
  normalizeAdapterSelection,
  readOptInRules,
  readRulesByName,
} from "#governance/monolith/rules-loader";
import {
  deriveAdaptersFromProviders,
  resolveAiGuidelinesConfig,
  writeAiGuidelinesConfig,
} from "#features/core/config";
import { syncConsumerTemplates } from "#features/core/templates";
import { syncProviderTrampolines } from "#features/core/trampolines";

function buildTacticalContext(sddDir) {
  return [
    "> [!IMPORTANT]",
    "> This project uses the **ai-guidelines** framework for AI governance.",
    "> Operational guidelines and engineering rules are compiled within the `<AI_GUIDELINES>` block in `AGENTS.md`.",
    "",
    "### Centralized Governance",
    "",
    "The root `AGENTS.md` is the runtime artifact. Project-specific content must remain outside of the `<AI_GUIDELINES>` block.",
    "",
    "### Consumer Bootstrap",
    "",
    `Consumer-local ai-guidelines assets live under \`${sddDir}/\`. Templates mirrored by the CLI live in \`${sddDir}/templates/\`. Specs and roadmap remain under \`.specify/specs/\`.`,
  ].join("\n");
}

/**
 * Aplica o runtime monolítico governado no AGENTS.md da raiz.
 * Esta feature é considerada CORE e mandatória para a governança.
 */
export async function applyPointers(targetDir, options, actions) {
  const dryRun = Boolean(options?.["dry-run"]);
  // Pointers são CORE e mandatórios.

  const rootAgentsPath = path.join(targetDir, "AGENTS.md");
  const config = await resolveAiGuidelinesConfig(targetDir, options);

  await writeAiGuidelinesConfig(targetDir, config, dryRun, actions);
  await syncConsumerTemplates(
    targetDir,
    config,
    { dryRun, prune: Boolean(options?.prune) },
    actions
  );
  await syncProviderTrampolines(
    targetDir,
    config,
    {
      dryRun,
      prune: Boolean(options?.prune),
      force: Boolean(options?.force),
    },
    actions
  );

  // Ler conteúdo atual ou criar vazio
  let currentContent = "";
  try {
    currentContent = await fs.readFile(rootAgentsPath, "utf8");
  } catch {
    // Arquivo não existe, tudo bem
  }

  // Mesclar conteúdo para criar/atualizar o runtime governado na raiz
  const sourceRulesDir = path.join(ROOT_DIR, ".core", "rules");
  const rulesJsonPath = path.join(sourceRulesDir, "_meta", "rules.json");
  let catalog = null;
  try {
    catalog = await loadRulesCatalog(rulesJsonPath);
  } catch {
    // Catalog absent or unreadable; fall back below.
  }

  let primaryDirectives = "";
  let lifecycleRules = "";
  let gitRules = "";
  let engineeringRules = "";
  let providerRules = [];
  let optInRules = [];

  const adapterSelection = normalizeAdapterSelection(deriveAdaptersFromProviders(config.providers));
  const features = options.features ?? config.features ?? [];
  const lang = options.lang ?? config.lang ?? "pt";

  if (catalog) {
    const filtered = filterRulesByScope(catalog.rules, {
      includeAdapters: adapterSelection,
      optInFeatures: features,
      lang,
    });
    const groupedUniversalRules = groupUniversalRulesByZone(filtered.universal);
    primaryDirectives = groupedUniversalRules.primaryDirectives;
    lifecycleRules = groupedUniversalRules.lifecycleRules;
    gitRules = groupedUniversalRules.gitRules;
    engineeringRules = groupedUniversalRules.engineeringRules;

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
    primaryDirectives = await fs.readFile(
      path.join(ROOT_DIR, ".core", "templates", "AGENTS-core.md.tmpl"),
      "utf8"
    );
    providerRules = await readRulesByName(sourceRulesDir, adapterSelection);
    optInRules = await readOptInRules({
      sourceRulesDir,
      editorialFeatures: EDITORIAL_FEATURES,
      features,
      lang,
    });
  }

  const monolithicBaseline = compileMonolithicAgentsContent({
    primaryDirectives,
    lifecycleRules,
    gitRules,
    engineeringRules,
    providerRules,
    optInRules,
    tacticalContext: buildTacticalContext(config.sdd_dir),
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

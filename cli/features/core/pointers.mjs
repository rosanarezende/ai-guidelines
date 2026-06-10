import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT_DIR } from "#fs/file-system";
import {
  deriveAdaptersFromProviders,
  resolveAiGuidelinesConfig,
  writeAiGuidelinesConfig,
} from "#features/core/config";
import { syncConsumerTemplates } from "#features/core/templates";
import { syncProviderEntrypoints } from "#features/core/provider-entrypoints";

async function loadRuntimeModules() {
  const bootstrapUrl = pathToFileURL(
    path.join(ROOT_DIR, "dist", "app", "services", "AgentsRuntimeBootstrap.js")
  ).href;
  const compilerUrl = pathToFileURL(
    path.join(ROOT_DIR, "dist", "app", "services", "RulesRuntimeCompiler.js")
  ).href;
  const [bootstrap, compiler] = await Promise.all([import(bootstrapUrl), import(compilerUrl)]);
  return { bootstrap, compiler };
}

async function loadCompiledRules(config) {
  const sourceRulesDir = path.join(ROOT_DIR, ".core", "rules");
  const rulesJsonPath = path.join(sourceRulesDir, "_meta", "rules.json");
  const { compiler } = await loadRuntimeModules();
  const catalogText = await fs.readFile(rulesJsonPath, "utf8").catch((error) => {
    throw new Error(
      `rules.json nao encontrado em ${rulesJsonPath}. Rode \`yarn build:rules\` antes do bootstrap. (${error.message})`
    );
  });
  const catalog = JSON.parse(catalogText);
  const adapterRulesByName = compiler.compileAdapterRulesByName(catalog, {
    includeAdapters: deriveAdaptersFromProviders(config.providers),
    optInFeatures: config.features,
    lang: config.lang,
  });

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

  const { bootstrap } = await loadRuntimeModules();
  const runtimeStub = bootstrap.buildAgentsRuntimeStub(config.sdd_dir);

  // O mergeAgentsContent injeta/substitui apenas o bloco <AI_GUIDELINES>
  // e preserva regras próprias do consumidor fora dele.
  const rootContent = bootstrap.mergeAgentsContent(currentContent, runtimeStub);

  if (currentContent !== rootContent) {
    if (dryRun) {
      actions.push("[dry-run] write AGENTS.md (ai-guidelines runtime updated)");
      return;
    }

    await fs.writeFile(rootAgentsPath, rootContent);
    actions.push(`write ${path.basename(rootAgentsPath)} (ai-guidelines runtime updated)`);
  }
}

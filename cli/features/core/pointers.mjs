import fs from "node:fs/promises";
import path from "node:path";
import { EDITORIAL_FEATURES } from "#core/cli-input";
import { ROOT_DIR } from "#core/file-system";
import { mergeAgentsContent } from "#governance/agents-merge";
import { compileMonolithicAgentsContent } from "#governance/monolith/compiler";
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
  const coreBaseline = await fs.readFile(coreTemplatePath, "utf8");
  const globalRules = await fs.readFile(path.join(sourceRulesDir, "global-rules.md"), "utf8");

  const providerRules = await readRulesByName(
    sourceRulesDir,
    normalizeProviderSelection(options.provider)
  );

  const optInRules = await readOptInRules({
    sourceRulesDir,
    editorialFeatures: EDITORIAL_FEATURES,
    features: options.features ?? [],
    lang: options.lang ?? "pt",
  });

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

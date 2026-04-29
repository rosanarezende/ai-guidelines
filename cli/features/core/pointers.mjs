import fs from "node:fs/promises";
import path from "node:path";
import { EDITORIAL_FEATURES } from "#core/cli-input";
import { ROOT_DIR } from "#core/file-system";
import { compileMonolithicAgentsContent, mergeAgentsContent } from "#core/content-merge";

const PROVIDER_RULE_FILES = ["claude.md", "codex.md", "gemini.md"];

function normalizeProviderSelection(provider) {
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

async function readRulesByName(sourceRulesDir, fileNames) {
  const rules = [];

  for (const fileName of fileNames) {
    const content = await fs.readFile(path.join(sourceRulesDir, fileName), "utf8");
    rules.push({ name: fileName.replace(/\.md$/i, ""), content });
  }

  return rules;
}

async function readOptInRules(sourceRulesDir, features, lang) {
  const activeEditorialFeatures = EDITORIAL_FEATURES.filter((feature) =>
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

/**
 * Aplica a arquitetura de ponteiros no AGENTS.md da raiz.
 * Esta feature é considerada CORE e mandatória para a governança.
 */
export async function applyPointers(targetDir, options, actions) {
  const dryRun = Boolean(options?.["dry-run"]);
  // Pointers são CORE e mandatórios.

  // Se não for explicitamente pulado, ele é injetado.
  // Nota: Não checamos features.includes("pointers") porque agora é core.

  const rootAgentsPath = path.join(targetDir, "AGENTS.md");
  const coreAgentsPath = path.join(targetDir, ".ai-guidelines", "AGENTS.md");

  // 1. Garantir pasta .ai-guidelines
  if (dryRun) {
    actions.push("[dry-run] mkdir .ai-guidelines");
  } else {
    await fs.mkdir(path.join(targetDir, ".ai-guidelines"), { recursive: true });
  }

  // 2. Ler conteúdo atual ou criar vazio
  let currentContent = "";
  try {
    currentContent = await fs.readFile(rootAgentsPath, "utf8");
  } catch (e) {
    // Arquivo não existe, tudo bem
  }

  // 3. Mesclar conteúdo para criar o ponteiro na raiz
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
  const optInRules = await readOptInRules(
    sourceRulesDir,
    options.features ?? [],
    options.lang ?? "pt"
  );
  const monolithicBaseline = compileMonolithicAgentsContent({
    coreTemplate: coreBaseline,
    globalRules,
    providerRules,
    optInRules,
    pointerTemplate,
  });

  // O mergeAgentsContent injeta o ponteiro e preserva o resto do arquivo raiz
  const rootContent = mergeAgentsContent(currentContent, pointerTemplate);

  // 4. Escrever na raiz (Ponteiro)
  if (currentContent !== rootContent) {
    if (dryRun) {
      actions.push("[dry-run] write AGENTS.md (pointer injected)");
    } else {
      await fs.writeFile(rootAgentsPath, rootContent);
    }
    actions.push(`write ${path.basename(rootAgentsPath)} (pointer injected)`);
  }

  // 5. Escrever no core (.ai-guidelines/AGENTS.md)
  // Nota: No destino core, escrevemos o baseline real, não o ponteiro.
  const currentCoreContent = await fs.readFile(coreAgentsPath, "utf8").catch(() => "");
  if (currentCoreContent !== monolithicBaseline) {
    if (dryRun) {
      actions.push("[dry-run] write .ai-guidelines/AGENTS.md (core rules updated)");
    } else {
      await fs.writeFile(coreAgentsPath, monolithicBaseline);
    }
    actions.push(`write .ai-guidelines/${path.basename(coreAgentsPath)} (core rules updated)`);
  }
}

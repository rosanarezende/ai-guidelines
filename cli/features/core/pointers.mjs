import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "../../core/file-system.mjs";
import { mergeAgentsContent } from "../../core/content-merge.mjs";

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

  const pointerTemplate = await fs.readFile(pointerTemplatePath, "utf8");
  const coreBaseline = await fs.readFile(coreTemplatePath, "utf8");

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
  if (currentCoreContent !== coreBaseline) {
    if (dryRun) {
      actions.push("[dry-run] write .ai-guidelines/AGENTS.md (core rules updated)");
    } else {
      await fs.writeFile(coreAgentsPath, coreBaseline);
    }
    actions.push(`write .ai-guidelines/${path.basename(coreAgentsPath)} (core rules updated)`);
  }
}

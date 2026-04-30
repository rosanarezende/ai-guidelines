import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "#core/file-system";
import { mergeGitattributesContent } from "#fs/merge-utils";

/**
 * Governança de Persistência e EOL (.gitattributes)
 */
export async function applyGitattributes(targetDir, options, actions) {
  const dryRun = Boolean(options?.["dry-run"]);

  const gitattributesPath = path.join(targetDir, ".gitattributes");
  const sourcePath = path.join(ROOT_DIR, ".core", "templates", ".gitattributes.tmpl");

  let currentContent = "";
  try {
    currentContent = await fs.readFile(gitattributesPath, "utf8");
  } catch (e) {}

  const baselineContent = await fs.readFile(sourcePath, "utf8");
  const updatedContent = mergeGitattributesContent(currentContent, baselineContent);

  if (currentContent !== updatedContent) {
    if (dryRun) {
      actions.push("[dry-run] write .gitattributes (baseline sync)");
    } else {
      await fs.writeFile(gitattributesPath, updatedContent);
      actions.push(`write ${path.basename(gitattributesPath)} (baseline sync)`);
    }
    return { didWrite: true };
  }

  return { didWrite: false };
}

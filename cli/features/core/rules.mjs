import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "#core/file-system";
import { OPT_IN_RULE_FILES } from "#core/cli-input";

/**
 * Sincroniza as regras de governança para .ai-guidelines/rules/
 */
export async function applyRules(targetDir, options, actions) {
  const { prune = false } = options;
  const dryRun = Boolean(options?.["dry-run"]);
  // Rules são CORE e mandatórias.

  const sourceRulesDir = path.join(ROOT_DIR, ".core", "rules");
  const targetRulesDir = path.join(targetDir, ".ai-guidelines", "rules");

  if (dryRun) {
    actions.push("[dry-run] mkdir .ai-guidelines/rules");
  } else {
    await fs.mkdir(targetRulesDir, { recursive: true });
  }
  actions.push("sync baseline rules to .ai-guidelines/rules/");

  const dirents = await fs.readdir(sourceRulesDir, { withFileTypes: true });
  const files = dirents.filter((dirent) => dirent.isFile()).map((dirent) => dirent.name);

  for (const file of files) {
    const src = path.join(sourceRulesDir, file);
    const dest = path.join(targetRulesDir, file);

    const srcContent = await fs.readFile(src, "utf8");
    let destContent = "";
    try {
      destContent = await fs.readFile(dest, "utf8");
    } catch (e) {}

    if (srcContent !== destContent) {
      if (!dryRun) {
        await fs.writeFile(dest, srcContent);
      }
      actions.push(`write .ai-guidelines/rules/${file}`);
    }
  }

  if (prune) {
    const targetFiles = await fs.readdir(targetRulesDir);
    for (const file of targetFiles) {
      if (!files.includes(file) && !OPT_IN_RULE_FILES.includes(file)) {
        if (!dryRun) {
          await fs.unlink(path.join(targetRulesDir, file));
        }
        actions.push(`prune .ai-guidelines/rules/${file} (orphaned)`);
      }
    }
  }
}

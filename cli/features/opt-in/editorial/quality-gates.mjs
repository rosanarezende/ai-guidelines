import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "#core/file-system";

/**
 * Feature Opt-in: Quality Gates
 */
export async function applyQualityGates(targetDir, options, context, actions) {
  const { features = [], prune = false } = options;
  const dryRun = Boolean(options?.["dry-run"]);

  const sourceRulesPath = path.join(ROOT_DIR, ".core", "rules", "opt-in", "quality-gates.md");
  const targetRulesDir = path.join(targetDir, ".ai-guidelines", "rules");
  const targetRulesPath = path.join(targetRulesDir, "quality-gates.md");

  if (!features.includes("quality-gates")) {
    actions.push("skip quality-gates (feature desativada)");
    if (prune) {
      const exists = await fs
        .access(targetRulesPath)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        if (!dryRun) {
          await fs.unlink(targetRulesPath);
        }
        actions.push("prune .ai-guidelines/rules/quality-gates.md (feature desativada)");
      }
    }
    return;
  }

  try {
    const content = await fs.readFile(sourceRulesPath, "utf8");

    if (!dryRun) {
      await fs.mkdir(targetRulesDir, { recursive: true });
      await fs.writeFile(targetRulesPath, content);
    }

    actions.push("sync .ai-guidelines/rules/quality-gates.md");
  } catch (error) {
    actions.push(`error syncing quality-gates rules: ${error.message}`);
  }
}

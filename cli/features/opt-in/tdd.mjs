import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "../../core/file-system.mjs";

/**
 * Feature Opt-in: TDD
 */
export async function applyTdd(targetDir, options, context, actions) {
  const { features = [], prune = false } = options;
  const dryRun = Boolean(options?.["dry-run"]);

  const sourceRulesPath = path.join(ROOT_DIR, ".core", "rules", "opt-in", "tdd.md");
  const targetRulesDir = path.join(targetDir, ".ai-guidelines", "rules");
  const targetRulesPath = path.join(targetRulesDir, "tdd.md");

  if (!features.includes("tdd")) {
    actions.push("skip tdd (feature desativada)");
    if (prune) {
      const exists = await fs
        .access(targetRulesPath)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        if (!dryRun) {
          await fs.unlink(targetRulesPath);
        }
        actions.push("prune .ai-guidelines/rules/tdd.md (feature desativada)");
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

    actions.push("sync .ai-guidelines/rules/tdd.md");
  } catch (error) {
    actions.push(`error syncing tdd rules: ${error.message}`);
  }
}

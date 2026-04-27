import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "../../core/file-system.mjs";

/**
 * Feature Opt-in: TDD
 */
export async function applyTdd(targetDir, options, context, actions) {
  const { features = [] } = options;
  const dryRun = Boolean(options?.["dry-run"]);

  if (!features.includes("tdd")) {
    actions.push("skip tdd (feature desativada)");
    return;
  }

  const sourceRulesPath = path.join(ROOT_DIR, ".core", "rules", "tdd.md");
  const targetRulesDir = path.join(targetDir, ".ai-guidelines", "rules");
  const targetRulesPath = path.join(targetRulesDir, "tdd.md");

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

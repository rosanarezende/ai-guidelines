import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "#fs/file-system";
import { getOptInRuleRelativePath } from "#governance/monolith/rules-loader";

/**
 * Feature Opt-in: BDD
 */
export async function applyBdd(targetDir, options, context, actions) {
  const { features = [], prune = false, lang = "pt" } = options;
  const dryRun = Boolean(options?.["dry-run"]);

  // Usar o ROOT_DIR do context em testes unitários para mock fs via options se rootDir definido
  const baseDir = context.rootDir || ROOT_DIR;

  const sourceRulesPath = path.join(
    baseDir,
    ".core",
    "rules",
    getOptInRuleRelativePath("bdd", lang)
  );
  const targetRulesDir = path.join(targetDir, ".ai-guidelines", "rules");
  const targetRulesPath = path.join(targetRulesDir, "bdd.md");

  if (!features.includes("bdd")) {
    actions.push("skip bdd (feature desativada)");
    if (prune) {
      const exists = await fs
        .access(targetRulesPath)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        if (!dryRun) {
          await fs.unlink(targetRulesPath);
        }
        actions.push("prune .ai-guidelines/rules/bdd.md (feature desativada)");
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

    actions.push(`sync .ai-guidelines/rules/bdd.md (lang: ${lang})`);
  } catch (error) {
    actions.push(`error syncing bdd rules: ${error.message}`);
  }
}

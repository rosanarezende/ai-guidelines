import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "../../../core/file-system.mjs";
import { resolveInstallCommand, resolveCiRunner } from "../../../formatters/package-context.mjs";

/**
 * Governança de CI (GitHub Actions)
 */
export async function applyCi(targetDir, options, context, actions) {
  const { features = [], force = false } = options;
  const dryRun = Boolean(options?.["dry-run"]);
  const { packageManager = { id: "npm", runner: "npm run" } } = context;

  if (!features.includes("ci")) {
    actions.push("skip ci (feature desativada)");
    return;
  }

  const workflowDir = path.join(targetDir, ".github", "workflows");
  const workflowPath = path.join(workflowDir, "ai-guidelines-ci.yml");
  const sourcePath = path.join(
    ROOT_DIR,
    ".core",
    "templates",
    ".github",
    "workflows",
    "ai-guidelines-ci.yml.tmpl"
  );

  if (!dryRun) {
    await fs.mkdir(workflowDir, { recursive: true });
  }

  const exists = await fs
    .access(workflowPath)
    .then(() => true)
    .catch(() => false);

  let template = await fs.readFile(sourcePath, "utf8");

  // Customização dinâmica dos placeholders
  const replacements = {
    "{{ci_workflow_name}}": "AI Governance Check",
    "{{node_version}}": "24", // Alinhado com o benchmark de Node 24
    "{{install_command}}": resolveInstallCommand(packageManager),
    "{{check_command}}": `${resolveCiRunner(packageManager)} check`,
  };

  for (const [key, value] of Object.entries(replacements)) {
    template = template.replaceAll(key, value);
  }

  if (exists) {
    const currentContent = await fs.readFile(workflowPath, "utf8");
    if (currentContent === template) {
      return; // Já está atualizado
    }

    if (!force) {
      const isTTY = process.stdin.isTTY;
      let shouldUpdate = false;

      if (isTTY) {
        const { promptUser } = await import("../../core/install-runtime.mjs");
        shouldUpdate = await promptUser(
          `\nNovo baseline de CI detectado (.github/workflows/ai-guidelines-ci.yml). Atualizar agora? [S/n] `
        );
      }

      if (!shouldUpdate) {
        actions.push(
          `skip .github/workflows/ai-guidelines-ci.yml (desatualizado; use --force ou Wizard para atualizar)`
        );
        return;
      }
    }
  }

  if (!dryRun) {
    await fs.writeFile(workflowPath, template);
  }
  actions.push(`write .github/workflows/ai-guidelines-ci.yml (CI baseline)`);
}

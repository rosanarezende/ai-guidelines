import fs from "node:fs/promises";
import path from "node:path";
import { mergeHookContent } from "#fs/merge-utils";
import { mergePackageJson } from "#formatters/package-context";

/**
 * Governança de Automação (Husky Git Hooks)
 */
export async function applyHusky(targetDir, options, context, actions) {
  const { features = [] } = options;
  const dryRun = Boolean(options?.["dry-run"]);
  const force = Boolean(options?.force);
  const { packageManager = { id: "npm", runner: "npm run" } } = context;

  if (!features.includes("husky")) {
    actions.push("skip husky (feature desativada)");
    return;
  }

  const pkgPath = path.join(targetDir, "package.json");
  let currentPkg = {};
  try {
    currentPkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  } catch (e) {
    actions.push("skip husky (package.json ausente)");
    return;
  }

  // 1. Atualizar package.json
  const { packageJson: updatedPkg } = mergePackageJson(currentPkg, "adopt", {
    features: ["husky"],
  });
  if (!dryRun) {
    await fs.writeFile(pkgPath, JSON.stringify(updatedPkg, null, 2) + "\n");
  }
  actions.push("update package.json (husky prepare script)");

  // 2. Configurar Hooks
  const huskyDir = path.join(targetDir, ".husky");
  if (!dryRun) {
    await fs.mkdir(huskyDir, { recursive: true });
  }

  const hooks = [
    { name: "pre-commit", command: `${packageManager.runner} format` },
    { name: "pre-push", command: `${packageManager.runner} check` },
  ];

  for (const hook of hooks) {
    const hookPath = path.join(huskyDir, hook.name);
    let currentContent = "";
    try {
      currentContent = await fs.readFile(hookPath, "utf8");
    } catch (e) {}

    const updatedContent = mergeHookContent(currentContent, hook.command, force, hook.name);
    if (currentContent !== updatedContent) {
      if (!dryRun) {
        await fs.writeFile(hookPath, updatedContent, { mode: 0o755 });
      }
      actions.push(`write .husky/${hook.name}`);
    }
  }
}

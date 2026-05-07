import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "#fs/file-system";
import { mergePrettierIgnoreContent } from "#fs/merge-utils";
import { mergePackageJson, detectNewDevDeps } from "#formatters/package-context";

/**
 * Governança de Estilo (Prettier)
 */
export async function applyPrettier(targetDir, options, context, actions) {
  const { features = [] } = options;
  const dryRun = Boolean(options?.["dry-run"]);
  const forcePrettier = Boolean(options?.force || options?.["force-prettier"]);
  const { formatterContext = {} } = context;

  if (!features.includes("prettier")) {
    actions.push("skip prettier (feature desativada)");
    return;
  }

  if (formatterContext.shouldSkipPrettier && !forcePrettier) {
    actions.push(
      `skip prettier (formatter rival detectado: ${formatterContext.rival?.label || "Desconhecido"})`
    );
    return;
  }

  if (formatterContext.shouldSkipPrettier && forcePrettier) {
    actions.push(
      `override prettier (formatter rival detectado: ${formatterContext.rival?.label || "Desconhecido"}; sobrescrita explícita ativa)`
    );
  }

  const pkgPath = path.join(targetDir, "package.json");
  let pkgContent = "{}";
  try {
    pkgContent = await fs.readFile(pkgPath, "utf8");
  } catch (e) {
    actions.push("skip prettier (package.json não encontrado)");
    return;
  }

  const currentPkg = JSON.parse(pkgContent);

  // 1. Merge package.json
  // O mergePackageJson já sabe lidar com o gate de features
  const { packageJson: updatedPkg } = mergePackageJson(currentPkg, "adopt", {
    features: ["prettier"],
  });

  // 2. Reportar apenas novas dependências (Evitar falso positivo)
  const newDeps = detectNewDevDeps(currentPkg, updatedPkg);
  if (newDeps.length > 0) {
    actions.push(`novas dependências detectadas: ${newDeps.join(", ")}`);
  }

  if (!dryRun) {
    await fs.writeFile(pkgPath, JSON.stringify(updatedPkg, null, 2) + "\n");
  }
  actions.push(`${dryRun ? "[dry-run] " : ""}update package.json (prettier scripts & deps)`);

  const ignorePath = path.join(targetDir, ".prettierignore");
  let currentIgnore = "";
  try {
    currentIgnore = await fs.readFile(ignorePath, "utf8");
  } catch (e) {}

  const sourceIgnorePath = path.join(ROOT_DIR, ".core", "templates", ".prettierignore.tmpl");
  const baselineIgnore = await fs.readFile(sourceIgnorePath, "utf8");

  const updatedIgnore = mergePrettierIgnoreContent(currentIgnore, baselineIgnore);
  if (currentIgnore !== updatedIgnore) {
    if (!dryRun) {
      await fs.writeFile(ignorePath, updatedIgnore);
    }
    actions.push(`${dryRun ? "[dry-run] " : ""}write ${path.basename(ignorePath)}`);
  }
}

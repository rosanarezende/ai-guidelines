import path from "node:path";
import { ensureDir, fileExists, readTextIfExists } from "#core/file-system";

export async function ensureTargetDir(targetDir, dryRun) {
  await ensureDir(targetDir, dryRun, []);
}

export async function readPackageJson(targetDir, onWarning = () => {}) {
  const packageJsonText = await readTextIfExists(path.join(targetDir, "package.json"));

  if (!packageJsonText) {
    return { packageJsonText: null, packageJson: null };
  }

  try {
    return { packageJsonText, packageJson: JSON.parse(packageJsonText) };
  } catch (error) {
    onWarning(`[WARN] Erro ao processar package.json em ${targetDir}: ${error.message}`);
    return { packageJsonText, packageJson: null };
  }
}

export async function collectExistingPaths(targetDir, relativePaths) {
  const conflicts = [];

  for (const relativePath of relativePaths) {
    if (await fileExists(path.join(targetDir, relativePath))) {
      conflicts.push(relativePath);
    }
  }

  return conflicts;
}

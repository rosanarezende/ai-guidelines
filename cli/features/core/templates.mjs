import fs from "node:fs/promises";
import path from "node:path";
import {
  ROOT_DIR,
  ensureDir,
  fileExists,
  listFilesRecursive,
  readTextIfExists,
} from "#fs/file-system";
import {
  describeTemplateTransition,
  parseTemplateMetadata,
} from "#features/core/template-metadata";

function relPath(targetFilePath) {
  return path.relative(process.cwd(), targetFilePath) || targetFilePath;
}

export async function syncConsumerTemplates(targetDir, config, options, actions) {
  const sourceDir = path.join(ROOT_DIR, ".specify", "templates");
  const targetTemplatesDir = path.join(targetDir, config.sdd_dir, "templates");

  if (!(await fileExists(sourceDir))) {
    return;
  }

  if (actions) {
    actions.push("sync templates -> target");
  }

  const sourceFiles = await listFilesRecursive(sourceDir);
  const sourceRelativeSet = new Set(
    sourceFiles.map((absolute) => path.relative(sourceDir, absolute))
  );

  for (const sourceFilePath of sourceFiles) {
    const relative = path.relative(sourceDir, sourceFilePath);
    const destinationFilePath = path.join(targetTemplatesDir, relative);

    const sourceContent = await fs.readFile(sourceFilePath, "utf8");
    const destinationContent = await readTextIfExists(destinationFilePath);

    if (destinationContent === sourceContent) {
      continue;
    }

    const sourceMeta = parseTemplateMetadata(sourceContent);
    const destinationMeta = parseTemplateMetadata(destinationContent);
    const transition = describeTemplateTransition(sourceMeta, destinationMeta);

    const prefix = options.dryRun ? "[dry-run] " : "";
    const suffix = transition ? ` (${transition})` : "";
    actions.push(`${prefix}write ${relPath(destinationFilePath)}${suffix}`);

    if (!options.dryRun) {
      await ensureDir(path.dirname(destinationFilePath), false, actions);
      await fs.writeFile(destinationFilePath, sourceContent, "utf8");
    }
  }

  if (!options.prune) {
    return;
  }

  const targetFiles = await listFilesRecursive(targetTemplatesDir);
  for (const targetFilePath of targetFiles) {
    const relative = path.relative(targetTemplatesDir, targetFilePath);
    if (sourceRelativeSet.has(relative)) {
      continue;
    }
    actions.push(`${options.dryRun ? "[dry-run] " : ""}prune ${relPath(targetFilePath)}`);
    if (!options.dryRun) {
      await fs.unlink(targetFilePath);
    }
  }
}

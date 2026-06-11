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
import { tryRenderViaEngine } from "#features/core/recipes";

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
    const sourceFilename = path.basename(sourceFilePath);

    const engineResult = await tryRenderViaEngine({
      sourceFilename,
      destinationDir: path.dirname(destinationFilePath),
      dryRun: true,
    });

    let outputContent;
    let outputOrigin;
    if (engineResult.rendered) {
      outputContent = engineResult.content;
      outputOrigin = "engine";
    } else if (engineResult.reason === "engine-unavailable") {
      // Recipe mapeada existe mas dist/ não foi encontrado. Fail-fast em vez de
      // fallback silencioso para mirror: o pacote npm distribui dist/ via
      // package.json:files + prepack, então engine-unavailable indica regressão
      // real (build quebrado, prepack pulado, etc.), não um estado esperado.
      throw new Error(
        `Engine indisponível para recipe "${engineResult.recipeName}": ` +
          `artefatos compilados em dist/ não encontrados. ` +
          `Se rodando do repo, execute "npm run build" antes; ` +
          `se instalado via npm, isso indica um pacote quebrado (prepack pulado ou dist/ ausente do tarball).`
      );
    } else {
      outputContent = await fs.readFile(sourceFilePath, "utf8");
      outputOrigin = "mirror";
    }

    const destinationContent = await readTextIfExists(destinationFilePath);

    if (destinationContent === outputContent) {
      continue;
    }

    const sourceMeta = parseTemplateMetadata(outputContent);
    const destinationMeta = parseTemplateMetadata(destinationContent);
    const transition = describeTemplateTransition(sourceMeta, destinationMeta);

    const prefix = options.dryRun ? "[dry-run] " : "";
    const originTag = outputOrigin === "engine" ? " [engine]" : "";
    const suffix = transition ? ` (${transition})` : "";
    actions.push(`${prefix}write ${relPath(destinationFilePath)}${originTag}${suffix}`);

    if (!options.dryRun) {
      await ensureDir(path.dirname(destinationFilePath), false, actions);
      await fs.writeFile(destinationFilePath, outputContent, "utf8");
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

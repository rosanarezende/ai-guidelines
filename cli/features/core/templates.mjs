import path from "node:path";
import { ROOT_DIR, copyDirIfChanged } from "#fs/file-system";

export async function syncConsumerTemplates(targetDir, config, options, actions) {
  const sourceDir = path.join(ROOT_DIR, ".specify", "templates");
  const targetTemplatesDir = path.join(targetDir, config.sdd_dir, "templates");

  await copyDirIfChanged(sourceDir, targetTemplatesDir, options.dryRun, actions, {
    prune: Boolean(options.prune),
  });
}

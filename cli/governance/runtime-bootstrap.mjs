import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");
const compiledModule = resolve(repoRoot, "dist/cli/runtimeBootstrap.js");

async function loadRuntimeBootstrap() {
  if (!existsSync(compiledModule)) {
    throw new Error(`Compiled module not found: ${compiledModule}. Run \`yarn build\` first.`);
  }
  return import(pathToFileURL(compiledModule).href);
}

export async function buildRuntimeBootstrapContent(existingContent = "", options = {}) {
  const mod = await loadRuntimeBootstrap();
  return mod.buildRuntimeBootstrapContent(existingContent, options);
}

export async function syncRuntimeBootstrap(options = {}) {
  const mod = await loadRuntimeBootstrap();
  return mod.syncRuntimeBootstrap(repoRoot, options);
}

export async function checkRuntimeBootstrap(options = {}) {
  const mod = await loadRuntimeBootstrap();
  return mod.checkRuntimeBootstrap(repoRoot, options);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === __filename;

if (isMain) {
  const mod = await loadRuntimeBootstrap();
  process.exitCode = mod.main(process.argv.slice(2), repoRoot);
}

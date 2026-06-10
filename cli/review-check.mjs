#!/usr/bin/env node
/**
 * Bin físico do gate `review:check` — "revisão-como-artefato" (Spec 0024 Checkpoint 2.4).
 *
 * Composition root: importa `main` do módulo compilado (`dist/cli/reviewCheck.js`).
 *
 * Exit codes: 0 ok · 1 violação/erro de schema · 2 módulo compilado ausente.
 * Assume `npm run build`. `pathToFileURL` obrigatório (cross-OS, ESM).
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/reviewCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot));

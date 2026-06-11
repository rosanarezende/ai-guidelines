#!/usr/bin/env node
/**
 * Bin físico de `build:rules`.
 *
 * O compilador operacional vive em TypeScript (`src/cli/buildRules.ts`) e é
 * consumido a partir de `dist/` depois de `npm run build`. Este arquivo fica em
 * `cli/` apenas como wrapper bootstrap cross-OS.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/buildRules.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(await main(repoRoot));

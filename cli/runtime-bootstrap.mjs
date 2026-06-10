#!/usr/bin/env node
/**
 * Wrapper físico de `runtime-bootstrap:*`.
 *
 * A implementação operacional vive em TypeScript (`src/cli/runtimeBootstrap.ts`)
 * e é consumida de `dist/` após `yarn build`. `cli/` permanece como camada de
 * compatibilidade/bin cross-OS.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/runtimeBootstrap.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`yarn build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(process.argv.slice(2), repoRoot));

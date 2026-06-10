#!/usr/bin/env node
/**
 * Bin físico do gate `intent:check`.
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/intentCheck.js`) e o invoca. Valida a fronteira Intent↔Registry:
 * integridade referencial (erro) + cobertura de navegação humana (warning).
 *
 * Exit codes:
 *   0 — sucesso (toda action referencia comando registrado)
 *   1 — integridade referencial violada (≥ 1 action aponta comando inexistente)
 *   2 — uso inválido (módulo compilado ausente)
 *
 * Assume `npm run build`. Conversão via `pathToFileURL` obrigatória cross-OS.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/intentCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`yarn build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot));

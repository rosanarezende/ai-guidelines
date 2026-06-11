#!/usr/bin/env node
/**
 * Bin físico do gate `insights:check`.
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/insightsCheck.js`) e o invoca com o repo root. Espelha
 * `cli/state-yml-check.mjs`.
 *
 * Exit codes:
 *   0 — ok (ledger conforma às invariantes do domínio; ausente = vazio = ok)
 *   1 — invariante violada no ledger persistido
 *   2 — uso inválido (módulo compilado ausente)
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/insightsCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot));

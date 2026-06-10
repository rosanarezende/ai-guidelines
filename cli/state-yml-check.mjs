#!/usr/bin/env node
/**
 * Bin físico do gate `state-yml:check`.
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/stateYmlCheck.js`) e o invoca com o repo root.
 *
 * Exit codes:
 *   0 — sucesso (state.yml do escopo escolhido conformam ao schema canônico)
 *   1 — schema violation (≥ 1 state.yml não conforma)
 *   2 — uso inválido (módulo compilado ausente)
 *
 * Schema canônico: `src/domain/workflow/WorkflowState.ts`
 * (4 chaves: stage, gate, focus, next).
 *
 * Assume `npm run build` executado. Se `dist/cli/stateYmlCheck.js` não
 * existir, falha rapidamente com mensagem orientativa.
 *
 * Nota Windows: `await import(absolutePath)` falha com
 * `ERR_UNSUPPORTED_ESM_URL_SCHEME` em paths do tipo `C:\...`. Conversão
 * via `pathToFileURL` é obrigatória cross-OS.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/stateYmlCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`yarn build\` first.\n`
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const invalidArgs = args.filter((arg) => arg !== "--all");
if (invalidArgs.length > 0) {
  process.stderr.write(
    `❌ Uso inválido: ${invalidArgs.join(" ")}\n` + `   Use: yarn state-yml:check [--all]\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot, undefined, { scope: args.includes("--all") ? "all" : "operational" }));

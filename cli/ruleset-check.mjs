#!/usr/bin/env node
/**
 * Bin físico do gate `ruleset:check`.
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/rulesetCheck.js`) e o invoca com o repo root.
 *
 * Modos:
 *   (default) --producibility  invariante PRIMÁRIO; sem rede; entra no `validate`.
 *   --parity --live <path>     invariante SECUNDÁRIO; compara versionado vs
 *                              snapshot do ruleset vivo (produzido por `gh api`).
 *
 * Exit codes:
 *   0 — invariante satisfeito
 *   1 — invariante violado
 *   2 — uso inválido (módulo compilado ausente | flags inválidas)
 *   3 — paridade indeterminada (snapshot vivo ausente/ilegível)
 *
 * Assume `npm run build` executado. Nota Windows: `await import(absolutePath)`
 * falha com `ERR_UNSUPPORTED_ESM_URL_SCHEME`; `pathToFileURL` é obrigatório.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/rulesetCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const argv = process.argv.slice(2);
const mode = argv.includes("--parity") ? "parity" : "producibility";
const liveIdx = argv.indexOf("--live");
const livePath = liveIdx >= 0 ? argv[liveIdx + 1] : undefined;

if (liveIdx >= 0 && !livePath) {
  process.stderr.write(`❌ --live exige um caminho de arquivo.\n`);
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot, { mode, livePath }));

#!/usr/bin/env node
/**
 * Bin físico do drift guard de Living Documentation.
 *
 * Composition root: importa `runGenerate`/`runCheck` do módulo compilado
 * (`dist/cli/livingDocs.js`) e roteia por `process.argv[2]`.
 *
 * Exit codes:
 *   0 — sucesso (generate gravou artefato; check em sync)
 *   1 — drift detectado (check)
 *   2 — uso inválido (subcomando ausente ou desconhecido)
 *
 * Assume `npm run build` executado. Se `dist/cli/livingDocs.js` não existir
 * (ex.: instalação corrompida ou desenvolvimento sem build), imprime
 * mensagem clara e sai com código 2 — drift guard nunca deve degradar
 * silenciosamente.
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
const compiledModule = resolve(repoRoot, "dist/cli/livingDocs.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ ${compiledModule} not found.\n` +
      `   Build artefato ausente. Execute 'npm run build' antes de rodar este bin.\n`
  );
  process.exit(2);
}

const { runGenerate, runCheck } = await import(pathToFileURL(compiledModule).href);

const subcommand = process.argv[2];
const opts = { repoRoot };

let exitCode;
switch (subcommand) {
  case "generate":
    exitCode = runGenerate(opts);
    break;
  case "check":
    exitCode = runCheck(opts);
    break;
  default:
    process.stderr.write(`Usage: living-docs <generate|check>\n`);
    exitCode = 2;
}

process.exit(exitCode);

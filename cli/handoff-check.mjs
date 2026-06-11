#!/usr/bin/env node
/**
 * Bin físico do gate `handoff:check` (CO-4 / Spec 0024 — retomada derivada).
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/handoffCheck.js`) e o invoca com o repo root + argv.
 *
 * ADVISORY-FIRST: rederiva os fatos do handoff diretamente das fontes (sem
 * Markdown persistido) e reporta saúde das fontes (fresh/degraded/unavailable),
 * drift reconciliável, próxima ação derivada e selo determinístico. Warnings
 * NÃO bloqueiam; apenas estado impossível (state.yml ilegível, spec
 * irresolvível) retorna 1. Cobertura bloqueante de drift segue nos contratos
 * compostos: active-specs:check, reconcile:check, review:check.
 *
 * Uso: node cli/handoff-check.mjs [--spec 0024] [--no-remote]
 *
 * Exit codes:
 *   0 — ok ou advisory (warnings reportados)
 *   1 — estado irrecuperável (schema/resolução)
 *   2 — uso inválido (módulo compilado ausente)
 *
 * Assume `npm run build` executado. Conversão via `pathToFileURL` é obrigatória
 * cross-OS (Windows falha com `ERR_UNSUPPORTED_ESM_URL_SCHEME` em paths `C:\...`).
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/handoffCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot, process.argv.slice(2)));

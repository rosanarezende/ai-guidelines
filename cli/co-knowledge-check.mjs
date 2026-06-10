#!/usr/bin/env node
/**
 * Bin físico do gate `co-knowledge:check` (CO-2 / Spec 0024 — Knowledge tipado).
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/coKnowledgeCheck.js`) e o invoca com o repo root.
 *
 * Valida o ledger de Falsifications (F1–F3 + selo do fingerprint + F4a anti-reabertura
 * por ref). **Advisory-first**: detecta e reporta, mas o `main` retorna sempre 0 —
 * não bloqueia o build.
 *
 * Exit codes:
 *   0 — SEMPRE (advisory-first; ✅ ok ou ⚠️ achados reportados)
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
const compiledModule = resolve(repoRoot, "dist/cli/coKnowledgeCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`yarn build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot));

#!/usr/bin/env node
/**
 * Bin físico do gate `reconcile:check` (CO-1 / Spec 0024 — Continuidade Operacional).
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/reconcileCheck.js`) e o invoca com o repo root.
 *
 * Contrato de autoridade (INV-1): `state.yml § topology` é a SSOT estrutural; a
 * prosa de `next`/cursor não é autoridade quando diverge do canônico derivável.
 * Este gate é **advisory-first**: detecta e reporta divergência, mas o `main`
 * retorna sempre 0 — não bloqueia o build.
 *
 * Exit codes:
 *   0 — SEMPRE (advisory-first; ✅ reconciliado ou ⚠️ divergência reportada)
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
const compiledModule = resolve(repoRoot, "dist/cli/reconcileCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot));

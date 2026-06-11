#!/usr/bin/env node
/**
 * Bin físico de `pr-body:update` (FU-1, Spec 0024).
 *
 * Atualização PRESERVATIVA de PR body: lê o body remoto, funde apenas seções
 * autorizadas da proposta, aplica via `gh pr edit --body-file` (fallback
 * `gh api PATCH`), relê e confirma. `## Visão pretendida` é baseline do Draft
 * e nunca é substituída automaticamente (PIT-0010).
 *
 * Uso:
 *   npm run pr-body:update -- --pr <n> --body-file <arquivo.md>
 *     [--repo owner/repo] [--update-valor-entregue] [--dry-run]
 *
 * Exit codes:
 *   0 — aplicado e confirmado (ou no-op/dry-run)
 *   1 — atualização bloqueada por invariante ou divergência pós-aplicação
 *   2 — uso inválido (argumentos ou módulo compilado ausente)
 *
 * Assume `npm run build` executado. Conversão via `pathToFileURL` é obrigatória
 * cross-OS (Windows: `await import("C:\\...")` falha sem file URL).
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/prBodyUpdate.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(process.argv.slice(2)));

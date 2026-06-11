#!/usr/bin/env node
/**
 * Bin físico de `pr-ready:check` (FU-2, Spec 0024).
 *
 * READ-ONLY: valida as precondições da conversão Draft → Ready (body no
 * contrato Ready, CI verde no HEAD final, HEAD local = remoto, working tree
 * limpa, reviews obrigatórias, sem bloqueantes, gate humano ainda não
 * registrado). NUNCA converte o PR — Draft → Ready e Human Gate são atos
 * explícitos da owner; Ready não autoriza merge (ADR 0024).
 *
 * Uso:
 *   npm run pr-ready:check -- --pr <n> [--repo owner/repo]
 *
 * Exit codes:
 *   0 — precondições satisfeitas
 *   1 — precondições faltando (lista narrada)
 *   2 — uso inválido (argumentos ou módulo compilado ausente)
 *
 * Assume `npm run build` executado. Conversão via `pathToFileURL` é obrigatória
 * cross-OS.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/prReadyCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(process.argv.slice(2), { repoRoot }));

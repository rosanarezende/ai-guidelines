#!/usr/bin/env node
/**
 * Bin físico do gate `active-specs:check`.
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/activeSpecsConsistencyCheck.js`) e o invoca com o repo root.
 *
 * Drift guard fatos→projeção de `specs/active.yml`: `stage` fiel a
 * `state.yml.stage` ([DEC-0023-A04]); `id`/`slug`/`source_state_path`
 * round-trip com `spec_path` (forma que o gerador publish-state produz);
 * `branch` fiel ao branch git corrente quando ele pertence à mesma spec
 * (skipped em detached HEAD/branch fora do padrão — fronteira documentada
 * no módulo). Escopo ampliado no dogfood CO-4 (2026-06-11): branch stale
 * mascarado por fallback era invisível ao escopo stage-only original.
 *
 * Exit codes:
 *   0 — sucesso (invariantes satisfeitas onde observáveis)
 *   1 — ≥ 1 entry diverge dos fatos (stage/branch/identidade/path stale)
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
const compiledModule = resolve(repoRoot, "dist/cli/activeSpecsConsistencyCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot));

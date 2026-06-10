#!/usr/bin/env node
/**
 * Bin físico do gate `active-specs:check`.
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/activeSpecsConsistencyCheck.js`) e o invoca com o repo root.
 *
 * Drift guard: `entry.stage` de `specs/active.yml` deve ser projeção fiel de
 * `state.yml.stage` da spec (invariante [DEC-0023-A04]). O serializer valida
 * FORMA; este gate valida CONSISTÊNCIA SSOT→projeção.
 *
 * Exit codes:
 *   0 — sucesso (toda entry.stage == state.yml.stage)
 *   1 — ≥ 1 entry diverge da SSOT (stage stale / state.yml ausente)
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
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`yarn build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot));

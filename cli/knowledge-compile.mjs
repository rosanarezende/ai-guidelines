#!/usr/bin/env node
/**
 * Bin físico de `knowledge:compile` / `knowledge:check` (CO-3.2 / Spec 0024 —
 * co-enforcement).
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/knowledgeCompile.js`) e o invoca com o modo (`compile`|`check`) e as
 * duas raízes de resolução.
 *
 *   - `compile` — compila as fontes reais de constraints e PERSISTE o manifesto
 *     runtime; orquestra também `build:rules` (guarda-chuva).
 *   - `check`   — paridade derivada do artefato persistido (existência/classe/
 *     sync); integra o `validate`.
 *
 * Exit codes:
 *   0 — ok
 *   1 — inconsistência / drift
 *   2 — fonte core ausente / uso inválido / módulo compilado ausente
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
const compiledModule = resolve(repoRoot, "dist/cli/knowledgeCompile.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);

// Duas raízes (mesmo mecanismo do `constraints:check`): assets `.core/**` na raiz
// do PACOTE (derivada da localização do bin); o manifesto runtime e o overlay
// vivem na raiz do CONSUMIDOR (cwd). No mantenedor as duas coincidem.
process.exit(
  await main(process.argv.slice(2), { packageRoot: repoRoot, consumerRoot: process.cwd() })
);

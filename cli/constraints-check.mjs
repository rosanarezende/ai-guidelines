#!/usr/bin/env node
/**
 * Bin físico do gate `constraints:check` (CO-3.1 / Spec 0024 — co-enforcement).
 *
 * Composition root: importa `main` do módulo compilado
 * (`dist/cli/constraintsCheck.js`) e o invoca com o repo root.
 *
 * Compila a fonte estruturada de constraints (`.core/constraints/constraints.yml`
 * + overlay opcional `.governance/constraints.yml`) em memória e valida schema,
 * paridade, resolução de superfícies e mecanismos. **REQUIRED**: falha em
 * inconsistência (integra o `validate`).
 *
 * Exit codes:
 *   0 — ok (manifesto íntegro)
 *   1 — inconsistência detectada
 *   2 — fonte core ausente / módulo compilado ausente
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
const compiledModule = resolve(repoRoot, "dist/cli/constraintsCheck.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);

// Duas raízes (mesmo mecanismo do ROOT_DIR do bootstrap): os assets `.core/**`
// vivem na raiz do PACOTE (derivada da localização do bin); o overlay
// `.governance/constraints.yml` vive na raiz do CONSUMIDOR (cwd). No mantenedor
// as duas coincidem (npm roda o script a partir da raiz do repo).
process.exit(main({ packageRoot: repoRoot, consumerRoot: process.cwd() }));

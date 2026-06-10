#!/usr/bin/env node
/**
 * Bin físico do renderer `disclosure` — Disclosure de IA como projeção de
 * processo (Spec 0024 Checkpoint 2.4d). NÃO é gate: gera o bloco DERIVADO
 * (revisões/findings/gate) para colar no PR body; não entra no `validate`.
 *
 * Composition root: importa `main` do módulo compilado (`dist/cli/disclosureRender.js`).
 * Resolve a spec/nó pela branch atual; aceita PR_NUMBER opcional (env) p/ CI.
 *
 * Exit codes: 0 ok · 1 erro de resolução/parse · 2 módulo compilado ausente.
 * Assume `npm run build`. `pathToFileURL` obrigatório (cross-OS, ESM).
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/disclosureRender.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`yarn build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
const prNumber = process.env.PR_NUMBER ? Number(process.env.PR_NUMBER) : undefined;
process.exit(main(repoRoot, prNumber ? { prNumber } : {}));

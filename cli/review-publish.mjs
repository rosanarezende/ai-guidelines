#!/usr/bin/env node
/**
 * Bin físico de `review:publish` (CO-4, rodada 8 — publicação escopada).
 *
 * Fechamento operacional do artefato de review sob autorização
 * capability-scoped (`--authorization explicit-review-request`, mapeada pelo
 * agente a partir de um PEDIDO HUMANO EXPLÍCITO de review): valida
 * pré-condições (branch/upstream/behind, path canônico, selo, review:check,
 * diff EXATAMENTE review-only), cria commit exclusivo com mensagem DERIVADA e
 * faz push normal. FAIL-CLOSED: sem autorização ⇒ nada acontece. Nunca
 * force-push; nunca --no-verify; nunca GitHub comments.
 *
 * Uso:
 *   npm run review:publish -- --file <review-ou-evento.yml> \
 *     --authorization explicit-review-request
 *
 * Exit codes:
 *   0 — commit + push do artefato concluídos
 *   1 — bloqueado (pré-condição/guard/push) — diagnóstico explica; commit
 *       local é preservado quando só o push falha
 *   2 — uso inválido (módulo/argumentos)
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/reviewPublish.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ Compiled module not found: ${compiledModule}\n` + `   Run \`npm run build\` first.\n`
  );
  process.exit(2);
}

const { main } = await import(pathToFileURL(compiledModule).href);
process.exit(main(repoRoot, process.argv.slice(2)));

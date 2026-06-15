import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT_DIR } from "#fs/file-system";

/**
 * O orçamento de tokens vive no compilador TypeScript (`src/app/services/
 * TokenBudget.ts`) e é consumido a partir de `dist/` depois de `npm run build`
 * — mesmo padrão de bootstrap cross-OS usado por `pointers.mjs`. Rode
 * `npm run build` antes de invocar localmente sem build prévio.
 */
async function loadTokenBudget() {
  const url = pathToFileURL(path.join(ROOT_DIR, "dist", "app", "services", "TokenBudget.js")).href;
  return import(url);
}

function pct(tokens, limit) {
  if (limit === 0) return 0;
  return Math.round((tokens / limit) * 100);
}

function statusIcon(tokens, limit, ratio) {
  if (tokens >= limit) return "❌";
  if (tokens >= limit * ratio) return "⚠️ ";
  return "✅";
}

const SOFT_RATIO = 0.75;

function formatLine(label, tokens, limit) {
  const icon = statusIcon(tokens, limit, SOFT_RATIO);
  const percent = pct(tokens, limit);
  return `  ${icon} ${label.padEnd(28)} ${String(tokens).padStart(5)} / ${String(limit).padStart(
    5
  )} tokens (${String(percent).padStart(3)}%)`;
}

function formatHeading(title) {
  return `\n${title}`;
}

export async function runBudgetReport({ rulesJsonPath } = {}) {
  const resolvedPath =
    rulesJsonPath ?? path.join(ROOT_DIR, ".core", "rules", "_meta", "rules.json");

  let catalog;
  try {
    catalog = JSON.parse(await fs.readFile(resolvedPath, "utf-8"));
  } catch (error) {
    console.error(`Erro: não consegui ler o catálogo em ${resolvedPath}.`);
    console.error(`  Detalhe: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const { analyzeBudget } = await loadTokenBudget();
  const report = analyzeBudget(catalog);

  console.log("📊 Token budget report");
  console.log(formatHeading("Scope (catalog source):"));
  console.log(
    formatLine("universal", report.scopes.universal.tokens, report.scopes.universal.limit)
  );
  console.log(formatLine("opt-in", report.scopes["opt-in"].tokens, report.scopes["opt-in"].limit));

  console.log(formatHeading("Payload (distributed files):"));
  console.log(formatLine("AGENTS.md (compilado)", report.agentsMd.tokens, report.agentsMd.limit));
  if (report.perAdapter.length === 0) {
    console.log("  (nenhum adapter no catálogo)");
  } else {
    for (const adapter of report.perAdapter) {
      const label = `entrypoint ${adapter.adapter}`;
      console.log(formatLine(label, adapter.tokens, adapter.limit));
    }
  }

  console.log("");
  if (report.warnings.length === 0) {
    console.log("✅ Sem warnings. Orçamento dentro do esperado.");
    return;
  }

  console.log(`⚠️  ${report.warnings.length} warning(s):`);
  for (const warning of report.warnings) {
    console.log(`   ${warning}`);
  }
  console.log(
    "\nRevise as regras pesadas em .core/rules/ ou considere refatoração antes de bumpar versão."
  );
}

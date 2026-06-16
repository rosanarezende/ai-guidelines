import type { BudgetReport } from "../../../app/services/TokenBudget.js";

function percent(tokens: number, limit: number): number {
  if (limit === 0) {
    return 0;
  }
  return Math.round((tokens / limit) * 100);
}

function formatBudgetLine(label: string, tokens: number, limit: number): string {
  return `  ${label.padEnd(28)} ${String(tokens).padStart(5)} / ${String(limit).padStart(
    5
  )} tokens (${String(percent(tokens, limit)).padStart(3)}%)`;
}

export function renderBudgetReportLines(report: BudgetReport): readonly string[] {
  const lines: string[] = [
    "Token budget report",
    "",
    "Scope (catalog source):",
    formatBudgetLine("universal", report.scopes.universal.tokens, report.scopes.universal.limit),
    formatBudgetLine("opt-in", report.scopes["opt-in"].tokens, report.scopes["opt-in"].limit),
    "",
    "Payload (distributed files):",
    formatBudgetLine("AGENTS.md", report.agentsMd.tokens, report.agentsMd.limit),
  ];

  if (report.perAdapter.length === 0) {
    lines.push("  (nenhum adapter no catalogo)");
  } else {
    for (const adapter of report.perAdapter) {
      lines.push(formatBudgetLine(`entrypoint ${adapter.adapter}`, adapter.tokens, adapter.limit));
    }
  }

  if (report.warnings.length === 0) {
    lines.push("", "Sem warnings. Orcamento dentro do esperado.");
  } else {
    lines.push("", `${report.warnings.length} warning(s):`);
    for (const warning of report.warnings) {
      lines.push(`  ${warning}`);
    }
  }

  return lines;
}

import { compareInsightId } from "../../domain/insight/InsightId.js";
import { Insight, originOf, recurrenceOf, specsTouched } from "../../domain/insight/Insight.js";

/**
 * Projeção de retomada do tier "Percepções em Trânsito".
 *
 * Funções PURAS (sem IO), no espírito de `AssembleBriefing`: o `continue`
 * deriva a fila viva e a projeta SITUADA — sem que o owner reescreva nada.
 * Ordenação por saliência: recorrência desc (o que mais se repete pesa mais),
 * desempate por id asc (determinístico).
 */

export interface ResumptionInsightItem {
  readonly id: string;
  readonly text: string;
  readonly recurrence: number;
  readonly specs: ReadonlyArray<string>;
  readonly bornCursor: string | null;
}

export interface InsightsProjection {
  readonly items: ReadonlyArray<ResumptionInsightItem>;
}

export function buildInsightsProjection(open: ReadonlyArray<Insight>): InsightsProjection {
  const items = open
    .map((insight) => ({
      id: insight.id,
      text: insight.text,
      recurrence: recurrenceOf(insight),
      specs: specsTouched(insight),
      bornCursor: originOf(insight).cursor,
    }))
    .sort((a, b) => b.recurrence - a.recurrence || compareInsightId(a.id, b.id));
  return { items };
}

/**
 * Renderiza o bloco "Em trânsito" para o `continue`. Bloco VAZIO (string "")
 * quando não há percepções vivas — o `continue` simplesmente o omite.
 */
export function renderResumptionInsights(projection: InsightsProjection): string {
  if (projection.items.length === 0) return "";
  const lines: string[] = ["", "Em trânsito (percepções vivas):"];
  for (const item of projection.items) {
    const recurrence =
      item.recurrence > 1 ? ` · visto ${item.recurrence}× [${item.specs.join(",")}]` : "";
    lines.push(`  - ${item.id}: ${truncate(item.text, 90)}${recurrence}`);
  }
  return lines.join("\n");
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max - 1) + "…";
}

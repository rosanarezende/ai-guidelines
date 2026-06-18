import { Insight, recurrenceOf } from "./Insight.js";

/**
 * Limiar que transforma uma percepção aberta em candidata à decisão humana.
 *
 * A ferramenta apenas sinaliza: promover ou descartar continua sendo julgamento
 * humano.
 */
export const INSIGHT_GRADUATION_CANDIDATE_THRESHOLD = 3;

export function isInsightGraduationCandidate(insight: Insight): boolean {
  return (
    insight.status === "open" && recurrenceOf(insight) >= INSIGHT_GRADUATION_CANDIDATE_THRESHOLD
  );
}

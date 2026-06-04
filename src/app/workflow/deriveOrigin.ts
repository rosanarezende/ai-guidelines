import { OriginContext } from "../../domain/insight/Insight.js";
import { WorkflowState } from "../../domain/workflow/WorkflowState.js";

/**
 * Deriva o {@link OriginContext} de uma percepção: `spec` é o id canônico já
 * parseado do branch por `DetectActiveSpec` (fonte autoritativa, [DEC-0023-I01])
 * — NÃO re-derivado do slug do diretório; `cursor` é o checkpoint corrente da
 * topologia (ou `null`). Puro.
 */
export function deriveOrigin(specId: string, state: WorkflowState): OriginContext {
  const cursor = state.topology?.cursor.checkpoint ?? null;
  return { spec: specId, cursor };
}

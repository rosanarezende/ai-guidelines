import { OriginContext } from "../../domain/insight/Insight.js";
import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowState } from "../../domain/workflow/WorkflowState.js";

const SPEC_ID_RE = /^(\d{4})/;

/**
 * Deriva o {@link OriginContext} de uma percepção a partir do contexto da
 * spec ativa: `spec` = id do diretório (ex.: "0024-..." ⇒ "0024"); `cursor`
 * = checkpoint corrente da topologia (ou `null` se ausente). Puro.
 */
export function deriveOrigin(location: SpecLocation, state: WorkflowState): OriginContext {
  const match = SPEC_ID_RE.exec(location.slug);
  const spec = match ? match[1] : location.slug;
  const cursor = state.topology?.cursor.checkpoint ?? null;
  return { spec, cursor };
}

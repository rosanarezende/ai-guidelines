import { KnowledgeRef } from "./KnowledgeRef.js";
import { KnowledgeStage } from "./KnowledgeStage.js";

/**
 * Contrato comum a **toda** entidade do pipeline Knowledge.
 *
 * `Insight` já o satisfaz (estágio `insight`, via `insightArtifact`);
 * `Decision`/`Rule`/`Guardrail`/`Doctrine` o implementarão nos próximos PRs
 * **sem refatorar** este módulo. É o **ponto de extensão do grafo**: uma
 * projeção futura (`KnowledgeGraph`) navega artefatos heterogêneos por este
 * contrato uniforme, seguindo `graduatedTo`.
 */
export interface KnowledgeArtifact {
  readonly id: string;
  readonly stage: KnowledgeStage;
  /** Para onde graduou (downstream), se já graduou — a aresta do pipeline. */
  readonly graduatedTo?: KnowledgeRef;
}

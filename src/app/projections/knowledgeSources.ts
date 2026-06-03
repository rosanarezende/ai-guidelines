import { Insight } from "../../domain/insight/Insight.js";
import { insightArtifact } from "../../domain/insight/insightKnowledge.js";
import { KnowledgeArtifact } from "../../domain/knowledge/KnowledgeArtifact.js";
import { KnowledgeGraph } from "./KnowledgeGraph.js";

/**
 * Coleta os {@link KnowledgeArtifact} das fontes operacionais.
 *
 * HOJE: só `Insight` (estágio 0). Os próximos PRs (Doctrine/Decision/Rule…)
 * somam suas fontes AQUI — é o único ponto de wiring que cresce; o
 * {@link KnowledgeGraph} permanece intocado.
 */
export function collectKnowledgeArtifacts(
  insights: ReadonlyArray<Insight>
): ReadonlyArray<KnowledgeArtifact> {
  return insights.map(insightArtifact);
}

export function knowledgeGraphFromInsights(insights: ReadonlyArray<Insight>): KnowledgeGraph {
  return KnowledgeGraph.from(collectKnowledgeArtifacts(insights));
}

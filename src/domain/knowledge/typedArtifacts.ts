import { KnowledgeArtifact } from "./KnowledgeArtifact.js";
import { KnowledgeRef } from "./KnowledgeRef.js";

/**
 * Adapters puros que projetam fontes governadas existentes como nós do pipeline
 * Knowledge (CO-2), no mesmo padrão de `insightArtifact` — **sem persistir entidade
 * nova**. São MÍNIMOS: estabelecem o TIPO (`stage`) para o grafo ser heterogêneo
 * (insight + decision + doctrine + falsification). NÃO leem o acervo de ADRs/DECs —
 * isso seria migração ampla, fora do escopo do CO-2.
 */

/** Decision (decision-brief `DEC-*`) como nó de Knowledge — estágio `decision`. */
export function decisionArtifact(id: string, graduatedTo?: KnowledgeRef): KnowledgeArtifact {
  return { id, stage: "decision", ...(graduatedTo ? { graduatedTo } : {}) };
}

/**
 * Doctrine (`ADR-*`) como nó de Knowledge — estágio `doctrine`. **Lens** = um ADR
 * usado como lente de interpretação; é o MESMO estágio (convenção, não tipo novo).
 */
export function doctrineArtifact(id: string, graduatedTo?: KnowledgeRef): KnowledgeArtifact {
  return { id, stage: "doctrine", ...(graduatedTo ? { graduatedTo } : {}) };
}

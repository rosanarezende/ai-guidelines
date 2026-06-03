import { KnowledgeArtifact } from "../knowledge/KnowledgeArtifact.js";
import { KnowledgeRef } from "../knowledge/KnowledgeRef.js";
import { KnowledgeStage } from "../knowledge/KnowledgeStage.js";
import { Insight, PromotionKind } from "./Insight.js";

/**
 * Participação do `Insight` no pipeline Knowledge.
 *
 * Adapter PURO — **não** altera o agregado `Insight`, sua persistência
 * (`insights.yml`) nem a CLI. Apenas RECONHECE o Insight como o estágio 0 e
 * deriva a aresta de graduação a partir do que já é persistido (`promotion`).
 * Direção de dependência: `insight` → `knowledge` (o kernel não conhece Insight).
 */

/** Insight é o estágio 0 do pipeline. */
export const INSIGHT_STAGE: KnowledgeStage = "insight";

/**
 * Mapeia o vocabulário de promoção da CLI (estável: `adr|dec|guardrail|backlog`)
 * para o estágio de conhecimento downstream. `backlog` gradua para FORA do
 * Knowledge (vira `WorkItem`), logo retorna `null`.
 */
export function promotionKindToStage(kind: PromotionKind): KnowledgeStage | null {
  switch (kind) {
    case "adr":
      return "doctrine";
    case "dec":
      return "decision";
    case "guardrail":
      return "guardrail";
    case "backlog":
      return null;
  }
}

/**
 * A aresta de graduação de um Insight para o pipeline Knowledge — derivada da
 * `promotion` já persistida. `null` se: não-promovido, descartado, ou graduado
 * para Work (`backlog`). Construção ESTRUTURAL (sem validar forma); a validação
 * de forma é `isWellFormedRef`, aplicada pelo `insights:check`.
 */
export function graduationRefOf(insight: Insight): KnowledgeRef | null {
  if (insight.status !== "promoted" || insight.promotion === undefined) return null;
  const stage = promotionKindToStage(insight.promotion.kind);
  if (stage === null) return null;
  return { stage, id: insight.promotion.ref };
}

/** Vê um Insight como {@link KnowledgeArtifact} (estágio 0 + aresta de graduação). */
export function insightArtifact(insight: Insight): KnowledgeArtifact {
  const edge = graduationRefOf(insight);
  return {
    id: insight.id,
    stage: INSIGHT_STAGE,
    ...(edge ? { graduatedTo: edge } : {}),
  };
}

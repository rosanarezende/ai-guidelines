/**
 * Domínio **Knowledge** — espinha do contexto.
 *
 * Diferente do `WorkItem` (taxonomia MECE de intenção de saída, ADR 0010), o
 * Knowledge é um **PIPELINE DE MATURAÇÃO**: um artefato de conhecimento
 * cristaliza ao longo destes estágios, graduando de um para o próximo.
 *
 *   insight  →  decision  →  rule | guardrail  →  doctrine
 *   (bruto)     (decidível)   (norma enforçada)    (o "porquê" imutável)
 *
 * `rule` e `guardrail` são o **mesmo nível** de cristalização (norma enforçada);
 * diferem só na origem (`guardrail` = dogfood/interna). `Insight` é o estágio 0
 * — a única entidade já materializada; os demais entram nos próximos PRs
 * implementando o mesmo contrato ({@link KnowledgeArtifact}), sem refatorar este.
 */
export type KnowledgeStage = "insight" | "decision" | "rule" | "guardrail" | "doctrine";

export const KNOWLEDGE_STAGES: readonly KnowledgeStage[] = [
  "insight",
  "decision",
  "rule",
  "guardrail",
  "doctrine",
];

export function isKnowledgeStage(value: unknown): value is KnowledgeStage {
  return typeof value === "string" && (KNOWLEDGE_STAGES as readonly string[]).includes(value);
}

/** Ordem de cristalização (0 = insight). `rule` e `guardrail` empatam em 2. */
export function stageOrder(stage: KnowledgeStage): number {
  switch (stage) {
    case "insight":
      return 0;
    case "decision":
      return 1;
    case "rule":
    case "guardrail":
      return 2;
    case "doctrine":
      return 3;
  }
}

/** `candidate` é mais cristalizado (downstream) que `reference`? */
export function isDownstreamOf(candidate: KnowledgeStage, reference: KnowledgeStage): boolean {
  return stageOrder(candidate) > stageOrder(reference);
}

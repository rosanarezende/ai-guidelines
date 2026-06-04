import {
  isDownstreamOf,
  isKnowledgeStage,
  KNOWLEDGE_STAGES,
  stageOrder,
} from "./KnowledgeStage.js";

describe("KnowledgeStage (pipeline de maturação)", () => {
  it("ordena a cristalização: insight < decision < (rule = guardrail) < doctrine", () => {
    expect(stageOrder("insight")).toBe(0);
    expect(stageOrder("decision")).toBe(1);
    expect(stageOrder("rule")).toBe(stageOrder("guardrail"));
    expect(stageOrder("doctrine")).toBeGreaterThan(stageOrder("guardrail"));
  });

  it("reconhece downstream (mais cristalizado)", () => {
    expect(isDownstreamOf("doctrine", "insight")).toBe(true);
    expect(isDownstreamOf("insight", "doctrine")).toBe(false);
    expect(isDownstreamOf("rule", "guardrail")).toBe(false); // mesmo nível
  });

  it("valida estágios e fixa insight como o estágio 0", () => {
    expect(isKnowledgeStage("insight")).toBe(true);
    expect(isKnowledgeStage("backlog")).toBe(false);
    expect(KNOWLEDGE_STAGES[0]).toBe("insight");
  });
});

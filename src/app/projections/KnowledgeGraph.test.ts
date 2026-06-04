import { KnowledgeArtifact } from "../../domain/knowledge/KnowledgeArtifact.js";
import { KnowledgeGraph } from "./KnowledgeGraph.js";

const insightWithEdge: KnowledgeArtifact = {
  id: "PIT-0001",
  stage: "insight",
  graduatedTo: { stage: "guardrail", id: "GG-0003" },
};
const insightOpen: KnowledgeArtifact = { id: "PIT-0002", stage: "insight" };

describe("KnowledgeGraph (read-model do domínio Knowledge)", () => {
  it("deriva nós e arestas de graduação dos artefatos", () => {
    const graph = KnowledgeGraph.from([insightWithEdge, insightOpen]);
    expect(graph.nodeCount()).toBe(2);
    expect(graph.node("PIT-0001")).toEqual({ id: "PIT-0001", stage: "insight" });
    expect(graph.edges()).toHaveLength(1);
  });

  it("travessia downstream (outgoing): para onde X graduou", () => {
    const graph = KnowledgeGraph.from([insightWithEdge]);
    expect(graph.outgoing("PIT-0001")[0].to).toEqual({ stage: "guardrail", id: "GG-0003" });
    expect(graph.outgoing("PIT-9999")).toEqual([]);
  });

  it("travessia upstream (incoming): quem graduou para cá — mesmo sem nó-alvo materializado", () => {
    const graph = KnowledgeGraph.from([insightWithEdge]);
    expect(graph.incoming("GG-0003").map((e) => e.from)).toEqual(["PIT-0001"]);
    expect(graph.node("GG-0003")).toBeUndefined(); // alvo ainda não é um nó (entidade futura)
  });

  it("um artefato aberto não tem aresta", () => {
    const graph = KnowledgeGraph.from([insightOpen]);
    expect(graph.outgoing("PIT-0002")).toEqual([]);
    expect(graph.edges()).toEqual([]);
  });
});

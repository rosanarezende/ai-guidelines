import { Falsification, sealFalsification } from "../../domain/knowledge/Falsification.js";
import { KnowledgeArtifact } from "../../domain/knowledge/KnowledgeArtifact.js";
import { decisionArtifact, doctrineArtifact } from "../../domain/knowledge/typedArtifacts.js";
import { KnowledgeGraph } from "./KnowledgeGraph.js";

const insightWithEdge: KnowledgeArtifact = {
  id: "PIT-0001",
  stage: "insight",
  graduatedTo: { stage: "guardrail", id: "GG-0003" },
};
const insightOpen: KnowledgeArtifact = { id: "PIT-0002", stage: "insight" };

const falsification: Falsification = sealFalsification({
  id: "FAL-0001",
  claim: "claim derrubada",
  constrains: [{ space: "knowledge", ref: { stage: "decision", id: "DEC-0024-G07" } }],
  evidence: "git-tag:evidence/x",
  crystallizedAs: { stage: "insight", id: "PIT-0008" },
  falsifiesRef: { stage: "decision", id: "DEC-9999" },
});

describe("KnowledgeGraph (read-model do domínio Knowledge)", () => {
  it("deriva nós e arestas de graduação dos artefatos (nó é união discriminada)", () => {
    const graph = KnowledgeGraph.from([insightWithEdge, insightOpen]);
    expect(graph.nodeCount()).toBe(2);
    expect(graph.node("PIT-0001")).toEqual({ kind: "artifact", id: "PIT-0001", stage: "insight" });
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
    expect(graph.node("GG-0003")).toBeUndefined();
  });

  it("um artefato aberto não tem aresta", () => {
    const graph = KnowledgeGraph.from([insightOpen]);
    expect(graph.outgoing("PIT-0002")).toEqual([]);
    expect(graph.edges()).toEqual([]);
  });

  describe("eixo negativo (Falsification) — CO-2", () => {
    it("adiciona nó kind:falsification + arestas falsifies/constrains/crystallizedAs", () => {
      const graph = KnowledgeGraph.from([], [falsification]);
      expect(graph.node("FAL-0001")).toEqual({ kind: "falsification", id: "FAL-0001" });
      const rels = graph
        .outgoing("FAL-0001")
        .map((e) => e.relation)
        .sort();
      expect(rels).toEqual(["constrains", "crystallizedAs", "falsifies"]);
    });

    it("constrains aponta GovernedRef; incoming indexa pelo id do alvo", () => {
      const graph = KnowledgeGraph.from([], [falsification]);
      const constrains = graph.outgoing("FAL-0001").find((e) => e.relation === "constrains");
      expect(constrains?.to).toEqual({
        space: "knowledge",
        ref: { stage: "decision", id: "DEC-0024-G07" },
      });
      // a superfície constrangida é alcançável por incoming (mesmo sem nó materializado)
      expect(graph.incoming("DEC-0024-G07").map((e) => e.relation)).toContain("constrains");
    });

    it("grafo HETEROGÊNEO: insight + decision + doctrine + falsification coexistem", () => {
      const graph = KnowledgeGraph.from(
        [insightOpen, decisionArtifact("DEC-0024-G07"), doctrineArtifact("ADR-0026")],
        [falsification]
      );
      expect(graph.node("DEC-0024-G07")).toEqual({
        kind: "artifact",
        id: "DEC-0024-G07",
        stage: "decision",
      });
      expect(graph.node("ADR-0026")).toEqual({
        kind: "artifact",
        id: "ADR-0026",
        stage: "doctrine",
      });
      expect(graph.node("FAL-0001")?.kind).toBe("falsification");
      expect(graph.nodeCount()).toBe(4);
    });
  });
});

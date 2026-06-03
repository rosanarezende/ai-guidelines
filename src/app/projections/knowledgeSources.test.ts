import { OriginContext } from "../../domain/insight/Insight.js";
import { captureInsight, promoteInsight } from "../../domain/insight/InsightTransitions.js";
import { knowledgeGraphFromInsights } from "./knowledgeSources.js";

const ORIGIN: OriginContext = { spec: "0024", cursor: null };
const T = "2026-06-03T10:00:00Z";

describe("knowledgeSources (semeia o grafo das fontes operacionais)", () => {
  it("constrói o read-model a partir de Insights reais, com aresta de graduação", () => {
    const open = captureInsight({ text: "percepção ainda aberta", origin: ORIGIN }, "PIT-0001", T);
    const promoted = promoteInsight(
      captureInsight({ text: "percepção que graduou", origin: ORIGIN }, "PIT-0002", T),
      { kind: "guardrail", ref: "GG-0003" },
      T
    );

    const graph = knowledgeGraphFromInsights([open, promoted]);

    expect(graph.nodeCount()).toBe(2);
    // a graduação Insight→Guardrail já é navegável no grafo vivo:
    expect(graph.outgoing("PIT-0002")[0].to).toEqual({ stage: "guardrail", id: "GG-0003" });
    expect(graph.incoming("GG-0003").map((e) => e.from)).toEqual(["PIT-0002"]);
    expect(graph.outgoing("PIT-0001")).toEqual([]);
  });
});

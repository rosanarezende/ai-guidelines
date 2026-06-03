import { OriginContext } from "./Insight.js";
import {
  graduationRefOf,
  INSIGHT_STAGE,
  insightArtifact,
  promotionKindToStage,
} from "./insightKnowledge.js";
import { captureInsight, discardInsight, promoteInsight } from "./InsightTransitions.js";

const ORIGIN: OriginContext = { spec: "0024", cursor: null };
const T = "2026-06-03T10:00:00Z";

function captured() {
  return captureInsight({ text: "percepção de fundação longa", origin: ORIGIN }, "PIT-0001", T);
}

describe("Insight como estágio 0 do pipeline Knowledge", () => {
  it("um Insight aberto é o artefato de conhecimento no estágio insight, sem aresta", () => {
    expect(insightArtifact(captured())).toEqual({ id: "PIT-0001", stage: "insight" });
    expect(INSIGHT_STAGE).toBe("insight");
  });

  it("mapeia o vocabulário de promoção da CLI para estágios downstream", () => {
    expect(promotionKindToStage("adr")).toBe("doctrine");
    expect(promotionKindToStage("dec")).toBe("decision");
    expect(promotionKindToStage("guardrail")).toBe("guardrail");
    expect(promotionKindToStage("backlog")).toBeNull(); // gradua p/ Work, não Knowledge
  });

  it("deriva a aresta de graduação de um Insight promovido para o Knowledge", () => {
    const promoted = promoteInsight(captured(), { kind: "guardrail", ref: "GG-0003" }, T);
    expect(graduationRefOf(promoted)).toEqual({ stage: "guardrail", id: "GG-0003" });
    expect(insightArtifact(promoted).graduatedTo).toEqual({ stage: "guardrail", id: "GG-0003" });
  });

  it("graduação para backlog (Work) não é aresta de Knowledge", () => {
    const promoted = promoteInsight(captured(), { kind: "backlog", ref: "qualquer-coisa" }, T);
    expect(graduationRefOf(promoted)).toBeNull();
  });

  it("aberto/descartado não têm aresta de graduação", () => {
    expect(graduationRefOf(captured())).toBeNull();
    expect(graduationRefOf(discardInsight(captured(), "ruído", T))).toBeNull();
  });
});

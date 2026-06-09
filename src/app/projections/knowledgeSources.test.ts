import { OriginContext } from "../../domain/insight/Insight.js";
import { captureInsight, promoteInsight } from "../../domain/insight/InsightTransitions.js";
import { sealFalsification } from "../../domain/knowledge/Falsification.js";
import { KnowledgeBackfillEntry } from "../../domain/knowledge/KnowledgeBackfill.js";
import { Rule } from "../../domain/rules/Rule.js";
import {
  knowledgeGraphFromBackfill,
  knowledgeGraphFromInsights,
  knowledgeGraphFromRulesCatalog,
} from "./knowledgeSources.js";

const ORIGIN: OriginContext = { spec: "0024", cursor: null };
const T = "2026-06-03T10:00:00Z";

function rule(id: string, overrides: Partial<Rule> = {}): Rule {
  return {
    id,
    scope: "universal",
    category: "process",
    evidence_strength: "strong",
    sources: ["fixture"],
    applicable_languages: ["*"],
    tags: [],
    title: id,
    file: ".core/rules/top/agents-core.md",
    instruction_en: "fixture",
    ...overrides,
  };
}

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

  it("constrói o read-model mínimo a partir do inventário CO-2.1 + ledger de Falsifications", () => {
    const entries: KnowledgeBackfillEntry[] = [
      {
        id: "KB-0001",
        kind: "decision",
        ref: "decision:DEC-0024-G07",
        status: "done",
        priority: "P0",
        source: "decision-brief.md",
        rationale: "topologia como dado",
      },
      {
        id: "KB-0002",
        kind: "rule",
        ref: "rule:CORE-07",
        status: "done",
        priority: "P1",
        source: ".core/rules/top/agents-core.md",
        rationale: "push autonomo proibido",
      },
      {
        id: "KB-0003",
        kind: "guardrail",
        ref: "guardrail:GG-0002",
        status: "planned",
        priority: "P1",
        source: "state.yml",
        rationale: "banned concept planejado",
        deadline: "checkpoint-banned-concept",
      },
      {
        id: "KB-0004",
        kind: "doctrine",
        ref: "doctrine:ADR-0026",
        status: "done",
        priority: "P0",
        source: ".core/governance/adrs/0026-projection-distinct-from-first-class-entity.md",
        rationale: "projecao vs entidade",
      },
      {
        id: "KB-0005",
        kind: "falsification",
        ref: "falsification:FAL-0001",
        status: "done",
        priority: "P0",
        source: ".governance/runtime/falsifications/ledger.yml",
        rationale: "negativo de primeira classe",
      },
    ];
    const falsification = sealFalsification({
      id: "FAL-0001",
      claim: "claim derrubada",
      constrains: [{ space: "knowledge", ref: { stage: "decision", id: "DEC-0024-G07" } }],
      evidence: "git-tag:evidence/x",
    });

    const graph = knowledgeGraphFromBackfill(entries, [falsification]);

    expect(graph.node("DEC-0024-G07")).toEqual({
      kind: "artifact",
      id: "DEC-0024-G07",
      stage: "decision",
    });
    expect(graph.node("CORE-07")).toEqual({ kind: "artifact", id: "CORE-07", stage: "rule" });
    expect(graph.node("ADR-0026")).toEqual({
      kind: "artifact",
      id: "ADR-0026",
      stage: "doctrine",
    });
    expect(graph.node("GG-0002")).toBeUndefined(); // planned não vira nó materializado
    expect(graph.incoming("DEC-0024-G07").map((e) => e.relation)).toContain("constrains");
  });

  it("projeta RulesCatalog como Knowledge sem tratar AGENTS.md como fonte", () => {
    const graph = knowledgeGraphFromRulesCatalog([
      rule("CORE-07"),
      rule("OPT-0201", {
        scope: "opt-in",
        opt_in_feature: "bdd",
        file: ".core/rules/center/methodologies/bdd-pt.md",
      }),
      rule("ADP-0101", {
        scope: "adapter",
        adapter: "claude",
        file: ".core/rules/adapters/claude.md",
      }),
    ]);

    expect(graph.nodeCount()).toBe(3);
    expect(graph.node("CORE-07")).toEqual({ kind: "artifact", id: "CORE-07", stage: "rule" });
    expect(graph.node("OPT-0201")).toEqual({ kind: "artifact", id: "OPT-0201", stage: "rule" });
    expect(graph.node("ADP-0101")).toEqual({ kind: "artifact", id: "ADP-0101", stage: "rule" });
  });
});

import {
  knowledgeArtifactsFromBackfill,
  KnowledgeBackfillEntry,
  validateKnowledgeBackfill,
} from "./KnowledgeBackfill.js";

const validEntries: KnowledgeBackfillEntry[] = [
  {
    id: "KB-0001",
    kind: "insight",
    ref: "insight:PIT-0001",
    status: "done",
    priority: "P0",
    source: ".governance/runtime/insights.yml",
    rationale: "exemplo",
  },
  {
    id: "KB-0002",
    kind: "insight",
    ref: "insight:PIT-0008",
    status: "done",
    priority: "P0",
    source: ".governance/runtime/insights.yml",
    rationale: "exemplo",
  },
  {
    id: "KB-0003",
    kind: "decision",
    ref: "decision:DEC-0024-G07",
    status: "done",
    priority: "P0",
    source: "decision-brief.md",
    rationale: "exemplo",
  },
  {
    id: "KB-0004",
    kind: "decision",
    ref: "decision:DEC-0024-G08",
    status: "done",
    priority: "P0",
    source: "decision-brief.md",
    rationale: "exemplo",
  },
  {
    id: "KB-0005",
    kind: "rule",
    ref: "rule:CORE-07",
    status: "done",
    priority: "P1",
    source: ".core/rules/top/agents-core.md",
    rationale: "exemplo",
  },
  {
    id: "KB-0006",
    kind: "rule",
    ref: "rule:CORE-10",
    status: "done",
    priority: "P1",
    source: ".core/rules/top/agents-core.md",
    rationale: "exemplo",
  },
  {
    id: "KB-0013",
    kind: "rule",
    ref: "rule:OPT-0201",
    status: "done",
    priority: "P1",
    source: ".core/rules/center/methodologies/bdd-pt.md",
    rationale: "exemplo",
  },
  {
    id: "KB-0014",
    kind: "rule",
    ref: "rule:ADP-0101",
    status: "done",
    priority: "P1",
    source: ".core/rules/adapters/claude.md",
    rationale: "exemplo",
  },
  {
    id: "KB-0007",
    kind: "guardrail",
    ref: "guardrail:GG-0001",
    status: "done",
    priority: "P1",
    source: ".core/process/governance-foundation.md",
    rationale: "exemplo",
  },
  {
    id: "KB-0008",
    kind: "guardrail",
    ref: "guardrail:GG-0002",
    status: "planned",
    priority: "P1",
    source: "state.yml",
    rationale: "exemplo",
    deadline: "checkpoint-banned-concept",
  },
  {
    id: "KB-0009",
    kind: "doctrine",
    ref: "doctrine:ADR-0018",
    status: "done",
    priority: "P0",
    source: ".core/governance/adrs/0018-governance-first-ai-as-channel.md",
    rationale: "exemplo",
  },
  {
    id: "KB-0010",
    kind: "doctrine",
    ref: "doctrine:ADR-0026",
    status: "done",
    priority: "P0",
    source: ".core/governance/adrs/0026-projection-distinct-from-first-class-entity.md",
    rationale: "exemplo",
  },
  {
    id: "KB-0011",
    kind: "falsification",
    ref: "falsification:FAL-0001",
    status: "done",
    priority: "P0",
    source: ".governance/runtime/falsifications.yml",
    rationale: "exemplo",
  },
  {
    id: "KB-0012",
    kind: "falsification",
    ref: "falsification:FAL-0002",
    status: "done",
    priority: "P0",
    source: ".governance/runtime/falsifications.yml",
    rationale: "exemplo",
  },
];

describe("KnowledgeBackfill [BR-CO-KNOWLEDGE-BACKFILL]", () => {
  it("DADO dois exemplos por tipo ENTÃO valida sem violações", () => {
    expect(validateKnowledgeBackfill(validEntries)).toEqual([]);
  });

  it("DADO tipo sem dois exemplos ENTÃO reporta cobertura insuficiente", () => {
    const entries = validEntries.filter((entry) => entry.kind !== "doctrine");
    expect(validateKnowledgeBackfill(entries)).toContainEqual(
      expect.objectContaining({ code: "KB_KIND_UNDERREPRESENTED" })
    );
  });

  it("DADO planned sem deadline ENTÃO reporta débito invisível", () => {
    const entries = validEntries.map((entry) =>
      entry.id === "KB-0008" ? { ...entry, deadline: undefined } : entry
    );
    expect(validateKnowledgeBackfill(entries)).toContainEqual(
      expect.objectContaining({ code: "KB_PLANNED_WITHOUT_DEADLINE", entryId: "KB-0008" })
    );
  });

  it("DADO kind divergente da ref ENTÃO reporta mismatch", () => {
    const entries = validEntries.map((entry) =>
      entry.id === "KB-0003" ? { ...entry, kind: "doctrine" as const } : entry
    );
    expect(validateKnowledgeBackfill(entries)).toContainEqual(
      expect.objectContaining({ code: "KB_KIND_REF_MISMATCH", entryId: "KB-0003" })
    );
  });

  it("DADO backfill ENTÃO só entradas done do pipeline viram KnowledgeArtifact", () => {
    expect(knowledgeArtifactsFromBackfill(validEntries)).toEqual([
      { id: "PIT-0001", stage: "insight" },
      { id: "PIT-0008", stage: "insight" },
      { id: "DEC-0024-G07", stage: "decision" },
      { id: "DEC-0024-G08", stage: "decision" },
      { id: "CORE-07", stage: "rule" },
      { id: "CORE-10", stage: "rule" },
      { id: "OPT-0201", stage: "rule" },
      { id: "ADP-0101", stage: "rule" },
      { id: "GG-0001", stage: "guardrail" },
      { id: "ADR-0018", stage: "doctrine" },
      { id: "ADR-0026", stage: "doctrine" },
    ]);
  });
});

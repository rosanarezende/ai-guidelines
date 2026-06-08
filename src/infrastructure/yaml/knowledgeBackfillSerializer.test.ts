import {
  KnowledgeBackfillParseError,
  parseKnowledgeBackfill,
  serializeKnowledgeBackfill,
} from "./knowledgeBackfillSerializer.js";

describe("knowledgeBackfillSerializer [BR-CO-KNOWLEDGE-BACKFILL-SER]", () => {
  it("DADO inventário válido ENTÃO round-trip preserva campos", () => {
    const entries = parseKnowledgeBackfill(`version: 1
entries:
  - id: KB-0001
    kind: insight
    ref: insight:PIT-0001
    status: done
    priority: P0
    source: .governance/runtime/insights/open.yml
    rationale: exemplo
  - id: KB-0002
    kind: guardrail
    ref: guardrail:GG-0002
    status: planned
    priority: P1
    source: state.yml
    rationale: exemplo
    deadline: checkpoint-banned-concept
`);

    expect(parseKnowledgeBackfill(serializeKnowledgeBackfill(entries))).toEqual(entries);
  });

  it("DADO opcional ausente ENTÃO serializer omite deadline", () => {
    const text = serializeKnowledgeBackfill([
      {
        id: "KB-0001",
        kind: "insight",
        ref: "insight:PIT-0001",
        status: "done",
        priority: "P0",
        source: "x",
        rationale: "y",
      },
    ]);
    expect(text).not.toContain("deadline");
  });

  it("DADO chave desconhecida no root ENTÃO lança", () => {
    expect(() => parseKnowledgeBackfill("version: 1\nbogus: 1")).toThrow(
      KnowledgeBackfillParseError
    );
  });

  it("DADO chave desconhecida no registro ENTÃO lança", () => {
    const bad = `version: 1
entries:
  - id: KB-0001
    kind: insight
    ref: insight:PIT-0001
    status: done
    priority: P0
    source: x
    rationale: y
    bogus: z`;
    expect(() => parseKnowledgeBackfill(bad)).toThrow(/unexpected key/);
  });
});

import { OpenNextNodeDefinition } from "./openNextNode.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";

const def = new OpenNextNodeDefinition();

const SETTLED_GATE = {
  reviewDecisions: [],
  requiredReviewRoles: [],
  reviewStatuses: [],
  openFindings: 0,
  openBlocking: 0,
  closedFindings: 6,
  resolutions: 6,
  gateDecision: "approved",
} as const;

function postGateSnapshot(
  over: Partial<ReturnType<typeof makeDecisionSnapshot>> = {}
): ReturnType<typeof makeDecisionSnapshot> {
  const facts = makeHandoffFacts({
    cursor: { pr: "co-flow-convergence", checkpoint: "checkpoint-co-flow-convergence" },
    activeNode: {
      id: "co-flow-convergence",
      githubPr: 43,
      sequence: 10,
      terminal: false,
    },
    nextPlannedNode: {
      id: "co-capture",
      githubPr: null,
      sequence: 11,
      terminal: false,
    },
    git: {
      ...makeHandoffFacts().git,
      branch: "feat/spec-0024-co-flow-convergence",
      head: "abc1234",
      behind: 0,
      upstream: "origin/feat/spec-0024-co-flow-convergence",
    },
    pullRequest: {
      ...makeHandoffFacts().pullRequest!,
      number: 43,
      isDraft: false,
      headRefName: "feat/spec-0024-co-flow-convergence",
      baseRefName: "feat/spec-0024-co-enforcement",
      headRefOid: "abc1234",
      checks: { pass: 11, fail: 0, pending: 0 },
    },
    lifecycle: SETTLED_GATE,
  });
  return makeDecisionSnapshot({
    facts,
    checkpoint: "checkpoint-co-flow-convergence",
    specId: "0024",
    openFindings: [],
    lanes: [],
    subCheckpoints: [
      { id: "CO-10.1", title: "inventário", state: "done", line: 1 },
      { id: "CO-10.2", title: "convergência", state: "done", line: 2 },
      { id: "CO-10.3", title: "correções", state: "done", line: 3 },
    ],
    workingTreeState: "clean",
    gateExists: true,
    gateFile: ".governance/specs/0024-context-architecture/gates/c-co-flow-convergence.yml",
    ...over,
  });
}

describe("open-next-node · elegibilidade [decide]", () => {
  it("fica disponível após Human Gate aprovado, PR Ready, CI verde e próximo nó planejado sem PR", () => {
    const av = def.detect(postGateSnapshot());
    expect(av.status).toBe("available");
    expect(av.hint).toBe("co-flow-convergence pode transicionar para co-capture");
  });

  it("não se aplica antes de Human Gate aprovado", () => {
    const facts = makeHandoffFacts({
      lifecycle: { ...SETTLED_GATE, gateDecision: null },
    });
    const av = def.detect(postGateSnapshot({ facts }));
    expect(av.status).toBe("not-applicable");
    expect(av.reasons.join(" ")).toMatch(/Human Gate/);
  });

  it("bloqueia se o PR atual ainda está Draft ou CI pendente", () => {
    const base = postGateSnapshot();
    const facts = makeHandoffFacts({
      ...base.facts,
      pullRequest: {
        ...base.facts.pullRequest!,
        isDraft: true,
        checks: { pass: 10, fail: 0, pending: 1 },
      },
      lifecycle: SETTLED_GATE,
    });
    const av = def.detect(postGateSnapshot({ facts }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/Draft/);
    expect(av.reasons.join(" ")).toMatch(/pendente/);
  });

  it("bloqueia se o próximo nó já declara PR", () => {
    const base = postGateSnapshot();
    const facts = makeHandoffFacts({
      ...base.facts,
      nextPlannedNode: {
        id: "co-capture",
        githubPr: 44,
        sequence: 11,
        terminal: false,
      },
      lifecycle: SETTLED_GATE,
    });
    const av = def.detect(postGateSnapshot({ facts }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/já declara PR #44/);
  });
});

describe("open-next-node · briefing/preflight [decide]", () => {
  it("briefing disponível nomeia nó atual, próximo nó e efeitos planejados", () => {
    const brief = def.buildBrief(postGateSnapshot(), { technical: false });
    const text = JSON.stringify(brief.sections);
    expect(brief.status).toBe("available");
    expect(brief.summary).toContain("co-flow-convergence → co-capture");
    expect(text).toContain("Branch pretendida: feat/spec-0024-co-capture.");
    expect(text).toContain("Abrir PR Draft stacked contra a branch do nó aprovado.");
    expect(text).toContain("Materializar tasks.md do novo checkpoint");
  });

  it("prepare-plan é não-mutante e preserva state/tasks/active/branch/PR", () => {
    const plan = def.plan(postGateSnapshot(), "prepare-plan");
    expect(plan.mutating).toBe(false);
    expect(plan.changes).toEqual([]);
    expect(plan.preserved).toEqual([
      "state.yml inalterado",
      "tasks.md inalterado",
      "active.yml inalterado",
      "nenhum branch criado",
      "nenhum PR criado",
    ]);
    expect(plan.note.join(" ")).toMatch(/co-flow-convergence → co-capture/);
  });
});

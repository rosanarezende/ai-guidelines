import { deriveWorkBrief } from "../workBrief.js";
import { deriveGovernedFlow, derivePrReadyFlow } from "./GovernedFlow.js";
import { MarkReadinessDefinition } from "../decide/markReadiness.js";
import { AdvanceSubcheckpointDefinition } from "../decide/advanceSubcheckpoint.js";
import { HumanGateDefinition } from "../decide/humanGate.js";
import { OpenNextNodeDefinition } from "../decide/openNextNode.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";
import { parseWorkPolicy } from "../../infrastructure/yaml/workPolicyReader.js";
import { deriveNextAction } from "../handoffFacts.js";
import type { DecisionAvailability } from "../decide/model.js";

const POLICY = parseWorkPolicy(`
version: 1
modes:
  implement_checkpoint:
    purpose: "Implementar."
    allowed_actions: ["modify-functional-files"]
    forbidden_actions: ["ready", "human-gate", "merge"]
    validations: ["npm run validate"]
    publication:
      commit: explicit-work-request
      push: explicit-work-request
      mixed_scope: forbidden
    expects_resolutions: false
    pr_body_editable: true
    stop_conditions: ["done"]
    report_sections: ["Retomada"]
  prepare_subcheckpoint_transition:
    purpose: "Transição."
    allowed_actions: []
    forbidden_actions: ["human-gate", "merge"]
    validations: []
    publication:
      commit: forbidden
      push: forbidden
      mixed_scope: forbidden
    expects_resolutions: false
    pr_body_editable: false
    stop_conditions: ["transition"]
    report_sections: ["Retomada"]
  await_revalidation:
    purpose: "Aguardar."
    allowed_actions: []
    forbidden_actions: []
    validations: []
    publication:
      commit: forbidden
      push: forbidden
      mixed_scope: forbidden
    expects_resolutions: false
    pr_body_editable: false
    stop_conditions: ["wait"]
    report_sections: ["Retomada"]
  prepare_close:
    purpose: "Fechar."
    allowed_actions: []
    forbidden_actions: []
    validations: []
    publication:
      commit: forbidden
      push: forbidden
      mixed_scope: forbidden
    expects_resolutions: false
    pr_body_editable: true
    stop_conditions: ["close"]
    report_sections: ["Retomada"]
  current:
    purpose: "Atual."
    allowed_actions: []
    forbidden_actions: []
    validations: []
    publication:
      commit: forbidden
      push: forbidden
      mixed_scope: forbidden
    expects_resolutions: false
    pr_body_editable: false
    stop_conditions: ["current"]
    report_sections: ["Retomada"]
  resolve_findings:
    purpose: "Resolver."
    allowed_actions: []
    forbidden_actions: []
    validations: []
    publication:
      commit: explicit-work-request
      push: explicit-work-request
      mixed_scope: forbidden
    expects_resolutions: true
    pr_body_editable: false
    stop_conditions: ["resolve"]
    report_sections: ["Retomada"]
  blocked:
    purpose: "Bloqueado."
    allowed_actions: []
    forbidden_actions: []
    validations: []
    publication:
      commit: forbidden
      push: forbidden
      mixed_scope: forbidden
    expects_resolutions: false
    pr_body_editable: false
    stop_conditions: ["blocked"]
    report_sections: ["Retomada"]
`);

const GREEN = {
  reviewDecisions: [],
  requiredReviewRoles: [],
  reviewStatuses: [],
  openFindings: 0,
  openBlocking: 0,
  closedFindings: 6,
  resolutions: 6,
  gateDecision: null,
} as const;

const available: DecisionAvailability = { status: "available", reasons: [] };
const blockedNoReadiness: DecisionAvailability = {
  status: "blocked",
  reasons: [
    'CO-10.2 ainda não declarou seus critérios de saída satisfeitos (sem readiness "ready-for-transition" em tasks.md).',
  ],
};

function coFlowFacts(over: Partial<ReturnType<typeof makeHandoffFacts>> = {}) {
  return makeHandoffFacts({
    activeNode: { id: "co-flow-convergence", githubPr: 43, sequence: 10, terminal: false },
    cursor: { pr: "co-flow-convergence", checkpoint: "checkpoint-co-flow-convergence" },
    git: {
      ...makeHandoffFacts().git,
      branch: "feat/spec-0024-co-flow-convergence",
      head: "abc1234",
      upstream: "origin/feat/spec-0024-co-flow-convergence",
    },
    pullRequest: {
      ...makeHandoffFacts().pullRequest!,
      number: 43,
      isDraft: true,
      checks: { pass: 5, fail: 0, pending: 0 },
      headRefOid: "abc1234",
      headRefName: "feat/spec-0024-co-flow-convergence",
      baseRefName: "feat/spec-0024-co-enforcement",
    },
    lifecycle: GREEN,
    subCheckpoints: [
      { id: "CO-10.1", title: "inventário", state: "done", line: 100 },
      { id: "CO-10.2", title: "confronto modelo x codigo", state: "in-progress", line: 101 },
      { id: "CO-10.3", title: "correcao integral", state: "pending", line: 102 },
    ],
    ...over,
  });
}

describe("GovernedFlow", () => {
  it("cockpit/work/decide concordam que readiness é a próxima ação disponível", () => {
    const facts = coFlowFacts();
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      subCheckpoints: facts.subCheckpoints,
      workingTreeState: "clean",
      gateExists: false,
    });

    const flow = deriveGovernedFlow(snapshot);
    const work = deriveWorkBrief({
      facts,
      nextAction: deriveNextAction(facts),
      findings: [],
      policy: POLICY,
      workingTreeState: "clean",
      authorization: null,
      advanceEligibility: blockedNoReadiness,
      markReadinessEligibility: available,
    });

    expect(flow.recommended?.id).toBe("mark-readiness");
    expect(flow.humanSummary.nextAction).toBe("Declarar readiness do sub-checkpoint ativo");
    expect(flow.humanSummary.missing).toContain(
      "Falta declarar readiness do sub-checkpoint ativo."
    );
    expect(flow.humanSummary.ready).toEqual(
      expect.arrayContaining([
        "Os findings do checkpoint estao fechados.",
        "A working tree esta limpa.",
        "A CI esta verde.",
      ])
    );
    expect(work.nextAction.decisionType).toBe("mark-readiness");
    expect(new MarkReadinessDefinition().detect(snapshot).status).toBe("available");
    expect(new AdvanceSubcheckpointDefinition().detect(snapshot).status).toBe("blocked");
  });

  it("bloqueia readiness quando o sub-checkpoint ativo não tem commit de entrega após ativação", () => {
    const facts = coFlowFacts({
      subCheckpoints: [
        { id: "CO-10.1", title: "inventário", state: "done", line: 100 },
        { id: "CO-10.2", title: "confronto modelo x codigo", state: "done", line: 101 },
        { id: "CO-10.3", title: "correcao integral", state: "in-progress", line: 102 },
      ],
    });
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      subCheckpoints: facts.subCheckpoints,
      workingTreeState: "clean",
      gateExists: false,
      subCheckpointDeliveryEvidence: {
        status: "missing",
        activeId: "CO-10.3",
        activationCommit: "bc9278b",
        reason:
          "CO-10.3 acabou de ser ativado e ainda não há commit de entrega depois da ativação.",
      },
    });

    const flow = deriveGovernedFlow(snapshot);
    const mark = new MarkReadinessDefinition().detect(snapshot);

    expect(mark.status).toBe("blocked");
    expect(mark.reasons.join(" ")).toMatch(/ainda não há commit de entrega/);
    expect(flow.recommended?.id).not.toBe("mark-readiness");
    expect(
      flow.blocked.find((a) => a.id === "mark-readiness")?.availability.reasons.join(" ")
    ).toMatch(/CO-10\.3 acabou de ser ativado/);
  });

  it("work e decide bloqueiam advance sem readiness", () => {
    const facts = coFlowFacts();
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      subCheckpoints: facts.subCheckpoints,
    });
    const advance = new AdvanceSubcheckpointDefinition().detect(snapshot);
    const work = deriveWorkBrief({
      facts,
      nextAction: deriveNextAction(facts),
      findings: [],
      policy: POLICY,
      workingTreeState: "clean",
      authorization: null,
      advanceEligibility: advance,
      markReadinessEligibility: { status: "blocked", reasons: ["implementation not ready"] },
    });

    expect(advance.status).toBe("blocked");
    expect(work.nextAction.decisionType).toBe("advance-subcheckpoint");
    expect(work.nextAction.commands).toHaveLength(1);
    expect(work.nextAction.commands[0].role).toBe("read-only");
  });

  it("findings abertos e CI pendente bloqueiam readiness pela fonte comum", () => {
    const facts = coFlowFacts({
      lifecycle: { ...GREEN, openFindings: 1, openBlocking: 1 },
      pullRequest: {
        ...makeHandoffFacts().pullRequest!,
        number: 43,
        isDraft: true,
        checks: { pass: 4, fail: 0, pending: 1 },
        headRefOid: "abc1234",
      },
    });
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [
        {
          ...makeDecisionSnapshot().openFindings[0],
          blocking: true,
          resolution: null,
          verified: false,
        },
      ],
      subCheckpoints: facts.subCheckpoints,
    });
    const action = deriveGovernedFlow(snapshot).actions.find((a) => a.id === "mark-readiness")!;

    expect(action.availability.status).toBe("blocked");
    expect(action.availability.reasons.join(" ")).toMatch(/finding bloqueante/);
    expect(action.availability.reasons.join(" ")).toMatch(/pendente/);
  });

  it("Human Gate fica bloqueado antes de Ready e sem readiness terminal", () => {
    const facts = coFlowFacts();
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      subCheckpoints: facts.subCheckpoints,
    });
    const gate = new HumanGateDefinition().detect(snapshot);

    expect(gate.status).toBe("blocked");
    expect(gate.reasons.join(" ")).toMatch(/CO-10\.3 ainda está aberto/);
    expect(gate.reasons.join(" ")).toMatch(/PR #43 continua Draft/);
  });

  it("PR Ready usa o mesmo fluxo para CI, tree, reviews e smoke suspension", () => {
    const result = derivePrReadyFlow({
      prNumber: 43,
      prState: "OPEN",
      prDraft: true,
      readyBodyContractReasons: [],
      smokeTestsSuspended: true,
      checks: [{ name: "validate", bucket: "pending" }],
      localHeadSha: "abc1234",
      prHeadRefOid: "abc1234",
      workingTreeClean: false,
      checkpoint: {
        id: "checkpoint-co-flow-convergence",
        gateDecision: null,
        openBlockingCount: 0,
        reviewStatuses: [],
      },
    });

    expect(result.failures.join(" ")).toMatch(/smoke tests/);
    expect(result.failures.join(" ")).toMatch(/pendente/);
    expect(result.failures.join(" ")).toMatch(/working tree/);
  });

  it("último sub-checkpoint pronto não recomenda advance-subcheckpoint", () => {
    const facts = coFlowFacts({
      subCheckpoints: [
        { id: "CO-10.1", title: "inventário", state: "done", line: 100 },
        {
          id: "CO-10.2",
          title: "confronto",
          state: "in-progress",
          line: 101,
          readiness: "ready-for-transition",
        },
      ],
    });
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      subCheckpoints: facts.subCheckpoints,
    });

    expect(new AdvanceSubcheckpointDefinition().detect(snapshot).status).toBe("not-applicable");
    expect(deriveGovernedFlow(snapshot).recommended?.id).not.toBe("advance-subcheckpoint");
  });

  it("pós-Human Gate recomenda open-next-node pela mesma fonte que decide", () => {
    const facts = coFlowFacts({
      lifecycle: { ...GREEN, gateDecision: "approved" },
      pullRequest: {
        ...makeHandoffFacts().pullRequest!,
        number: 43,
        isDraft: false,
        checks: { pass: 11, fail: 0, pending: 0 },
        headRefOid: "abc1234",
        headRefName: "feat/spec-0024-co-flow-convergence",
        baseRefName: "feat/spec-0024-co-enforcement",
      },
      nextPlannedNode: {
        id: "co-capture",
        githubPr: null,
        sequence: 11,
        terminal: false,
      },
      subCheckpoints: [
        { id: "CO-10.1", title: "inventário", state: "done", line: 100 },
        { id: "CO-10.2", title: "confronto", state: "done", line: 101 },
        { id: "CO-10.3", title: "correções", state: "done", line: 102 },
      ],
    });
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      lanes: [],
      subCheckpoints: facts.subCheckpoints,
      gateExists: true,
      workingTreeState: "clean",
    });

    const flow = deriveGovernedFlow(snapshot);
    const decide = new OpenNextNodeDefinition().detect(snapshot);

    expect(decide.status).toBe("available");
    expect(flow.recommended?.id).toBe("open-next-node");
    expect(flow.recommended?.availability).toEqual(decide);
    expect(flow.recommended?.mutatingCommand).toContain(
      "--type open-next-node --decision open-node"
    );
  });
});

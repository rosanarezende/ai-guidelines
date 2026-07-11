import { deriveWorkBrief } from "../workBrief.js";
import { deriveGovernedFlow, derivePrReadyFlow } from "./GovernedFlow.js";
import { FinishStepDefinition } from "../decide/finishStep.js";
import { MarkReadinessDefinition } from "../decide/markReadiness.js";
import { AdvanceStepDefinition } from "../decide/advanceStep.js";
import { HumanGateDefinition } from "../decide/humanGate.js";
import { OpenNextTopologyNodeDefinition } from "../decide/openNextTopologyNode.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";
import { parseWorkPolicy } from "../../infrastructure/yaml/workPolicyReader.js";
import { STEP_READINESS, deriveNextAction } from "../handoffFacts.js";
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
  prepare_step_transition:
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
    steps: [
      { id: "CO-10.1", title: "inventário", state: "done", line: 100 },
      {
        id: "CO-10.2",
        title: "confronto modelo x codigo",
        state: "in-progress",
        readiness: STEP_READINESS,
        line: 101,
      },
      { id: "CO-10.3", title: "correcao integral", state: "pending", line: 102 },
    ],
    ...over,
  });
}

describe("GovernedFlow", () => {
  it("cockpit/work/decide concordam que finish-step é a próxima ação interna disponível", () => {
    const facts = coFlowFacts();
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      steps: facts.steps,
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
      finishStepEligibility: available,
      markReadinessEligibility: available,
    });

    expect(flow.recommended?.id).toBe("finish-step");
    expect(flow.humanSummary.nextAction).toBe("Encerrar CO-10.2 e iniciar CO-10.3.");
    expect(flow.humanSummary.missing).toContain(
      "Falta registrar a decisão governada que encerra CO-10.2 e ativa CO-10.3."
    );
    expect(flow.humanSummary.ready).toEqual(
      expect.arrayContaining([
        "Os findings do checkpoint estão fechados.",
        "A working tree está limpa.",
        "CI 5 ok, 0 falha(s), 0 pendente(s).",
      ])
    );
    expect(work.nextAction.decisionType).toBe("finish-step");
    expect(new FinishStepDefinition().detect(snapshot).status).toBe("available");
    expect(new MarkReadinessDefinition().detect(snapshot).status).toBe("blocked");
    expect(new AdvanceStepDefinition().detect(snapshot).status).toBe("available");
  });

  it("HumanSummary explica o escopo do objeto atual e do proxima etapa", () => {
    const facts = coFlowFacts({
      steps: [
        { id: "CO-10.1", title: "inventário", state: "done", line: 100 },
        {
          id: "CO-10.2",
          title: "confronto modelo x codigo",
          state: "in-progress",
          line: 101,
          text: "- [/] **CO-10.2 — confronto modelo x codigo**: comparar a maquina de estados canonica com os comandos vivos. **Entradas:** inventario, state.yml e comandos. **Saída:** matriz modelo x codigo com divergencias classificadas.",
        },
        {
          id: "CO-10.3",
          title: "correcao integral",
          state: "pending",
          line: 102,
          text: "- [ ] **CO-10.3 — correcao integral**: corrigir divergencias reais ainda classificadas em CO-10.2 sem criar segunda SSOT. **Entradas:** matriz CO-10.2 atualizada. **Saída:** runtime/checks/docs convergindo em snapshot comum.",
        },
      ],
    });
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      steps: facts.steps,
      workingTreeState: "clean",
      gateExists: false,
    });

    const summary = deriveGovernedFlow(snapshot).humanSummary;

    expect(summary.currentObject).toEqual({
      label: "CO-10.2 — confronto modelo x codigo",
      objective: "Comparar a maquina de estados canonica com os comandos vivos.",
      output: "matriz modelo x codigo com divergencias classificadas.",
      decisions: [],
    });
    expect(summary.nextObject).toEqual({
      label: "CO-10.3 — correcao integral",
      objective:
        "Corrigir divergencias reais ainda classificadas em CO-10.2 sem criar segunda SSOT.",
      output: "runtime/checks/docs convergindo em snapshot comum.",
      decisions: [],
    });
    expect(summary.nextObjects?.map((object) => object.label)).toEqual([
      "CO-10.3 — correcao integral",
    ]);
  });

  it("sinaliza percepções recorrentes como ação visível sem transformar em mutação", () => {
    const facts = coFlowFacts({
      insights: [
        {
          id: "PIT-0011",
          excerpt: "Contrato executavel invisivel ainda produz ritual manual",
          occurrenceCount: 7,
          graduationCandidate: true,
          currentContext: false,
        },
      ],
    });
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      steps: facts.steps,
      workingTreeState: "clean",
      gateExists: false,
    });

    const flow = deriveGovernedFlow(snapshot);
    const action = flow.available.find((item) => item.id === "review-insight-candidates");

    expect(action?.title).toBe("Ver percepções recorrentes que precisam de decisão");
    expect(action?.command).toBe("npm run flow -- insight list");
    expect(action?.mutatingCommand).toBeUndefined();
    expect(action?.availability.hint).toContain("1 percepção");
  });

  it("bloqueia readiness quando a etapa ativa não tem commit de entrega após ativação", () => {
    const facts = coFlowFacts({
      steps: [
        { id: "CO-10.1", title: "inventário", state: "done", line: 100 },
        { id: "CO-10.2", title: "confronto modelo x codigo", state: "done", line: 101 },
        { id: "CO-10.3", title: "correcao integral", state: "in-progress", line: 102 },
      ],
    });
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      steps: facts.steps,
      workingTreeState: "clean",
      gateExists: false,
      stepDeliveryEvidence: {
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

  it("work continua implementação quando etapa ativa ainda não declarou readiness", () => {
    const facts = coFlowFacts({
      steps: [
        { id: "CO-10.1", title: "inventário", state: "done", line: 100 },
        {
          id: "CO-10.2",
          title: "confronto modelo x codigo",
          state: "in-progress",
          line: 101,
        },
        { id: "CO-10.3", title: "correcao integral", state: "pending", line: 102 },
      ],
    });
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      steps: facts.steps,
    });
    const advance = new AdvanceStepDefinition().detect(snapshot);
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
    expect(work.nextAction.decisionType).toBeNull();
    expect(work.nextAction.description).toBe(
      "Implementar o checkpoint ativo CO-10.2 — confronto modelo x codigo."
    );
    expect(work.nextAction.commands).toHaveLength(0);
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
      steps: facts.steps,
    });
    const action = deriveGovernedFlow(snapshot).actions.find((a) => a.id === "mark-readiness")!;

    expect(action.availability.status).toBe("blocked");
    expect(action.availability.reasons.join(" ")).toMatch(/finding bloqueante/);
    expect(action.availability.reasons.join(" ")).toMatch(/pendente/);
  });

  it("HumanSummary traduz CI pendente como proxima acao de espera", () => {
    const facts = coFlowFacts({
      pullRequest: {
        ...makeHandoffFacts().pullRequest!,
        number: 43,
        isDraft: true,
        checks: { pass: 1, fail: 0, pending: 3 },
        headRefOid: "abc1234",
      },
    });
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      steps: facts.steps,
      workingTreeState: "clean",
    });

    const summary = deriveGovernedFlow(snapshot).humanSummary;

    expect(summary.nextAction).toBe("Aguardar a CI terminar.");
    expect(summary.missing).toContain("A CI tem 3 check(s) pendente(s).");
  });

  it("Human Gate fica bloqueado antes de Ready e sem readiness terminal", () => {
    const facts = coFlowFacts();
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-convergence",
      openFindings: [],
      steps: facts.steps,
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

  it("PR Ready bloqueia quando o plano situado de reviews ainda tem decisão humana pendente", () => {
    const result = derivePrReadyFlow({
      prNumber: 45,
      prState: "OPEN",
      prDraft: true,
      readyBodyContractReasons: [],
      smokeTestsSuspended: false,
      smokeRequired: false,
      checks: [{ name: "validate", bucket: "pass" }],
      localHeadSha: "abc1234",
      prHeadRefOid: "abc1234",
      workingTreeClean: true,
      checkpoint: {
        id: "checkpoint-artifact-taxonomy-and-model-review-contract",
        gateDecision: null,
        openBlockingCount: 0,
        reviewPlanDecisionReasons: [
          "technical_audit: decisão humana pendente (sistema recomendou recommended).",
        ],
        reviewStatuses: [],
      },
    });

    expect(result.failures.join(" ")).toContain("plano de revisão do PR");
    expect(result.failures.join(" ")).toContain("technical_audit");
  });

  it("última etapa pronta não recomenda advance-step", () => {
    const facts = coFlowFacts({
      steps: [
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
      steps: facts.steps,
    });

    expect(new AdvanceStepDefinition().detect(snapshot).status).toBe("not-applicable");
    expect(deriveGovernedFlow(snapshot).recommended?.id).not.toBe("advance-step");
  });

  it("pós-Human Gate recomenda open-next-topology-node pela mesma fonte que decide", () => {
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
      steps: [
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
      steps: facts.steps,
      gateExists: true,
      workingTreeState: "clean",
    });

    const flow = deriveGovernedFlow(snapshot);
    const decide = new OpenNextTopologyNodeDefinition().detect(snapshot);

    expect(decide.status).toBe("available");
    expect(flow.recommended?.id).toBe("open-next-topology-node");
    expect(flow.recommended?.availability).toEqual(decide);
    expect(flow.recommended?.mutatingCommand).toContain(
      "--type open-next-topology-node --decision open-node"
    );
  });

  it("pós-Human Gate não recomenda abrir nó topológico quando há checkpoint semântico pendente", () => {
    const facts = coFlowFacts({
      lifecycle: { ...GREEN, gateDecision: "approved" },
      pullRequest: {
        ...makeHandoffFacts().pullRequest!,
        number: 44,
        isDraft: false,
        checks: { pass: 11, fail: 0, pending: 0 },
        headRefOid: "def5678",
        headRefName: "feat/spec-0024-co-flow-continuation",
        baseRefName: "feat/spec-0024-co-flow-convergence",
      },
      nextPlannedNode: {
        id: "dualroot-collapse",
        githubPr: null,
        sequence: 12,
        terminal: false,
      },
      steps: [
        { id: "drift-diagnosis-and-repair", title: "Governance Doctor", state: "done", line: 126 },
        {
          id: "lifecycle-model-and-artifact-taxonomy-decision",
          title: "mapa e inventário",
          state: "done",
          line: 127,
        },
        {
          id: "artifact-taxonomy-and-model-review-contract",
          title: "implementação robusta da taxonomia",
          state: "pending",
          line: 128,
        },
      ],
    });
    const snapshot = makeDecisionSnapshot({
      facts,
      checkpoint: "checkpoint-co-flow-continuation",
      openFindings: [],
      lanes: [],
      steps: facts.steps,
      gateExists: true,
      workingTreeState: "clean",
    });

    const flow = deriveGovernedFlow(snapshot);
    const decide = new OpenNextTopologyNodeDefinition().detect(snapshot);
    const plan = new OpenNextTopologyNodeDefinition().plan(snapshot, "open-node");

    expect(decide.status).toBe("blocked");
    expect(decide.reasons.join(" ")).toContain("artifact-taxonomy-and-model-review-contract");
    expect(flow.recommended?.id).not.toBe("open-next-topology-node");
    expect(plan.mutating).toBe(false);
    expect(plan.note.join(" ")).toContain("artifact-taxonomy-and-model-review-contract");
  });
});

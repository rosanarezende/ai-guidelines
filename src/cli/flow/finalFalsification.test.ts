import { deriveWorkBrief } from "../workBrief.js";
import { deriveHandoff } from "../handoffFacts.js";
import { AdvanceStepDefinition } from "../decide/advanceStep.js";
import { FinishStepDefinition } from "../decide/finishStep.js";
import { HumanGateDefinition } from "../decide/humanGate.js";
import { MarkReadinessDefinition } from "../decide/markReadiness.js";
import { OpenNextTopologyNodeDefinition } from "../decide/openNextTopologyNode.js";
import { deriveGovernedFlow, derivePrReadyFlow } from "./GovernedFlow.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";
import { parseWorkPolicy } from "../../infrastructure/yaml/workPolicyReader.js";
import type { HandoffFacts, HandoffStep } from "../handoffFacts.js";
import type { DecisionSnapshot } from "../decide/snapshot.js";
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
    purpose: "Transicao."
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

const SETTLED = {
  reviewDecisions: [],
  requiredReviewRoles: [],
  reviewStatuses: [],
  openFindings: 0,
  openBlocking: 0,
  closedFindings: 6,
  resolutions: 6,
  gateDecision: null,
} as const;

function coFlowFacts(over: Partial<HandoffFacts> = {}): HandoffFacts {
  return makeHandoffFacts({
    activeNode: { id: "co-flow-convergence", githubPr: 43, sequence: 10, terminal: false },
    nextPlannedNode: { id: "co-capture", githubPr: null, sequence: 11, terminal: false },
    cursor: { pr: "co-flow-convergence", checkpoint: "checkpoint-co-flow-convergence" },
    git: {
      ...makeHandoffFacts().git,
      branch: "feat/spec-0024-co-flow-convergence",
      head: "54da3bb",
      behind: 0,
      upstream: "origin/feat/spec-0024-co-flow-convergence",
    },
    pullRequest: {
      ...makeHandoffFacts().pullRequest!,
      number: 43,
      isDraft: true,
      checks: { pass: 4, fail: 0, pending: 0 },
      headRefOid: "54da3bb",
      headRefName: "feat/spec-0024-co-flow-convergence",
      baseRefName: "feat/spec-0024-co-enforcement",
    },
    lifecycle: SETTLED,
    steps: [
      { id: "CO-10.1", title: "inventario real + modelo canonico", state: "done", line: 109 },
      { id: "CO-10.2", title: "convergencia coesa inicial", state: "done", line: 110 },
      { id: "CO-10.3", title: "correcao integral dos gaps", state: "done", line: 111 },
      { id: "CO-10.4", title: "dogfood ponta a ponta", state: "done", line: 112 },
      { id: "CO-10.5", title: "UX e linguagem humana", state: "done", line: 113 },
      { id: "CO-10.6", title: "falsificacao + Human Gate", state: "in-progress", line: 114 },
    ],
    ...over,
  });
}

function snapshot(
  over: {
    readonly facts?: HandoffFacts;
    readonly steps?: readonly HandoffStep[];
    readonly workingTreeState?: DecisionSnapshot["workingTreeState"];
    readonly gateExists?: boolean;
    readonly prReady?: DecisionSnapshot["prReady"];
    readonly gateDecidability?: DecisionSnapshot["gateDecidability"];
    readonly stepDeliveryEvidence?: DecisionSnapshot["stepDeliveryEvidence"];
  } = {}
): DecisionSnapshot {
  const facts = over.facts ?? coFlowFacts();
  const active = facts.steps.find((item) => item.state === "in-progress");
  return makeDecisionSnapshot({
    facts,
    specId: "0024",
    checkpoint: "checkpoint-co-flow-convergence",
    openFindings: [],
    lanes: [],
    steps: over.steps ?? facts.steps,
    workingTreeState: over.workingTreeState ?? "clean",
    gateExists: over.gateExists ?? false,
    prReady: over.prReady ?? null,
    gateDecidability: over.gateDecidability ?? null,
    stepDeliveryEvidence: over.stepDeliveryEvidence ?? {
      status: "missing",
      activeId: active?.id ?? "(sem ativo)",
      activationCommit: "54da3bb",
      reason: `${active?.id ?? "etapa"} acabou de ser ativado e ainda não há commit de entrega depois da ativação.`,
    },
  });
}

function deriveWorkFor(snapshotValue: DecisionSnapshot) {
  const handoff = deriveHandoff(snapshotValue.facts);
  return deriveWorkBrief({
    facts: snapshotValue.facts,
    nextAction: handoff.nextAction,
    findings: [],
    policy: POLICY,
    workingTreeState: snapshotValue.workingTreeState,
    authorization: null,
    advanceEligibility: new AdvanceStepDefinition().detect(snapshotValue),
    finishStepEligibility: new FinishStepDefinition().detect(snapshotValue),
    markReadinessEligibility: new MarkReadinessDefinition().detect(snapshotValue),
  });
}

function actionStatus(
  snapshotValue: DecisionSnapshot,
  id: "finish-step" | "mark-readiness" | "advance-step" | "human-gate" | "open-next-topology-node"
): DecisionAvailability["status"] {
  const action = deriveGovernedFlow(snapshotValue).actions.find((item) => item.id === id);
  if (!action) throw new Error(`acao ausente: ${id}`);
  return action.availability.status;
}

describe("CO-10.6 final falsification — fluxo governado ponta a ponta", () => {
  it("estado recém-ativado: flow, work e decide concordam que CO-10.6 deve ser implementado", () => {
    const s = snapshot({
      steps: coFlowFacts().steps,
    });

    const flow = deriveGovernedFlow(s);
    const work = deriveWorkFor(s);
    const markReadiness = new MarkReadinessDefinition().detect(s);
    const humanGate = new HumanGateDefinition().detect(s);

    expect(flow.recommended).toBeNull();
    expect(flow.humanSummary.nextAction).toBe("Nenhuma decisão mutante está disponível agora.");
    expect(work.mode).toBe("implement_checkpoint");
    expect(work.object.step?.id).toBe("CO-10.6");
    expect(work.nextAction.decisionType).toBeNull();
    expect(markReadiness.status).toBe("blocked");
    expect(markReadiness.reasons.join(" ")).toMatch(/não há commit de entrega depois da ativação/);
    expect(humanGate.status).toBe("blocked");
    expect(humanGate.reasons.join(" ")).toMatch(/CO-10\.6 ainda não declarou readiness/);
  });

  it("CO-10.6 entregue mas sem readiness: a única ação recomendada vira declarar readiness terminal", () => {
    const s = snapshot({
      steps: coFlowFacts().steps,
    });
    const withDelivery = makeDecisionSnapshot({
      ...s,
      stepDeliveryEvidence: {
        status: "present",
        activeId: "CO-10.6",
        activationCommit: "54da3bb",
        commitsAfterActivation: 1,
      },
    });

    const flow = deriveGovernedFlow(withDelivery);
    const work = deriveWorkFor(withDelivery);

    expect(flow.recommended?.id).toBe("mark-readiness");
    expect(flow.humanSummary.nextAction).toBe("Declarar que CO-10.6 está pronto para transição.");
    expect(work.nextAction.decisionType).toBe("mark-readiness");
    expect(actionStatus(withDelivery, "advance-step")).toBe("not-applicable");
    expect(actionStatus(withDelivery, "human-gate")).toBe("blocked");
  });

  it("readiness terminal + PR Draft: work e decide bloqueiam Human Gate por Ready, não por advance interno", () => {
    const terminalReady = coFlowFacts({
      steps: [
        ...coFlowFacts().steps.slice(0, 5),
        {
          id: "CO-10.6",
          title: "falsificacao + Human Gate",
          state: "in-progress",
          line: 114,
          readiness: "ready-for-transition",
        },
      ],
    });
    const s = snapshot({ facts: terminalReady, steps: terminalReady.steps });

    const flow = deriveGovernedFlow(s);
    const work = deriveWorkFor(s);
    const advance = new AdvanceStepDefinition().detect(s);
    const humanGate = new HumanGateDefinition().detect(s);

    expect(advance.status).toBe("not-applicable");
    expect(flow.recommended).toBeNull();
    expect(work.mode).toBe("prepare_close");
    expect(work.nextAction.decisionType).toBe("human-gate");
    expect(work.nextAction.commands).toEqual([
      {
        role: "read-only",
        label: "Inspecionar por que a decisão ainda está bloqueada (zero escrita)",
        command: "npm run flow -- decide --type human-gate --brief-only",
      },
    ]);
    expect(humanGate.status).toBe("blocked");
    expect(humanGate.reasons.join(" ")).toMatch(/PR #43 continua Draft/);
    expect(humanGate.reasons.join(" ")).not.toMatch(/advance-step/);
  });

  it("PR Ready + readiness terminal + checks verdes: Human Gate fica disponível e pr-ready compartilha CI/tree/reviews", () => {
    const readyFacts = coFlowFacts({
      pullRequest: {
        ...coFlowFacts().pullRequest!,
        isDraft: false,
        checks: { pass: 4, fail: 0, pending: 0 },
      },
      steps: [
        ...coFlowFacts().steps.slice(0, 5),
        {
          id: "CO-10.6",
          title: "falsificacao + Human Gate",
          state: "in-progress",
          line: 114,
          readiness: "ready-for-transition",
        },
      ],
    });
    const s = snapshot({
      facts: readyFacts,
      steps: readyFacts.steps,
      prReady: { ok: true, summary: "verde" },
      gateDecidability: { ok: true, summary: "verde" },
    });

    const flow = deriveGovernedFlow(s);
    const work = deriveWorkFor(s);
    const gate = new HumanGateDefinition().detect(s);
    const ready = derivePrReadyFlow({
      prNumber: 43,
      prState: "OPEN",
      prDraft: false,
      readyBodyContractReasons: [],
      smokeTestsSuspended: false,
      checks: [{ name: "smoke", bucket: "pass" }],
      localHeadSha: "54da3bb",
      prHeadRefOid: "54da3bb",
      workingTreeClean: true,
      checkpoint: {
        id: "checkpoint-co-flow-convergence",
        gateDecision: null,
        openBlockingCount: 0,
        reviewStatuses: [],
      },
    });

    expect(gate.status).toBe("available");
    expect(flow.recommended?.id).toBe("human-gate");
    expect(work.mode).toBe("current");
    expect(work.nextAction.decisionType).toBe("human-gate");
    expect(ready.failures).toEqual([]);
  });

  it("reviews opcionais/recomendadas são sugeridas antes do Human Gate sem bloquear a decisão", () => {
    const readyFacts = coFlowFacts({
      lifecycle: {
        ...SETTLED,
        reviewStatuses: [
          {
            typeId: "technical_audit",
            requirement: "optional",
            applicability: "yes",
            state: "stale",
            decision: "approved",
            blocking: false,
            source: "checkpoint-policy",
          },
          {
            typeId: "security_review",
            requirement: "recommended",
            applicability: "yes",
            state: "missing",
            decision: null,
            blocking: false,
            source: "checkpoint-policy",
          },
        ],
      },
      pullRequest: {
        ...coFlowFacts().pullRequest!,
        isDraft: false,
        checks: { pass: 4, fail: 0, pending: 0 },
      },
      steps: [
        ...coFlowFacts().steps.slice(0, 5),
        {
          id: "CO-10.6",
          title: "falsificacao + Human Gate",
          state: "done",
          line: 114,
        },
      ],
    });
    const s = snapshot({
      facts: readyFacts,
      steps: readyFacts.steps,
      prReady: { ok: true, summary: "verde" },
      gateDecidability: { ok: true, summary: "verde" },
    });

    const flow = deriveGovernedFlow(s);
    const gate = new HumanGateDefinition().detect(s);
    const advisory = flow.actions.find((action) => action.id === "request-advisory-review");

    expect(gate.status).toBe("available");
    expect(flow.recommended?.id).toBe("human-gate");
    expect(advisory?.availability.status).toBe("available");
    expect(advisory?.command).toBe("npm run flow -- review types");
    expect(advisory?.mutatingCommand).toBeUndefined();
    expect(flow.available.map((action) => action.id)).toContain("request-advisory-review");
    expect(flow.blocked.map((action) => action.id)).not.toContain("request-advisory-review");
  });

  it("estado degradado ou inseguro falha fechado: CI pendente, branch atrás e tree suja bloqueiam readiness/Ready/Gate", () => {
    const unsafeFacts = coFlowFacts({
      git: { ...coFlowFacts().git, behind: 1, workingTreeClean: false },
      pullRequest: {
        ...coFlowFacts().pullRequest!,
        isDraft: false,
        checks: { pass: 2, fail: 0, pending: 2 },
      },
    });
    const s = snapshot({
      facts: unsafeFacts,
      steps: unsafeFacts.steps,
      workingTreeState: "functional-dirty",
      prReady: { ok: false, summary: "vermelho" },
      gateDecidability: { ok: false, summary: "vermelho" },
    });

    const mark = new MarkReadinessDefinition().detect(s);
    const gate = new HumanGateDefinition().detect(s);
    const ready = derivePrReadyFlow({
      prNumber: 43,
      prState: "OPEN",
      prDraft: false,
      readyBodyContractReasons: [],
      smokeTestsSuspended: false,
      checks: [
        { name: "repo-validation", bucket: "pending" },
        { name: "smoke", bucket: "pass" },
      ],
      localHeadSha: "54da3bb",
      prHeadRefOid: "54da3bb",
      workingTreeClean: false,
      checkpoint: {
        id: "checkpoint-co-flow-convergence",
        gateDecision: null,
        openBlockingCount: 0,
        reviewStatuses: [],
      },
    });

    expect(mark.status).toBe("blocked");
    expect(mark.reasons.join(" ")).toMatch(/working tree/);
    expect(mark.reasons.join(" ")).toMatch(/atrás do remoto/);
    expect(mark.reasons.join(" ")).toMatch(/pendente/);
    expect(gate.status).toBe("blocked");
    expect(gate.reasons.join(" ")).toMatch(/pendente/);
    expect(gate.reasons.join(" ")).toMatch(/working tree/);
    expect(ready.failures.join(" ")).toMatch(/pendente/);
    expect(ready.failures.join(" ")).toMatch(/working tree/);
  });

  it("pós-Human Gate: a próxima ação é abrir o próximo nó, sem merge e sem implementação automática", () => {
    const postGateFacts = coFlowFacts({
      lifecycle: { ...SETTLED, gateDecision: "approved" },
      pullRequest: {
        ...coFlowFacts().pullRequest!,
        isDraft: false,
        checks: { pass: 4, fail: 0, pending: 0 },
      },
      steps: [
        ...coFlowFacts().steps.slice(0, 5),
        {
          id: "CO-10.6",
          title: "falsificacao + Human Gate",
          state: "done",
          line: 114,
        },
      ],
    });
    const s = snapshot({
      facts: postGateFacts,
      steps: postGateFacts.steps,
      gateExists: true,
    });

    const flow = deriveGovernedFlow(s);
    const work = deriveWorkFor(s);
    const openNext = new OpenNextTopologyNodeDefinition().detect(s);

    expect(openNext.status).toBe("available");
    expect(flow.recommended?.id).toBe("open-next-topology-node");
    expect(work.mode).toBe("blocked");
    expect(work.nextAction.decisionType).toBe("open-next-topology-node");
    expect(flow.recommended?.effect).toEqual(
      expect.arrayContaining([
        "cria branch, PR Draft e reconcilia state/active/tasks",
        "não executa merge",
      ])
    );
    expect(work.nextAction.stillForbidden).toEqual(
      expect.arrayContaining(["Fazer merge", "Implementar o próximo nó"])
    );
  });

  it("simula uma pessoa recebendo uma tarefa e sendo guiada ate a transicao pos-Gate", () => {
    const receivedTask = snapshot();
    const receivedFlow = deriveGovernedFlow(receivedTask);
    const receivedWork = deriveWorkFor(receivedTask);

    expect(receivedFlow.humanSummary.currentObject?.label).toBe(
      "CO-10.6 — falsificacao + Human Gate"
    );
    expect(receivedFlow.humanSummary.nextObject).toBeNull();
    expect(receivedFlow.humanSummary.nextAction).toBe(
      "Nenhuma decisão mutante está disponível agora."
    );
    expect(receivedFlow.humanSummary.missing.join(" ")).toMatch(/não há commit de entrega/);
    expect(receivedWork.mode).toBe("implement_checkpoint");
    expect(receivedWork.object.step?.id).toBe("CO-10.6");
    expect(receivedWork.nextAction.decisionType).toBeNull();

    const delivered = makeDecisionSnapshot({
      ...receivedTask,
      stepDeliveryEvidence: {
        status: "present",
        activeId: "CO-10.6",
        activationCommit: "54da3bb",
        commitsAfterActivation: 1,
      },
    });
    const deliveredFlow = deriveGovernedFlow(delivered);
    const deliveredWork = deriveWorkFor(delivered);

    expect(deliveredFlow.recommended?.id).toBe("mark-readiness");
    expect(deliveredFlow.recommended?.command).toBe(
      "npm run flow -- decide --type mark-readiness --brief-only"
    );
    expect(deliveredFlow.recommended?.mutatingCommand).toBe(
      "npm run flow -- decide --type mark-readiness --decision mark-ready --authorization explicit-human-decision --confirm"
    );
    expect(deliveredWork.nextAction.decisionType).toBe("mark-readiness");
    expect(actionStatus(delivered, "advance-step")).toBe("not-applicable");

    const terminalReadyDraftFacts = coFlowFacts({
      steps: [
        ...coFlowFacts().steps.slice(0, 5),
        {
          id: "CO-10.6",
          title: "falsificacao + Human Gate",
          state: "in-progress",
          line: 114,
          readiness: "ready-for-transition",
        },
      ],
    });
    const terminalReadyDraft = snapshot({
      facts: terminalReadyDraftFacts,
      steps: terminalReadyDraftFacts.steps,
    });
    const terminalDraftWork = deriveWorkFor(terminalReadyDraft);
    const terminalDraftGate = new HumanGateDefinition().detect(terminalReadyDraft);

    expect(terminalDraftWork.mode).toBe("prepare_close");
    expect(terminalDraftWork.nextAction.decisionType).toBe("human-gate");
    expect(terminalDraftWork.nextAction.commands[0]?.command).toBe(
      "npm run flow -- decide --type human-gate --brief-only"
    );
    expect(actionStatus(terminalReadyDraft, "advance-step")).toBe("not-applicable");
    expect(terminalDraftGate.status).toBe("blocked");
    expect(terminalDraftGate.reasons.join(" ")).toMatch(/continua Draft/);

    const readyFacts = coFlowFacts({
      pullRequest: {
        ...coFlowFacts().pullRequest!,
        isDraft: false,
        checks: { pass: 4, fail: 0, pending: 0 },
      },
      steps: terminalReadyDraftFacts.steps,
    });
    const readyForGate = snapshot({
      facts: readyFacts,
      steps: readyFacts.steps,
      prReady: { ok: true, summary: "verde" },
      gateDecidability: { ok: true, summary: "verde" },
    });
    const readyFlow = deriveGovernedFlow(readyForGate);
    const readyWork = deriveWorkFor(readyForGate);
    const readyGate = new HumanGateDefinition().detect(readyForGate);

    expect(readyFlow.recommended?.id).toBe("human-gate");
    expect(readyFlow.recommended?.command).toBe(
      "npm run flow -- decide --type human-gate --brief-only"
    );
    expect(readyWork.nextAction.decisionType).toBe("human-gate");
    expect(readyGate.status).toBe("available");

    const unsafeFacts = coFlowFacts({
      git: { ...coFlowFacts().git, behind: 1, workingTreeClean: false },
      pullRequest: {
        ...coFlowFacts().pullRequest!,
        isDraft: false,
        checks: { pass: 2, fail: 0, pending: 2 },
      },
    });
    const unsafe = snapshot({
      facts: unsafeFacts,
      steps: unsafeFacts.steps,
      workingTreeState: "functional-dirty",
    });
    const unsafeFlow = deriveGovernedFlow(unsafe);
    const unsafeMark = new MarkReadinessDefinition().detect(unsafe);

    expect(unsafeFlow.humanSummary.nextAction).toBe(
      "Finalizar as mudanças locais e deixar a working tree limpa."
    );
    expect(unsafeMark.status).toBe("blocked");
    expect(unsafeMark.reasons.join(" ")).toMatch(/working tree/);
    expect(unsafeMark.reasons.join(" ")).toMatch(/atrás do remoto/);
    expect(unsafeMark.reasons.join(" ")).toMatch(/pendente/);

    const terminalDoneSteps = terminalReadyDraftFacts.steps.map((item) => ({
      id: item.id,
      title: item.title,
      state: "done" as const,
      line: item.line,
    }));
    const postGateFacts = coFlowFacts({
      lifecycle: { ...SETTLED, gateDecision: "approved" },
      pullRequest: {
        ...coFlowFacts().pullRequest!,
        isDraft: false,
        checks: { pass: 4, fail: 0, pending: 0 },
      },
      steps: terminalDoneSteps,
    });
    const postGate = snapshot({
      facts: postGateFacts,
      steps: postGateFacts.steps,
      gateExists: true,
    });
    const postGateFlow = deriveGovernedFlow(postGate);
    const postGateWork = deriveWorkFor(postGate);

    expect(postGateFlow.recommended?.id).toBe("open-next-topology-node");
    expect(postGateFlow.recommended?.command).toBe(
      "npm run flow -- decide --type open-next-topology-node --brief-only"
    );
    expect(postGateWork.nextAction.decisionType).toBe("open-next-topology-node");
    expect(postGateWork.nextAction.stillForbidden).toEqual(
      expect.arrayContaining(["Fazer merge", "Implementar o próximo nó"])
    );
  });
});

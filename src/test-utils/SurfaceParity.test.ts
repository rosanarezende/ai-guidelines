import { deriveNextAction, STEP_READINESS } from "../app/handoff/handoffFacts.js";
import { deriveFrenteProgression } from "../app/workflow/frenteProgression.js";
import { HumanGateDefinition } from "../cli/decide/humanGate.js";
import { OpenNextTopologyNodeDefinition } from "../cli/decide/openNextTopologyNode.js";
import {
  derivePrReadyFlow,
  openNextTopologyNodeFactsFromDecisionSnapshot,
} from "../cli/flow/GovernedFlow.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "./decisionFixtures.js";

/**
 * Testes de PARIDADE entre superfícies (Spec 0024 · PR #46).
 *
 * A causa raiz dos bugs recentes: superfícies diferentes (handoff, decide,
 * humanGate, pr-ready) re-derivavam "qual é o próximo movimento?" com filtros
 * próprios e divergiam. Estes testes fixam o contrato: dado o MESMO fixture
 * factual, todas as superfícies concordam — cada uma só renderiza a derivação
 * canônica (frenteProgression).
 */

const FRENTE_STEPS = [
  {
    id: "internal-architecture-refactor-ddd-bdd",
    title: "refactor interno",
    state: "in-progress" as const,
    readiness: STEP_READINESS,
    line: 1,
  },
  {
    id: "broad-flow-falsification",
    title: "falsificação ampla",
    state: "pending" as const,
    line: 2,
  },
  {
    id: "continuation-review-human-gate",
    title: "revisão final",
    state: "pending" as const,
    line: 3,
  },
];

const DUALROOT = {
  id: "dualroot-collapse",
  sequence: 14,
  terminal: false,
  githubPr: null,
};

/** Fixture A — gate do checkpoint aprovado, Frente ainda com checkpoints pendentes. */
function frentePendenteFixture() {
  const facts = makeHandoffFacts({
    steps: FRENTE_STEPS,
    nextPlannedNode: DUALROOT,
    activeNode: {
      id: "internal-architecture-refactor-ddd-bdd",
      sequence: 13,
      terminal: false,
      githubPr: 46,
    },
    lifecycle: {
      reviewDecisions: [],
      requiredReviewRoles: [],
      reviewStatuses: [],
      openFindings: 0,
      openBlocking: 0,
      closedFindings: 0,
      resolutions: 0,
      gateDecision: "approved",
    },
  });
  // openNextTopologyNode.buildBrief lê snapshot.handoffSnapshot.collected.state
  // (topology ausente ⇒ payload null ⇒ ramo "nada é aplicado"); o fixture padrão
  // usa `undefined as never`, então provemos o stub mínimo navegável.
  const handoffSnapshotStub = {
    collected: { state: { topology: undefined } },
  } as unknown as ReturnType<typeof makeDecisionSnapshot>["handoffSnapshot"];
  return {
    facts,
    snapshot: makeDecisionSnapshot({
      facts,
      steps: FRENTE_STEPS,
      handoffSnapshot: handoffSnapshotStub,
    }),
  };
}

describe("paridade entre superfícies · Frente pendente + gate aprovado", () => {
  const { facts, snapshot } = frentePendenteFixture();
  const canonical = deriveFrenteProgression({
    steps: FRENTE_STEPS,
    nextPlannedNode: DUALROOT,
    gateApproved: true,
  });

  it("derivação canônica: dualroot NÃO é executável; próximo semântico é a continuação", () => {
    expect(canonical.nextTopologyExecutable).toBe(false);
    expect(canonical.nextSemanticStep?.id).toBe("broad-flow-falsification");
  });

  it("handoff (deriveNextAction) concorda: continuação antes do nó topológico", () => {
    const action = deriveNextAction(facts);
    expect(action.kind).toBe("conclude-node-open-next");
    expect(action.blocking).toBe(true);
    expect(action.description).toContain("antes de abrir o nó topológico dualroot-collapse");
    expect(action.description).not.toContain("abrir o próximo PR autorizado: dualroot-collapse");
    for (const id of canonical.unfinishedSteps.map((s) => s.id)) {
      expect(action.description).toContain(id);
    }
  });

  it("humanGate (preview) concorda: próximo checkpoint da Frente, não dualroot", () => {
    const brief = new HumanGateDefinition().buildBrief(snapshot, { technical: false });
    const text = JSON.stringify(brief.sections);
    expect(text).toContain("Próximo checkpoint da Frente: broad-flow-falsification");
    expect(text).toContain(canonical.topologyBlockedSentence);
    expect(text).not.toContain("Próximo nó planejado: dualroot-collapse.");
  });

  it("openNextTopologyNode (decide) concorda: nada é aplicado com a Frente pendente", () => {
    const nodeFacts = openNextTopologyNodeFactsFromDecisionSnapshot(snapshot);
    expect(nodeFacts.pendingSteps).toEqual(canonical.unfinishedSteps.map((s) => s.id));

    const brief = new OpenNextTopologyNodeDefinition().buildBrief(snapshot, { technical: false });
    const text = JSON.stringify(brief.sections);
    expect(text).toContain("Nada é aplicado por open-next-topology-node neste estado.");
    expect(text).not.toContain("Criar e publicar branch feat/spec-0024-dualroot-collapse");
  });
});

describe("paridade entre superfícies · etapa em implementação (CI/tree verdes)", () => {
  const activeWithoutReadiness = {
    id: "internal-architecture-refactor-ddd-bdd",
    readiness: null,
  };

  it("pr-ready NÃO parece concluído só porque CI/tree estão verdes", () => {
    const result = derivePrReadyFlow({
      prNumber: 46,
      prState: "OPEN",
      prDraft: true,
      readyBodyContractReasons: [],
      smokeTestsSuspended: false,
      checks: [{ name: "smoke", bucket: "pass" }],
      localHeadSha: "abc1234",
      prHeadRefOid: "abc1234",
      workingTreeClean: true,
      checkpoint: {
        id: "checkpoint-internal-architecture-refactor-ddd-bdd",
        gateDecision: null,
        openBlockingCount: 0,
        activeStep: activeWithoutReadiness,
        reviewStatuses: [],
      },
    });
    const text = result.failures.join(" ");
    expect(text).toContain('etapa ativa "internal-architecture-refactor-ddd-bdd"');
    expect(text).toContain(`ainda não declarou readiness "${STEP_READINESS}"`);
  });

  it("humanGate bloqueia pela MESMA razão semântica (paridade)", () => {
    const steps = [
      {
        id: "internal-architecture-refactor-ddd-bdd",
        title: "refactor interno",
        state: "in-progress" as const,
        line: 1,
      },
    ];
    const facts = makeHandoffFacts({
      steps,
      lifecycle: {
        reviewDecisions: [],
        requiredReviewRoles: [],
        reviewStatuses: [],
        openFindings: 0,
        openBlocking: 0,
        closedFindings: 0,
        resolutions: 0,
        gateDecision: null,
      },
    });
    const av = new HumanGateDefinition().detect(makeDecisionSnapshot({ facts, steps }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toContain("ainda não declarou readiness");
  });

  it("com readiness declarada, o bloqueio semântico de pr-ready desaparece", () => {
    const result = derivePrReadyFlow({
      prNumber: 46,
      prState: "OPEN",
      prDraft: true,
      readyBodyContractReasons: [],
      smokeTestsSuspended: false,
      checks: [{ name: "smoke", bucket: "pass" }],
      localHeadSha: "abc1234",
      prHeadRefOid: "abc1234",
      workingTreeClean: true,
      checkpoint: {
        id: "checkpoint-internal-architecture-refactor-ddd-bdd",
        gateDecision: null,
        openBlockingCount: 0,
        activeStep: {
          id: "internal-architecture-refactor-ddd-bdd",
          readiness: STEP_READINESS,
        },
        reviewStatuses: [],
      },
    });
    expect(result.failures.join(" ")).not.toContain("ainda não declarou readiness");
  });
});

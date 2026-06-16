import { CockpitModel, renderCockpit } from "./cockpit.js";
import { DecisionAvailability } from "./decide/model.js";
import { CollectedWorkBrief, WorkBrief } from "./workBrief.js";
import { makeHandoffFacts } from "../test-utils/decisionFixtures.js";

function decision(
  id: string,
  title: string,
  availability: DecisionAvailability
): CockpitModel["decisions"][number] {
  return { id, title, availability };
}

function workBrief(over: Partial<WorkBrief> = {}): CollectedWorkBrief {
  const facts = makeHandoffFacts({
    activeNode: {
      id: "co-flow-convergence",
      githubPr: 43,
      sequence: 10,
      terminal: false,
    },
    cursor: { pr: "co-flow-convergence", checkpoint: "checkpoint-co-flow-convergence" },
    git: {
      ...makeHandoffFacts().git,
      branch: "feat/spec-0024-co-flow-convergence",
      head: "681ca2a",
      upstream: "origin/feat/spec-0024-co-flow-convergence",
    },
    pullRequest: {
      ...makeHandoffFacts().pullRequest!,
      number: 43,
      isDraft: true,
      baseRefName: "feat/spec-0024-co-enforcement",
      headRefName: "feat/spec-0024-co-flow-convergence",
      checks: { pass: 11, fail: 0, pending: 0 },
    },
    lifecycle: {
      reviewDecisions: [],
      requiredReviewRoles: [],
      reviewStatuses: [],
      openFindings: 0,
      openBlocking: 0,
      closedFindings: 6,
      resolutions: 6,
      gateDecision: null,
    },
  });
  const brief: WorkBrief = {
    specId: "0024",
    checkpoint: "checkpoint-co-flow-convergence",
    gitHead: "681ca2a",
    effectiveFunctionalHead: "681ca2a",
    workingTreeState: "clean",
    mode: "implement_checkpoint",
    purpose: "Implementar o sub-checkpoint ativo.",
    modeBasis: ["CO-10.1 ativo sem readiness"],
    degraded: [],
    object: {
      checkpoint: "checkpoint-co-flow-convergence",
      subCheckpoint: {
        id: "CO-10.1",
        title: "inventário real + modelo canônico",
        line: 42,
      },
    },
    authorization: { kind: "none", commitAllowed: false, pushAllowed: false },
    allowedActions: ["Implementar o objeto ativo"],
    forbiddenActions: ["Não avançar para CO-10.2"],
    validations: [],
    publication: {
      commit: "explicit-work-request",
      push: "explicit-work-request",
      mixedScope: "forbidden",
    },
    expectsResolutions: false,
    prBodyEditable: false,
    stopConditions: ["Parar antes de CO-10.2"],
    reportSections: ["Retomada", "Testes"],
    nextAction: {
      description: "Implementar CO-10.1.",
      basis: ["CO-10.1 segue [/] sem readiness."],
      commands: [],
      stillForbidden: ["Ready", "Human Gate", "merge"],
      decisionType: null,
    },
    ...over,
  };
  return {
    snapshot: {
      collected: { facts },
      derived: { seal: "seal-cockpit", nextAction: facts.insights[0] as never },
      receiptSkippedReason: null,
    } as never,
    brief,
  };
}

describe("cockpit situado", () => {
  it("renderiza painel raiz e recomenda readiness quando ela é o próximo ato", () => {
    const out = renderCockpit({
      work: workBrief(),
      decisions: [
        decision("mark-readiness", "Declarar readiness do sub-checkpoint ativo", {
          status: "available",
          reasons: [],
          hint: "CO-10.1 pronto para declarar readiness",
        }),
        decision("advance-subcheckpoint", "Avançar sub-checkpoint", {
          status: "blocked",
          reasons: ["CO-10.1 ainda não declarou seus critérios de saída."],
        }),
      ],
    });

    expect(out).toMatch(/Cockpit situado/);
    expect(out).toMatch(/CO-10\.1/);
    expect(out).toMatch(/Declarar readiness/);
    expect(out).toMatch(
      /npm run guidelines -- decide --type mark-readiness --decision mark-ready --authorization explicit-human-decision --confirm/
    );
  });

  it("mostra CI pending como bloqueio e não sugere readiness executável", () => {
    const out = renderCockpit({
      work: workBrief(),
      decisions: [
        decision("mark-readiness", "Declarar readiness do sub-checkpoint ativo", {
          status: "blocked",
          reasons: ["A integração contínua ainda tem 2 verificação(ões) pendente(s)."],
        }),
      ],
    });

    expect(out).toMatch(/Ações disponíveis\n- \(nenhuma decisão mutante disponível agora\)/);
    expect(out).toMatch(/pendente/);
    expect(out).toMatch(/decide --type mark-readiness --brief-only/);
  });

  it("prioriza close-dispositions quando há findings revalidados a encerrar", () => {
    const out = renderCockpit({
      work: workBrief({
        mode: "await_revalidation",
        nextAction: {
          description: "Fechar dispositions revalidadas.",
          basis: [],
          commands: [],
          stillForbidden: [],
          decisionType: "close-dispositions",
        },
      }),
      decisions: [
        decision("close-dispositions", "Fechar findings revalidados", {
          status: "available",
          reasons: [],
        }),
        decision("mark-readiness", "Declarar readiness do sub-checkpoint ativo", {
          status: "available",
          reasons: [],
        }),
      ],
    });

    expect(out).toMatch(/Próxima ação recomendada\n- Fechar findings revalidados/);
  });

  it("não sugere Human Gate antes de Ready quando ele está bloqueado", () => {
    const out = renderCockpit({
      work: workBrief(),
      decisions: [
        decision("human-gate", "Human Gate", {
          status: "blocked",
          reasons: ["PR ainda está Draft."],
        }),
      ],
    });

    expect(out).not.toMatch(/Próxima ação recomendada\n- Human Gate/);
    expect(out).toMatch(/PR ainda está Draft/);
  });

  it("exibe comandos canônicos e ações proibidas", () => {
    const out = renderCockpit({
      work: workBrief(),
      decisions: [],
    });

    expect(out).toMatch(/npm run guidelines -- handoff 0024/);
    expect(out).toMatch(/npm run guidelines -- work --authorization explicit-work-request/);
    expect(out).toMatch(/Não avançar para CO-10\.2/);
    expect(out).toMatch(/Fazer merge/);
  });
});

/**
 * Integração `work` × `decide` — INVARIANTE de consistência da transição de
 * etapa (refinamento do dogfood do CO-3.2).
 *
 * Dogfood real (2026-06-14): CO-3.2 `[/]`, CO-3.3 `[ ]`, implementação entregue,
 * PR #42 Draft. `npm run flow -- work` recomendava `decide` para concluir CO-3.2 e
 * ativar CO-3.3, mas o menu de `decide` OCULTAVA `advance-step` como
 * `not-applicable` (guard `done.length > 0`) e mostrava só o Human Gate
 * indisponível. Causa estrutural: `work` e `decide` derivavam a elegibilidade da
 * transição em LUGARES diferentes, com regras divergentes.
 *
 * INVARIANTE testada aqui: `work` e `decide` derivam a MESMA elegibilidade do
 * MESMO snapshot (`deriveAdvanceEligibility`); todo comando que `work` recomenda
 * como executável corresponde a uma decisão `available` no `DecisionRegistry`; e
 * uma decisão bloqueada NUNCA é recomendada como executável.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { deriveWorkBrief, WorkBrief } from "./workBrief.js";
import { deriveNextAction, HandoffStep } from "./handoffFacts.js";
import { AdvanceStepDefinition } from "./decide/advanceStep.js";
import { buildDecisionRegistry } from "./decide/registry.js";
import { parseDecideArgs, runDecide } from "./decide/decide.js";
import { DecisionSnapshot } from "./decide/snapshot.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../test-utils/decisionFixtures.js";
import { parseWorkPolicy, WorkPolicy } from "../infrastructure/yaml/workPolicyReader.js";

const WORK_POLICY: WorkPolicy = parseWorkPolicy(
  fs.readFileSync(path.join(process.cwd(), ".core/governance/work-policy.yml"), "utf-8")
);

const def = new AdvanceStepDefinition();
const registry = buildDecisionRegistry();

/** Auditoria fechada do CO-3.1 (3 dispositions CLOSED 3/0; nenhuma aberta). */
const AUDIT_SETTLED = {
  reviewDecisions: [{ role: "technical_audit", decision: "changes_requested" }],
  requiredReviewRoles: [],
  reviewStatuses: [
    {
      typeId: "technical_audit",
      applicability: "yes" as const,
      requirement: "optional" as const,
      state: "stale" as const,
      decision: "changes_requested",
      blocking: false,
      source: "repo-default",
    },
  ],
  openFindings: 0,
  openBlocking: 0,
  closedFindings: 3,
  resolutions: 3,
  gateDecision: null,
} as const;

function realSubs(): HandoffStep[] {
  return [
    { id: "CO-3.1", title: "Constraint + EnforcementBinding", state: "done", line: 101 },
    {
      id: "CO-3.2",
      title: "knowledge:compile + manifesto/paridade",
      state: "in-progress",
      line: 102,
      readiness: "ready-for-transition",
    },
    { id: "CO-3.3", title: "migração e remoção do substrato legacy", state: "pending", line: 103 },
    { id: "CO-3.4", title: "dogfood do enforcement e recibo", state: "pending", line: 104 },
  ];
}

/**
 * Snapshot do ESTADO REAL: CO-3.1 `[x]`, CO-3.2 `[/]`, CO-3.3/3.4 `[ ]`,
 * auditoria fechada, CI verde, tree limpa, PR Draft, sem gate. `over` permite
 * variar UM fato (ex.: CI pendente) preservando o resto.
 */
function realSnapshot(over: { ciPending?: number; ciFail?: number } = {}): DecisionSnapshot {
  // Fonte ÚNICA das etapas: os HandoffFacts (decide projeta
  // snapshot.steps === facts.steps; `work` lê facts).
  const facts = makeHandoffFacts({
    lifecycle: { ...AUDIT_SETTLED },
    steps: realSubs(),
    pullRequest: {
      ...makeHandoffFacts().pullRequest!,
      isDraft: true,
      checks: { pass: 12, fail: over.ciFail ?? 0, pending: over.ciPending ?? 0 },
    },
  });
  return makeDecisionSnapshot({
    facts,
    openFindings: [],
    lanes: [],
    closedFindingsCount: 3,
    workingTreeState: "clean",
    gateExists: false,
    steps: facts.steps,
  });
}

function terminalSnapshot(): DecisionSnapshot {
  const facts = makeHandoffFacts({
    lifecycle: { ...AUDIT_SETTLED },
    steps: [
      { id: "CO-3.1", title: "Constraint + EnforcementBinding", state: "done", line: 101 },
      { id: "CO-3.2", title: "knowledge:compile + manifesto/paridade", state: "done", line: 102 },
      { id: "CO-3.3", title: "migração e remoção do substrato legacy", state: "done", line: 103 },
      {
        id: "CO-3.5",
        title: "colapso integral do runtime CLI",
        state: "in-progress",
        line: 105,
        readiness: "ready-for-transition",
      },
    ],
    pullRequest: {
      ...makeHandoffFacts().pullRequest!,
      isDraft: true,
      checks: { pass: 12, fail: 0, pending: 0 },
    },
  });
  return makeDecisionSnapshot({
    facts,
    openFindings: [],
    lanes: [],
    closedFindingsCount: 3,
    workingTreeState: "clean",
    gateExists: false,
    steps: facts.steps,
  });
}

/**
 * Constrói o work brief a partir do MESMO snapshot, derivando a elegibilidade
 * com a MESMA função que `decide` usa (`def.detect`) — espelha `collectWorkBrief`.
 */
function workBriefFor(snapshot: DecisionSnapshot): WorkBrief {
  const advanceEligibility = def.detect(snapshot);
  return deriveWorkBrief({
    facts: snapshot.facts,
    nextAction: deriveNextAction(snapshot.facts),
    findings: [], // estado real: 0 findings open
    policy: WORK_POLICY,
    workingTreeState: snapshot.workingTreeState,
    authorization: "explicit-work-request",
    advanceEligibility,
  });
}

function recordingLogger() {
  const lines: string[] = [];
  return {
    lines,
    logger: { info: (m: string) => lines.push(m), error: (m: string) => lines.push(m) },
  };
}

describe("consistência work×decide · estado real CO-3.2 [/] (dogfood CO-3.2)", () => {
  it("[1] decide: advance-step é AVAILABLE no estado real (não mais oculto)", () => {
    const av = def.detect(realSnapshot());
    expect(av.status).toBe("available");
    expect(av.hint).toMatch(/CO-3\.2 concluível; CO-3\.3 é o próximo/);
  });

  it("[2] work: recomenda advance-step (concluir CO-3.2 e ativar CO-3.3)", () => {
    const b = workBriefFor(realSnapshot());
    expect(b.mode).toBe("prepare_step_transition");
    expect(b.object.transition?.conclude?.id).toBe("CO-3.2");
    expect(b.object.transition?.activate.id).toBe("CO-3.3");
    expect(b.nextAction.description).toBe("Concluir CO-3.2 e ativar CO-3.3.");
    expect(b.nextAction.decisionType).toBe("advance-step");
    expect(b.nextAction.commands.find((c) => c.role === "recommended")?.command).toBe(
      "npm run flow -- decide"
    );
  });

  it("[3] INVARIANTE: todo comando recomendado por work.nextAction está available no DecisionRegistry", () => {
    const snapshot = realSnapshot();
    const b = workBriefFor(snapshot);
    const recommendsExecutable = b.nextAction.commands.some((c) => c.role === "recommended");
    if (recommendsExecutable) {
      expect(b.nextAction.decisionType).not.toBeNull();
      const reg = registry.resolve(b.nextAction.decisionType!);
      expect(reg).toBeDefined();
      // a MESMA decisão recomendada DEVE estar available no registry real.
      expect(reg!.detect(snapshot).status).toBe("available");
    }
  });

  it("[4] decide menu: advance-step APARECE como Disponível (brief-only)", async () => {
    const { lines, logger } = recordingLogger();
    const code = await runDecide("/x", parseDecideArgs(["--brief-only"]), {
      logger,
      registry: buildDecisionRegistry(),
      collect: () => realSnapshot(),
      remote: null,
    });
    expect(code).toBe(0);
    const out = lines.join("\n");
    // listado no menu (não omitido como not-applicable) e marcado Disponível.
    expect(out).toMatch(/Iniciar o próxima etapa/);
    expect(out).toMatch(/Disponível/);
    // o Human Gate continua presente como indisponível (Draft).
    expect(out).toMatch(/Human Gate/);
  });

  it("[5] decide direto --type advance-step --brief-only EXPLICA available", async () => {
    const { lines, logger } = recordingLogger();
    const code = await runDecide(
      "/x",
      parseDecideArgs(["--type", "advance-step", "--brief-only"]),
      { logger, registry: buildDecisionRegistry(), collect: () => realSnapshot(), remote: null }
    );
    expect(code).toBe(0);
    const out = lines.join("\n");
    expect(out).toMatch(/Iniciar o próxima etapa/);
    expect(out).toMatch(/concluir CO-3\.2 e ativar CO-3\.3/);
    // available ⇒ NÃO renderiza o bloco "não pode ser exercida/não se aplica".
    expect(out).not.toMatch(/ainda não pode ser exercida|não se aplica agora/);
  });

  it("[6] preserva CO-3.2 [/] e CO-3.3 [ ] — o teste é read-only (nenhuma escrita)", () => {
    const subs = realSnapshot().steps;
    expect(subs.find((s) => s.id === "CO-3.2")?.state).toBe("in-progress");
    expect(subs.find((s) => s.id === "CO-3.3")?.state).toBe("pending");
  });
});

describe("consistência work×decide · transição BLOQUEADA (requisito nomeado)", () => {
  it("[7] CI pendente: decide BLOQUEIA e nomeia o requisito", () => {
    const av = def.detect(realSnapshot({ ciPending: 2 }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/verificação\(ões\) pendente/);
  });

  it("[8] CI pendente: work NÃO recomenda advance como executável (só inspeção read-only)", () => {
    const snapshot = realSnapshot({ ciPending: 2 });
    const b = workBriefFor(snapshot);
    expect(b.nextAction.decisionType).toBe("advance-step");
    expect(b.nextAction.commands.find((c) => c.role === "recommended")).toBeUndefined();
    expect(b.nextAction.commands).toHaveLength(1);
    expect(b.nextAction.commands[0].role).toBe("read-only");
    expect(b.nextAction.description).toMatch(/BLOQUEADO/);
    expect(b.nextAction.basis.join(" ")).toMatch(/verificação\(ões\) pendente/);
  });

  it("[9] INVARIANTE: decisão bloqueada não aparece como recomendada (work × registry concordam)", () => {
    const snapshot = realSnapshot({ ciPending: 2 });
    const b = workBriefFor(snapshot);
    const recommendsExecutable = b.nextAction.commands.some((c) => c.role === "recommended");
    expect(recommendsExecutable).toBe(false);
    // e o registry real concorda: a mesma decisão está blocked.
    expect(registry.resolve("advance-step")!.detect(snapshot).status).toBe("blocked");
  });

  it("[10] CI pendente: decide menu mostra advance como Indisponível com o requisito; direto explica blocked", async () => {
    const { lines, logger } = recordingLogger();
    await runDecide("/x", parseDecideArgs(["--type", "advance-step", "--brief-only"]), {
      logger,
      registry: buildDecisionRegistry(),
      collect: () => realSnapshot({ ciPending: 2 }),
      remote: null,
    });
    const out = lines.join("\n");
    expect(out).toMatch(/ainda não pode ser exercida porque/);
    expect(out).toMatch(/verificação\(ões\) pendente/);
  });
});

describe("consistência work×decide · terminal do última etapa", () => {
  it("[11] decide menu omite advance-step e mantém Human Gate bloqueado por Draft", async () => {
    const { lines, logger } = recordingLogger();
    const code = await runDecide("/x", parseDecideArgs(["--brief-only"]), {
      logger,
      registry: buildDecisionRegistry(),
      collect: () => terminalSnapshot(),
      remote: null,
    });
    expect(code).toBe(0);
    const out = lines.join("\n");
    expect(out).not.toMatch(/Iniciar o próxima etapa/);
    expect(out).toMatch(/Human Gate/);
    expect(out).toMatch(/Draft/);
  });

  it("[12] work projeta prepare_close, não advance-step", () => {
    const snapshot = terminalSnapshot();
    const b = workBriefFor(snapshot);
    expect(b.mode).toBe("prepare_close");
    expect(b.nextAction.decisionType).toBe("human-gate");
    expect(b.nextAction.commands.some((c) => /advance-step/.test(c.command))).toBe(false);
  });
});

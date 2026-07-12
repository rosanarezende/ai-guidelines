import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { HumanGateDefinition } from "./humanGate.js";
import { DecisionGitOps } from "./model.js";
import { DecisionSnapshot } from "./snapshot.js";
import { deriveHandoff, STEP_READINESS } from "../../app/handoff/handoffFacts.js";
import { evaluateReadyPreconditions, ReadyCheckSnapshot } from "../prReadyCheck.js";
import { deriveWorkBrief } from "../workBrief.js";
import { parseGate } from "../../infrastructure/yaml/reviewArtifactsReader.js";
import { parseWorkPolicy } from "../../infrastructure/yaml/workPolicyReader.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";

const def = new HumanGateDefinition();
const OWNER = { name: "Rosana", email: "rosanarezende.com@gmail.com", handle: "@rosanarezende" };
const WORK_POLICY = parseWorkPolicy(
  fs.readFileSync(path.join(process.cwd(), ".core/governance/work-policy.yml"), "utf-8")
);

class FakeGit implements DecisionGitOps {
  added: string[] = [];
  commits: string[] = [];
  pushed = 0;
  constructor(private readonly dirty: string[] | null) {}
  porcelainPaths() {
    return this.dirty;
  }
  revParseShortHead() {
    return "9999abc";
  }
  add(f: string) {
    this.added.push(f);
  }
  commit(m: string) {
    this.commits.push(m);
  }
  push() {
    this.pushed++;
  }
}

/** Snapshot ELEGÍVEL: PR Ready, CI verde, sem findings/etapas/reviews pendentes. */
function readySnapshot(over: Partial<DecisionSnapshot> = {}): DecisionSnapshot {
  const facts = makeHandoffFacts({
    pullRequest: {
      number: 42,
      state: "OPEN",
      isDraft: false,
      baseRefName: "feat/spec-0024-co-projection",
      headRefName: "feat/spec-0024-co-enforcement",
      headRefOid: "a069f9c",
      checks: { pass: 11, fail: 0, pending: 0 },
      bodyReadyReasons: [],
      labels: [],
    },
    lifecycle: {
      reviewDecisions: [],
      requiredReviewRoles: [],
      reviewStatuses: [],
      openFindings: 0,
      openBlocking: 0,
      closedFindings: 3,
      resolutions: 3,
      gateDecision: null,
    },
  });
  return makeDecisionSnapshot({
    facts,
    openFindings: [],
    lanes: [],
    steps: [
      { id: "CO-3.1", title: "x", state: "done", line: 1 },
      { id: "CO-3.2", title: "y", state: "done", line: 2 },
    ],
    prReady: { ok: true, summary: "verde" },
    gateDecidability: { ok: true, summary: "verde" },
    ...over,
  });
}

function readyPreconditionsSnapshot(over: Partial<ReadyCheckSnapshot> = {}): ReadyCheckSnapshot {
  return {
    pr: {
      number: 42,
      state: "OPEN",
      isDraft: false,
      title: "[Spec 0024] co-enforcement",
      body: "(body já validado via readyBodyContractReasons)",
      labels: [],
      headRefOid: "a069f9ca069f9ca069f9ca069f9ca069f9ca0",
      headRefName: "feat/spec-0024-co-enforcement",
      baseRefName: "feat/spec-0024-co-projection",
    },
    checks: [
      { name: "governance-pr-check", bucket: "pass" },
      { name: "repo-validation", bucket: "pass" },
      { name: "smoke", bucket: "pass" },
    ],
    readyBodyContractReasons: [],
    localHeadSha: "a069f9ca069f9ca069f9ca069f9ca069f9ca0",
    workingTreeClean: true,
    checkpoint: {
      id: "checkpoint-co-enforcement",
      gateDecision: null,
      openBlockingCount: 0,
      reviewDecisions: [],
      reviewStatuses: [
        {
          typeId: "technical_audit",
          applicability: "yes",
          requirement: "optional",
          state: "stale",
          decision: "changes_requested",
          blocking: false,
          source: "repo-default",
          errors: [],
        },
        {
          typeId: "architectural_review",
          applicability: "yes",
          requirement: "optional",
          state: "missing",
          decision: null,
          blocking: false,
          source: "repo-default",
          errors: [],
        },
      ],
    },
    ...over,
  };
}

describe("human-gate · elegibilidade [decide]", () => {
  it("[6][33] Draft + etapa ativa sem readiness ⇒ blocked, explicado em linguagem humana", () => {
    const av = def.detect(makeDecisionSnapshot());
    expect(av.status).toBe("blocked");
    const reasons = av.reasons.join(" ");
    expect(reasons).toMatch(/CO-3\.1 ainda não declarou readiness/);
    expect(reasons).toMatch(/Draft/);
  });

  it("[34] etapas futuras pendentes não bloqueiam o gate do checkpoint atual", () => {
    const s = readySnapshot({
      steps: [
        { id: "CO-3.4", title: "x", state: "in-progress", readiness: STEP_READINESS, line: 1 },
        { id: "CO-3.5", title: "y", state: "pending", line: 2 },
      ],
    });
    const av = def.detect(s);

    expect(av.status).toBe("available");
    expect(av.reasons.join(" ")).not.toMatch(/CO-3\.5/);
  });

  it("[34b] etapa ativa sem readiness bloqueia o gate", () => {
    const s = readySnapshot({
      steps: [{ id: "CO-3.5", title: "colapso", state: "in-progress", line: 5 }],
    });
    const av = def.detect(s);
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/CO-3\.5 ainda não declarou readiness/);
  });

  it("[35] review obrigatório pendente bloqueia", () => {
    const facts = makeHandoffFacts({
      pullRequest: { ...readySnapshot().facts.pullRequest! },
      lifecycle: {
        reviewDecisions: [],
        requiredReviewRoles: ["technical_audit"],
        reviewStatuses: [
          {
            typeId: "technical_audit",
            applicability: "yes",
            requirement: "required",
            state: "missing",
            decision: null,
            blocking: true,
            source: "rule",
          },
        ],
        openFindings: 0,
        openBlocking: 0,
        closedFindings: 0,
        resolutions: 0,
        gateDecision: null,
      },
    });
    expect(def.detect(readySnapshot({ facts })).status).toBe("blocked");
  });

  it("[36] finding aberto bloqueia", () => {
    expect(
      def.detect(readySnapshot({ openFindings: makeDecisionSnapshot().openFindings })).status
    ).toBe("blocked");
  });

  it("[37] CI vermelha bloqueia", () => {
    const facts = makeHandoffFacts({
      pullRequest: {
        ...readySnapshot().facts.pullRequest!,
        checks: { pass: 9, fail: 2, pending: 0 },
      },
      lifecycle: readySnapshot().facts.lifecycle!,
    });
    expect(def.detect(readySnapshot({ facts })).status).toBe("blocked");
  });

  it("CI pendente bloqueia com mensagem factual", () => {
    const facts = makeHandoffFacts({
      pullRequest: {
        ...readySnapshot().facts.pullRequest!,
        checks: { pass: 10, fail: 0, pending: 1 },
      },
      lifecycle: readySnapshot().facts.lifecycle!,
    });
    const av = def.detect(readySnapshot({ facts }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toContain("0 falha(s), 1 pendente(s)");
  });

  it("[38] pr-ready:check vermelho bloqueia", () => {
    expect(def.detect(readySnapshot({ prReady: { ok: false, summary: "x" } })).status).toBe(
      "blocked"
    );
  });

  it("pr-ready:check verde não bloqueia o Human Gate", () => {
    const av = def.detect(readySnapshot({ prReady: { ok: true, summary: "verde" } }));
    expect(av.status).toBe("available");
    expect(av.reasons.join(" ")).not.toMatch(/pr-ready/);
  });

  it("[39] gate-decidability:check vermelho bloqueia", () => {
    expect(
      def.detect(readySnapshot({ gateDecidability: { ok: false, summary: "x" } })).status
    ).toBe("blocked");
  });

  it("gate já existente ⇒ not-applicable", () => {
    expect(def.detect(readySnapshot({ gateExists: true })).status).toBe("not-applicable");
  });

  it("estado elegível ⇒ available", () => {
    expect(def.detect(readySnapshot()).status).toBe("available");
  });

  it("reviews opcionais missing/stale não bloqueiam Human Gate", () => {
    const facts = makeHandoffFacts({
      pullRequest: { ...readySnapshot().facts.pullRequest! },
      lifecycle: {
        reviewDecisions: [{ role: "technical_audit", decision: "changes_requested" }],
        requiredReviewRoles: [],
        reviewStatuses: [
          {
            typeId: "technical_audit",
            applicability: "yes",
            requirement: "optional",
            state: "stale",
            decision: "changes_requested",
            blocking: false,
            source: "repo-default",
          },
          {
            typeId: "architectural_review",
            applicability: "yes",
            requirement: "optional",
            state: "missing",
            decision: null,
            blocking: false,
            source: "repo-default",
          },
        ],
        openFindings: 0,
        openBlocking: 0,
        closedFindings: 0,
        resolutions: 0,
        gateDecision: null,
      },
    });
    expect(def.detect(readySnapshot({ facts })).status).toBe("available");
  });

  it("pr-ready:check, decide e work/handoff convergem no estado Ready", () => {
    const terminalSteps = [
      { id: "CO-3.1", title: "base", state: "done" as const, line: 1 },
      {
        id: "CO-3.5",
        title: "colapso integral do runtime CLI",
        state: "in-progress" as const,
        line: 5,
        readiness: STEP_READINESS,
      },
    ];
    const facts = makeHandoffFacts({
      pullRequest: { ...readySnapshot().facts.pullRequest! },
      lifecycle: readySnapshot().facts.lifecycle!,
      steps: terminalSteps,
    });
    const snap = readySnapshot({ facts, steps: terminalSteps });
    const handoff = deriveHandoff(facts);
    const work = deriveWorkBrief({
      facts,
      nextAction: handoff.nextAction,
      findings: [],
      policy: WORK_POLICY,
      workingTreeState: "clean",
      authorization: null,
      advanceEligibility: { status: "blocked", reasons: ["não aplicável"] },
    });

    expect(evaluateReadyPreconditions(readyPreconditionsSnapshot()).ok).toBe(true);
    expect(def.detect(snap).status).toBe("available");
    expect(handoff.nextAction.kind).toBe("exercise-human-gate");
    expect(work.mode).toBe("current");
    expect(work.nextAction.decisionType).toBe("human-gate");
    expect(work.nextAction.commands.some((c) => c.command === "npm run flow -- decide")).toBe(true);
  });

  it("readiness terminal do última etapa ⇒ available para Human Gate", () => {
    const terminal = readySnapshot({
      steps: [
        { id: "CO-3.1", title: "base", state: "done", line: 1 },
        {
          id: "CO-3.5",
          title: "colapso integral do runtime CLI",
          state: "in-progress",
          line: 5,
          readiness: "ready-for-transition",
        },
      ],
    });
    expect(def.detect(terminal).status).toBe("available");
    const b = def.buildBrief(terminal, { technical: false });
    expect(JSON.stringify(b.sections)).toMatch(/Pronto para Gate: CO-3\.5/);
  });
});

describe("human-gate · briefing humano [decide]", () => {
  it("bloqueado: 8 seções + razões humanas; sem schema na linguagem principal", () => {
    const b = def.buildBrief(makeDecisionSnapshot(), { technical: false });
    expect(b.status).toBe("blocked");
    expect(b.sections).toHaveLength(8);
    expect(b.blockedReasons.length).toBeGreaterThan(0);
    expect(b.summary).not.toMatch(/^[0-9a-f]{7,}/i);
  });

  it("--technical revela checkpoint/PR/gate alvo", () => {
    const b = def.buildBrief(makeDecisionSnapshot(), { technical: true });
    const tech = JSON.stringify(b.technicalDetails);
    expect(tech).toMatch(/gate artifact alvo/);
    expect(b.technicalDetails.length).toBeGreaterThan(0);
  });

  it("briefing disponível mostra pr-ready verde, contagem de CI do snapshot e próximo co-flow-convergence", () => {
    const b = def.buildBrief(readySnapshot(), { technical: false });
    const text = JSON.stringify(b.sections);
    expect(b.status).toBe("available");
    expect(b.summary).toContain("Human Gate disponível");
    expect(text).toContain("Integração contínua: 11 ok");
    expect(text).toContain("pr-ready:check: verde");
    expect(text).toContain("Próximo nó planejado: co-flow-convergence.");
  });

  it("Frente com checkpoints pendentes: próximo passo é o checkpoint da continuação, não o nó topológico", () => {
    const s = readySnapshot({
      steps: [
        {
          id: "internal-architecture-refactor-ddd-bdd",
          title: "refactor",
          state: "in-progress",
          readiness: STEP_READINESS,
          line: 1,
        },
        { id: "broad-flow-falsification", title: "falsificação ampla", state: "pending", line: 2 },
        { id: "continuation-review-human-gate", title: "revisão final", state: "pending", line: 3 },
      ],
    });
    const b = def.buildBrief(s, { technical: false });
    const text = JSON.stringify(b.sections);
    expect(text).toContain(
      "Próximo checkpoint da Frente: broad-flow-falsification — falsificação ampla."
    );
    expect(text).toContain("só abre depois que a Frente fechar");
    expect(text).toContain("broad-flow-falsification, continuation-review-human-gate");
    expect(text).not.toContain("Próximo nó planejado: co-flow-convergence.");
  });

  it("Human Gate mostra technical_audit current/approved quando verification aprovada é vigente", () => {
    const facts = makeHandoffFacts({
      pullRequest: { ...readySnapshot().facts.pullRequest! },
      lifecycle: {
        reviewDecisions: [{ role: "technical_audit", decision: "approved" }],
        requiredReviewRoles: [],
        reviewStatuses: [
          {
            typeId: "technical_audit",
            applicability: "yes",
            requirement: "optional",
            state: "current",
            decision: "approved",
            blocking: false,
            source: "repo-default",
          },
        ],
        openFindings: 0,
        openBlocking: 0,
        closedFindings: 3,
        resolutions: 3,
        gateDecision: null,
      },
    });
    const b = def.buildBrief(readySnapshot({ facts }), { technical: false });
    const text = JSON.stringify(b.sections);
    expect(b.status).toBe("available");
    expect(text).toContain("technical_audit: optional · current (approved)");
    expect(text).not.toContain("technical_audit: optional · current (changes_requested)");
  });
});

describe("human-gate · plano e efeito [decide]", () => {
  it("[40] elegível gera preview do gate artifact", () => {
    const plan = def.plan(readySnapshot(), "approve");
    expect(plan.mutating).toBe(true);
    expect(plan.changes[0].path).toMatch(/gates\/c-co-enforcement\.yml/);
    expect(plan.preserved.join(" ")).toMatch(/topologia/);
  });

  it("[45] reject não escreve (schema de gate não tem 'rejected'); request-changes escreve changes_requested", () => {
    expect(def.plan(readySnapshot(), "reject").mutating).toBe(false);
    const rc = def.plan(readySnapshot(), "request-changes");
    expect(rc.mutating).toBe(true);
    expect((rc.payload as { decision: string }).decision).toBe("changes_requested");
  });

  describe("apply", () => {
    let repoRoot: string;
    beforeEach(() => {
      repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "decide-hg-"));
    });
    afterEach(() => fs.rmSync(repoRoot, { recursive: true, force: true }));

    it("[41][42][43] approve cria o gate canônico, sem tocar topologia/PR (diff exclusivo)", async () => {
      const plan = def.plan(readySnapshot({ repoRoot }), "approve");
      const git = new FakeGit([plan.changes[0].path]);
      const result = await def.apply(plan, {
        repoRoot,
        logger: { info: () => {}, error: () => {} },
        actor: OWNER,
        git,
        authorization: "explicit-human-decision",
      });
      expect(result.ok).toBe(true);
      const abs = path.join(repoRoot, plan.changes[0].path);
      const gate = parseGate(fs.readFileSync(abs, "utf8"), plan.changes[0].path);
      expect(gate.decision).toBe("approved");
      expect(gate.actor).toBe("@rosanarezende");
      expect(git.added).toEqual([plan.changes[0].path]);
      expect(git.commits).toHaveLength(1);
      expect(git.pushed).toBe(1);
    });

    it("[44] gate duplicado bloqueia (não sobrescreve)", async () => {
      const plan = def.plan(readySnapshot({ repoRoot }), "approve");
      const abs = path.join(repoRoot, plan.changes[0].path);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, 'checkpoint: "x"\nactor: "@a"\ndecision: approved\n');
      const git = new FakeGit([plan.changes[0].path]);
      const result = await def.apply(plan, {
        repoRoot,
        logger: { info: () => {}, error: () => {} },
        actor: OWNER,
        git,
        authorization: "explicit-human-decision",
      });
      expect(result.ok).toBe(false);
      expect(result.messages.join(" ")).toMatch(/Já existe gate/);
      expect(git.commits).toHaveLength(0);
    });
  });
});

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { HumanGateDefinition } from "./humanGate.js";
import { DecisionGitOps } from "./model.js";
import { DecisionSnapshot } from "./snapshot.js";
import { parseGate } from "../../infrastructure/yaml/reviewArtifactsReader.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";

const def = new HumanGateDefinition();
const OWNER = { name: "Rosana", email: "rosanarezende.com@gmail.com", handle: "@rosanarezende" };

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

/** Snapshot ELEGÍVEL: PR Ready, CI verde, sem findings/sub-checkpoints/reviews pendentes. */
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
    subCheckpoints: [
      { id: "CO-3.1", title: "x", state: "done", line: 1 },
      { id: "CO-3.2", title: "y", state: "done", line: 2 },
    ],
    prReady: { ok: true, summary: "verde" },
    gateDecidability: { ok: true, summary: "verde" },
    ...over,
  });
}

describe("human-gate · elegibilidade [decide]", () => {
  it("[6][33] Draft + sub-checkpoints pendentes ⇒ blocked, explicado em linguagem humana", () => {
    const av = def.detect(makeDecisionSnapshot());
    expect(av.status).toBe("blocked");
    const reasons = av.reasons.join(" ");
    expect(reasons).toMatch(/CO-3\.2 ainda está aberto/);
    expect(reasons).toMatch(/CO-3\.3 ainda está aberto/);
    expect(reasons).toMatch(/CO-3\.4 ainda está aberto/);
    expect(reasons).toMatch(/Draft/);
  });

  it("[34] sub-checkpoint (tarefa) pendente bloqueia", () => {
    const s = readySnapshot({
      subCheckpoints: [{ id: "CO-3.4", title: "x", state: "pending", line: 1 }],
    });
    expect(def.detect(s).status).toBe("blocked");
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

  it("[38] pr-ready:check vermelho bloqueia", () => {
    expect(def.detect(readySnapshot({ prReady: { ok: false, summary: "x" } })).status).toBe(
      "blocked"
    );
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

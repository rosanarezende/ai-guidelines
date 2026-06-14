import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  AdvanceSubcheckpointDefinition,
  advanceSubCheckpointMarkers,
} from "./advanceSubcheckpoint.js";
import { DecisionGitOps } from "./model.js";
import { DecisionSnapshot } from "./snapshot.js";
import { HandoffSubCheckpoint } from "../handoffFacts.js";
import { resolveSubCheckpointWork } from "../workBrief.js";
import { renderBrief } from "./render.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";

const def = new AdvanceSubcheckpointDefinition();
const OWNER = { name: "Rosana", email: "rosanarezende.com@gmail.com", handle: "@rosanarezende" };

const SETTLED = {
  reviewDecisions: [],
  requiredReviewRoles: [],
  reviewStatuses: [],
  openFindings: 0,
  openBlocking: 0,
  closedFindings: 3,
  resolutions: 3,
  gateDecision: null,
} as const;

function subs(list: Array<Partial<HandoffSubCheckpoint>>): HandoffSubCheckpoint[] {
  return list.map((o, i) => ({
    id: o.id ?? `CO-3.${i + 1}`,
    title: o.title ?? "t",
    state: o.state ?? "pending",
    line: o.line ?? 100 + i,
  }));
}

/** Estado real esperado: CO-3.1 [/], CO-3.2-3.4 [ ], auditoria fechada, tree limpa. */
function snap(over: Partial<DecisionSnapshot> = {}): DecisionSnapshot {
  const facts = makeHandoffFacts({ lifecycle: { ...SETTLED } });
  return makeDecisionSnapshot({
    facts,
    openFindings: [],
    lanes: [],
    workingTreeState: "clean",
    subCheckpoints: subs([
      { id: "CO-3.1", title: "Constraint + EnforcementBinding", state: "in-progress", line: 101 },
      {
        id: "CO-3.2",
        title: "knowledge:compile + manifesto/paridade",
        state: "pending",
        line: 102,
      },
      { id: "CO-3.3", title: "migração legacy", state: "pending", line: 103 },
      { id: "CO-3.4", title: "dogfood", state: "pending", line: 104 },
    ]),
    ...over,
  });
}

class FakeGit implements DecisionGitOps {
  added: string[] = [];
  commits: string[] = [];
  pushed = 0;
  constructor(
    private readonly dirty: string[] | null,
    private readonly pushFails = false
  ) {}
  porcelainPaths() {
    return this.dirty;
  }
  revParseShortHead() {
    return "abcd123";
  }
  add(f: string) {
    this.added.push(f);
  }
  commit(m: string) {
    this.commits.push(m);
  }
  push() {
    this.pushed++;
    if (this.pushFails) throw new Error("rejected");
  }
}

describe("advance-subcheckpoint · elegibilidade [decide]", () => {
  it("[1] atual [/] + próximo [ ] (auditoria fechada, tree limpa) ⇒ available", () => {
    const av = def.detect(snap());
    expect(av.status).toBe("available");
    expect(av.hint).toMatch(/CO-3\.1 concluível; CO-3\.2 é o próximo/);
  });

  it("[2] sem próximo bloqueia", () => {
    expect(
      def.detect(
        snap({ subCheckpoints: subs([{ id: "CO-3.1", state: "in-progress", line: 101 }]) })
      ).status
    ).toBe("blocked");
  });

  it("[3] dois atuais ([/]) bloqueiam", () => {
    const s = snap({
      subCheckpoints: subs([
        { id: "CO-3.1", state: "in-progress", line: 101 },
        { id: "CO-3.2", state: "in-progress", line: 102 },
      ]),
    });
    expect(def.detect(s).status).toBe("blocked");
  });

  it("[4] ordem ambígua (pendente antes do ativo) bloqueia", () => {
    const s = snap({
      subCheckpoints: subs([
        { id: "CO-3.1", state: "pending", line: 101 },
        { id: "CO-3.2", state: "in-progress", line: 102 },
        { id: "CO-3.3", state: "pending", line: 103 },
      ]),
    });
    expect(def.detect(s).status).toBe("blocked");
  });

  it("[5] finding bloqueante aberto bloqueia", () => {
    const facts = makeHandoffFacts({ lifecycle: { ...SETTLED, openFindings: 1 } });
    const s = snap({
      facts,
      openFindings: makeDecisionSnapshot().openFindings.slice(0, 1),
    });
    expect(def.detect(s).status).toBe("blocked");
  });

  it("[6] correção aguardando revalidação bloqueia", () => {
    const facts = makeHandoffFacts({ lifecycle: { ...SETTLED, openFindings: 1 } });
    const open = makeDecisionSnapshot()
      .openFindings.slice(0, 1)
      .map((f) => ({
        ...f,
        blocking: false,
        verified: false,
        resolution: { action: "fixed", ref: "x", evidence: null, tests: [], humanSummary: null },
      }));
    expect(def.detect(snap({ facts, openFindings: open })).status).toBe("blocked");
  });

  it("[7] CI com falha bloqueia", () => {
    const facts = makeHandoffFacts({
      lifecycle: { ...SETTLED },
      pullRequest: { ...makeHandoffFacts().pullRequest!, checks: { pass: 9, fail: 2, pending: 0 } },
    });
    expect(def.detect(snap({ facts })).status).toBe("blocked");
  });

  it("[8] working tree suja bloqueia", () => {
    expect(def.detect(snap({ workingTreeState: "functional-dirty" })).status).toBe("blocked");
  });

  it("[9] branch behind bloqueia", () => {
    const facts = makeHandoffFacts({
      lifecycle: { ...SETTLED },
      git: { ...makeHandoffFacts().git, behind: 2 },
    });
    expect(def.detect(snap({ facts })).status).toBe("blocked");
  });

  it("[10] gate já registrado bloqueia", () => {
    expect(def.detect(snap({ gateExists: true })).status).toBe("blocked");
  });

  it("pós-transição (CO-3.1 [x], CO-3.2 [/]) ⇒ not-applicable", () => {
    const s = snap({
      subCheckpoints: subs([
        { id: "CO-3.1", state: "done", line: 101 },
        { id: "CO-3.2", state: "in-progress", line: 102 },
        { id: "CO-3.3", state: "pending", line: 103 },
      ]),
    });
    expect(def.detect(s).status).toBe("not-applicable");
  });
});

describe("advance-subcheckpoint · briefing humano [decide]", () => {
  it("[11] resumo não começa por ID/SHA; seções humanas", () => {
    const b = def.buildBrief(snap(), { technical: false });
    expect(b.summary).not.toMatch(/^[0-9a-f]{7,}/i);
    expect(b.summary).not.toMatch(/^(CO-\d|technical_audit#)/);
    expect(b.sections.map((s) => s.heading)).toContain("O que foi concluído?");
  });

  it("[12] detalhes técnicos (linhas/paths) só em --technical", () => {
    const humanOut = renderBrief(def.buildBrief(snap(), { technical: false }), {
      technical: false,
    });
    expect(humanOut).not.toMatch(/tasks\.md linha|\.governance\/specs/);
    const techOut = renderBrief(def.buildBrief(snap(), { technical: true }), { technical: true });
    expect(techOut).toMatch(/tasks\.md linha 101/);
  });
});

describe("advance-subcheckpoint · plano e marcadores [decide]", () => {
  it("[13] preview altera exatamente dois marcadores", () => {
    const plan = def.plan(snap(), "advance");
    expect(plan.mutating).toBe(true);
    expect(plan.changes.map((c) => c.description)).toEqual([
      "CO-3.1: [/] → [x]",
      "CO-3.2: [ ] → [/]",
    ]);
    expect(plan.preserved.join(" ")).toMatch(/state\.yml/);
    expect(plan.commitMessage).toBe("docs(spec-0024): avança co-enforcement para CO-3.2");
  });

  it("[14] keep/request-explanation/cancel geram zero diff", () => {
    expect(def.plan(snap(), "keep").mutating).toBe(false);
    expect(def.plan(snap(), "request-explanation").mutating).toBe(false);
    expect(def.plan(snap(), "cancel").mutating).toBe(false);
  });

  it("[26] plano é determinístico (wizard e modo direto produzem o mesmo)", () => {
    const s = snap();
    expect(def.plan(s, "advance")).toEqual(def.plan(s, "advance"));
  });

  it("marcadores: troca só os dois caracteres, preserva o resto e CRLF", () => {
    const md = ["x", "- [/] **CO-3.1 — A** desc", "- [ ] **CO-3.2 — B** desc", "y"].join("\r\n");
    const r = advanceSubCheckpointMarkers(md, "CO-3.1", "CO-3.2");
    expect(r.ok).toBe(true);
    expect(r.text).toBe(
      ["x", "- [x] **CO-3.1 — A** desc", "- [/] **CO-3.2 — B** desc", "y"].join("\r\n")
    );
  });

  it("[17] marcador ausente ⇒ edição falha (sem escrita)", () => {
    const md = "- [/] **CO-3.1 — A**\n- [/] **CO-3.2 — B**"; // CO-3.2 não está [ ]
    expect(advanceSubCheckpointMarkers(md, "CO-3.1", "CO-3.2").ok).toBe(false);
  });
});

// ── apply: repo temporário com tasks.md + state.yml ──────────────────────────
const TASKS_MD = `# Tasks

- [/] **Checkpoint co-enforcement** (nó \`co-enforcement\`) — em execução.
  - **Sub-checkpoints (CO-3):**
    - [/] **CO-3.1 — Constraint + EnforcementBinding** (modelo): EM EXECUÇÃO.
    - [ ] **CO-3.2 — knowledge:compile + manifesto/paridade**: entrypoint humano.
    - [ ] **CO-3.3 — migração legacy**: port TS.
`;

function applySnap(repoRoot: string): DecisionSnapshot {
  const facts = makeHandoffFacts({ lifecycle: { ...SETTLED } });
  return makeDecisionSnapshot({
    repoRoot,
    facts,
    specId: "0099",
    specPath: ".governance/specs/0099-x",
    checkpoint: "checkpoint-co-enforcement",
    openFindings: [],
    lanes: [],
    workingTreeState: "clean",
    subCheckpoints: subs([
      { id: "CO-3.1", title: "Constraint + EnforcementBinding", state: "in-progress", line: 5 },
      { id: "CO-3.2", title: "knowledge:compile + manifesto/paridade", state: "pending", line: 6 },
      { id: "CO-3.3", title: "migração legacy", state: "pending", line: 7 },
    ]),
  });
}

describe("advance-subcheckpoint · apply (efeito governado) [decide]", () => {
  let repoRoot: string;
  let tasksAbs: string;
  let stateAbs: string;
  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "decide-adv-"));
    const dir = path.join(repoRoot, ".governance/specs/0099-x");
    fs.mkdirSync(dir, { recursive: true });
    tasksAbs = path.join(dir, "tasks.md");
    stateAbs = path.join(dir, "state.yml");
    fs.writeFileSync(tasksAbs, TASKS_MD);
    fs.writeFileSync(stateAbs, "stage: implementation\ngate:\n  status: closed\n");
  });
  afterEach(() => fs.rmSync(repoRoot, { recursive: true, force: true }));

  const ctx = (git: DecisionGitOps) => ({
    repoRoot,
    logger: { info: () => {}, error: () => {} },
    actor: OWNER,
    git,
    authorization: "explicit-human-decision" as const,
  });

  it("[16][18][20][21][23] aplica a transição: só tasks.md, 1 ativo, work aponta CO-3.2, commit exclusivo", async () => {
    const stateBefore = fs.readFileSync(stateAbs, "utf8");
    const plan = def.plan(applySnap(repoRoot), "advance");
    const git = new FakeGit([".governance/specs/0099-x/tasks.md"]);
    const result = await def.apply(plan, ctx(git));
    expect(result.ok).toBe(true);

    const after = fs.readFileSync(tasksAbs, "utf8");
    expect(after).toContain("- [x] **CO-3.1 —");
    expect(after).toContain("- [/] **CO-3.2 —");
    expect(after).toContain("- [ ] **CO-3.3 —");

    // [19] state.yml byte-idêntico.
    expect(fs.readFileSync(stateAbs, "utf8")).toBe(stateBefore);
    // [18][22][23] só tasks.md; commit exclusivo.
    expect(git.added).toEqual([".governance/specs/0099-x/tasks.md"]);
    expect(git.commits).toHaveLength(1);
    expect(git.pushed).toBe(1);
  });

  it("[24] push falho preserva o commit local", async () => {
    const plan = def.plan(applySnap(repoRoot), "advance");
    const git = new FakeGit([".governance/specs/0099-x/tasks.md"], true);
    const result = await def.apply(plan, ctx(git));
    expect(result.ok).toBe(false);
    expect(result.committed).toBe("abcd123");
    expect(result.pushed).toBe(false);
    expect(result.messages.join(" ")).toMatch(/permanece LOCAL/);
  });

  it("diff misto bloqueia antes do commit", async () => {
    const plan = def.plan(applySnap(repoRoot), "advance");
    const git = new FakeGit([".governance/specs/0099-x/tasks.md", "src/foo.ts"]);
    const result = await def.apply(plan, ctx(git));
    expect(result.ok).toBe(false);
    expect(git.commits).toHaveLength(0);
  });
});

// ── simulação prospectiva: o estado projetado vira IMPLEMENT com objeto ───────
describe("advance-subcheckpoint · simulação prospectiva [decide]", () => {
  it("[16] o estado projetado infere IMPLEMENT_CHECKPOINT com objeto CO-3.2", () => {
    const r = advanceSubCheckpointMarkers(TASKS_MD, "CO-3.1", "CO-3.2");
    expect(r.ok).toBe(true);
    const projected = resolveSubCheckpointWork({
      subCheckpoints: [
        { id: "CO-3.1", title: "a", state: "done", line: 5 },
        {
          id: "CO-3.2",
          title: "knowledge:compile + manifesto/paridade",
          state: "in-progress",
          line: 6,
        },
        { id: "CO-3.3", title: "c", state: "pending", line: 7 },
      ],
      lifecycle: { ...SETTLED },
    } as never);
    expect(projected.kind).toBe("implement");
    if (projected.kind === "implement") expect(projected.subCheckpoint.id).toBe("CO-3.2");
  });
});

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { AdvanceStepDefinition, advanceStepMarkers } from "./advanceStep.js";
import { DecisionGitOps } from "./model.js";
import { DecisionSnapshot } from "./snapshot.js";
import { HandoffStep } from "../../app/handoff/handoffFacts.js";
import { resolveStepWork } from "../workBrief.js";
import { renderBrief } from "./render.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";

const def = new AdvanceStepDefinition();
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

function subs(list: Array<Partial<HandoffStep>>): HandoffStep[] {
  return list.map((o, i) => ({
    id: o.id ?? `CO-3.${i + 1}`,
    title: o.title ?? "t",
    state: o.state ?? "pending",
    line: o.line ?? 100 + i,
    ...(o.readiness ? { readiness: o.readiness } : {}),
  }));
}

/** Estado real esperado: CO-3.1 [/] com readiness declarada, CO-3.2-3.4 [ ], tree limpa. */
function snap(over: Partial<DecisionSnapshot> = {}): DecisionSnapshot {
  const facts = makeHandoffFacts({ lifecycle: { ...SETTLED } });
  return makeDecisionSnapshot({
    facts,
    openFindings: [],
    lanes: [],
    workingTreeState: "clean",
    steps: subs([
      {
        id: "CO-3.1",
        title: "Constraint + EnforcementBinding",
        state: "in-progress",
        line: 101,
        readiness: "ready-for-transition",
      },
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

describe("advance-step · elegibilidade [decide]", () => {
  it("[1] atual [/] com readiness + próximo [ ] (tree limpa) ⇒ available", () => {
    const av = def.detect(snap());
    expect(av.status).toBe("available");
    expect(av.hint).toMatch(/CO-3\.1 concluível; CO-3\.2 é o próximo/);
  });

  it("[2] sem próximo não se aplica (terminal do checkpoint)", () => {
    const av = def.detect(
      snap({
        steps: subs([
          {
            id: "CO-3.1",
            state: "in-progress",
            line: 101,
            readiness: "ready-for-transition",
          },
        ]),
      })
    );
    expect(av.status).toBe("not-applicable");
    expect(av.reasons.join(" ")).toMatch(/Não há próxima etapa pendente/);
  });

  it("[3] dois atuais ([/]) bloqueiam", () => {
    const s = snap({
      steps: subs([
        { id: "CO-3.1", state: "in-progress", line: 101 },
        { id: "CO-3.2", state: "in-progress", line: 102 },
      ]),
    });
    expect(def.detect(s).status).toBe("blocked");
  });

  it("[4] ordem ambígua (pendente antes do ativo) bloqueia", () => {
    const s = snap({
      steps: subs([
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

  it("[27] ESTADO REAL pós-transição (CO-3.1 [x], CO-3.2 [/] ready, CO-3.3 [ ]) ⇒ available", () => {
    // Regressão do dogfood: ter CO-3.1 já concluído ([x]) é o caso NORMAL de toda
    // transição após a primeira — NÃO torna `advance` not-applicable (ocultando-o
    // do menu enquanto `work` o recomendava). Com o ATIVO declarando readiness,
    // a transição CO-3.2 → CO-3.3 é AVAILABLE.
    const s = snap({
      steps: subs([
        { id: "CO-3.1", state: "done", line: 101 },
        { id: "CO-3.2", state: "in-progress", line: 102, readiness: "ready-for-transition" },
        { id: "CO-3.3", state: "pending", line: 103 },
        { id: "CO-3.4", state: "pending", line: 104 },
      ]),
    });
    const av = def.detect(s);
    expect(av.status).toBe("available");
    expect(av.hint).toMatch(/CO-3\.2 concluível; CO-3\.3 é o próximo/);
  });

  it("[28] atual [/] SEM readiness ⇒ blocked (critérios de saída não declarados)", () => {
    const s = snap({
      steps: subs([
        { id: "CO-3.1", state: "done", line: 101 },
        { id: "CO-3.2", state: "in-progress", line: 102 }, // sem readiness
        { id: "CO-3.3", state: "pending", line: 103 },
      ]),
    });
    const av = def.detect(s);
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/CO-3\.2 ainda não declarou seus critérios de saída/);
  });

  it("[29] readiness + ZERO findings ⇒ available (findings fechados não são pré-requisito)", () => {
    const facts = makeHandoffFacts({
      lifecycle: { ...SETTLED, closedFindings: 0, resolutions: 0 },
    });
    const av = def.detect(snap({ facts }));
    expect(av.status).toBe("available"); // antes era bloqueado por closedFindings===0
  });

  it("[30] findings fechados (do CO-3.1) NÃO liberam o ativo SEM readiness", () => {
    // closedFindings=3 (audit do CO-3.1) presentes, mas o ativo não declarou readiness.
    const s = snap({
      steps: subs([
        { id: "CO-3.1", state: "done", line: 101 },
        { id: "CO-3.2", state: "in-progress", line: 102 }, // sem readiness
        { id: "CO-3.3", state: "pending", line: 103 },
      ]),
    });
    expect(def.detect(s).status).toBe("blocked"); // SETTLED tem closedFindings=3
  });

  it("[28] pós-transição com CI pendente ⇒ blocked e o requisito é NOMEADO", () => {
    const facts = makeHandoffFacts({
      lifecycle: { ...SETTLED },
      pullRequest: { ...makeHandoffFacts().pullRequest!, checks: { pass: 9, fail: 0, pending: 3 } },
    });
    const s = snap({
      facts,
      steps: subs([
        { id: "CO-3.1", state: "done", line: 101 },
        { id: "CO-3.2", state: "in-progress", line: 102 },
        { id: "CO-3.3", state: "pending", line: 103 },
      ]),
    });
    const av = def.detect(s);
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/verificação\(ões\) pendente/);
  });
});

describe("advance-step · briefing humano [decide]", () => {
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

  it("[12b] terminal sem próximo explica que advance-step não se aplica", () => {
    const b = def.buildBrief(
      snap({
        steps: subs([
          { id: "CO-3.4", state: "in-progress", readiness: "ready-for-transition", line: 104 },
        ]),
      }),
      { technical: false }
    );
    expect(b.status).toBe("not-applicable");
    expect(b.summary).toMatch(/não se aplica ao terminal/);
    expect(b.consequences.join(" ")).toMatch(/Nenhuma etapa será marcada ou ativada/);
    expect(b.blockedReasons.join(" ")).toMatch(/Não há próxima etapa pendente/);
  });
});

describe("advance-step · plano e marcadores [decide]", () => {
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
    const r = advanceStepMarkers(md, "CO-3.1", "CO-3.2");
    expect(r.ok).toBe(true);
    expect(r.text).toBe(
      ["x", "- [x] **CO-3.1 — A** desc", "- [/] **CO-3.2 — B** desc", "y"].join("\r\n")
    );
  });

  it("ao concluir, REMOVE o readiness do concluído (invariante: [x] nunca carrega readiness)", () => {
    const md = [
      "- [/] **CO-3.4 — dogfood** `readiness: ready-for-transition`: desc",
      "- [ ] **CO-3.5 — colapso**: desc",
    ].join("\n");
    const r = advanceStepMarkers(md, "CO-3.4", "CO-3.5");
    expect(r.ok).toBe(true);
    expect(r.text).toBe(
      ["- [x] **CO-3.4 — dogfood**: desc", "- [/] **CO-3.5 — colapso**: desc"].join("\n")
    );
    // o concluído [x] não pode mais conter o token
    expect(r.text).not.toMatch(/\[x\][^\n]*readiness/);
  });

  it("[17] marcador ausente ⇒ edição falha (sem escrita)", () => {
    const md = "- [/] **CO-3.1 — A**\n- [/] **CO-3.2 — B**"; // CO-3.2 não está [ ]
    expect(advanceStepMarkers(md, "CO-3.1", "CO-3.2").ok).toBe(false);
  });
});

// ── apply: repo temporário com tasks.md + state.yml ──────────────────────────
const TASKS_MD = `# Tasks

- [/] **Checkpoint co-enforcement** (nó \`co-enforcement\`) — em execução.
  - **Etapas (CO-3):**
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
    steps: subs([
      { id: "CO-3.1", title: "Constraint + EnforcementBinding", state: "in-progress", line: 5 },
      { id: "CO-3.2", title: "knowledge:compile + manifesto/paridade", state: "pending", line: 6 },
      { id: "CO-3.3", title: "migração legacy", state: "pending", line: 7 },
    ]),
  });
}

describe("advance-step · apply (efeito governado) [decide]", () => {
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
describe("advance-step · simulação prospectiva [decide]", () => {
  it("[16] o estado projetado infere IMPLEMENT_CHECKPOINT com objeto CO-3.2", () => {
    const r = advanceStepMarkers(TASKS_MD, "CO-3.1", "CO-3.2");
    expect(r.ok).toBe(true);
    const projected = resolveStepWork({
      steps: [
        { id: "CO-3.1", title: "a", state: "done", line: 5 },
        {
          id: "CO-3.2",
          title: "knowledge:compile + manifesto/paridade",
          state: "in-progress",
          line: 6,
        },
        { id: "CO-3.3", title: "c", state: "pending", line: 7 },
      ],
      lifecycle: { ...SETTLED, resolutions: 0 },
    } as never);
    expect(projected.kind).toBe("implement");
    if (projected.kind === "implement") expect(projected.step.id).toBe("CO-3.2");
  });
});

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { DecisionGitOps } from "./model.js";
import { DecisionSnapshot } from "./snapshot.js";
import { MarkReadinessDefinition, markReadinessMarker } from "./markReadiness.js";
import { HandoffStep, resolveStepWork } from "../handoffFacts.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";

const def = new MarkReadinessDefinition();
const OWNER = { name: "Rosana", email: "rosanarezende.com@gmail.com", handle: "@rosanarezende" };

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

function subs(list: Array<Partial<HandoffStep>>): HandoffStep[] {
  return list.map((o, i) => ({
    id: o.id ?? `CO-10.${i + 1}`,
    title: o.title ?? "t",
    state: o.state ?? "pending",
    line: o.line ?? 100 + i,
    ...(o.readiness ? { readiness: o.readiness } : {}),
  }));
}

function snap(over: Partial<DecisionSnapshot> = {}): DecisionSnapshot {
  const facts = makeHandoffFacts({
    activeNode: {
      id: "co-flow-convergence",
      githubPr: 43,
      sequence: 10,
      terminal: false,
    },
    cursor: {
      pr: "co-flow-convergence",
      checkpoint: "checkpoint-co-flow-convergence",
    },
    git: {
      ...makeHandoffFacts().git,
      branch: "feat/spec-0024-co-flow-convergence",
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
    lifecycle: { ...SETTLED },
    steps: subs([
      { id: "CO-10.1", title: "inventário real + modelo canônico", state: "in-progress" },
      { id: "CO-10.2", title: "confronto modelo × código", state: "pending" },
    ]),
  });
  return makeDecisionSnapshot({
    facts,
    specId: "0024",
    checkpoint: "checkpoint-co-flow-convergence",
    openFindings: [],
    lanes: [],
    workingTreeState: "clean",
    steps: facts.steps,
    gateExists: false,
    gateFile: null,
    ...over,
  });
}

class FakeGit implements DecisionGitOps {
  added: string[] = [];
  commits: string[] = [];
  pushed = 0;
  constructor(private readonly dirty: string[] | null) {}
  porcelainPaths() {
    return this.dirty;
  }
  revParseShortHead() {
    return "ready01";
  }
  add(file: string) {
    this.added.push(file);
  }
  commit(message: string) {
    this.commits.push(message);
  }
  push() {
    this.pushed++;
  }
}

describe("mark-readiness · elegibilidade [decide]", () => {
  it("fica disponível quando findings estão fechados, CI verde e tree limpa", () => {
    const av = def.detect(snap());
    expect(av.status).toBe("available");
    expect(av.hint).toMatch(/CO-10\.1 pronto/);
  });

  it("bloqueia com finding aberto", () => {
    const base = makeDecisionSnapshot().openFindings.slice(0, 1);
    const facts = makeHandoffFacts({ lifecycle: { ...SETTLED, openFindings: 1 } });
    const av = def.detect(snap({ facts, openFindings: base }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/finding/);
  });

  it("bloqueia com CI pendente", () => {
    const facts = makeHandoffFacts({
      lifecycle: { ...SETTLED },
      pullRequest: { ...makeHandoffFacts().pullRequest!, checks: { pass: 9, fail: 0, pending: 2 } },
    });
    const av = def.detect(snap({ facts }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/pendente/);
  });

  it("bloqueia quando PR head remoto não cobre o HEAD local", () => {
    const facts = makeHandoffFacts({
      lifecycle: { ...SETTLED },
      git: { ...makeHandoffFacts().git, head: "bbbbbbb" },
      pullRequest: { ...makeHandoffFacts().pullRequest!, headRefOid: "aaaaaaaa" },
    });
    const av = def.detect(snap({ facts, gitHead: "bbbbbbb" }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/não cobre o git HEAD local/);
  });

  it("bloqueia com working tree suja", () => {
    expect(def.detect(snap({ workingTreeState: "functional-dirty" })).status).toBe("blocked");
  });

  it("bloqueia se gate já foi aprovado/publicado", () => {
    const facts = makeHandoffFacts({ lifecycle: { ...SETTLED, gateDecision: "approved" } });
    const av = def.detect(snap({ facts, gateExists: true }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/gate/);
  });

  it("bloqueia sem etapa ativa", () => {
    const av = def.detect(
      snap({
        steps: subs([{ id: "CO-10.1", state: "pending" }]),
      })
    );
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/Nenhuma etapa/);
  });

  it("bloqueia com múltiplas etapas ativas", () => {
    const av = def.detect(
      snap({
        steps: subs([
          { id: "CO-10.1", state: "in-progress" },
          { id: "CO-10.2", state: "in-progress" },
        ]),
      })
    );
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/Mais de um/);
  });

  it("bloqueia readiness em [ ] ou [x]", () => {
    const av = def.detect(
      snap({
        steps: subs([
          { id: "CO-10.1", state: "in-progress" },
          { id: "CO-10.2", state: "pending", readiness: "ready-for-transition" },
        ]),
      })
    );
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/readiness só é válida/);
  });
});

describe("mark-readiness · efeito governado [decide]", () => {
  let repoRoot: string;
  let tasksAbs: string;
  let stateAbs: string;
  let reviewAbs: string;
  let gateDir: string;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "decide-ready-"));
    const dir = path.join(repoRoot, ".governance/specs/0024-context-architecture");
    fs.mkdirSync(path.join(dir, "reviews"), { recursive: true });
    gateDir = path.join(dir, "gates");
    fs.mkdirSync(gateDir, { recursive: true });
    tasksAbs = path.join(dir, "tasks.md");
    stateAbs = path.join(dir, "state.yml");
    reviewAbs = path.join(dir, "reviews/c-co-flow-convergence-technical_audit.yml");
    fs.writeFileSync(
      tasksAbs,
      [
        "# Tasks",
        "",
        "- [/] **Checkpoint co-flow-convergence** (nó `co-flow-convergence`) — em execução.",
        "  - **Etapas (CO-10):**",
        "    - [/] **CO-10.1 — inventário real + modelo canônico**: em execução.",
        "    - [ ] **CO-10.2 — confronto modelo × código**: pendente.",
      ].join("\n")
    );
    fs.writeFileSync(stateAbs, "active: co-flow-convergence\n");
    fs.writeFileSync(reviewAbs, "role: technical_audit\n");
  });

  afterEach(() => fs.rmSync(repoRoot, { recursive: true, force: true }));

  function applySnap(): DecisionSnapshot {
    return snap({
      repoRoot,
      specPath: ".governance/specs/0024-context-architecture",
      steps: subs([
        {
          id: "CO-10.1",
          title: "inventário real + modelo canônico",
          state: "in-progress",
          line: 5,
        },
        { id: "CO-10.2", title: "confronto modelo × código", state: "pending", line: 6 },
      ]),
    });
  }

  const ctx = (git: DecisionGitOps) => ({
    repoRoot,
    logger: { info: () => {}, error: () => {} },
    actor: OWNER,
    git,
    authorization: "explicit-human-decision" as const,
  });

  it("aplica somente readiness em tasks.md e preserva state/reviews/gates", async () => {
    const stateBefore = fs.readFileSync(stateAbs, "utf8");
    const reviewBefore = fs.readFileSync(reviewAbs, "utf8");
    const plan = def.plan(applySnap(), "mark-ready");
    const git = new FakeGit([".governance/specs/0024-context-architecture/tasks.md"]);

    const result = await def.apply(plan, ctx(git));

    expect(result.ok).toBe(true);
    const after = fs.readFileSync(tasksAbs, "utf8");
    expect(after).toContain(
      "- [/] **CO-10.1 — inventário real + modelo canônico** `readiness: ready-for-transition`:"
    );
    expect(after).toContain("- [ ] **CO-10.2");
    expect(fs.readFileSync(stateAbs, "utf8")).toBe(stateBefore);
    expect(fs.readFileSync(reviewAbs, "utf8")).toBe(reviewBefore);
    expect(fs.readdirSync(gateDir)).toEqual([]);
    expect(git.added).toEqual([".governance/specs/0024-context-architecture/tasks.md"]);
    expect(git.commits).toEqual(["docs(spec-0024): declara readiness de CO-10.1"]);
    expect(git.pushed).toBe(1);
  });

  it("bloqueia diff misto antes de commit", async () => {
    const plan = def.plan(applySnap(), "mark-ready");
    const git = new FakeGit([
      ".governance/specs/0024-context-architecture/tasks.md",
      ".governance/specs/0024-context-architecture/state.yml",
    ]);
    const result = await def.apply(plan, ctx(git));
    expect(result.ok).toBe(false);
    expect(git.commits).toHaveLength(0);
    expect(result.messages.join(" ")).toMatch(/mixed_diff/);
  });

  it("após readiness, work infere transição para CO-10.2", () => {
    const md = fs.readFileSync(tasksAbs, "utf8");
    const edited = markReadinessMarker(md, "CO-10.1");
    expect(edited.ok).toBe(true);
    const projected = resolveStepWork({
      ...makeHandoffFacts(),
      steps: [
        {
          id: "CO-10.1",
          title: "inventário real + modelo canônico",
          state: "in-progress",
          line: 3,
          readiness: "ready-for-transition",
        },
        { id: "CO-10.2", title: "confronto modelo × código", state: "pending", line: 4 },
      ],
      lifecycle: { ...SETTLED },
    });
    expect(projected.kind).toBe("transition");
    if (projected.kind === "transition") expect(projected.transition.activate.id).toBe("CO-10.2");
  });
});

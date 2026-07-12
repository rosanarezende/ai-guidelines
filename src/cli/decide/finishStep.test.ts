import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { FinishStepDefinition } from "./finishStep.js";
import { DecisionGitOps } from "./model.js";
import { DecisionSnapshot } from "./snapshot.js";
import { HandoffStep } from "../handoffFacts.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";

const def = new FinishStepDefinition();
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
    id: o.id ?? `CO-10.${i + 1}`,
    title: o.title ?? "t",
    state: o.state ?? "pending",
    line: o.line ?? 100 + i,
    ...(o.readiness ? { readiness: o.readiness } : {}),
  }));
}

function snap(over: Partial<DecisionSnapshot> = {}): DecisionSnapshot {
  const facts = makeHandoffFacts({ lifecycle: { ...SETTLED } });
  return makeDecisionSnapshot({
    facts,
    checkpoint: "checkpoint-co-flow-convergence",
    openFindings: [],
    lanes: [],
    workingTreeState: "clean",
    steps: subs([
      { id: "CO-10.3", state: "done", line: 103 },
      { id: "CO-10.4", title: "dogfood ponta a ponta", state: "in-progress", line: 104 },
      { id: "CO-10.5", title: "falsificação + Human Gate", state: "pending", line: 105 },
    ]),
    stepDeliveryEvidence: {
      status: "present",
      activeId: "CO-10.4",
      activationCommit: "aaaaaaa",
      commitsAfterActivation: 1,
    },
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
    return "abcd123";
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

describe("finish-step · elegibilidade [decide]", () => {
  it("sem readiness persistida, mas critérios satisfeitos e próximo pendente ⇒ available", () => {
    const av = def.detect(snap());
    expect(av.status).toBe("available");
    expect(av.hint).toMatch(/CO-10\.4 satisfaz readiness; CO-10\.5 será ativado/);
  });

  it("com readiness já existente, usa a mesma elegibilidade de advance ⇒ available", () => {
    const av = def.detect(
      snap({
        steps: subs([
          { id: "CO-10.3", state: "done", line: 103 },
          {
            id: "CO-10.4",
            state: "in-progress",
            readiness: "ready-for-transition",
            line: 104,
          },
          { id: "CO-10.5", state: "pending", line: 105 },
        ]),
      })
    );
    expect(av.status).toBe("available");
  });

  it("CI pendente bloqueia e nomeia o requisito", () => {
    const facts = makeHandoffFacts({
      lifecycle: { ...SETTLED },
      pullRequest: { ...makeHandoffFacts().pullRequest!, checks: { pass: 4, fail: 0, pending: 1 } },
    });
    const av = def.detect(snap({ facts }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/pendente/);
  });

  it("terminal sem próximo pendente não usa finish-step", () => {
    const av = def.detect(
      snap({
        steps: subs([
          { id: "CO-10.4", state: "done", line: 104 },
          { id: "CO-10.5", state: "in-progress", line: 105 },
        ]),
      })
    );
    expect(av.status).toBe("not-applicable");
    expect(av.reasons.join(" ")).toMatch(/caminho terminal/);
  });
});

describe("finish-step · plano e apply [decide]", () => {
  const TASKS = `# Tasks

- [/] **Checkpoint co-flow-convergence** (nó \`co-flow-convergence\`) — ativo.
  - [x] **CO-10.3 — correção integral**: feito.
  - [/] **CO-10.4 — dogfood ponta a ponta**: ativo.
  - [ ] **CO-10.5 — falsificação + Human Gate**: pendente.
`;

  let repoRoot: string;
  let tasksAbs: string;
  let stateAbs: string;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "decide-finish-"));
    const dir = path.join(repoRoot, ".governance/specs/0099-x");
    fs.mkdirSync(dir, { recursive: true });
    tasksAbs = path.join(dir, "tasks.md");
    stateAbs = path.join(dir, "state.yml");
    fs.writeFileSync(tasksAbs, TASKS);
    fs.writeFileSync(stateAbs, "stage: implementation\n");
  });

  afterEach(() => fs.rmSync(repoRoot, { recursive: true, force: true }));

  function applySnap(): DecisionSnapshot {
    return snap({
      repoRoot,
      specId: "0099",
      specPath: ".governance/specs/0099-x",
      checkpoint: "checkpoint-co-flow-convergence",
    });
  }

  const ctx = (git: DecisionGitOps) => ({
    repoRoot,
    logger: { info: () => {}, error: () => {} },
    actor: OWNER,
    git,
    authorization: "explicit-human-decision" as const,
  });

  it("preview altera exatamente dois marcadores, sem readiness intermediária", () => {
    const plan = def.plan(applySnap(), "finish");
    expect(plan.mutating).toBe(true);
    expect(plan.changes.map((c) => c.description)).toEqual([
      "CO-10.4: [/] → [x]",
      "CO-10.5: [ ] → [/]",
    ]);
    expect(plan.commitMessage).toBe("docs(spec-0099): conclui CO-10.4 e ativa CO-10.5");
    expect(plan.preserved.join(" ")).toMatch(/state\.yml/);
  });

  it("aplica só tasks.md e deixa o próximo ativo sem implementar nada", async () => {
    const stateBefore = fs.readFileSync(stateAbs, "utf8");
    const git = new FakeGit([".governance/specs/0099-x/tasks.md"]);
    const result = await def.apply(def.plan(applySnap(), "finish"), ctx(git));

    expect(result.ok).toBe(true);
    const after = fs.readFileSync(tasksAbs, "utf8");
    expect(after).toContain("- [x] **CO-10.4 —");
    expect(after).toContain("- [/] **CO-10.5 —");
    expect(after).not.toMatch(/CO-10\.4[^\n]*readiness/);
    expect(fs.readFileSync(stateAbs, "utf8")).toBe(stateBefore);
    expect(git.added).toEqual([".governance/specs/0099-x/tasks.md"]);
    expect(git.commits).toEqual(["docs(spec-0099): conclui CO-10.4 e ativa CO-10.5"]);
    expect(git.pushed).toBe(1);
  });

  it("diff misto bloqueia antes do commit", async () => {
    const git = new FakeGit([".governance/specs/0099-x/tasks.md", "src/foo.ts"]);
    const result = await def.apply(def.plan(applySnap(), "finish"), ctx(git));
    expect(result.ok).toBe(false);
    expect(git.commits).toHaveLength(0);
  });
});

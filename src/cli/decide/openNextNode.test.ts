import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { PullRequestData, StackOps } from "../../app/ports/StackOps.js";
import type { DecisionApplyContext, DecisionGitOps, Logger } from "./model.js";
import {
  OpenNextNodeDefinition,
  type OpenNextNodePayload,
  executionPrTitle,
  nextNodeBranch,
  transitionActiveSpecsYaml,
  transitionStateYaml,
  transitionTasksMarkdown,
} from "./openNextNode.js";
import { parseWorkflowState } from "../../infrastructure/yaml/workflowStateSerializer.js";
import { parseActiveSpecs } from "../../infrastructure/yaml/activeSpecsSerializer.js";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";

const def = new OpenNextNodeDefinition();

const SETTLED_GATE = {
  reviewDecisions: [],
  requiredReviewRoles: [],
  reviewStatuses: [],
  openFindings: 0,
  openBlocking: 0,
  closedFindings: 6,
  resolutions: 6,
  gateDecision: "approved",
} as const;

const STATE_YAML = `stage: implementation
gate:
  status: closed
focus: []
next: []
topology:
  cursor:
    pr: co-flow-convergence
    checkpoint: checkpoint-co-flow-convergence
  prs:
    concluded:
      - id: node-1
        github_pr: 1
        role: execution
        terminal: false
        sequence: 1
        checkpoints: [checkpoint-node-1]
      - id: node-2
        github_pr: 2
        role: execution
        terminal: false
        sequence: 2
        checkpoints: [checkpoint-node-2]
      - id: node-3
        github_pr: 3
        role: execution
        terminal: false
        sequence: 3
        checkpoints: [checkpoint-node-3]
      - id: node-4
        github_pr: 4
        role: execution
        terminal: false
        sequence: 4
        checkpoints: [checkpoint-node-4]
      - id: node-5
        github_pr: 5
        role: execution
        terminal: false
        sequence: 5
        checkpoints: [checkpoint-node-5]
      - id: node-6
        github_pr: 6
        role: execution
        terminal: false
        sequence: 6
        checkpoints: [checkpoint-node-6]
      - id: node-7
        github_pr: 7
        role: execution
        terminal: false
        sequence: 7
        checkpoints: [checkpoint-node-7]
      - id: node-8
        github_pr: 8
        role: execution
        terminal: false
        sequence: 8
        checkpoints: [checkpoint-node-8]
      - id: co-enforcement
        github_pr: 42
        role: execution
        terminal: false
        sequence: 9
        checkpoints: [checkpoint-co-enforcement]
    active:
      - id: co-flow-convergence
        github_pr: 43
        role: execution
        terminal: false
        sequence: 10
        checkpoints: [checkpoint-co-flow-convergence]
    planned:
      - id: co-capture
        github_pr: null
        role: execution
        terminal: false
        sequence: 11
        checkpoints: [checkpoint-co-capture]
      - id: integration-final
        github_pr: null
        role: integration
        terminal: true
        sequence: null
        checkpoints: [review-and-merge]
`;

const ACTIVE_SPECS_YAML = `version: 1
active_specs:
  - id: "0024"
    slug: context-architecture
    branch: feat/spec-0024-co-flow-convergence
    stage: implementation
    status: active
    spec_path: .governance/specs/0024-context-architecture
    source_state_path: .governance/specs/0024-context-architecture/state.yml
    updated_at: 2026-06-16T00:00:00.000-03:00
    updated_by: "@rosanarezende"
`;

const TASKS_MD = `# Tasks

## Fase de Absorção

- [x] **Checkpoint co-enforcement** (nó \`co-enforcement\`, seq 9, PR #42) — concluído.
- [/] **Checkpoint co-flow-convergence** (nó \`co-flow-convergence\`, seq 10, PR #43) — ativo.

## Fase de Review
`;

function handoffSnapshot() {
  return {
    collected: { state: parseWorkflowState(STATE_YAML) },
    derived: {},
    receipt: null,
    receiptFile: null,
  } as any;
}

function postGateSnapshot(
  over: Partial<ReturnType<typeof makeDecisionSnapshot>> = {}
): ReturnType<typeof makeDecisionSnapshot> {
  const facts = makeHandoffFacts({
    cursor: { pr: "co-flow-convergence", checkpoint: "checkpoint-co-flow-convergence" },
    activeNode: {
      id: "co-flow-convergence",
      githubPr: 43,
      sequence: 10,
      terminal: false,
    },
    nextPlannedNode: {
      id: "co-capture",
      githubPr: null,
      sequence: 11,
      terminal: false,
    },
    git: {
      ...makeHandoffFacts().git,
      branch: "feat/spec-0024-co-flow-convergence",
      head: "abc1234",
      behind: 0,
      upstream: "origin/feat/spec-0024-co-flow-convergence",
    },
    pullRequest: {
      ...makeHandoffFacts().pullRequest!,
      number: 43,
      isDraft: false,
      headRefName: "feat/spec-0024-co-flow-convergence",
      baseRefName: "feat/spec-0024-co-enforcement",
      headRefOid: "abc1234",
      checks: { pass: 11, fail: 0, pending: 0 },
    },
    lifecycle: SETTLED_GATE,
  });
  return makeDecisionSnapshot({
    facts,
    handoffSnapshot: handoffSnapshot(),
    checkpoint: "checkpoint-co-flow-convergence",
    specId: "0024",
    openFindings: [],
    lanes: [],
    subCheckpoints: [
      { id: "CO-10.1", title: "inventário", state: "done", line: 1 },
      { id: "CO-10.2", title: "convergência", state: "done", line: 2 },
      { id: "CO-10.3", title: "correções", state: "done", line: 3 },
    ],
    workingTreeState: "clean",
    gateExists: true,
    gateFile: ".governance/specs/0024-context-architecture/gates/c-co-flow-convergence.yml",
    ...over,
  });
}

function payloadFrom(snapshot = postGateSnapshot()): OpenNextNodePayload {
  return def.plan(snapshot, "open-node").payload as OpenNextNodePayload;
}

function writeRepoFixture(repoRoot: string): void {
  fs.mkdirSync(path.join(repoRoot, ".governance/specs/0024-context-architecture"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(repoRoot, ".governance/runtime/specs"), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, ".governance/specs/0024-context-architecture/state.yml"),
    STATE_YAML,
    "utf8"
  );
  fs.writeFileSync(
    path.join(repoRoot, ".governance/specs/0024-context-architecture/tasks.md"),
    TASKS_MD,
    "utf8"
  );
  fs.writeFileSync(
    path.join(repoRoot, ".governance/runtime/specs/active.yml"),
    ACTIVE_SPECS_YAML,
    "utf8"
  );
}

class FakeGitOps implements DecisionGitOps {
  readonly calls: string[] = [];
  readonly staged: string[] = [];
  readonly commitMessages: string[] = [];
  private readonly beforeDirty: readonly string[] | null;
  private readonly afterDirty: readonly string[] | null;
  private readonly dirtySequence: readonly (readonly string[] | null)[];
  private statusCalls = 0;

  constructor(opts: {
    beforeDirty?: readonly string[] | null;
    afterDirty: readonly string[] | null;
    dirtySequence?: readonly (readonly string[] | null)[];
  }) {
    this.beforeDirty = opts.beforeDirty ?? [];
    this.afterDirty = opts.afterDirty;
    this.dirtySequence = opts.dirtySequence ?? [this.beforeDirty, this.afterDirty];
  }

  porcelainPaths(): readonly string[] | null {
    this.statusCalls += 1;
    return (
      this.dirtySequence[Math.min(this.statusCalls - 1, this.dirtySequence.length - 1)] ?? null
    );
  }
  revParseShortHead(): string | null {
    return `commit${this.commitMessages.length}`;
  }
  createBranch(branchName: string, startPoint: string): void {
    this.calls.push(`createBranch:${branchName}:${startPoint}`);
  }
  pushBranch(branchName: string): void {
    this.calls.push(`pushBranch:${branchName}`);
  }
  add(relFile: string): void {
    this.staged.push(relFile);
    this.calls.push(`add:${relFile}`);
  }
  commit(message: string): void {
    this.commitMessages.push(message);
    this.calls.push(`commit:${message}`);
  }
  push(): void {
    this.calls.push("push");
  }
}

class FakeStackOps implements StackOps {
  readonly created: Parameters<StackOps["createPullRequest"]>[0][] = [];
  constructor(private readonly number: number) {}

  createPullRequest(input: Parameters<StackOps["createPullRequest"]>[0]): PullRequestData {
    this.created.push(input);
    return {
      number: this.number,
      title: input.title,
      body: input.body,
      state: "OPEN",
      isDraft: input.draft === true,
      headRefName: input.head,
      baseRefName: input.base,
      labels: [],
      url: `https://github.test/repo/pull/${this.number}`,
      mergeCommitSha: null,
    };
  }
  getPullRequest(): PullRequestData | null {
    throw new Error("not used");
  }
  editPullRequestBase(): void {
    throw new Error("not used");
  }
  mergePullRequest(): void {
    throw new Error("not used");
  }
  closePullRequest(): void {
    throw new Error("not used");
  }
  listOpenPullRequests(): readonly PullRequestData[] {
    throw new Error("not used");
  }
  listReviewComments(): readonly never[] {
    throw new Error("not used");
  }
}

const silentLogger: Logger = {
  info: () => undefined,
  error: () => undefined,
};

function applyContext(
  repoRoot: string,
  git: DecisionGitOps,
  stack: StackOps
): DecisionApplyContext {
  return {
    repoRoot,
    logger: silentLogger,
    actor: { name: "Rosana", email: "rosanarezende.com@gmail.com", handle: "@rosanarezende" },
    git,
    stack,
    authorization: "explicit-human-decision",
  };
}

describe("open-next-node · elegibilidade [decide]", () => {
  it("fica disponível após Human Gate aprovado, PR Ready, CI verde e próximo nó planejado sem PR", () => {
    const av = def.detect(postGateSnapshot());
    expect(av.status).toBe("available");
    expect(av.hint).toBe("co-flow-convergence pode transicionar para co-capture");
  });

  it("não se aplica antes de Human Gate aprovado", () => {
    const facts = makeHandoffFacts({
      lifecycle: { ...SETTLED_GATE, gateDecision: null },
    });
    const av = def.detect(postGateSnapshot({ facts }));
    expect(av.status).toBe("not-applicable");
    expect(av.reasons.join(" ")).toMatch(/Human Gate/);
  });

  it("bloqueia se o PR atual ainda está Draft ou CI pendente", () => {
    const base = postGateSnapshot();
    const facts = makeHandoffFacts({
      ...base.facts,
      pullRequest: {
        ...base.facts.pullRequest!,
        isDraft: true,
        checks: { pass: 10, fail: 0, pending: 1 },
      },
      lifecycle: SETTLED_GATE,
    });
    const av = def.detect(postGateSnapshot({ facts }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/Draft/);
    expect(av.reasons.join(" ")).toMatch(/pendente/);
  });

  it("bloqueia se o próximo nó já declara PR", () => {
    const base = postGateSnapshot();
    const facts = makeHandoffFacts({
      ...base.facts,
      nextPlannedNode: {
        id: "co-capture",
        githubPr: 44,
        sequence: 11,
        terminal: false,
      },
      lifecycle: SETTLED_GATE,
    });
    const av = def.detect(postGateSnapshot({ facts }));
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/já declara PR #44/);
  });
});

describe("open-next-node · contrato e transformações puras [decide]", () => {
  it("briefing disponível nomeia nó atual, próximo nó e efeitos transacionais", () => {
    const brief = def.buildBrief(postGateSnapshot(), { technical: false });
    const text = JSON.stringify(brief.sections);
    expect(brief.status).toBe("available");
    expect(brief.summary).toContain("co-flow-convergence → co-capture");
    expect(text).toContain("Branch pretendida: feat/spec-0024-co-capture.");
    expect(text).toContain("Abrir PR Draft stacked contra a branch do nó aprovado.");
    expect(text).toContain("Atualizar state.yml com o número factual retornado pelo GitHub.");
    expect(text).toContain("Materializar tasks.md para o novo checkpoint");
  });

  it("open-node é plano mutante com branch, PR factual e artefatos governados", () => {
    const plan = def.plan(postGateSnapshot(), "open-node");
    expect(plan.mutating).toBe(true);
    expect(plan.commitMessage).toBe("docs(spec-0024): abre nó co-capture");
    expect(plan.changes.map((c) => c.path)).toEqual([
      "feat/spec-0024-co-capture",
      "PR GitHub",
      ".governance/specs/0024-context-architecture/state.yml",
      ".governance/runtime/specs/active.yml",
      ".governance/specs/0024-context-architecture/tasks.md",
    ]);
    expect(plan.preserved).toContain("merge da stack");
    expect(plan.preserved).toContain("implementação funcional do próximo nó");
  });

  it("não aceita mais prepare-plan como alias de transição", () => {
    expect(() => def.plan(postGateSnapshot(), "prepare-plan")).toThrow(/Escolha desconhecida/);
  });

  it("deriva branch e título canônicos do próximo nó", () => {
    expect(nextNodeBranch("0024", "co-capture")).toBe("feat/spec-0024-co-capture");
    expect(
      executionPrTitle("0024", {
        id: "co-capture",
        githubPr: null,
        sequence: 11,
        terminal: false,
      })
    ).toBe("[🛠️11️⃣➜] [Spec 0024] co-capture — co capture");
  });

  it("transitionStateYaml conclui nó ativo, ativa próximo e injeta PR factual", () => {
    const rendered = transitionStateYaml(STATE_YAML, payloadFrom(), 44);
    const parsed = parseWorkflowState(rendered);
    expect(parsed.topology?.cursor).toEqual({
      pr: "co-capture",
      checkpoint: "checkpoint-co-capture",
    });
    expect(parsed.topology?.prs.concluded.some((n) => n.id === "co-flow-convergence")).toBe(true);
    expect(parsed.topology?.prs.active).toHaveLength(1);
    expect(parsed.topology?.prs.active[0]).toMatchObject({
      id: "co-capture",
      github_pr: 44,
      sequence: 11,
    });
    expect(parsed.topology?.prs.planned.some((n) => n.id === "co-capture")).toBe(false);
  });

  it("transitionActiveSpecsYaml aponta a spec ativa para a nova branch", () => {
    const rendered = transitionActiveSpecsYaml(
      ACTIVE_SPECS_YAML,
      payloadFrom(),
      "@rosanarezende",
      new Date("2026-06-17T15:00:00.000Z")
    );
    const parsed = parseActiveSpecs(rendered);
    expect(parsed.activeSpecs[0]).toMatchObject({
      id: "0024",
      branch: "feat/spec-0024-co-capture",
      updatedBy: "@rosanarezende",
      updatedAt: "2026-06-17T12:00:00.000-03:00",
    });
  });

  it("transitionTasksMarkdown encerra o checkpoint atual e materializa o próximo", () => {
    const rendered = transitionTasksMarkdown(TASKS_MD, payloadFrom(), 44);
    expect(rendered).toContain("- [x] **Checkpoint co-flow-convergence**");
    expect(rendered).toContain("- [/] **Checkpoint co-capture**");
    expect(rendered).toContain("**PR #44**");
    expect(rendered).toContain("checkpoint `checkpoint-co-capture`");
  });
});

describe("open-next-node · aplicação por portas [decide]", () => {
  it("cria branch, publica, abre PR factual, escreve artefatos, comita e faz push", async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "open-next-node-"));
    writeRepoFixture(repoRoot);
    const snapshot = postGateSnapshot({ repoRoot });
    const plan = def.plan(snapshot, "open-node");
    const payload = plan.payload as OpenNextNodePayload;
    const expectedDirty = [payload.stateFile, payload.activeSpecsFile, payload.tasksFile];
    const git = new FakeGitOps({
      afterDirty: expectedDirty,
      dirtySequence: [[], [payload.activeSpecsFile], expectedDirty],
    });
    const stack = new FakeStackOps(44);

    const result = await def.apply(plan, applyContext(repoRoot, git, stack));

    expect(result.ok).toBe(true);
    expect(result.committed).toBe("commit2");
    expect(result.pushed).toBe(true);
    expect(git.calls).toEqual([
      "createBranch:feat/spec-0024-co-capture:abc1234",
      `add:${payload.activeSpecsFile}`,
      "commit:docs(spec-0024): prepara branch co-capture",
      "pushBranch:feat/spec-0024-co-capture",
      `add:${payload.stateFile}`,
      `add:${payload.activeSpecsFile}`,
      `add:${payload.tasksFile}`,
      "commit:docs(spec-0024): abre nó co-capture",
      "push",
    ]);
    expect(stack.created).toHaveLength(1);
    expect(stack.created[0]).toMatchObject({
      base: "feat/spec-0024-co-flow-convergence",
      head: "feat/spec-0024-co-capture",
      draft: true,
    });
    expect(stack.created[0].body).toContain(
      "<summary><strong>Detalhes de escopo e limites</strong></summary>"
    );
    expect(stack.created[0].body).toContain("## Valor entregue");
    expect(stack.created[0].body).toContain("co-capture");

    const state = parseWorkflowState(
      fs.readFileSync(path.join(repoRoot, payload.stateFile), "utf8")
    );
    expect(state.topology?.cursor.pr).toBe("co-capture");
    expect(state.next[0]).toContain("canonical-next: co-capture");
    expect(state.next[0]).toContain("PR #44 stacked");
    expect(state.topology?.prs.active[0].github_pr).toBe(44);
    const active = parseActiveSpecs(
      fs.readFileSync(path.join(repoRoot, payload.activeSpecsFile), "utf8")
    );
    expect(active.activeSpecs[0].branch).toBe("feat/spec-0024-co-capture");
    const tasks = fs.readFileSync(path.join(repoRoot, payload.tasksFile), "utf8");
    expect(tasks).toContain("- [/] **Checkpoint co-capture**");
  });

  it("bloqueia antes de qualquer efeito se a working tree estiver suja", async () => {
    const snapshot = postGateSnapshot();
    const plan = def.plan(snapshot, "open-node");
    const git = new FakeGitOps({ beforeDirty: ["docs/x.md"], afterDirty: [] });
    const stack = new FakeStackOps(44);

    const result = await def.apply(plan, applyContext("/tmp/fake-repo", git, stack));

    expect(result.ok).toBe(false);
    expect(result.messages.join(" ")).toMatch(/working tree precisa estar limpa/);
    expect(git.calls).toEqual([]);
    expect(stack.created).toHaveLength(0);
  });

  it("bloqueia commit quando a transição produzir mixed diff fora dos artefatos esperados", async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "open-next-node-mixed-"));
    writeRepoFixture(repoRoot);
    const snapshot = postGateSnapshot({ repoRoot });
    const plan = def.plan(snapshot, "open-node");
    const payload = plan.payload as OpenNextNodePayload;
    const git = new FakeGitOps({
      afterDirty: [payload.stateFile, payload.activeSpecsFile, payload.tasksFile, "src/x.ts"],
      dirtySequence: [
        [],
        [payload.activeSpecsFile],
        [payload.stateFile, payload.activeSpecsFile, payload.tasksFile, "src/x.ts"],
      ],
    });
    const stack = new FakeStackOps(44);

    const result = await def.apply(plan, applyContext(repoRoot, git, stack));

    expect(result.ok).toBe(false);
    expect(result.messages.join(" ")).toMatch(/mixed_diff: forbidden/);
    expect(git.calls).toEqual([
      "createBranch:feat/spec-0024-co-capture:abc1234",
      `add:${payload.activeSpecsFile}`,
      "commit:docs(spec-0024): prepara branch co-capture",
      "pushBranch:feat/spec-0024-co-capture",
    ]);
    expect(stack.created).toHaveLength(1);
  });

  it("bloqueia antes de publicar branch quando a preparação de active.yml gerar diff misto", async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "open-next-node-prep-mixed-"));
    writeRepoFixture(repoRoot);
    const snapshot = postGateSnapshot({ repoRoot });
    const plan = def.plan(snapshot, "open-node");
    const payload = plan.payload as OpenNextNodePayload;
    const git = new FakeGitOps({
      afterDirty: [payload.activeSpecsFile, "src/x.ts"],
      dirtySequence: [[], [payload.activeSpecsFile, "src/x.ts"]],
    });
    const stack = new FakeStackOps(44);

    const result = await def.apply(plan, applyContext(repoRoot, git, stack));

    expect(result.ok).toBe(false);
    expect(result.messages.join(" ")).toMatch(/diff misto antes de publicar branch/);
    expect(git.calls).toEqual(["createBranch:feat/spec-0024-co-capture:abc1234"]);
    expect(stack.created).toHaveLength(0);
  });
});

import {
  CreatePullRequestInput,
  PullRequestData,
  ReviewComment,
  StackOps,
} from "../app/ports/StackOps.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { TriageReview, TriageReviewResult } from "../app/workflow/TriageReview.js";
import { renderTriage, runReview } from "./review.js";
import { Logger } from "./workflow.js";

class CollectingLogger implements Logger {
  readonly lines: string[] = [];
  info(msg: string): void {
    this.lines.push(msg);
  }
  error(msg: string): void {
    this.lines.push(`ERR: ${msg}`);
  }
}

function reviewComment(over: Partial<ReviewComment> & { id: number }): ReviewComment {
  return {
    author: "copilot",
    path: "src/x.ts",
    line: 10,
    body: "comentário",
    inReplyToId: null,
    url: `https://gh/c/${over.id}`,
    createdAt: "2026-05-25T00:00:00Z",
    ...over,
  };
}

class FakeStackOps implements StackOps {
  constructor(
    private readonly comments: ReadonlyArray<ReviewComment>,
    private readonly openPrs: ReadonlyArray<PullRequestData> = []
  ) {}
  listReviewComments(): ReadonlyArray<ReviewComment> {
    return this.comments;
  }
  listOpenPullRequests(): ReadonlyArray<PullRequestData> {
    return this.openPrs;
  }
  createPullRequest(_i: CreatePullRequestInput): PullRequestData {
    throw new Error("not used");
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
}

class FakeFs implements WorkflowFileSystem {
  constructor(private readonly branch: string | null) {}
  currentBranch(): string | null {
    return this.branch;
  }
  fileExists(): boolean {
    return false;
  }
  directoryExists(): boolean {
    return false;
  }
  readTextFile(): string {
    throw new Error("not used");
  }
  writeTextFile(): void {
    throw new Error("not used");
  }
  listDirectory(): ReadonlyArray<string> {
    return [];
  }
  resolveAbsolute(p: string): string {
    return `/repo/${p}`;
  }
}

function pr(number: number, headRefName: string): PullRequestData {
  return {
    number,
    title: `PR ${number}`,
    body: "",
    state: "OPEN",
    isDraft: false,
    headRefName,
    baseRefName: "main",
    labels: [],
    url: `https://gh/pr/${number}`,
    mergeCommitSha: null,
  };
}

describe("renderTriage [BR-WORKFLOW-REVIEW-TRIAGE]", () => {
  function build(comments: ReadonlyArray<ReviewComment>): TriageReviewResult {
    return new TriageReview(new FakeStackOps(comments)).run(26);
  }

  it("DADO untriaged + replied QUANDO render ENTÃO lista os abertos e cita os respondidos", () => {
    const { lines, clipboardContext } = renderTriage(
      build([
        reviewComment({ id: 1, path: "src/a.ts", line: 5, body: "injeção de shell?" }),
        reviewComment({ id: 2, inReplyToId: 1, author: "rosanarezende" }),
        reviewComment({ id: 3, path: "src/b.ts", line: 9, body: "timeout curto" }),
      ])
    );
    const out = lines.join("\n");
    expect(out).toMatch(/PR #26: 3 comentário\(s\), 1 sem resposta/);
    expect(out).toMatch(/#3 \[copilot\] src\/b\.ts:9/);
    expect(out).toMatch(/Respondidos \(1\): #1/);
    // não pode prometer análise/resposta pelo runtime (ADR 0018)
    expect(out).toMatch(/NÃO o runtime, per ADR 0018/);
    // contexto copiável traz só os abertos
    expect(clipboardContext).toMatch(/#3 \[copilot\] src\/b\.ts:9/);
    expect(clipboardContext).not.toMatch(/#1 \[copilot\]/);
  });

  it("DADO zero comentários abertos QUANDO render ENTÃO mensagem de tudo respondido", () => {
    const { lines } = renderTriage(
      build([reviewComment({ id: 1 }), reviewComment({ id: 2, inReplyToId: 1 })])
    );
    expect(lines.join("\n")).toMatch(/Nenhum comentário de review sem resposta/);
  });
});

describe("runReview [BR-WORKFLOW-REVIEW-TRIAGE]", () => {
  it("DADO --pr explícito QUANDO runReview ENTÃO triagem do PR dado (exit 0)", async () => {
    const logger = new CollectingLogger();
    const stack = new FakeStackOps([reviewComment({ id: 7, body: "ajuste X" })]);
    const code = await runReview(
      { repoRoot: "/repo", logger, fs: new FakeFs("qualquer"), stack },
      { pr: 42 }
    );
    expect(code).toBe(0);
    expect(logger.lines.join("\n")).toMatch(/PR #42/);
  });

  it("DADO sem --pr E branch casa um PR aberto QUANDO runReview ENTÃO detecta o PR", async () => {
    const logger = new CollectingLogger();
    const stack = new FakeStackOps([], [pr(26, "feat/spec-0023-dx-thinking")]);
    const code = await runReview(
      { repoRoot: "/repo", logger, fs: new FakeFs("feat/spec-0023-dx-thinking"), stack },
      {}
    );
    expect(code).toBe(0);
    expect(logger.lines.join("\n")).toMatch(/PR #26/);
  });

  it("DADO sem --pr E nenhum PR para a branch QUANDO runReview ENTÃO erro narrativo (exit 1)", async () => {
    const logger = new CollectingLogger();
    const stack = new FakeStackOps([], []);
    const code = await runReview(
      { repoRoot: "/repo", logger, fs: new FakeFs("feat/orfa"), stack },
      {}
    );
    expect(code).toBe(1);
    expect(logger.lines.join("\n")).toMatch(/Nenhum PR aberto com head/);
  });
});

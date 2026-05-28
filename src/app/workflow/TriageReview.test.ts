import {
  CreatePullRequestInput,
  PullRequestData,
  ReviewComment,
  StackOps,
} from "../ports/StackOps.js";
import { TriageReview } from "./TriageReview.js";

/** Fake StackOps: só `listReviewComments` é exercitado; o resto lança. */
class FakeStackOps implements StackOps {
  constructor(private readonly comments: ReadonlyArray<ReviewComment>) {}
  listReviewComments(): ReadonlyArray<ReviewComment> {
    return this.comments;
  }
  createPullRequest(_input: CreatePullRequestInput): PullRequestData {
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
  listOpenPullRequests(): ReadonlyArray<PullRequestData> {
    throw new Error("not used");
  }
}

function comment(over: Partial<ReviewComment> & { id: number }): ReviewComment {
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

describe("TriageReview [BR-WORKFLOW-REVIEW-TRIAGE]", () => {
  it("DADO comentários sem reply QUANDO run ENTÃO todos viram untriaged", () => {
    const stack = new FakeStackOps([
      comment({ id: 1 }),
      comment({ id: 2, path: "src/y.ts", line: 20 }),
    ]);
    const r = new TriageReview(stack).run(25);
    expect(r.prNumber).toBe(25);
    expect(r.total).toBe(2);
    expect(r.untriaged.map((t) => t.root.id)).toEqual([1, 2]);
    expect(r.replied).toEqual([]);
  });

  it("DADO root com reply QUANDO run ENTÃO root vai para replied com a reply aninhada", () => {
    const stack = new FakeStackOps([
      comment({ id: 1 }),
      comment({ id: 2, author: "rosanarezende", inReplyToId: 1, body: "corrigido" }),
      comment({ id: 3 }),
    ]);
    const r = new TriageReview(stack).run(25);
    expect(r.untriaged.map((t) => t.root.id)).toEqual([3]);
    expect(r.replied.map((t) => t.root.id)).toEqual([1]);
    expect(r.replied[0].replies.map((c) => c.id)).toEqual([2]);
  });

  it("DADO múltiplas replies fora de ordem QUANDO run ENTÃO replies vêm ordenadas por createdAt", () => {
    const stack = new FakeStackOps([
      comment({ id: 1 }),
      comment({ id: 3, inReplyToId: 1, createdAt: "2026-05-25T03:00:00Z" }),
      comment({ id: 2, inReplyToId: 1, createdAt: "2026-05-25T01:00:00Z" }),
    ]);
    const r = new TriageReview(stack).run(25);
    expect(r.replied[0].replies.map((c) => c.id)).toEqual([2, 3]);
  });

  it("DADO PR sem comentários QUANDO run ENTÃO tudo vazio", () => {
    const r = new TriageReview(new FakeStackOps([])).run(99);
    expect(r.total).toBe(0);
    expect(r.untriaged).toEqual([]);
    expect(r.replied).toEqual([]);
  });
});

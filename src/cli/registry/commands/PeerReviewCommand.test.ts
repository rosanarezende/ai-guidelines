import { PullRequestData, ReviewComment, StackOps } from "../../../app/ports/StackOps.js";
import { PeerReviewCommand, PeerReviewGitOps, PeerReviewOptions } from "./PeerReviewCommand.js";
import { CommandContext, Logger } from "../Command.js";

function pr(overrides: Partial<PullRequestData> = {}): PullRequestData {
  return {
    number: 43,
    title: "Feature de colega",
    body: "",
    state: "OPEN",
    isDraft: false,
    headRefName: "feat/peer-work",
    baseRefName: "main",
    labels: [],
    url: "https://github.com/org/repo/pull/43",
    mergeCommitSha: null,
    ...overrides,
  };
}

class FakeStackOps implements StackOps {
  constructor(private readonly pullRequest: PullRequestData | null = pr()) {}
  createPullRequest(): PullRequestData {
    throw new Error("not implemented");
  }
  getPullRequest(): PullRequestData | null {
    return this.pullRequest;
  }
  editPullRequestBase(): void {
    throw new Error("not implemented");
  }
  mergePullRequest(): void {
    throw new Error("not implemented");
  }
  closePullRequest(): void {
    throw new Error("not implemented");
  }
  listOpenPullRequests(): ReadonlyArray<PullRequestData> {
    return this.pullRequest ? [this.pullRequest] : [];
  }
  listReviewComments(): ReadonlyArray<ReviewComment> {
    return [];
  }
}

class FakePeerReviewGit implements PeerReviewGitOps {
  readonly calls: string[] = [];
  constructor(
    private readonly clean = true,
    private readonly current = "feat/my-work",
    private readonly existingPath = false
  ) {}
  currentBranch(): string | null {
    return this.current;
  }
  isWorkingTreeClean(): boolean {
    return this.clean;
  }
  worktreePath(prNumber: number): string {
    return `/repo/.temp/peer-review/pr-${prNumber}`;
  }
  pathExists(): boolean {
    return this.existingPath;
  }
  fetchPullRequest(prNumber: number, refName: string): void {
    this.calls.push(`fetch ${prNumber} ${refName}`);
  }
  addWorktree(absPath: string, refName: string): void {
    this.calls.push(`worktree ${absPath} ${refName}`);
  }
  checkoutPullRequest(prNumber: number): void {
    this.calls.push(`checkout ${prNumber}`);
  }
}

function logger(): {
  readonly logger: Logger;
  readonly infos: string[];
  readonly errors: string[];
} {
  const infos: string[] = [];
  const errors: string[] = [];
  return {
    logger: {
      info: (message) => infos.push(message),
      error: (message) => errors.push(message),
    },
    infos,
    errors,
  };
}

function context(log: Logger): CommandContext {
  return { repoRoot: "/repo", logger: log };
}

function command(stack: StackOps, git: PeerReviewGitOps): PeerReviewCommand {
  return new PeerReviewCommand(
    () => stack,
    () => git
  );
}

async function run(
  options: PeerReviewOptions,
  deps: { readonly stack?: StackOps; readonly git?: FakePeerReviewGit } = {}
) {
  const log = logger();
  const git = deps.git ?? new FakePeerReviewGit();
  const cmd = command(deps.stack ?? new FakeStackOps(), git);
  const result = await cmd.run(options, context(log.logger));
  return { ...log, git, result };
}

describe("PeerReviewCommand", () => {
  it("parseia briefing read-only", () => {
    expect(new PeerReviewCommand().parse(["43", "--brief-only"])).toEqual({
      pr: 43,
      briefOnly: true,
      confirm: false,
    });
  });

  it("parseia modos de aplicação com confirmação", () => {
    expect(new PeerReviewCommand().parse(["43", "--mode", "worktree", "--confirm"])).toEqual({
      pr: 43,
      mode: "worktree",
      briefOnly: false,
      confirm: true,
    });
    expect(new PeerReviewCommand().parse(["43", "--mode=checkout", "--confirm"])).toEqual({
      pr: 43,
      mode: "checkout",
      briefOnly: false,
      confirm: true,
    });
  });

  it("falha para PR ausente ou modo inválido", () => {
    expect(() => new PeerReviewCommand().parse([])).toThrow(/peer-review <pr>/);
    expect(() => new PeerReviewCommand().parse(["43", "--mode", "invalid"])).toThrow(
      /worktree ou checkout/
    );
  });

  it("brief-only mostra contexto do PR sem tocar em git", async () => {
    const { result, infos, git } = await run({ pr: 43, briefOnly: true, confirm: false });

    expect(result.exitCode).toBe(0);
    expect(infos.join("\n")).toContain("Review entre pares — PR #43");
    expect(infos.join("\n")).toContain("Feature de colega");
    expect(git.calls).toEqual([]);
  });

  it("sem confirm mostra prévia e não aplica worktree", async () => {
    const { result, infos, git } = await run({
      pr: 43,
      mode: "worktree",
      briefOnly: false,
      confirm: false,
    });

    expect(result.exitCode).toBe(0);
    expect(infos.join("\n")).toContain("--mode worktree --confirm");
    expect(git.calls).toEqual([]);
  });

  it("worktree confirmado fetch + worktree sem exigir tree limpa", async () => {
    const git = new FakePeerReviewGit(false);
    const { result } = await run(
      { pr: 43, mode: "worktree", briefOnly: false, confirm: true },
      { git }
    );

    expect(result.exitCode).toBe(0);
    expect(git.calls).toEqual([
      "fetch 43 refs/ai-guidelines/review/pr-43",
      "worktree /repo/.temp/peer-review/pr-43 refs/ai-guidelines/review/pr-43",
    ]);
  });

  it("worktree existente bloqueia sem sobrescrever", async () => {
    const git = new FakePeerReviewGit(true, "feat/my-work", true);
    const { result, errors } = await run(
      { pr: 43, mode: "worktree", briefOnly: false, confirm: true },
      { git }
    );

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toContain("Worktree já existe");
    expect(git.calls).toEqual([]);
  });

  it("checkout guiado bloqueia working tree suja", async () => {
    const git = new FakePeerReviewGit(false);
    const { result, errors } = await run(
      { pr: 43, mode: "checkout", briefOnly: false, confirm: true },
      { git }
    );

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toContain("working tree");
    expect(git.calls).toEqual([]);
  });

  it("checkout guiado com tree limpa chama gh pr checkout", async () => {
    const git = new FakePeerReviewGit(true);
    const { result } = await run(
      { pr: 43, mode: "checkout", briefOnly: false, confirm: true },
      { git }
    );

    expect(result.exitCode).toBe(0);
    expect(git.calls).toEqual(["checkout 43"]);
  });
});

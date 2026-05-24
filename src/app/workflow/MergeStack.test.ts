import {
  CreatePullRequestInput,
  MergePullRequestInput,
  PullRequestData,
  StackOps,
} from "../ports/StackOps.js";
import { MergeStack, MergeStackError } from "./MergeStack.js";

class FakeStackOps implements StackOps {
  prs = new Map<number, PullRequestData>();
  mergeCalls: MergePullRequestInput[] = [];
  editBaseCalls: { number: number; newBase: string }[] = [];
  failOnMerge: number | null = null;

  seed(pr: PullRequestData): void {
    this.prs.set(pr.number, pr);
  }

  createPullRequest(_input: CreatePullRequestInput): PullRequestData {
    throw new Error("not used in MergeStack tests");
  }
  getPullRequest(number: number): PullRequestData | null {
    return this.prs.get(number) ?? null;
  }
  editPullRequestBase(number: number, newBase: string): void {
    this.editBaseCalls.push({ number, newBase });
    const pr = this.prs.get(number);
    if (pr) this.prs.set(number, { ...pr, baseRefName: newBase });
  }
  mergePullRequest(input: MergePullRequestInput): void {
    if (this.failOnMerge === input.number) {
      throw new Error(`Simulated merge failure for PR #${input.number}`);
    }
    this.mergeCalls.push(input);
    const pr = this.prs.get(input.number);
    if (pr) this.prs.set(input.number, { ...pr, state: "MERGED" });
  }
  listOpenPullRequests(): ReadonlyArray<PullRequestData> {
    return [...this.prs.values()].filter((p) => p.state === "OPEN");
  }
}

function pr(
  number: number,
  opts: {
    base?: string;
    head?: string;
    state?: "OPEN" | "CLOSED" | "MERGED";
    isDraft?: boolean;
  } = {}
): PullRequestData {
  return {
    number,
    title: `Test PR #${number}`,
    body: "",
    state: opts.state ?? "OPEN",
    isDraft: opts.isDraft ?? false,
    headRefName: opts.head ?? `feat/branch-${number}`,
    baseRefName: opts.base ?? "main",
    labels: [],
    url: `https://github.com/test/repo/pull/${number}`,
  };
}

describe("App — MergeStack [BR-WORKFLOW-MERGE-STACK]", () => {
  describe("plan", () => {
    it("DADO lista de PRs Ready com bases distintas ENTÃO devolve plan marcando needsBaseEdit corretamente por PR", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main", head: "feat-workflow-runtime" }));
      stack.seed(pr(19, { base: "feat-workflow-runtime", head: "feat-lifecycle" }));
      stack.seed(pr(22, { base: "feat-lifecycle", head: "feat-followup" }));

      const plan = new MergeStack(stack).plan({
        prNumbers: [18, 19, 22],
        mainBranch: "main",
        mergeStrategy: "squash",
      });

      expect(plan.items).toHaveLength(3);
      expect(plan.items[0]).toMatchObject({ prNumber: 18, needsBaseEdit: false });
      expect(plan.items[1]).toMatchObject({ prNumber: 19, needsBaseEdit: true });
      expect(plan.items[2]).toMatchObject({ prNumber: 22, needsBaseEdit: true });
    });

    it("DADO PR não encontrado ENTÃO MergeStackError com orientação sobre gh auth", () => {
      const stack = new FakeStackOps();
      expect(() =>
        new MergeStack(stack).plan({
          prNumbers: [999],
          mainBranch: "main",
          mergeStrategy: "squash",
        })
      ).toThrow(MergeStackError);
      expect(() =>
        new MergeStack(stack).plan({
          prNumbers: [999],
          mainBranch: "main",
          mergeStrategy: "squash",
        })
      ).toThrow(/não encontrado.*gh auth/);
    });

    it("DADO PR ainda Draft ENTÃO MergeStackError citando CORE-10 + ADR 0024", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { isDraft: true }));
      expect(() =>
        new MergeStack(stack).plan({
          prNumbers: [18],
          mainBranch: "main",
          mergeStrategy: "squash",
        })
      ).toThrow(/Draft.*CORE-10.*ADR 0024/);
    });

    it("DADO PR já MERGED ENTÃO MergeStackError narrativo", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { state: "MERGED" }));
      expect(() =>
        new MergeStack(stack).plan({
          prNumbers: [18],
          mainBranch: "main",
          mergeStrategy: "squash",
        })
      ).toThrow(/não está OPEN.*MERGED/);
    });

    it("DADO prNumbers vazio ENTÃO MergeStackError narrativo", () => {
      expect(() =>
        new MergeStack(new FakeStackOps()).plan({
          prNumbers: [],
          mainBranch: "main",
          mergeStrategy: "squash",
        })
      ).toThrow(/Lista de PRs vazia/);
    });
  });

  describe("execute", () => {
    it("DADO plan com 3 PRs ENTÃO chama editPullRequestBase apenas para PRs com base != main E mergeia todos em ordem", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main" }));
      stack.seed(pr(19, { base: "feat-workflow-runtime" }));
      stack.seed(pr(22, { base: "feat-lifecycle" }));

      const useCase = new MergeStack(stack);
      const plan = useCase.plan({
        prNumbers: [18, 19, 22],
        mainBranch: "main",
        mergeStrategy: "squash",
      });
      useCase.execute(plan);

      // editBase: só para #19 e #22 (não #18, já tem base=main)
      expect(stack.editBaseCalls).toEqual([
        { number: 19, newBase: "main" },
        { number: 22, newBase: "main" },
      ]);
      // merge: todos em ordem
      expect(stack.mergeCalls.map((m) => m.number)).toEqual([18, 19, 22]);
      // estratégia + deleteBranch defaults
      expect(stack.mergeCalls.every((m) => m.strategy === "squash")).toBe(true);
      expect(stack.mergeCalls.every((m) => m.deleteBranch === true)).toBe(true);
    });

    it("DADO falha mid-way em PR #19 ENTÃO MergeStackError com failedItemIndex correto + orientação de retomada", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main" }));
      stack.seed(pr(19, { base: "feat-workflow-runtime" }));
      stack.seed(pr(22, { base: "feat-lifecycle" }));
      stack.failOnMerge = 19;

      const useCase = new MergeStack(stack);
      const plan = useCase.plan({
        prNumbers: [18, 19, 22],
        mainBranch: "main",
        mergeStrategy: "squash",
      });

      try {
        useCase.execute(plan);
        fail("expected MergeStackError");
      } catch (err) {
        expect(err).toBeInstanceOf(MergeStackError);
        const e = err as MergeStackError;
        expect(e.failedItemIndex).toBe(1);
        expect(e.message).toMatch(/Falha ao mergear PR #19.*passo 2\/3/);
        expect(e.message).toMatch(/skipSteps=2.*continuar do próximo/);
        expect(e.message).toMatch(/skipSteps=1.*tentar este PR novamente/);
      }
      // #18 mergeado com sucesso antes da falha
      expect(stack.mergeCalls.map((m) => m.number)).toEqual([18]);
    });

    it("DADO skipSteps=1 ENTÃO pula primeiro item e executa do segundo em diante", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main" }));
      stack.seed(pr(19, { base: "main" })); // após retomada, já está em main
      stack.seed(pr(22, { base: "main" }));

      const useCase = new MergeStack(stack);
      const plan = useCase.plan({
        prNumbers: [18, 19, 22],
        mainBranch: "main",
        mergeStrategy: "squash",
        skipSteps: 1,
      });
      useCase.execute(plan);

      // #18 pulado; só #19 e #22 mergeados
      expect(stack.mergeCalls.map((m) => m.number)).toEqual([19, 22]);
    });

    it("DADO hooks onItemStart/onItemDone ENTÃO callbacks são invocados por item na ordem", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main" }));
      stack.seed(pr(19, { base: "feat-workflow-runtime" }));

      const events: string[] = [];
      const useCase = new MergeStack(stack);
      const plan = useCase.plan({
        prNumbers: [18, 19],
        mainBranch: "main",
        mergeStrategy: "squash",
      });
      useCase.execute(plan, {
        onItemStart: (item, i) => events.push(`start:${i}:${item.prNumber}`),
        onItemDone: (item, i) => events.push(`done:${i}:${item.prNumber}`),
      });

      expect(events).toEqual(["start:0:18", "done:0:18", "start:1:19", "done:1:19"]);
    });
  });
});

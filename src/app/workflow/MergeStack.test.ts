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
  closeCalls: { number: number; comment: string }[] = [];
  failOnMerge: number | null = null;
  failOnClose: number | null = null;

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
    if (pr) {
      this.prs.set(input.number, {
        ...pr,
        state: "MERGED",
        mergeCommitSha: `sha-${input.number}`,
      });
    }
  }
  closePullRequest(number: number, comment: string): void {
    if (this.failOnClose === number) {
      throw new Error(`Simulated close failure for PR #${number}`);
    }
    this.closeCalls.push({ number, comment });
    const pr = this.prs.get(number);
    if (pr) this.prs.set(number, { ...pr, state: "CLOSED" });
  }
  listOpenPullRequests(): ReadonlyArray<PullRequestData> {
    return [...this.prs.values()].filter((p) => p.state === "OPEN");
  }
  listReviewComments() {
    return [];
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
    mergeCommitSha: null,
  };
}

describe("App — MergeStack [BR-WORKFLOW-MERGE-STACK]", () => {
  describe("plan — validações comuns aos modos", () => {
    it("DADO PR não encontrado ENTÃO MergeStackError com orientação sobre gh auth", () => {
      const stack = new FakeStackOps();
      expect(() =>
        new MergeStack(stack).plan({
          prNumbers: [999],
          mainBranch: "main",
          mergeStrategy: "squash",
        })
      ).toThrow(/não encontrado.*gh auth/);
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

  describe("modo sequential (override)", () => {
    it("DADO lista de PRs Ready com bases distintas ENTÃO plan marca needsBaseEdit por PR", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main", head: "feat-workflow-runtime" }));
      stack.seed(pr(19, { base: "feat-workflow-runtime", head: "feat-lifecycle" }));
      stack.seed(pr(22, { base: "feat-lifecycle", head: "feat-followup" }));

      const plan = new MergeStack(stack).plan({
        prNumbers: [18, 19, 22],
        mainBranch: "main",
        mergeStrategy: "squash",
        mode: "sequential",
      });

      expect(plan.mode).toBe("sequential");
      expect(plan.items).toHaveLength(3);
      expect(plan.items[0]).toMatchObject({ prNumber: 18, needsBaseEdit: false });
      expect(plan.items[1]).toMatchObject({ prNumber: 19, needsBaseEdit: true });
      expect(plan.items[2]).toMatchObject({ prNumber: 22, needsBaseEdit: true });
      expect(plan.rollbackRecipe).toMatch(/sequential.*ordem inversa/);
    });

    it("DADO PR ainda Draft ENTÃO MergeStackError citando CORE-10 + ADR 0024", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { isDraft: true }));
      expect(() =>
        new MergeStack(stack).plan({
          prNumbers: [18],
          mainBranch: "main",
          mergeStrategy: "squash",
          mode: "sequential",
        })
      ).toThrow(/Draft.*CORE-10.*ADR 0024/);
    });

    it("DADO execute ENTÃO editPullRequestBase só p/ base != main E mergeia todos em ordem", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main" }));
      stack.seed(pr(19, { base: "feat-workflow-runtime" }));
      stack.seed(pr(22, { base: "feat-lifecycle" }));

      const useCase = new MergeStack(stack);
      const plan = useCase.plan({
        prNumbers: [18, 19, 22],
        mainBranch: "main",
        mergeStrategy: "squash",
        mode: "sequential",
      });
      useCase.execute(plan);

      expect(stack.editBaseCalls).toEqual([
        { number: 19, newBase: "main" },
        { number: 22, newBase: "main" },
      ]);
      expect(stack.mergeCalls.map((m) => m.number)).toEqual([18, 19, 22]);
      expect(stack.mergeCalls.every((m) => m.strategy === "squash")).toBe(true);
      expect(stack.mergeCalls.every((m) => m.deleteBranch === true)).toBe(true);
      // sequential não fecha nada (landed-via é exclusivo do unit)
      expect(stack.closeCalls).toEqual([]);
    });

    it("DADO falha mid-way em PR #19 ENTÃO MergeStackError com failedItemIndex + retomada", () => {
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
        mode: "sequential",
      });

      try {
        useCase.execute(plan);
        fail("expected MergeStackError");
      } catch (err) {
        const e = err as MergeStackError;
        expect(e).toBeInstanceOf(MergeStackError);
        expect(e.failedItemIndex).toBe(1);
        expect(e.message).toMatch(/Falha ao mergear PR #19.*passo 2\/3/);
        expect(e.message).toMatch(/skipSteps=2.*continuar do próximo/);
        expect(e.message).toMatch(/skipSteps=1.*tentar este PR novamente/);
      }
      expect(stack.mergeCalls.map((m) => m.number)).toEqual([18]);
    });

    it("DADO skipSteps=1 ENTÃO pula primeiro item e executa do segundo em diante", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main" }));
      stack.seed(pr(19, { base: "main" }));
      stack.seed(pr(22, { base: "main" }));

      const useCase = new MergeStack(stack);
      const plan = useCase.plan({
        prNumbers: [18, 19, 22],
        mainBranch: "main",
        mergeStrategy: "squash",
        mode: "sequential",
        skipSteps: 1,
      });
      useCase.execute(plan);

      expect(stack.mergeCalls.map((m) => m.number)).toEqual([19, 22]);
    });
  });

  describe("modo unit (default)", () => {
    it("DADO mode ausente ENTÃO default é unit (veículo = terminal; resto reconciliado)", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main" }));
      stack.seed(pr(19, { base: "feat-18" }));
      stack.seed(pr(26, { base: "feat-25" }));

      const plan = new MergeStack(stack).plan({
        prNumbers: [18, 19, 26],
        mainBranch: "main",
        mergeStrategy: "squash",
      });

      expect(plan.mode).toBe("unit");
      expect(plan.items).toHaveLength(1);
      expect(plan.items[0].prNumber).toBe(26); // terminal
      expect(plan.reconcilePrNumbers).toEqual([18, 19]);
      expect(plan.rollbackRecipe).toMatch(/unit.*git revert/);
    });

    it("DADO integrationPrNumber com base=main ENTÃO Integration é o veículo; stack PRs fecham via landed-via", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "feat-17" }));
      stack.seed(pr(26, { base: "feat-25" }));
      stack.seed(pr(27, { base: "main" })); // Integration já aponta para main

      const plan = new MergeStack(stack).plan({
        prNumbers: [18, 26],
        mainBranch: "main",
        mergeStrategy: "squash",
        integrationPrNumber: 27,
      });

      expect(plan.items[0].prNumber).toBe(27); // Integration é o veículo
      expect(plan.items[0].needsBaseEdit).toBe(false); // já aponta para main
      expect(plan.reconcilePrNumbers).toEqual([18, 26]); // stack PRs fecham via landed-via
    });

    it("DADO integrationPrNumber com base != main ENTÃO Integration entra na reconciliação (não é veículo)", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "feat-17" }));
      stack.seed(pr(26, { base: "feat-25" }));
      stack.seed(pr(27, { base: "feat-26" })); // Integration NÃO aponta para main

      const plan = new MergeStack(stack).plan({
        prNumbers: [18, 26],
        mainBranch: "main",
        mergeStrategy: "squash",
        integrationPrNumber: 27,
      });

      expect(plan.items[0].prNumber).toBe(26); // terminal é o veículo
      expect(plan.reconcilePrNumbers).toEqual([18, 27]); // Integration fecha via landed-via
    });

    it("DADO execute unit com Integration PR como veículo ENTÃO mergeia o Integration e fecha stack PRs via landed-via", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main" }));
      stack.seed(pr(25, { base: "feat-24" }));
      stack.seed(pr(26, { base: "feat-25" }));
      stack.seed(pr(27, { base: "main" })); // Integration já aponta para main → veículo

      const useCase = new MergeStack(stack);
      const plan = useCase.plan({
        prNumbers: [18, 25, 26],
        mainBranch: "main",
        mergeStrategy: "squash",
        integrationPrNumber: 27,
      });
      useCase.execute(plan);

      // Integration (#27) mergeado diretamente; sem edit-base
      expect(stack.mergeCalls.map((m) => m.number)).toEqual([27]);
      expect(stack.editBaseCalls).toEqual([]);
      // stack PRs fechados via landed-via
      expect(stack.closeCalls.map((c) => c.number)).toEqual([18, 25, 26]);
      for (const c of stack.closeCalls) {
        expect(c.comment).toMatch(/landed-via: #27 @ sha-27/);
        expect(c.comment).toMatch(/não foi rejeitado/);
      }
    });

    it("DADO execute unit sem Integration PR ENTÃO terminal é o veículo com edit-base e stack fecha via landed-via", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main" }));
      stack.seed(pr(25, { base: "feat-24" }));
      stack.seed(pr(26, { base: "feat-25" }));

      const useCase = new MergeStack(stack);
      const plan = useCase.plan({
        prNumbers: [18, 25, 26],
        mainBranch: "main",
        mergeStrategy: "squash",
      });
      useCase.execute(plan);

      // veículo #26 mergeado; base reescrita
      expect(stack.mergeCalls.map((m) => m.number)).toEqual([26]);
      expect(stack.editBaseCalls).toEqual([{ number: 26, newBase: "main" }]);
      // stack PRs anteriores fechados via landed-via
      expect(stack.closeCalls.map((c) => c.number)).toEqual([18, 25]);
      for (const c of stack.closeCalls) {
        expect(c.comment).toMatch(/landed-via: #26 @ sha-26/);
      }
    });

    it("DADO vehicleCommitMessage ENTÃO o merge do veículo usa subject/body curados", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(26, { base: "main" }));

      const useCase = new MergeStack(stack);
      const plan = useCase.plan({
        prNumbers: [26],
        mainBranch: "main",
        mergeStrategy: "squash",
        vehicleCommitMessage: { subject: "feat(spec-0023): workflow runtime", body: "detalhe" },
      });
      useCase.execute(plan);

      expect(stack.mergeCalls[0]).toMatchObject({
        number: 26,
        subject: "feat(spec-0023): workflow runtime",
        body: "detalhe",
      });
    });

    it("DADO veículo Draft ENTÃO MergeStackError citando CORE-10 + ADR 0024", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18));
      stack.seed(pr(26, { isDraft: true }));
      expect(() =>
        new MergeStack(stack).plan({
          prNumbers: [18, 26],
          mainBranch: "main",
          mergeStrategy: "squash",
        })
      ).toThrow(/#26 \(veículo\) ainda é Draft.*CORE-10.*ADR 0024/);
    });

    it("DADO falha ao reconciliar (close) ENTÃO erro narra veículo já mergeado + close manual", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(18, { base: "main" }));
      stack.seed(pr(26, { base: "main" }));
      stack.failOnClose = 18;

      const useCase = new MergeStack(stack);
      const plan = useCase.plan({
        prNumbers: [18, 26],
        mainBranch: "main",
        mergeStrategy: "squash",
      });

      try {
        useCase.execute(plan);
        fail("expected MergeStackError");
      } catch (err) {
        const e = err as MergeStackError;
        expect(e).toBeInstanceOf(MergeStackError);
        expect(e.message).toMatch(/Veículo #26 mergeado.*falha ao reconciliar.*#18/);
        expect(e.message).toMatch(/Feche manualmente/);
      }
      // veículo foi mergeado antes da falha de reconciliação
      expect(stack.mergeCalls.map((m) => m.number)).toEqual([26]);
    });

    it("DADO merge-commit strategy ENTÃO rollbackRecipe usa revert -m 1", () => {
      const stack = new FakeStackOps();
      stack.seed(pr(26, { base: "main" }));
      const plan = new MergeStack(stack).plan({
        prNumbers: [26],
        mainBranch: "main",
        mergeStrategy: "merge",
      });
      expect(plan.rollbackRecipe).toMatch(/revert -m 1/);
    });
  });
});

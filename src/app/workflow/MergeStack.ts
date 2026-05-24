import { MergeStrategy, StackOps } from "../ports/StackOps.js";

/**
 * Use case tier 2: executa atomic merge da stack governance-first.
 *
 * Cravado em `[DEC-0023-L01]` (Bloco L). Materializa wizard option 5
 * (`🔀 Executar merge atômico da stack`). Padrão `plan + execute`.
 *
 * Estratégia (per `[DEC-0023-L01]` Opção C): merge sequencial de PRs
 * existentes. Para cada PR na ordem:
 *   1. Se base != main, edita base para main (`gh pr edit --base main`)
 *   2. Mergeia (`gh pr merge --<strategy> --delete-branch`)
 *
 * Falha mid-way: levanta `MergeStackError` com `failedItemIndex`. Owner
 * pode usar `skipSteps` para retomar de onde parou. Sem rollback automático
 * (cravado como risco aceito em Bloco L).
 *
 * Detecção da stack (qual PRs em que ordem) é responsabilidade do CLI
 * caller — este use case recebe a lista pronta. Decoupling intencional:
 * use case = orchestration; CLI = detecção via convenção de title/labels.
 */

export interface MergeStackInput {
  /** PRs em ordem de merge (upstream → downstream). */
  readonly prNumbers: ReadonlyArray<number>;
  /** Branch alvo do merge atômico (tipicamente "main"). */
  readonly mainBranch: string;
  /** Estratégia de merge (squash recomendado para consistência com histórico). */
  readonly mergeStrategy: MergeStrategy;
  /**
   * Skip primeiros N items (para retomar após falha mid-way).
   * Default: 0. Use `failedItemIndex` do erro como valor.
   */
  readonly skipSteps?: number;
}

export interface MergeStackPlanItem {
  readonly prNumber: number;
  readonly prTitle: string;
  readonly currentBase: string;
  readonly head: string;
  /** True se base atual != mainBranch (precisa `edit-base` antes de merge). */
  readonly needsBaseEdit: boolean;
}

export interface MergeStackPlan {
  readonly items: ReadonlyArray<MergeStackPlanItem>;
  readonly mainBranch: string;
  readonly mergeStrategy: MergeStrategy;
  readonly skipSteps: number;
}

export class MergeStackError extends Error {
  constructor(
    message: string,
    /** Index do item que falhou (para `skipSteps` no rerun). */
    readonly failedItemIndex?: number
  ) {
    super(message);
    this.name = "MergeStackError";
  }
}

export interface MergeStackExecuteHooks {
  onItemStart?: (item: MergeStackPlanItem, index: number) => void;
  onItemDone?: (item: MergeStackPlanItem, index: number) => void;
}

export class MergeStack {
  constructor(private readonly stack: StackOps) {}

  plan(input: MergeStackInput): MergeStackPlan {
    if (input.prNumbers.length === 0) {
      throw new MergeStackError("Lista de PRs vazia — nada para mergear.");
    }

    const items: MergeStackPlanItem[] = [];
    for (const prNumber of input.prNumbers) {
      const pr = this.stack.getPullRequest(prNumber);
      if (!pr) {
        throw new MergeStackError(
          `PR #${prNumber} não encontrado ou inacessível (verifique gh auth e número do PR).`
        );
      }
      if (pr.state !== "OPEN") {
        throw new MergeStackError(
          `PR #${prNumber} não está OPEN (estado atual: ${pr.state}). ` +
            `Stack atomic merge requer todos os PRs abertos.`
        );
      }
      if (pr.isDraft) {
        throw new MergeStackError(
          `PR #${prNumber} ainda é Draft. Converta para Ready primeiro (per CORE-10 + ADR 0024).`
        );
      }
      items.push({
        prNumber,
        prTitle: pr.title,
        currentBase: pr.baseRefName,
        head: pr.headRefName,
        needsBaseEdit: pr.baseRefName !== input.mainBranch,
      });
    }

    const skipSteps = input.skipSteps ?? 0;
    if (skipSteps < 0 || skipSteps > items.length) {
      throw new MergeStackError(`skipSteps=${skipSteps} inválido (válido: 0 a ${items.length}).`);
    }

    return {
      items,
      mainBranch: input.mainBranch,
      mergeStrategy: input.mergeStrategy,
      skipSteps,
    };
  }

  execute(plan: MergeStackPlan, hooks?: MergeStackExecuteHooks): void {
    for (let i = 0; i < plan.items.length; i++) {
      if (i < plan.skipSteps) continue;
      const item = plan.items[i];
      hooks?.onItemStart?.(item, i);
      try {
        if (item.needsBaseEdit) {
          this.stack.editPullRequestBase(item.prNumber, plan.mainBranch);
        }
        this.stack.mergePullRequest({
          number: item.prNumber,
          strategy: plan.mergeStrategy,
          deleteBranch: true,
        });
        hooks?.onItemDone?.(item, i);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new MergeStackError(
          `Falha ao mergear PR #${item.prNumber} (passo ${i + 1}/${plan.items.length}): ${msg}. ` +
            `Resolva manualmente e retome com skipSteps=${i + 1} para continuar do próximo PR, ` +
            `OU skipSteps=${i} para tentar este PR novamente após fix.`,
          i
        );
      }
    }
  }
}

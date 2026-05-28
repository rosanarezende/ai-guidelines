import { MergeStrategy, PullRequestData, StackOps } from "../ports/StackOps.js";

/**
 * Use case tier 2: executa atomic merge da stack governance-first.
 *
 * Cravado em `[DEC-0023-L01]` (Bloco L); modos de aterrissagem em `[DEC-0023-O03]`.
 * Materializa wizard option 5 (`🔀 Executar merge atômico da stack`). Padrão
 * `plan + execute`.
 *
 * **Modos de aterrissagem** (cf. ADR 0024 § Modos de aterrissagem da stack):
 *   - `unit` (default): a stack aterrissa como **uma unidade**. Veículo = PR
 *     **terminal** de implementação (último de `prNumbers`); base reescrita para
 *     main + merge. Os demais PRs (impl não-terminais + Integration) sofrem
 *     **landed-via reconciliation** (`closePullRequest` com anotação). 1 SHA canônico.
 *   - `sequential` (override): cada PR de implementação aterrissa bottom-up
 *     (`gh pr edit --base main` + `gh pr merge`). Mecânica original.
 *
 * **Integration PR não é veículo de aterrissagem** (semântica atual): é
 * reconciliado (fechado) em `unit`, nunca mergeado. Sua narrativa pode virar a
 * mensagem curada do commit do veículo (`vehicleCommitMessage`).
 *
 * Detecção da stack (quais PRs, em que ordem, qual é o Integration) é
 * responsabilidade do CLI caller — este use case recebe a lista pronta e linear.
 * `unit` assume `prNumbers` topo-ordenado (terminal por último); a invariante de
 * linearidade é garantida pela detecção (cf. ADR 0024).
 */

export type LandingMode = "unit" | "sequential";

export interface MergeStackInput {
  /** PRs de implementação em ordem (upstream → downstream; terminal por último). */
  readonly prNumbers: ReadonlyArray<number>;
  /** Branch alvo do merge (tipicamente "main"). */
  readonly mainBranch: string;
  /** Estratégia de merge (squash recomendado para consistência com histórico). */
  readonly mergeStrategy: MergeStrategy;
  /** Modo de aterrissagem. Default: `unit`. */
  readonly mode?: LandingMode;
  /** Integration PR (homologação) a reconciliar em `unit`. Nunca é veículo. */
  readonly integrationPrNumber?: number;
  /** Mensagem curada do commit canônico (modo `unit`; tipicamente do body do Integration PR). */
  readonly vehicleCommitMessage?: { readonly subject: string; readonly body?: string };
  /**
   * `sequential` apenas: pula os primeiros N items (retomar após falha mid-way).
   * Default: 0.
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
  readonly mode: LandingMode;
  /** PRs efetivamente mergeados. `sequential`: todos; `unit`: só o veículo (1 item). */
  readonly items: ReadonlyArray<MergeStackPlanItem>;
  /** `unit`: PRs fechados via landed-via reconciliation (impl não-terminais + Integration). */
  readonly reconcilePrNumbers: ReadonlyArray<number>;
  readonly mainBranch: string;
  readonly mergeStrategy: MergeStrategy;
  readonly skipSteps: number;
  /** Receita determinística de rollback do modo escolhido (exibida no plan). */
  readonly rollbackRecipe: string;
  readonly vehicleCommitMessage?: { readonly subject: string; readonly body?: string };
}

export class MergeStackError extends Error {
  constructor(
    message: string,
    /** Index do item que falhou (`sequential`; para `skipSteps` no rerun). */
    readonly failedItemIndex?: number
  ) {
    super(message);
    this.name = "MergeStackError";
  }
}

export interface MergeStackExecuteHooks {
  onItemStart?: (item: MergeStackPlanItem, index: number) => void;
  onItemDone?: (item: MergeStackPlanItem, index: number) => void;
  onReconcile?: (prNumber: number) => void;
}

function unitRollbackRecipe(strategy: MergeStrategy): string {
  return strategy === "merge"
    ? "rollback (unit): `git revert -m 1 <SHA-do-merge-commit>` — 1 comando. SHA exibido após o merge."
    : "rollback (unit): `git revert <SHA-canônico>` — 1 comando. SHA exibido após o merge.";
}

function sequentialRollbackRecipe(count: number): string {
  return (
    `rollback (sequential): reverter os ${count} commits na ordem inversa ` +
    "(`git revert <sha_n> … <sha_1>`). Atenção: fatias interdependentes — reverter " +
    "uma do meio pode quebrar as de cima; para spec coesa, prefira rollback total."
  );
}

function planItemOf(pr: PullRequestData, mainBranch: string): MergeStackPlanItem {
  return {
    prNumber: pr.number,
    prTitle: pr.title,
    currentBase: pr.baseRefName,
    head: pr.headRefName,
    needsBaseEdit: pr.baseRefName !== mainBranch,
  };
}

export class MergeStack {
  constructor(private readonly stack: StackOps) {}

  plan(input: MergeStackInput): MergeStackPlan {
    const mode: LandingMode = input.mode ?? "unit";
    if (input.prNumbers.length === 0) {
      throw new MergeStackError("Lista de PRs vazia — nada para mergear.");
    }

    // Busca + valida existência e estado OPEN de todos os PRs envolvidos.
    const involved = [
      ...input.prNumbers,
      ...(input.integrationPrNumber !== undefined ? [input.integrationPrNumber] : []),
    ];
    const fetched = new Map<number, PullRequestData>();
    for (const prNumber of involved) {
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
      fetched.set(prNumber, pr);
    }

    if (mode === "sequential") {
      const items = input.prNumbers.map((prNumber) => {
        const pr = fetched.get(prNumber) as PullRequestData;
        if (pr.isDraft) {
          throw new MergeStackError(
            `PR #${prNumber} ainda é Draft. Converta para Ready primeiro (per CORE-10 + ADR 0024).`
          );
        }
        return planItemOf(pr, input.mainBranch);
      });
      const skipSteps = input.skipSteps ?? 0;
      if (skipSteps < 0 || skipSteps > items.length) {
        throw new MergeStackError(`skipSteps=${skipSteps} inválido (válido: 0 a ${items.length}).`);
      }
      return {
        mode,
        items,
        reconcilePrNumbers: [],
        mainBranch: input.mainBranch,
        mergeStrategy: input.mergeStrategy,
        skipSteps,
        rollbackRecipe: sequentialRollbackRecipe(items.length),
      };
    }

    // unit: se o Integration PR existe e já aponta para main, ele é o veículo natural —
    // evita o conflito de edit-base (GitHub rejeita PATCH quando já existe PR com o mesmo
    // head→base). Todos os PRs da stack fecham via landed-via reconciliation.
    // Sem Integration PR: veículo = terminal da stack (edit-base se necessário).
    const integrationPrData =
      input.integrationPrNumber !== undefined ? fetched.get(input.integrationPrNumber) : undefined;
    const useIntegrationAsVehicle =
      integrationPrData !== undefined && integrationPrData.baseRefName === input.mainBranch;

    const vehicleNumber = useIntegrationAsVehicle
      ? input.integrationPrNumber!
      : input.prNumbers[input.prNumbers.length - 1];
    const vehicle = (
      useIntegrationAsVehicle ? integrationPrData : fetched.get(vehicleNumber)
    ) as PullRequestData;
    if (vehicle.isDraft) {
      throw new MergeStackError(
        `PR #${vehicleNumber} (veículo) ainda é Draft. Converta para Ready primeiro (per CORE-10 + ADR 0024).`
      );
    }
    const reconcilePrNumbers = useIntegrationAsVehicle
      ? [...input.prNumbers]
      : [
          ...input.prNumbers.slice(0, -1),
          ...(input.integrationPrNumber !== undefined ? [input.integrationPrNumber] : []),
        ];
    return {
      mode,
      items: [planItemOf(vehicle, input.mainBranch)],
      reconcilePrNumbers,
      mainBranch: input.mainBranch,
      mergeStrategy: input.mergeStrategy,
      skipSteps: 0,
      rollbackRecipe: unitRollbackRecipe(input.mergeStrategy),
      ...(input.vehicleCommitMessage ? { vehicleCommitMessage: input.vehicleCommitMessage } : {}),
    };
  }

  execute(plan: MergeStackPlan, hooks?: MergeStackExecuteHooks): void {
    if (plan.mode === "sequential") {
      this.executeSequential(plan, hooks);
      return;
    }
    this.executeUnit(plan, hooks);
  }

  private executeSequential(plan: MergeStackPlan, hooks?: MergeStackExecuteHooks): void {
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

  private executeUnit(plan: MergeStackPlan, hooks?: MergeStackExecuteHooks): void {
    const vehicle = plan.items[0];
    hooks?.onItemStart?.(vehicle, 0);
    let canonicalSha = "(sha pendente)";
    try {
      if (vehicle.needsBaseEdit) {
        this.stack.editPullRequestBase(vehicle.prNumber, plan.mainBranch);
      }
      this.stack.mergePullRequest({
        number: vehicle.prNumber,
        strategy: plan.mergeStrategy,
        deleteBranch: true,
        ...(plan.vehicleCommitMessage
          ? { subject: plan.vehicleCommitMessage.subject, body: plan.vehicleCommitMessage.body }
          : {}),
      });
      const merged = this.stack.getPullRequest(vehicle.prNumber);
      if (merged?.mergeCommitSha) canonicalSha = merged.mergeCommitSha;
      hooks?.onItemDone?.(vehicle, 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new MergeStackError(
        `Falha ao mergear o veículo PR #${vehicle.prNumber} (unit): ${msg}. ` +
          `Nenhum PR foi reconciliado; resolva e reexecute.`,
        0
      );
    }

    // landed-via reconciliation: fecha os demais PRs (não rejeitados).
    for (const prNumber of plan.reconcilePrNumbers) {
      hooks?.onReconcile?.(prNumber);
      try {
        this.stack.closePullRequest(
          prNumber,
          `landed-via: #${vehicle.prNumber} @ ${canonicalSha} (atomic spec merge, ADR 0020). ` +
            `Commits já estão em \`main\` via o veículo; este PR não foi rejeitado.`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new MergeStackError(
          `Veículo #${vehicle.prNumber} mergeado (SHA ${canonicalSha}), mas falha ao reconciliar ` +
            `(close) PR #${prNumber}: ${msg}. Feche manualmente com anotação landed-via.`
        );
      }
    }
  }
}

/**
 * Port para operações de PR via GitHub CLI (`gh`).
 *
 * Cravado em `[DEC-0023-L01]` (Bloco L do decision-brief 0023). Suporta
 * use cases tier 2 do wizard (`OpenIntegrationPR`, `MergeStack`) que
 * orquestram operações governance-first sobre PRs da stack.
 *
 * **Princípio cravado em ADR 0024** (seção "Operational CLI commands"):
 * adapters são determinísticos (sem inferência); use cases mostram plan +
 * confirmation antes de invocar métodos com side-effect. Adapters levantam
 * exceção em falha; use cases interpretam.
 *
 * Implementação default em `src/infrastructure/git/GhCli.ts` (delega para
 * `gh` via `execFileSync` com args array — fecha CWE-78 per padrão cravado
 * em `collectLocalContext.ts`). Tests injetam fakes que devolvem PR data
 * predefinida.
 */

export type PullRequestState = "OPEN" | "CLOSED" | "MERGED";
export type MergeStrategy = "squash" | "merge" | "rebase";

export interface PullRequestData {
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly state: PullRequestState;
  readonly isDraft: boolean;
  readonly headRefName: string;
  readonly baseRefName: string;
  readonly labels: ReadonlyArray<string>;
  readonly url: string;
}

export interface CreatePullRequestInput {
  readonly title: string;
  readonly body: string;
  readonly base: string;
  readonly head: string;
  readonly labels?: ReadonlyArray<string>;
  /** Abrir como Draft (per CORE-09 + ADR 0024). Default: false. */
  readonly draft?: boolean;
}

export interface MergePullRequestInput {
  readonly number: number;
  readonly strategy: MergeStrategy;
  /** Deletar branch source após merge. Default: true (cleanup). */
  readonly deleteBranch?: boolean;
}

export interface StackOps {
  /**
   * Cria PR e retorna seus dados (incluindo número atribuído).
   * Side-effect: PR aparece em GitHub UI.
   */
  createPullRequest(input: CreatePullRequestInput): PullRequestData;

  /**
   * Lê dados de um PR específico. Retorna `null` se PR não existe ou
   * inacessível (sem permissão, etc.).
   */
  getPullRequest(number: number): PullRequestData | null;

  /**
   * Atualiza base branch de um PR (`gh pr edit <N> --base <branch>`).
   * Usado em `MergeStack` para reparentar PRs downstream após merge upstream.
   * Side-effect: GitHub recalcula diff + dispara re-run de CI.
   */
  editPullRequestBase(number: number, newBase: string): void;

  /**
   * Faz merge de um PR (`gh pr merge`). Side-effect irreversível — main
   * recebe os commits e branch source pode ser deletada (default).
   */
  mergePullRequest(input: MergePullRequestInput): void;

  /**
   * Lista PRs abertos do repo corrente. Usado para detecção de stack
   * governance-first via convenção de title (`[🛠️Nn]`, `[🧾🔒]`, etc.).
   */
  listOpenPullRequests(): ReadonlyArray<PullRequestData>;
}

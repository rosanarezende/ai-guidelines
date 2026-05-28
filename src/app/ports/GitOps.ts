/**
 * Port para operações git locais.
 *
 * Cravado em `[DEC-0023-L01]` (Bloco L do decision-brief 0023). Suporta o
 * use case tier 3 `ReleasePrep` (standalone, repo-specific) que orquestra
 * bump + tag + push para disparar o workflow `.github/workflows/release.yml`.
 *
 * Distinto de `WorkflowFileSystem` (que cobre arquivos do workspace) —
 * `GitOps` cobre o **repositório git** (working tree state, commits, tags,
 * push remotos). Boundary cravado: cada port tem responsabilidade única.
 *
 * **Princípio cravado em ADR 0024** (seção "Operational CLI commands"):
 * adapters são determinísticos (sem inferência); use cases mostram plan +
 * confirmation antes de invocar métodos com side-effect (commit/tag/push).
 *
 * Implementação default em `src/infrastructure/git/NodeGit.ts` (delega para
 * `git` via `execFileSync` com args array — fecha CWE-78). Tests injetam
 * fakes que registram chamadas para verificação.
 */

export interface GitOps {
  /**
   * Branch git atual. Retorna `null` se HEAD detached ou não-repo
   * (mesma semântica de `WorkflowFileSystem.currentBranch()`).
   */
  currentBranch(): string | null;

  /**
   * `true` se working tree está clean — sem changes staged, unstaged ou
   * untracked rastreados. Usado como pre-flight em `ReleasePrep` para
   * impedir commit acidental de arquivos não relacionados.
   */
  isWorkingTreeClean(): boolean;

  /**
   * Adiciona arquivos ao stage (`git add <paths...>`).
   * Side-effect: muda staging area do working tree.
   */
  add(paths: ReadonlyArray<string>): void;

  /**
   * Cria commit com a mensagem dada (`git commit -m <message>`).
   * Side-effect: novo commit no HEAD da branch corrente.
   */
  commit(message: string): void;

  /**
   * Cria tag local (`git tag <name>`). Não pusha — chamar `push` depois.
   * Side-effect: tag local adicionada ao repo.
   */
  tag(name: string): void;

  /**
   * Push para remote (`git push <remote> <refs...>`).
   * Side-effect irreversível: refs publicados em remote (commits + tags).
   */
  push(remote: string, refs: ReadonlyArray<string>): void;

  /**
   * Lista tags locais. Usado em `ReleasePrep` para verificar se tag
   * alvo já existe (impede duplicação).
   */
  listTags(): ReadonlyArray<string>;

  /**
   * Lista tags em remote (`git ls-remote --tags <remote>`). Usado em
   * `ReleasePrep` para verificar duplicação remota antes do push.
   */
  listRemoteTags(remote: string): ReadonlyArray<string>;
}

/**
 * Port write-side para a raiz `.governance/` do workspace.
 *
 * Distinto do {@link ./WorkspaceStore} (que cuida de pastas **por item** densas).
 * Esta porta opera no escopo do workspace inteiro: cria/garante a raiz e
 * subdiretórios reservados, e expõe rollback explícito quando o caller
 * precisa reverter uma adoção interrompida no meio.
 */
export interface WorkspaceProvisioner {
  /**
   * Garante a existência de um diretório dentro do workspace. Idempotente:
   * não falha quando o diretório já existe.
   *
   * @returns `true` se o diretório foi criado **neste call**; `false` se já
   * existia (no-op). O caller usa esse sinal para rollback bilateral —
   * removendo apenas o que ele próprio criou, sem tocar em conteúdo do usuário.
   */
  ensureDirectory(relPath: string): boolean;

  /**
   * Remove um diretório criado anteriormente. Idempotente. Implementações
   * DEVEM falhar fechado: removem apenas o que está vazio (rollback nunca
   * destrói conteúdo do usuário).
   */
  removeDirectoryIfEmpty(relPath: string): void;
}

/**
 * Port write-side do filesystem do **consumidor** (raiz alvo de init/adopt/update).
 *
 * Distinto de {@link ./WorkspaceProvisioner} (raiz `.governance/` do mantenedor)
 * e de {@link ./WorkflowFileSystem}. Aqui o escopo é o diretório-alvo onde a CLI
 * escreve provider entrypoints, `config.json` e baselines. Todos os caminhos são
 * **relativos à raiz alvo** que o adapter concreto guarda (Passo 2 ·
 * `NodeProvisioningFileSystem`). Sem isto, o use case {@link ../use-cases/ProvisionWorkspace}
 * não saberia ler/escrever sem acoplar `node:fs`.
 *
 * Migração Spec 0024 · CO-3.5 (colapso integral do runtime CLI). Substitui o
 * acesso direto a `node:fs/promises` espalhado em `cli/features/**`.
 */
export interface ProvisioningFileSystem {
  /** Conteúdo atual do arquivo, ou `null` se não existir. */
  readText(relPath: string): Promise<string | null>;
  /** Escreve `content` (cria diretórios pais se necessário fica a cargo do caller via {@link ensureDir}). */
  writeText(relPath: string, content: string): Promise<void>;
  /** True se o caminho existe (arquivo ou diretório). */
  exists(relPath: string): Promise<boolean>;
  /** Garante a existência do diretório (recursivo, idempotente). */
  ensureDir(relPathDir: string): Promise<void>;
  /** Remove o arquivo. Idempotente: no-op se ausente. */
  remove(relPath: string): Promise<void>;
  /** Resolve um caminho relativo para a raiz alvo do consumidor. */
  resolvePath(relPath: string): string;
}

/**
 * Port para criação/remoção física de workspaces.
 * Implementação real (filesystem) chega na Fase 2; aqui apenas o contrato.
 */
export interface WorkspaceStore {
  /** Cria a pasta canônica do item denso. */
  createWorkspace(workspacePath: string): void;
  /** Remove a pasta criada (rollback). Idempotente. */
  removeWorkspace(workspacePath: string): void;
  /** True se o workspace já existe. */
  exists(workspacePath: string): boolean;
}

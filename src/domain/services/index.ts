import { WorkItem, WorkItemType } from "../entities";

/**
 * Interface para gerenciar o registro estruturado (registry.yml).
 * Lida com a persistência e recuperação do estado canônico.
 */
export interface RegistryService {
  /**
   * Carrega todos os itens de trabalho do registro.
   */
  loadAll(): Promise<WorkItem[]>;

  /**
   * Recupera um item de trabalho específico pelo seu ID.
   */
  getById(id: string): Promise<WorkItem | undefined>;

  /**
   * Persiste um novo item de trabalho. Falha se o ID já existir.
   */
  create(item: WorkItem): Promise<void>;

  /**
   * Atualiza um item existente. Protege campos imutáveis (id, createdAt).
   */
  update(id: string, partial: Partial<WorkItem>): Promise<void>;

  /**
   * Remove um item de trabalho.
   * Implementações podem optar por 'Soft Delete' para auditoria.
   */
  delete(id: string): Promise<void>;
}

/**
 * Interface para interagir com o sistema de arquivos do workspace de governança (.governance/).
 * Lida com criação de pastas, aplicação de templates e gestão de artefatos.
 */
export interface WorkspaceService {
  /**
   * Inicializa a estrutura do diretório .governance/ se ela não existir.
   */
  initWorkspace(): Promise<void>;

  /**
   * Cria o armazenamento físico (pastas/arquivos) para um item de trabalho.
   * Baseado no tipo do item e nos templates configurados.
   */
  createItemWorkspace(item: WorkItem): Promise<void>;

  /**
   * Verifica se o armazenamento físico para um item de trabalho existe.
   */
  itemWorkspaceExists(item: WorkItem): Promise<boolean>;

  /**
   * Lê um artefato (ex: spec.md) do workspace de um item de trabalho.
   */
  readArtifact(item: WorkItem, filename: string): Promise<string>;
}

/**
 * Interface para validar transições de estado e regras de negócio.
 * Implementa as políticas de governança.
 */
export interface PolicyService {
  /**
   * Valida se um item de trabalho pode transicionar de seu estado atual para um novo.
   * ex: regras de promoção de "proposal" -> "spec".
   */
  validateTransition(
    item: WorkItem,
    newType: WorkItemType
  ): Promise<{ valid: boolean; errors?: string[] }>;

  /**
   * Valida se um item de trabalho satisfaz todos os metadados obrigatórios para seu tipo atual.
   */
  validateMetadata(item: WorkItem): Promise<{ valid: boolean; errors?: string[] }>;
}

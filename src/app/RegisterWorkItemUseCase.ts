import { WorkItem } from "../domain/entities";
import { RegistryService, WorkspaceService, PolicyService } from "../domain/services";

/**
 * Caso de Uso: Registrar um novo Item de Trabalho na governança.
 * Orquestra a validação de políticas, persistência e criação de workspace físico.
 */
export class RegisterWorkItemUseCase {
  constructor(
    private readonly registry: RegistryService,
    private readonly workspace: WorkspaceService,
    private readonly policy: PolicyService
  ) {}

  /**
   * Executa o registro de um item.
   * @param item O item de trabalho a ser registrado.
   * @returns Resultado da operação com possíveis erros de validação.
   */
  async execute(item: WorkItem): Promise<{ success: boolean; errors?: string[] }> {
    // 1. Valida se o item respeita as regras de metadados do seu Pilar de Valor
    const validation = await this.policy.validateMetadata(item);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // 2. Persiste o item no registro estruturado (registry.yml)
    await this.registry.create(item);

    // 3. Cria a estrutura de pastas física (se o tipo exigir workspacePath)
    if (item.workspacePath) {
      // Garante que o workspace base existe antes de criar a pasta do item
      await this.workspace.initWorkspace();
      await this.workspace.createItemWorkspace(item);
    }

    return { success: true };
  }
}

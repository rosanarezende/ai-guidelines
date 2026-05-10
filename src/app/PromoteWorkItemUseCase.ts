import { WorkItem, WorkItemType } from "../domain/entities";
import { RegistryService, WorkspaceService, PolicyService } from "../domain/services";

/**
 * Caso de Uso: Promover um Item de Trabalho (ex: proposal -> spec).
 * Orquestra a validação da transição, atualização do registro e evolução do workspace.
 */
export class PromoteWorkItemUseCase {
  constructor(
    private readonly registry: RegistryService,
    private readonly workspace: WorkspaceService,
    private readonly policy: PolicyService
  ) {}

  /**
   * Executa a promoção de um item.
   * @param id ID do item a ser promovido.
   * @param newType Novo tipo/pilar de valor.
   * @param updates Metadados adicionais exigidos pelo novo tipo (ex: workspacePath).
   */
  async execute(
    id: string,
    newType: WorkItemType,
    updates: Partial<WorkItem>
  ): Promise<{ success: boolean; errors?: string[] }> {
    // 1. Recupera o item atual
    const item = await this.registry.getById(id);
    if (!item) {
      return { success: false, errors: [`Item '${id}' não encontrado.`] };
    }

    // 2. Valida se a transição é permitida pelas regras de governança
    const transition = await this.policy.validateTransition(item, newType);
    if (!transition.valid) {
      return { success: true, errors: transition.errors };
    }

    // 3. Monta o novo estado do item para validação de metadados
    const promotedItem: WorkItem = {
      ...item,
      ...updates,
      type: newType,
      updatedAt: new Date(),
    };

    // 4. Valida se o item atende aos requisitos do NOVO tipo
    const metadataValidation = await this.policy.validateMetadata(promotedItem);
    if (!metadataValidation.valid) {
      return { success: false, errors: metadataValidation.errors };
    }

    // 5. Atualiza o registro canônico
    await this.registry.update(id, {
      ...updates,
      type: newType,
    });

    // 6. Cria o workspace físico se ele não existia e agora é exigido
    if (promotedItem.workspacePath) {
      const exists = await this.workspace.itemWorkspaceExists(promotedItem);
      if (!exists) {
        await this.workspace.initWorkspace();
        await this.workspace.createItemWorkspace(promotedItem);
      }
    }

    return { success: true };
  }
}

/**
 * Helpers puros de integridade do registry.
 *
 * Centraliza checks que precisam ser idênticos entre todos os stores
 * (`InMemoryRegistry`, `GovernanceRegistryStore`) para evitar drift de
 * mensagem/código entre implementações. Sem IO, sem dependências externas.
 *
 * Camada: domain.
 */
import { GovernanceError } from "../shared/errors.js";
import { WorkItem, WorkItemPatch } from "../work-item/WorkItem.js";

/**
 * Garante que um patch não tenta alterar campos imutáveis (`id`, `createdAt`).
 *
 * Aceita `patch.id`/`patch.createdAt` apenas quando coincidem com o item atual
 * (compatível com o envelope wide do `WorkItemPatch`, que carrega os campos
 * para que testes possam exercitar a imutabilidade com mensagens determinísticas).
 *
 * Lança `GovernanceError` com código estável:
 *  - `REGISTRY_IMMUTABLE_ID` quando `patch.id` diverge do `current.id`.
 *  - `REGISTRY_IMMUTABLE_CREATED_AT` quando `patch.createdAt` diverge.
 */
export function assertRegistryImmutables(current: WorkItem, patch: WorkItemPatch): void {
  if (patch.id !== undefined && patch.id !== current.id) {
    throw new GovernanceError(
      "REGISTRY_IMMUTABLE_ID",
      `O campo 'id' é imutável após a criação ('${current.id}').`
    );
  }
  if (patch.createdAt !== undefined && patch.createdAt !== current.createdAt) {
    throw new GovernanceError(
      "REGISTRY_IMMUTABLE_CREATED_AT",
      `O campo 'createdAt' é imutável após a criação.`
    );
  }
}

import { GovernanceError } from "../shared/errors.js";
import { WorkItemId, WORK_ITEM_KINDS } from "../shared/types.js";
import { WorkItem, WorkItemPatch } from "../work-item/WorkItem.js";
import { assertRegistryImmutables } from "./integrity.js";

/**
 * Registry em memória, SSOT lógica do PR1.
 * Garante: unicidade de IDs, imutabilidade de id/createdAt, ordenação determinística.
 */
export class InMemoryRegistry {
  private readonly items = new Map<WorkItemId, WorkItem>();

  add(item: WorkItem): void {
    if (!WORK_ITEM_KINDS.includes(item.kind)) {
      throw new GovernanceError(
        "REGISTRY_UNKNOWN_KIND",
        `Tipo de item desconhecido: '${item.kind}'.`
      );
    }
    if (this.items.has(item.id)) {
      throw new GovernanceError(
        "REGISTRY_DUPLICATE_ID",
        `Item com id '${item.id}' já existe no registry.`
      );
    }
    this.items.set(item.id, item);
  }

  update(id: WorkItemId, patch: WorkItemPatch, updatedAt: string): WorkItem {
    const current = this.items.get(id);
    if (!current) {
      throw new GovernanceError(
        "REGISTRY_NOT_FOUND",
        `Item com id '${id}' não existe no registry.`
      );
    }
    assertRegistryImmutables(current, patch);
    // Merge estrutural; o caller (use case) é responsável por garantir que
    // o resultado satisfaça o discriminated union do WorkItem.
    const next = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt,
    } as WorkItem;
    this.items.set(id, next);
    return next;
  }

  remove(id: WorkItemId): void {
    if (!this.items.delete(id)) {
      throw new GovernanceError(
        "REGISTRY_NOT_FOUND",
        `Item com id '${id}' não existe no registry.`
      );
    }
  }

  has(id: WorkItemId): boolean {
    return this.items.has(id);
  }

  find(id: WorkItemId): WorkItem | undefined {
    return this.items.get(id);
  }

  /**
   * Listagem determinística (ordenada por id ascendente — diff estável).
   */
  list(): ReadonlyArray<WorkItem> {
    return [...this.items.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  size(): number {
    return this.items.size;
  }
}

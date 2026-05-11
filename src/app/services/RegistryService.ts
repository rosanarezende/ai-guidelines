/**
 * Coordena ciclo de vida do {@link PersistentRegistryStore} concreto.
 *
 * Responsabilidades:
 *  - Carregar o registry do disco no startup (`store.load()`).
 *  - Expor um CRUD fino para use cases (que continuam falando só com o port).
 *  - Persistir após cada mutação bem-sucedida (`autosave: true`) ou deixar
 *    o caller controlar o `save()` em batch (`autosave: false`).
 *
 * Decisão arquitetural: o `RegistryService` vive na camada `app/` como serviço de
 * orquestração. **Não** importa `infrastructure/` diretamente — recebe o store já
 * construído (DI). A composição da raiz fica na camada de bootstrap (futuro CLI).
 */
import { RegistryStore } from "../ports/RegistryStore.js";
import { WorkItem, WorkItemPatch } from "../../domain/work-item/WorkItem.js";
import { WorkItemId } from "../../domain/shared/types.js";

/**
 * Port estendido: store persistente. `load`/`save` são opcionais no contrato
 * básico (testes podem usar `InMemoryRegistry` sem persistência); quem
 * implementa IO real (ex.: `GovernanceRegistryStore`) declara estes métodos.
 */
export interface PersistentRegistryStore extends RegistryStore {
  load(): void;
  save(): void;
}

export class RegistryService {
  constructor(
    private readonly store: PersistentRegistryStore,
    private readonly options: { autosave: boolean } = { autosave: true }
  ) {}

  /** Carrega estado do disco. Idempotente. */
  load(): void {
    this.store.load();
  }

  /** Persiste estado atual. */
  save(): void {
    this.store.save();
  }

  add(item: WorkItem): void {
    this.store.add(item);
    if (this.options.autosave) this.store.save();
  }

  update(id: WorkItemId, patch: WorkItemPatch, updatedAt: string): WorkItem {
    const result = this.store.update(id, patch, updatedAt);
    if (this.options.autosave) this.store.save();
    return result;
  }

  remove(id: WorkItemId): void {
    this.store.remove(id);
    if (this.options.autosave) this.store.save();
  }

  find(id: WorkItemId): WorkItem | undefined {
    return this.store.find(id);
  }

  list(): ReadonlyArray<WorkItem> {
    return this.store.list();
  }
}

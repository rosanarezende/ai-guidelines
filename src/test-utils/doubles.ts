import { Clock } from "../app/ports/Clock.js";
import { FileSystemProbe } from "../app/ports/FileSystemProbe.js";
import { IdGenerator } from "../app/ports/IdGenerator.js";
import { RegistryStore } from "../app/ports/RegistryStore.js";
import { WorkspaceProvisioner } from "../app/ports/WorkspaceProvisioner.js";
import { WorkspaceStore } from "../app/ports/WorkspaceStore.js";
import { InMemoryRegistry } from "../domain/registry/Registry.js";
import { WorkItemId } from "../domain/shared/types.js";

export class FixedClock implements Clock {
  private current: string;
  constructor(initial = "2026-05-10T00:00:00.000Z") {
    this.current = initial;
  }
  nowIso(): string {
    return this.current;
  }
  set(iso: string): void {
    this.current = iso;
  }
}

export class SeqIdGenerator implements IdGenerator {
  private n = 0;
  constructor(private readonly prefix = "wi") {}
  next(): WorkItemId {
    this.n += 1;
    return `${this.prefix}-${String(this.n).padStart(4, "0")}`;
  }
}

export class FakeWorkspaceStore implements WorkspaceStore {
  public readonly created: string[] = [];
  public readonly removed: string[] = [];
  public failOnCreate = false;
  public failOnPath: string | null = null;

  createWorkspace(workspacePath: string): void {
    if (this.failOnCreate || (this.failOnPath !== null && this.failOnPath === workspacePath)) {
      throw new Error(`Falha simulada criando workspace '${workspacePath}'.`);
    }
    this.created.push(workspacePath);
  }
  removeWorkspace(workspacePath: string): void {
    this.removed.push(workspacePath);
    const i = this.created.indexOf(workspacePath);
    if (i >= 0) this.created.splice(i, 1);
  }
  exists(workspacePath: string): boolean {
    return this.created.includes(workspacePath);
  }
}

/**
 * Adapter sobre InMemoryRegistry que registra a sequência de chamadas e
 * permite injeção de falha em `add` para testar rollback de workspace.
 */
export class SpyRegistryStore implements RegistryStore {
  public readonly calls: string[] = [];
  public failOnAddId: string | null = null;
  private readonly inner = new InMemoryRegistry();

  add(item: Parameters<RegistryStore["add"]>[0]): void {
    this.calls.push(`add:${item.id}`);
    if (this.failOnAddId !== null && this.failOnAddId === item.id) {
      throw new Error(`Falha simulada de persistência para '${item.id}'.`);
    }
    this.inner.add(item);
  }
  update(id: WorkItemId, patch: Parameters<RegistryStore["update"]>[1], updatedAt: string) {
    this.calls.push(`update:${id}`);
    return this.inner.update(id, patch, updatedAt);
  }
  remove(id: WorkItemId): void {
    this.calls.push(`remove:${id}`);
    this.inner.remove(id);
  }
  find(id: WorkItemId) {
    return this.inner.find(id);
  }
  list() {
    return this.inner.list();
  }
}

/**
 * Probe in-memory: simula presença de diretórios pelo conjunto declarado.
 */
export class FakeFileSystemProbe implements FileSystemProbe {
  private readonly dirs: Set<string>;
  constructor(present: Iterable<string> = []) {
    this.dirs = new Set(present);
  }
  add(relPath: string): void {
    this.dirs.add(relPath);
  }
  remove(relPath: string): void {
    this.dirs.delete(relPath);
  }
  directoryExists(relPath: string): boolean {
    return this.dirs.has(relPath);
  }
}

/**
 * Provisioner in-memory para testar idempotência e rollback.
 *  - registra cada chamada em `events`
 *  - mantém set de diretórios "criados"
 *  - permite injetar falha em um path específico via `failOnEnsure`
 */
export class FakeWorkspaceProvisioner implements WorkspaceProvisioner {
  public readonly events: string[] = [];
  public failOnEnsure: string | null = null;
  private readonly dirs = new Set<string>();

  constructor(preExisting: Iterable<string> = []) {
    for (const p of preExisting) this.dirs.add(p);
  }

  ensureDirectory(relPath: string): boolean {
    if (this.failOnEnsure === relPath) {
      this.events.push(`ensure-fail:${relPath}`);
      throw new Error(`Falha simulada criando '${relPath}'.`);
    }
    if (this.dirs.has(relPath)) {
      this.events.push(`ensure-noop:${relPath}`);
      return false;
    }
    this.dirs.add(relPath);
    this.events.push(`ensure-create:${relPath}`);
    return true;
  }

  removeDirectoryIfEmpty(relPath: string): void {
    if (!this.dirs.has(relPath)) {
      this.events.push(`remove-absent:${relPath}`);
      return;
    }
    this.dirs.delete(relPath);
    this.events.push(`remove:${relPath}`);
  }

  has(relPath: string): boolean {
    return this.dirs.has(relPath);
  }
}

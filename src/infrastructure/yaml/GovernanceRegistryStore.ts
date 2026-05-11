/**
 * Implementação real do {@link RegistryStore} sobre `registry.yml`.
 *
 * Garantias:
 *  - Round-trip seguro: load → save sem mutação preserva bytes.
 *  - Determinismo: itens sempre ordenados alfabeticamente por `id` na escrita.
 *  - Atomicidade: `save()` usa `tmp + rename`; falha mid-write não corrompe o arquivo original.
 *  - Imutabilidade: `id` e `createdAt` rejeitados por update divergente (espelha `InMemoryRegistry`).
 *  - Schema guard: lança `GovernanceError` com `REGISTRY_YAML_*` em qualquer divergência.
 *  - Preservação de comentários: comentários do usuário em `registry.yml` sobrevivem a load → mutate → save
 *    (yaml@2 atrela comentários ao nó; reordenação alfabética preserva associação).
 *
 * Camada: `infrastructure/`. Não conhece use cases. Cumpre o port `RegistryStore` do app.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { Document, isMap, isSeq, Scalar, YAMLMap, YAMLSeq } from "yaml";
import { RegistryStore } from "../../app/ports/RegistryStore.js";
import { assertRegistryImmutables } from "../../domain/registry/integrity.js";
import { GovernanceError } from "../../domain/shared/errors.js";
import { WorkItem, WorkItemPatch } from "../../domain/work-item/WorkItem.js";
import { WorkItemId } from "../../domain/shared/types.js";
import {
  buildEmptyDocument,
  parseRegistry,
  reorderItemMap,
  REGISTRY_FIELD_ORDER,
  sortItemsSeq,
  workItemToPlain,
} from "./registrySchema.js";

const TO_STRING_OPTIONS: Parameters<Document["toString"]>[0] = {
  lineWidth: 0,
  minContentWidth: 0,
  defaultStringType: "PLAIN",
  defaultKeyType: "PLAIN",
};

export class GovernanceRegistryStore implements RegistryStore {
  private doc: Document;
  private cache = new Map<WorkItemId, WorkItem>();

  constructor(private readonly filePath: string) {
    this.doc = buildEmptyDocument();
  }

  /**
   * Carrega o estado do disco. Se o arquivo não existir, mantém Document vazio.
   * Idempotente: pode ser chamado múltiplas vezes; cada chamada zera o cache.
   */
  load(): void {
    if (!fs.existsSync(this.filePath)) {
      this.doc = buildEmptyDocument();
      this.cache = new Map();
      return;
    }
    const text = fs.readFileSync(this.filePath, "utf8");
    const parsed = parseRegistry(text);
    this.doc = parsed.document;
    this.cache = new Map(parsed.items.map((wi) => [wi.id, wi]));
    // Garante ordem canônica no Document carregado (defesa contra hand-edits fora de ordem).
    this.applyCanonicalShape();
  }

  /**
   * Persiste o estado atual em disco com escrita atômica (tmp + rename).
   * Falha mid-write deixa o arquivo original intacto.
   */
  save(): void {
    this.applyCanonicalShape();
    const serialized = this.doc.toString(TO_STRING_OPTIONS);
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, serialized, "utf8");
    try {
      fs.renameSync(tmp, this.filePath);
    } catch (err) {
      // Cleanup do tmp se rename falhar — original permanece intocado.
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* noop */
      }
      throw err;
    }
  }

  /** Serialização atual (debug/teste de determinismo sem tocar disco). */
  toYaml(): string {
    this.applyCanonicalShape();
    return this.doc.toString(TO_STRING_OPTIONS);
  }

  add(item: WorkItem): void {
    if (this.cache.has(item.id)) {
      throw new GovernanceError(
        "REGISTRY_DUPLICATE_ID",
        `Item com id '${item.id}' já existe no registry.`
      );
    }
    const seq = this.itemsSeq();
    const node = this.doc.createNode(workItemToPlain(item)) as YAMLMap;
    seq.items.push(node);
    this.cache.set(item.id, item);
  }

  update(id: WorkItemId, patch: WorkItemPatch, updatedAt: string): WorkItem {
    const current = this.cache.get(id);
    if (!current) {
      throw new GovernanceError(
        "REGISTRY_NOT_FOUND",
        `Item com id '${id}' não existe no registry.`
      );
    }
    assertRegistryImmutables(current, patch);
    const next: WorkItem = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt,
    } as WorkItem;

    // Encontra o YAMLMap correspondente e atualiza in-place (preserva comentários).
    const seq = this.itemsSeq();
    const idx = seq.items.findIndex((n) => isMap(n) && (n as YAMLMap).get("id") === id);
    if (idx === -1) {
      // Cache desalinhado do Document — invariante quebrada.
      throw new GovernanceError(
        "REGISTRY_NOT_FOUND",
        `Item '${id}' presente no cache mas ausente no Document YAML.`
      );
    }
    const node = seq.items[idx] as YAMLMap;
    this.applyPatchToNode(node, next);
    this.cache.set(id, next);
    return next;
  }

  remove(id: WorkItemId): void {
    if (!this.cache.has(id)) {
      throw new GovernanceError(
        "REGISTRY_NOT_FOUND",
        `Item com id '${id}' não existe no registry.`
      );
    }
    const seq = this.itemsSeq();
    const idx = seq.items.findIndex((n) => isMap(n) && (n as YAMLMap).get("id") === id);
    if (idx >= 0) seq.items.splice(idx, 1);
    this.cache.delete(id);
  }

  find(id: WorkItemId): WorkItem | undefined {
    return this.cache.get(id);
  }

  list(): ReadonlyArray<WorkItem> {
    return [...this.cache.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  // ---- internos -----------------------------------------------------------

  private itemsSeq(): YAMLSeq {
    const root = this.doc.contents;
    if (!isMap(root)) {
      throw new GovernanceError(
        "REGISTRY_YAML_INVALID_ROOT",
        "Document corrompido: raiz não é um YAMLMap."
      );
    }
    const seq = root.get("items", true);
    if (!isSeq(seq)) {
      // Garantia defensiva — buildEmptyDocument sempre cria items: [].
      const fresh = new YAMLSeq();
      root.set("items", fresh);
      return fresh;
    }
    return seq as YAMLSeq;
  }

  private applyPatchToNode(node: YAMLMap, next: WorkItem): void {
    const plain = workItemToPlain(next);
    // Remove chaves que sumiram (ex.: status mudou e campo nicho deve sair).
    const existingKeys = node.items.map((p) => String((p.key as { value: unknown }).value));
    for (const k of existingKeys) {
      if (!(k in plain)) node.delete(k);
    }
    // Atualiza/insere na ordem canônica.
    for (const key of REGISTRY_FIELD_ORDER) {
      if (!(key in plain)) continue;
      const value = (plain as Record<string, unknown>)[key];
      const newNode = this.doc.createNode(value);
      if (node.has(key)) {
        node.set(key, newNode);
      } else {
        node.add({ key: new Scalar(key), value: newNode });
      }
    }
    reorderItemMap(node);
  }

  /**
   * Aplica ordem canônica ao Document inteiro:
   *  - `version`/`items` na raiz (version primeiro).
   *  - items ordenados alfa por id.
   *  - cada item com chaves em REGISTRY_FIELD_ORDER.
   */
  private applyCanonicalShape(): void {
    const root = this.doc.contents;
    if (!isMap(root)) return;
    // Ordem na raiz: version primeiro, items depois.
    const pairs = [...(root as YAMLMap).items];
    pairs.sort((a, b) => {
      const ka = String((a.key as { value: unknown }).value);
      const kb = String((b.key as { value: unknown }).value);
      const order = (k: string): number => (k === "version" ? 0 : k === "items" ? 1 : 2);
      return order(ka) - order(kb);
    });
    (root as YAMLMap).items = pairs;

    const seq = this.itemsSeq();
    sortItemsSeq(seq);
    for (const node of seq.items) {
      if (isMap(node)) reorderItemMap(node as YAMLMap);
    }
  }
}

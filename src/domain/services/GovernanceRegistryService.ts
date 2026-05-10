import { parseDocument, Document, YAMLMap, YAMLSeq } from "yaml";
import { WorkItem } from "../entities";
import { FileSystem, RegistryService } from "./index";

/**
 * Implementação do RegistryService usando a biblioteca 'yaml'.
 * Gerencia o arquivo '.governance/registry.yml' preservando a estrutura e legibilidade.
 */
export class GovernanceRegistryService implements RegistryService {
  private readonly registryPath = ".governance/registry.yml";

  constructor(private readonly fs: FileSystem) {}

  /**
   * Carrega todos os itens de trabalho do registro.
   */
  async loadAll(): Promise<WorkItem[]> {
    if (!(await this.fs.exists(this.registryPath))) {
      return [];
    }
    const content = await this.fs.readFile(this.registryPath);
    const doc = parseDocument(content);
    const data = doc.toJS();
    const items = data?.items || [];

    // Garante que datas sejam objetos Date reais
    return items.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  }

  /**
   * Busca um item específico pelo ID.
   */
  async getById(id: string): Promise<WorkItem | undefined> {
    const items = await this.loadAll();
    return items.find((item) => item.id === id);
  }

  /**
   * Persiste um novo item de trabalho.
   * Lança erro se o ID já existir.
   */
  async create(item: WorkItem): Promise<void> {
    const doc = await this.getOrCreateDocument();
    let itemsSeq = doc.get("items") as YAMLSeq;

    if (!itemsSeq) {
      doc.set("items", []);
      itemsSeq = doc.get("items") as YAMLSeq;
    }

    // Verifica duplicidade no nível do documento (Node-based check para precisão)
    const exists = itemsSeq.items.some((node: any) => {
      if (node instanceof YAMLMap) {
        return node.get("id") === item.id;
      }
      return false;
    });

    if (exists) {
      throw new Error(`Item com ID '${item.id}' já existe no registro.`);
    }

    // Converte o item para um formato serializável (datas para ISO)
    const serializableItem = {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };

    itemsSeq.add(serializableItem);
    await this.fs.writeFile(this.registryPath, doc.toString());
  }

  /**
   * Atualiza um item existente.
   * Protege campos imutáveis (id, createdAt) e atualiza updatedAt automaticamente.
   */
  async update(id: string, partial: Partial<WorkItem>): Promise<void> {
    const doc = await this.getOrCreateDocument();
    const itemsSeq = doc.get("items") as YAMLSeq;

    if (!itemsSeq) {
      throw new Error("Registro está vazio ou corrompido.");
    }

    const index = itemsSeq.items.findIndex((node: any) => {
      return node instanceof YAMLMap && node.get("id") === id;
    });

    if (index === -1) {
      throw new Error(`Item com ID '${id}' não encontrado para atualização.`);
    }

    const node = itemsSeq.get(index) as YAMLMap;

    // Aplica atualizações parciais
    Object.entries(partial).forEach(([key, value]) => {
      if (key !== "id" && key !== "createdAt") {
        if (value instanceof Date) {
          node.set(key, value.toISOString());
        } else {
          node.set(key, value);
        }
      }
    });

    node.set("updatedAt", new Date().toISOString());
    await this.fs.writeFile(this.registryPath, doc.toString());
  }

  /**
   * Remove um item do registro.
   */
  async delete(id: string): Promise<void> {
    const doc = await this.getOrCreateDocument();
    const itemsSeq = doc.get("items") as YAMLSeq;

    if (!itemsSeq) return;

    const index = itemsSeq.items.findIndex((node: any) => {
      return node instanceof YAMLMap && node.get("id") === id;
    });

    if (index !== -1) {
      itemsSeq.delete(index);
      await this.fs.writeFile(this.registryPath, doc.toString());
    }
  }

  /**
   * Helper para carregar o documento atual ou criar um novo se não existir.
   */
  private async getOrCreateDocument(): Promise<Document> {
    if (!(await this.fs.exists(this.registryPath))) {
      return parseDocument("items: []\n");
    }
    const content = await this.fs.readFile(this.registryPath);
    return parseDocument(content);
  }
}

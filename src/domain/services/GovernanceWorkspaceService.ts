import * as path from "node:path";
import { WorkItem } from "../entities";
import { FileSystem, WorkspaceService } from "./index";

/**
 * Implementação do WorkspaceService para o meta-framework ai-guidelines.
 * Organiza os itens de trabalho dentro do diretório '.governance/'.
 */
export class GovernanceWorkspaceService implements WorkspaceService {
  private readonly rootDir = ".governance";

  constructor(private readonly fs: FileSystem) {}

  /**
   * Inicializa a estrutura básica do workspace de governança.
   */
  async initWorkspace(): Promise<void> {
    await this.fs.mkdir(this.rootDir);
    await this.fs.mkdir(path.join(this.rootDir, "specs"));
    await this.fs.mkdir(path.join(this.rootDir, "experiments"));
    await this.fs.mkdir(path.join(this.rootDir, "explorations"));
    await this.fs.mkdir(path.join(this.rootDir, "incidents"));
  }

  /**
   * Cria a pasta física para um item de trabalho, se ele exigir uma.
   */
  async createItemWorkspace(item: WorkItem): Promise<void> {
    if (!item.workspacePath) return;
    await this.fs.mkdir(item.workspacePath);
  }

  /**
   * Verifica se a pasta física de um item de trabalho já existe.
   */
  async itemWorkspaceExists(item: WorkItem): Promise<boolean> {
    if (!item.workspacePath) return false;
    return this.fs.exists(item.workspacePath);
  }

  /**
   * Lê o conteúdo de um artefato específico dentro do workspace do item.
   */
  async readArtifact(item: WorkItem, filename: string): Promise<string> {
    if (!item.workspacePath) {
      throw new Error(
        `Item ${item.id} não possui uma pasta física associada (workspacePath ausente).`
      );
    }
    const filePath = path.join(item.workspacePath, filename);
    return this.fs.readFile(filePath);
  }
}

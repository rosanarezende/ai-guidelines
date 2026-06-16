/**
 * Adapter `ProvisioningFileSystem` sobre `node:fs/promises`, ancorado na raiz
 * alvo do consumidor. Todos os relPaths são resolvidos contra `targetDir`.
 *
 * Migração Spec 0024 · CO-3.5 (colapso integral do runtime CLI). Substitui o
 * acesso direto a `node:fs` espalhado em `cli/fs/file-system.mjs` +
 * `cli/features/**`. **Aditivo:** não está no caminho ativo até o flip (Passo 4).
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ProvisioningFileSystem } from "../../app/ports/ProvisioningFileSystem.js";

function isNotFound(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === "ENOENT";
}

export class NodeProvisioningFileSystem implements ProvisioningFileSystem {
  constructor(private readonly targetDir: string) {}

  resolvePath(relPath: string): string {
    return path.resolve(this.targetDir, relPath);
  }

  async readText(relPath: string): Promise<string | null> {
    try {
      return await fs.readFile(this.resolvePath(relPath), "utf8");
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async writeText(relPath: string, content: string): Promise<void> {
    await fs.writeFile(this.resolvePath(relPath), content, "utf8");
  }

  async exists(relPath: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(relPath));
      return true;
    } catch {
      return false;
    }
  }

  async ensureDir(relPathDir: string): Promise<void> {
    await fs.mkdir(this.resolvePath(relPathDir), { recursive: true });
  }

  async remove(relPath: string): Promise<void> {
    try {
      await fs.unlink(this.resolvePath(relPath));
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
  }
}

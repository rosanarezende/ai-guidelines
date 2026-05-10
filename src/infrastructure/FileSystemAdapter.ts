import * as fs from "node:fs/promises";
import * as path from "node:path";
import { FileSystem } from "../domain/services";

/**
 * Implementação real do FileSystem port usando Node.js fs/promises.
 */
export class NodeFileSystemAdapter implements FileSystem {
  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, "utf-8");
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await this.mkdir(dir, true);
    await fs.writeFile(filePath, content, "utf-8");
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(dirPath: string, recursive: boolean = true): Promise<void> {
    await fs.mkdir(dirPath, { recursive });
  }

  async readDir(dirPath: string): Promise<string[]> {
    return fs.readdir(dirPath);
  }
}

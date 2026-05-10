import * as fs from "node:fs";
import * as path from "node:path";
import { FileSystemProbe } from "../../app/ports/FileSystemProbe.js";

/**
 * Implementação Node do {@link FileSystemProbe}.
 *
 * Resolve caminhos relativos sempre contra um `rootDir` fixo — garantia de
 * que probe não escapa do workspace (segurança defensiva mínima).
 */
export class NodeFileSystemProbe implements FileSystemProbe {
  constructor(private readonly rootDir: string) {}

  directoryExists(relPath: string): boolean {
    const abs = path.resolve(this.rootDir, relPath);
    if (!abs.startsWith(path.resolve(this.rootDir))) return false;
    try {
      return fs.statSync(abs).isDirectory();
    } catch {
      return false;
    }
  }
}

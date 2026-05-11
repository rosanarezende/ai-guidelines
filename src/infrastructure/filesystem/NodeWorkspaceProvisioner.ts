import * as fs from "node:fs";
import * as path from "node:path";
import { GovernanceError } from "../../domain/shared/errors.js";
import { WorkspaceProvisioner } from "../../app/ports/WorkspaceProvisioner.js";

/**
 * Implementação Node do {@link WorkspaceProvisioner}.
 *
 * Invariantes:
 *  - Escopo: todos os caminhos resolvem dentro de `rootDir`. Caminhos fora
 *    levantam `WORKSPACE_PATH_OUT_OF_SCOPE` (defesa contra `..`).
 *  - Idempotência: `ensureDirectory` é no-op quando o diretório já existe.
 *  - Rollback seguro: `removeDirectoryIfEmpty` nunca apaga conteúdo do
 *    usuário (só remove o que está vazio).
 */
export class NodeWorkspaceProvisioner implements WorkspaceProvisioner {
  constructor(private readonly rootDir: string) {}

  ensureDirectory(relPath: string): boolean {
    const abs = this.resolveScoped(relPath);
    const existedBefore = directoryExistsAt(abs);
    fs.mkdirSync(abs, { recursive: true });
    return !existedBefore;
  }

  removeDirectoryIfEmpty(relPath: string): void {
    const abs = this.resolveScoped(relPath);
    try {
      const entries = fs.readdirSync(abs);
      if (entries.length === 0) {
        fs.rmdirSync(abs);
      }
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return;
      throw err;
    }
  }

  private resolveScoped(relPath: string): string {
    const root = path.resolve(this.rootDir);
    const abs = path.resolve(root, relPath);
    if (abs !== root && !abs.startsWith(root + path.sep)) {
      throw new GovernanceError(
        "WORKSPACE_PATH_OUT_OF_SCOPE",
        `Caminho '${relPath}' escapa do root '${root}'.`
      );
    }
    return abs;
  }
}

function directoryExistsAt(abs: string): boolean {
  try {
    return fs.statSync(abs).isDirectory();
  } catch {
    return false;
  }
}

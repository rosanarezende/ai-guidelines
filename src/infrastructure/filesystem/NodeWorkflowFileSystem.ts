import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";

/**
 * Implementação Node do {@link WorkflowFileSystem}.
 *
 * - Resolve caminhos relativos contra um `rootDir` fixo (workspace root)
 *   e rejeita paths que escapam dele (segurança defensiva mínima).
 * - `currentBranch()` usa `git rev-parse --abbrev-ref HEAD`; retorna `null`
 *   se HEAD detached, fora de repo, ou git ausente.
 */
export class NodeWorkflowFileSystem implements WorkflowFileSystem {
  constructor(private readonly rootDir: string) {}

  private absolute(relPath: string): string | null {
    const abs = path.resolve(this.rootDir, relPath);

    // Robust containment check:
    // - `startsWith(root)` is unsafe: `${root}2/...` would pass.
    // - `relative` handles normalization cross-platform.
    const rel = path.relative(this.rootDir, abs);
    if (rel === "") return abs;
    const escapes = rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel);
    if (escapes) return null;

    return abs;
  }

  fileExists(relPath: string): boolean {
    const abs = this.absolute(relPath);
    if (!abs) return false;
    try {
      return fs.statSync(abs).isFile();
    } catch {
      return false;
    }
  }

  directoryExists(relPath: string): boolean {
    const abs = this.absolute(relPath);
    if (!abs) return false;
    try {
      return fs.statSync(abs).isDirectory();
    } catch {
      return false;
    }
  }

  readTextFile(relPath: string): string {
    const abs = this.absolute(relPath);
    if (!abs) throw new Error(`refusing to read outside rootDir: ${relPath}`);
    return fs.readFileSync(abs, "utf8");
  }

  writeTextFile(relPath: string, contents: string): void {
    const abs = this.absolute(relPath);
    if (!abs) throw new Error(`refusing to write outside rootDir: ${relPath}`);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, contents, "utf8");
  }

  listDirectory(relPath: string): ReadonlyArray<string> {
    const abs = this.absolute(relPath);
    if (!abs) return [];
    try {
      return fs.readdirSync(abs);
    } catch {
      return [];
    }
  }

  currentBranch(): string | null {
    try {
      const out = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
        cwd: this.rootDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (!out || out === "HEAD") return null;
      return out;
    } catch {
      return null;
    }
  }

  resolveAbsolute(relPath: string): string {
    const abs = this.absolute(relPath);
    if (!abs) {
      throw new Error(`refusing to resolve outside rootDir: ${relPath}`);
    }
    return abs;
  }
}

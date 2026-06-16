/**
 * Adapter `ProcessRunner` sobre `node:child_process`. Mantém `spawn` fora do
 * domínio e dos use cases. Migração Spec 0024 · CO-3.5 — substitui `runInstall`
 * de `cli/app/install.mjs` + `ensureExecutable` de `cli/fs/file-system.mjs`.
 *
 * `spawn`/`chmod` são injetáveis para teste determinístico (mesmo padrão de
 * `runInstall({ spawnFn })` no legado). **Aditivo:** fora do caminho ativo até o
 * flip (Passo 4) e só consumido a partir do Passo 2b (efeitos install/chmod).
 */
import { spawn as nodeSpawn } from "node:child_process";
import { chmod as nodeChmod } from "node:fs/promises";
import * as path from "node:path";
import { InstallRequest, ProcessRunner } from "../../app/ports/ProcessRunner.js";

interface SpawnedProcess {
  on(event: "close", listener: (code: number | null) => void): void;
  on(event: "error", listener: (error: Error) => void): void;
}

type SpawnFn = (
  command: string,
  options: { cwd: string; stdio: "inherit"; shell: true }
) => SpawnedProcess;
type GitSpawnFn = (
  command: string,
  args: readonly string[],
  options: { cwd: string; shell: true }
) => SpawnedProcess;
type ChmodFn = (filePath: string, mode: number) => Promise<void>;

export interface NodeProcessRunnerDeps {
  readonly spawn?: SpawnFn;
  readonly gitSpawn?: GitSpawnFn;
  readonly chmod?: ChmodFn;
}

export class NodeProcessRunner implements ProcessRunner {
  private readonly spawn: SpawnFn;
  private readonly gitSpawn: GitSpawnFn;
  private readonly chmod: ChmodFn;

  constructor(deps: NodeProcessRunnerDeps = {}) {
    this.spawn = deps.spawn ?? (nodeSpawn as unknown as SpawnFn);
    this.gitSpawn = deps.gitSpawn ?? (nodeSpawn as unknown as GitSpawnFn);
    this.chmod = deps.chmod ?? nodeChmod;
  }

  async runInstall(request: InstallRequest): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const child = this.spawn(request.command, {
        cwd: request.cwd,
        stdio: "inherit",
        shell: true,
      });
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Install falhou com código ${code}`));
        }
      });
      child.on("error", reject);
    });
  }

  async markExecutable(absolutePath: string): Promise<void> {
    try {
      await this.chmod(absolutePath, 0o755);
    } catch {
      // Sistemas sem suporte a chmod: best-effort, segue para o git add.
    }

    return new Promise<void>((resolve) => {
      const git = this.gitSpawn("git", ["add", "--chmod=+x", path.basename(absolutePath)], {
        cwd: path.dirname(absolutePath),
        shell: true,
      });
      git.on("close", () => resolve());
      git.on("error", () => resolve());
    });
  }
}

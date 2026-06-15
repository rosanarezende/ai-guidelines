import { NodeProcessRunner, NodeProcessRunnerDeps } from "./NodeProcessRunner.js";

type SpawnDep = NodeProcessRunnerDeps["spawn"];
type GitSpawnDep = NodeProcessRunnerDeps["gitSpawn"];

type Handlers = Record<string, ((arg: unknown) => void)[]>;

/** Processo filho fake: agenda a emissão do evento após o registro dos handlers. */
function fakeChild(emit: (handlers: Handlers) => void) {
  const handlers: Handlers = {};
  queueMicrotask(() => emit(handlers));
  return {
    on(event: string, cb: (arg: unknown) => void) {
      (handlers[event] ??= []).push(cb);
    },
  };
}

const emitClose = (code: number) => (h: Handlers) => h.close?.forEach((cb) => cb(code));

describe("infrastructure/NodeProcessRunner (spawn injetado)", () => {
  it("runInstall resolve em close(0) e repassa command/cwd/shell", async () => {
    const spawn = jest.fn((_cmd: string, _opts: unknown) => fakeChild(emitClose(0)));
    const runner = new NodeProcessRunner({ spawn: spawn as unknown as SpawnDep });
    await expect(
      runner.runInstall({ cwd: "/repo", command: "npm install" })
    ).resolves.toBeUndefined();
    expect(spawn).toHaveBeenCalledWith("npm install", {
      cwd: "/repo",
      stdio: "inherit",
      shell: true,
    });
  });

  it("runInstall rejeita quando o código de saída é != 0", async () => {
    const spawn = jest.fn((_cmd: string, _opts: unknown) => fakeChild(emitClose(1)));
    const runner = new NodeProcessRunner({ spawn: spawn as unknown as SpawnDep });
    await expect(runner.runInstall({ cwd: "/r", command: "x" })).rejects.toThrow(/código 1/);
  });

  it("markExecutable faz chmod 0o755 + git add --chmod=+x na pasta do arquivo", async () => {
    const chmod = jest.fn(async () => {});
    const gitSpawn = jest.fn((_cmd: string, _args: readonly string[], _opts: unknown) =>
      fakeChild(emitClose(0))
    );
    const runner = new NodeProcessRunner({ chmod, gitSpawn: gitSpawn as unknown as GitSpawnDep });
    await runner.markExecutable("/repo/bin/x.sh");
    expect(chmod).toHaveBeenCalledWith("/repo/bin/x.sh", 0o755);
    expect(gitSpawn).toHaveBeenCalledWith("git", ["add", "--chmod=+x", "x.sh"], {
      cwd: "/repo/bin",
      shell: true,
    });
  });

  it("markExecutable resolve mesmo quando chmod falha (best-effort)", async () => {
    const chmod = jest.fn(async () => {
      throw new Error("no chmod");
    });
    const gitSpawn = jest.fn((_cmd: string, _args: readonly string[], _opts: unknown) =>
      fakeChild(emitClose(0))
    );
    const runner = new NodeProcessRunner({ chmod, gitSpawn: gitSpawn as unknown as GitSpawnDep });
    await expect(runner.markExecutable("/a/b.sh")).resolves.toBeUndefined();
  });
});

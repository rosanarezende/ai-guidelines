import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface CliResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function runCli(args: readonly string[]): Promise<CliResult> {
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ["dist/cli/main.js", ...args],
      {
        cwd: process.cwd(),
        env: { ...process.env, NODE_NO_WARNINGS: "1" },
        timeout: 30_000,
      }
    );
    return { exitCode: 0, stdout, stderr };
  } catch (error) {
    const err = error as Error & {
      readonly code?: number | string;
      readonly stdout?: string;
      readonly stderr?: string;
    };
    return {
      exitCode: typeof err.code === "number" ? err.code : 1,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? err.message,
    };
  }
}

async function withTempDir<T>(prefix: string, fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("BootstrapCommand flip — caminho ativo via dist", () => {
  it("help ativo não lista providers e documenta update --providers", async () => {
    const result = await runCli(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("update --providers claude,openai");
    expect(result.stdout).not.toMatch(/^\s+providers\s*$/m);
  });

  it("update --providers funciona pelo caminho ativo", async () => {
    await withTempDir("ai-guidelines-update-", async (target) => {
      const result = await runCli([
        "update",
        "--providers",
        "claude,openai",
        "--dry-run",
        "--target",
        target,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("modo update --providers");
    });
  });

  it("providers falha como comando desconhecido com orientação para update --providers", async () => {
    await withTempDir("ai-guidelines-providers-", async (target) => {
      const result = await runCli(["providers", "--target", target]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Comando não suportado: "providers"');
      expect(result.stderr).toContain("guidelines update --providers");
    });
  });

  it("init e adopt dry-run funcionam pelo caminho ativo", async () => {
    await withTempDir("ai-guidelines-init-", async (initTarget) => {
      const init = await runCli([
        "init",
        "--dry-run",
        "--target",
        initTarget,
        "--name",
        "tmp-init",
        "--package-manager",
        "npm",
        "--providers",
        "claude",
      ]);

      expect(init.exitCode).toBe(0);
      expect(init.stdout).toContain("modo conservador");
    });

    await withTempDir("ai-guidelines-adopt-", async (adoptTarget) => {
      const adopt = await runCli([
        "adopt",
        "--dry-run",
        "--target",
        adoptTarget,
        "--name",
        "tmp-adopt",
        "--package-manager",
        "npm",
        "--providers",
        "claude",
      ]);

      expect(adopt.exitCode).toBe(0);
      expect(adopt.stdout).toContain("modo conservador");
    });
  });

  it("check-budget executa pelo caminho ativo", async () => {
    const result = await runCli(["check-budget"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Token budget report");
  });
});

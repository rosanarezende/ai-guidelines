import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");
export const SMOKE_TIMEOUT_MS = 120_000;

function formatCommand(command, args) {
  return [command, ...args].join(" ");
}

function resolveExecutable(command) {
  // Em Windows, bins instalados via npm/yarn ficam em arquivos `.cmd` que cmd.exe
  // sabe executar diretamente. Evita `shell: true` (que quebra com paths que
  // contêm espaços, como `C:\Program Files\nodejs\node.exe`).
  if (process.platform !== "win32") return command;
  if (command === "npm") return "npm.cmd";
  if (command === "npx") return "npx.cmd";
  if (command === "yarn") return "yarn.cmd";
  return command;
}

export async function exists(filePath) {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
}

export async function makeTempDir(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function runCommand(command, args, options = {}) {
  const cwd = options.cwd ?? ROOT_DIR;
  const env = {
    ...process.env,
    ...options.env,
  };

  const resolved = resolveExecutable(command);
  // Em Windows, spawn de arquivos .cmd/.bat sem shell:true falha com EINVAL
  // desde Node 20+ (CVE-2024-27980). shell:true é seguro aqui porque o nome
  // resolvido (`npm.cmd`, `npx.cmd`, `yarn.cmd`) não contém espaços; node.exe
  // (cujo path tem espaços) continua spawnado direto, sem shell.
  const useShell = process.platform === "win32" && /\.(cmd|bat)$/i.test(resolved);

  return new Promise((resolve, reject) => {
    const child = spawn(resolved, args, {
      cwd,
      env,
      shell: useShell,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `Falha ao executar "${formatCommand(command, args)}": ${error.message}\nstdout:\n${stdout}\nstderr:\n${stderr}`
        )
      );
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
        return;
      }

      reject(
        new Error(
          `Comando falhou (${code}): ${formatCommand(command, args)}\nstdout:\n${stdout}\nstderr:\n${stderr}`
        )
      );
    });
  });
}

export async function runNode(scriptPath, args, options = {}) {
  return runCommand(process.execPath, [scriptPath, ...args], options);
}

export async function packLocal() {
  const packDir = await makeTempDir("ai-guidelines-pack-");
  const npmCacheDir = path.join(packDir, "npm-cache");

  try {
    const { stdout } = await runCommand(
      "npm",
      ["pack", "--ignore-scripts", "--json", "--pack-destination", packDir],
      {
        cwd: ROOT_DIR,
        env: {
          npm_config_cache: npmCacheDir,
        },
      }
    );
    const parsed = JSON.parse(stdout);
    const [firstEntry] = parsed;
    assert.ok(firstEntry?.filename, "npm pack --json deve retornar filename");

    const tarballPath = path.join(packDir, firstEntry.filename);
    assert.equal(await exists(tarballPath), true, "tarball deve existir após npm pack");

    return {
      tarballPath,
      cleanup: async () => {
        await fs.rm(packDir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await fs.rm(packDir, { recursive: true, force: true });
    throw error;
  }
}

async function writeRunnerPackageJson(runnerDir) {
  const packageJsonPath = path.join(runnerDir, "package.json");
  const packageJson = {
    name: "ai-guidelines-smoke-runner",
    private: true,
  };

  await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

export async function installInTempDir(tarballPath) {
  const sandboxDir = await makeTempDir("ai-guidelines-smoke-");
  const runnerDir = path.join(sandboxDir, "runner");
  const targetDir = path.join(sandboxDir, "target");
  const npmCacheDir = path.join(sandboxDir, "npm-cache");
  const packageDir = path.join(runnerDir, "node_modules", "ai-guidelines");

  await fs.mkdir(runnerDir, { recursive: true });
  await fs.mkdir(targetDir, { recursive: true });
  await fs.mkdir(npmCacheDir, { recursive: true });
  await writeRunnerPackageJson(runnerDir);

  await runCommand("npm", ["install", "--ignore-scripts", tarballPath], {
    cwd: runnerDir,
    env: {
      npm_config_cache: npmCacheDir,
    },
  });

  assert.equal(
    await exists(path.join(packageDir, "package.json")),
    true,
    "tarball instalado deve expor node_modules/ai-guidelines/package.json"
  );

  return {
    sandboxDir,
    runnerDir,
    targetDir,
    packageDir,
    cleanup: async () => {
      await fs.rm(sandboxDir, { recursive: true, force: true });
    },
  };
}

export async function runInstalledCli(packageDir, args, options = {}) {
  const packageJsonPath = path.join(packageDir, "package.json");
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  const relativeBinPath =
    typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.["ai-guidelines"];

  assert.ok(relativeBinPath, "package instalado deve declarar bin para ai-guidelines");

  return runNode(path.join(packageDir, relativeBinPath), args, {
    cwd: options.cwd ?? packageDir,
    env: options.env,
  });
}

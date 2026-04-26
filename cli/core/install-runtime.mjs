import readline from "node:readline";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileExists } from "./file-system.mjs";
import { resolveLocalInstallCommand } from "../formatters/package-context.mjs";

export async function getInstallHint(targetDir, packageManager) {
  const { cmd, args } = resolveLocalInstallCommand(packageManager);
  if (packageManager.id === "yarn-berry") {
    const releasePath = path.join(targetDir, args[0]);
    if (!(await fileExists(releasePath))) {
      return "corepack enable && yarn install";
    }
  }
  return `${cmd} ${args.join(" ")}`;
}

export async function runInstall(targetDir, packageManager, { spawnFn = spawn } = {}) {
  const { cmd, args } = resolveLocalInstallCommand(packageManager);

  if (packageManager.id === "yarn-berry") {
    const releasePath = path.join(targetDir, args[0]);
    if (!(await fileExists(releasePath))) {
      throw new Error(
        `Arquivo de release do yarn não encontrado em ${args[0]}. Execute: corepack enable && yarn install`
      );
    }
  }

  return new Promise((resolve, reject) => {
    const child = spawnFn(cmd, args, { cwd: targetDir, stdio: "inherit", shell: true });
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

export function promptUser(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "" || normalized === "s" || normalized === "y");
    });
  });
}

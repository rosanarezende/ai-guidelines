import path from "node:path";
import { spawn } from "node:child_process";
import { fileExists } from "#fs/file-system";
import { resolveLocalInstallCommand } from "#formatters/package-context";

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

/**
 * Confirma instalação de dependências via inquirer (padrão do framework
 * para input humano — cf. NEXT.md da Spec 0023 § "Convenção operacional —
 * inquirer em todo input humano").
 *
 * Mantém assinatura `promptUser(question, defaultYes)` por
 * compatibilidade com callers; internamente delega a `@inquirer/prompts.confirm`.
 */
export async function promptUser(question, defaultYes = true) {
  const { confirm } = await import("@inquirer/prompts");
  return confirm({ message: question, default: defaultYes });
}

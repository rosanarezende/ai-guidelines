import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "..", "..");
export const TEMPLATE_DIR = path.join(ROOT_DIR, ".core", "templates");

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextIfExists(filePath) {
  if (!(await fileExists(filePath))) {
    return null;
  }

  return fs.readFile(filePath, "utf8");
}

export function renderTemplate(template, replacements) {
  return Object.entries(replacements).reduce((accumulator, [key, value]) => {
    return accumulator.replaceAll(`{{${key}}}`, value);
  }, template);
}

export function stringifyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function ensureDir(filePath, dryRun, actions) {
  if (dryRun) {
    const displayPath = path.relative(process.cwd(), filePath) || filePath;
    actions.push(`[dry-run] mkdir -p ${displayPath}`);
    return;
  }

  await fs.mkdir(filePath, { recursive: true });
}

export async function writeFileIfChanged(filePath, nextContent, dryRun, actions) {
  const currentContent = await readTextIfExists(filePath);
  if (currentContent === nextContent) {
    return false;
  }

  // Relativizamos a CWD do processo (≈ diretório do consumidor) em vez de
  // ROOT_DIR (raiz do framework distribuído via node_modules), para que
  // os logs façam sentido para quem está rodando a CLI.
  const displayPath = path.relative(process.cwd(), filePath) || filePath;
  actions.push(`${dryRun ? "[dry-run] " : ""}write ${displayPath}`);

  if (!dryRun) {
    await ensureDir(path.dirname(filePath), false, actions);
    await fs.writeFile(filePath, nextContent, "utf8");
  }

  return true;
}

export async function loadTemplate(templateName) {
  const templatePath = path.join(TEMPLATE_DIR, templateName);
  return fs.readFile(templatePath, "utf8");
}

// Recursão manual em vez de `fs.readdir(..., { recursive: true })` + `entry.parentPath`:
// o comportamento de `Dirent.path`/`parentPath` em modo recursive variou entre Node
// 20/21/22 (e tem bugs reportados em Windows/macOS sobre paths concatenados de forma
// inconsistente), o que se manifestou como `mkdir 'C:\C:\...'` no smoke CI Windows
// Node 22 e como sync silenciosamente vazio em macOS Node 24. Recursão manual é
// determinística cross-version e cross-SO.
export async function listFilesRecursive(rootDir) {
  if (!(await fileExists(rootDir))) {
    return [];
  }

  const collected = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        collected.push(fullPath);
      }
    }
  }

  return collected;
}

export async function copyDirIfChanged(sourceDir, targetDir, dryRun, actions, options = {}) {
  if (!(await fileExists(sourceDir))) {
    return;
  }

  if (actions) {
    actions.push(`sync ${path.basename(sourceDir)} -> target`);
  }

  const sourceFiles = await listFilesRecursive(sourceDir);
  const sourceRelativeSet = new Set();

  for (const sourceFilePath of sourceFiles) {
    const relativePath = path.relative(sourceDir, sourceFilePath);
    sourceRelativeSet.add(relativePath);
    const targetFilePath = path.join(targetDir, relativePath);

    const content = await fs.readFile(sourceFilePath, "utf8");
    await writeFileIfChanged(targetFilePath, content, dryRun, actions);
  }

  if (options.prune && (await fileExists(targetDir))) {
    const targetFiles = await listFilesRecursive(targetDir);
    for (const targetFilePath of targetFiles) {
      const relativePath = path.relative(targetDir, targetFilePath);
      if (sourceRelativeSet.has(relativePath)) {
        continue;
      }
      actions.push(`${dryRun ? "[dry-run] " : ""}prune ${relativePath}`);
      if (!dryRun) {
        await fs.unlink(targetFilePath);
      }
    }
  }
}

export async function ensureExecutable(filePath, dryRun, actions) {
  if (dryRun) {
    actions.push(`[dry-run] chmod +x ${filePath}`);
    return;
  }

  try {
    await fs.chmod(filePath, 0o755);
  } catch {
    // Ignorar erros de chmod em sistemas que não suportam
  }

  return new Promise((resolve) => {
    const git = spawn("git", ["add", "--chmod=+x", path.basename(filePath)], {
      cwd: path.dirname(filePath),
      shell: true,
    });
    git.on("close", () => resolve());
    git.on("error", () => resolve());
  });
}

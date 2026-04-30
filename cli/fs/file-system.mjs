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
    actions.push(`[dry-run] mkdir -p ${filePath}`);
    return;
  }

  await fs.mkdir(filePath, { recursive: true });
}

export async function writeFileIfChanged(filePath, nextContent, dryRun, actions) {
  const currentContent = await readTextIfExists(filePath);
  if (currentContent === nextContent) {
    return false;
  }

  actions.push(`${dryRun ? "[dry-run] " : ""}write ${path.relative(ROOT_DIR, filePath)}`);

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

export async function copyDirIfChanged(sourceDir, targetDir, dryRun, actions, options = {}) {
  if (!(await fileExists(sourceDir))) {
    return;
  }

  if (actions) {
    actions.push(`sync ${path.basename(sourceDir)} -> target`);
  }

  const entries = await fs.readdir(sourceDir, { withFileTypes: true, recursive: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      continue;
    }

    const entryDir = entry.path || entry.parentPath;
    if (typeof entryDir !== "string") {
      continue;
    }

    const sourceFilePath = path.join(entryDir, entry.name);
    const relativePath = path.relative(sourceDir, sourceFilePath);
    const targetFilePath = path.join(targetDir, relativePath);

    const content = await fs.readFile(sourceFilePath, "utf8");
    await writeFileIfChanged(targetFilePath, content, dryRun, actions);
  }

  if (options.prune) {
    const sourceFiles = entries
      .filter((e) => !e.isDirectory())
      .map((e) => path.relative(sourceDir, path.join(e.path || e.parentPath, e.name)));
    const sourceFilesSet = new Set(sourceFiles);

    if (await fileExists(targetDir)) {
      const targetEntries = await fs.readdir(targetDir, { withFileTypes: true, recursive: true });
      for (const entry of targetEntries) {
        if (entry.isDirectory()) {
          continue;
        }
        const targetEntryDir = entry.path || entry.parentPath;
        const targetFilePath = path.join(targetEntryDir, entry.name);
        const relativePath = path.relative(targetDir, targetFilePath);

        if (!sourceFilesSet.has(relativePath)) {
          actions.push(`${dryRun ? "[dry-run] " : ""}prune ${relativePath}`);
          if (!dryRun) {
            await fs.unlink(targetFilePath);
          }
        }
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

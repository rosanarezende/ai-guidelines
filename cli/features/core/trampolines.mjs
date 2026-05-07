import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, fileExists, readTextIfExists, writeFileIfChanged } from "#fs/file-system";

function buildCommonContextIgnores(sddDir) {
  return [
    "node_modules",
    ".git",
    ".yarn",
    "dist",
    "build",
    "coverage",
    ".next",
    ".turbo",
    ".cache",
    `${sddDir}/templates`,
  ].join("\n");
}

function buildHardRedirect(providerLabel, sddDir) {
  return [
    "# SYSTEM DIRECTIVE: HARD REDIRECT",
    `You are operating inside the ${providerLabel} integration for this workspace.`,
    "Do not rely on your default behavioral assumptions.",
    "You must read and strictly follow the canonical AGENTS.md file at the repository root.",
    "Project-specific rules belong in AGENTS.md, not in this native provider file.",
    `Consumer-local ai-guidelines assets live under \`${sddDir}/\`.`,
  ].join("\n\n");
}

function buildCursorRedirect(sddDir) {
  return [
    "---",
    "description: ai-guidelines hard redirect",
    "alwaysApply: true",
    "---",
    "",
    buildHardRedirect("Cursor", sddDir),
  ].join("\n");
}

function getManagedProviderFiles(provider, sddDir) {
  const commonContextIgnores = buildCommonContextIgnores(sddDir);
  const redirects = {
    claude: [
      ["CLAUDE.md", buildHardRedirect("Claude Code", sddDir)],
      [".claudeignore", commonContextIgnores],
    ],
    cursor: [[path.join(".cursor", "rules", "ai-guidelines.mdc"), buildCursorRedirect(sddDir)]],
    copilot: [
      [
        path.join(".github", "copilot-instructions.md"),
        buildHardRedirect("GitHub Copilot", sddDir),
      ],
    ],
    windsurf: [[".windsurfrules", buildHardRedirect("Windsurf", sddDir)]],
    gemini: [
      ["GEMINI.md", buildHardRedirect("Gemini", sddDir)],
      [".aiexclude", commonContextIgnores],
    ],
    aider: [
      ["CONVENTIONS.md", buildHardRedirect("Aider", sddDir)],
      [".aiderignore", commonContextIgnores],
    ],
    openai: [
      [path.join(".openai", "instructions.md"), buildHardRedirect("OpenAI / Codex", sddDir)],
      [".gptignore", commonContextIgnores],
    ],
  };

  return redirects[provider] ?? [];
}

function getAllManagedRelativePaths(sddDir) {
  return ["claude", "cursor", "copilot", "windsurf", "gemini", "aider", "openai"].flatMap(
    (provider) => {
      return getManagedProviderFiles(provider, sddDir).map(([relativePath]) => relativePath);
    }
  );
}

async function removeManagedFile(targetDir, relativePath, dryRun, actions) {
  const absolutePath = path.join(targetDir, relativePath);
  if (!(await fileExists(absolutePath))) {
    return;
  }

  actions.push(`${dryRun ? "[dry-run] " : ""}prune ${relativePath}`);

  if (!dryRun) {
    await fs.unlink(absolutePath);
  }
}

async function writeManagedFile(targetDir, relativePath, content, options, actions) {
  const absolutePath = path.join(targetDir, relativePath);
  const currentContent = await readTextIfExists(absolutePath);

  if (currentContent !== null && currentContent !== content && !options.force) {
    actions.push(
      `preserve ${relativePath} (existing native provider file; use --force to overwrite)`
    );
    return;
  }

  await writeFileIfChanged(absolutePath, content, options.dryRun, actions);
}

export async function syncProviderTrampolines(targetDir, config, options, actions) {
  const selectedFiles = config.providers.flatMap((provider) => {
    return getManagedProviderFiles(provider, config.sdd_dir);
  });

  for (const [relativePath] of selectedFiles) {
    const parentDir = path.dirname(path.join(targetDir, relativePath));
    await ensureDir(parentDir, options.dryRun, actions);
  }

  for (const [relativePath, content] of selectedFiles) {
    await writeManagedFile(targetDir, relativePath, content, options, actions);
  }

  if (!options.prune) {
    return;
  }

  const selectedPathSet = new Set(selectedFiles.map(([relativePath]) => relativePath));
  const allManagedPaths = getAllManagedRelativePaths(config.sdd_dir);

  for (const relativePath of allManagedPaths) {
    if (!selectedPathSet.has(relativePath)) {
      await removeManagedFile(targetDir, relativePath, options.dryRun, actions);
    }
  }
}

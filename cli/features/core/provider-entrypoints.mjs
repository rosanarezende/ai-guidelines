import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, fileExists, readTextIfExists } from "#fs/file-system";
import { applyManagedBlock, inferSyntaxFromPath } from "#features/core/managed-block";
import { getAdaptersForProvider, getSupportedProviders } from "#features/core/config";

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

const CURSOR_FRONTMATTER = [
  "---",
  "description: ai-guidelines hard redirect",
  "alwaysApply: true",
  "---",
].join("\n");

function buildMarkdownInner(providerLabel, sddDir, adapterContents) {
  const sections = [buildHardRedirect(providerLabel, sddDir), ...adapterContents.filter(Boolean)];
  return sections.join("\n\n---\n\n");
}

function getProviderEntrypoints(provider, sddDir, adapterRulesByName = {}) {
  const adapters = getAdaptersForProvider(provider);
  const adapterContents = adapters
    .map((adapter) => adapterRulesByName[adapter])
    .filter((content) => typeof content === "string" && content.length > 0);

  const commonContextIgnores = buildCommonContextIgnores(sddDir);

  const recipes = {
    claude: [
      ["CLAUDE.md", buildMarkdownInner("Claude Code", sddDir, adapterContents)],
      [".claudeignore", commonContextIgnores],
    ],
    cursor: [
      [
        path.join(".cursor", "rules", "ai-guidelines.mdc"),
        buildMarkdownInner("Cursor", sddDir, adapterContents),
      ],
    ],
    copilot: [
      [
        path.join(".github", "copilot-instructions.md"),
        buildMarkdownInner("GitHub Copilot", sddDir, adapterContents),
      ],
    ],
    windsurf: [[".windsurfrules", buildMarkdownInner("Windsurf", sddDir, adapterContents)]],
    gemini: [
      ["GEMINI.md", buildMarkdownInner("Gemini", sddDir, adapterContents)],
      [".aiexclude", commonContextIgnores],
    ],
    aider: [
      ["CONVENTIONS.md", buildMarkdownInner("Aider", sddDir, adapterContents)],
      [".aiderignore", commonContextIgnores],
    ],
    openai: [
      [
        path.join(".openai", "instructions.md"),
        buildMarkdownInner("OpenAI / Codex", sddDir, adapterContents),
      ],
      [".gptignore", commonContextIgnores],
    ],
  };

  return recipes[provider] ?? [];
}

function getAllManagedRelativePaths(sddDir) {
  return getSupportedProviders().flatMap((provider) => {
    return getProviderEntrypoints(provider, sddDir).map(([relativePath]) => relativePath);
  });
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

function describeAction(state, relativePath, dryRun) {
  const prefix = dryRun ? "[dry-run] " : "";
  switch (state) {
    case "created":
      return `${prefix}write ${relativePath}`;
    case "block-updated":
      return `${prefix}update managed block in ${relativePath}`;
    case "legacy-prepended":
      return `${prefix}prepend managed block to existing ${relativePath} (legacy content preserved)`;
    case "legacy-overwritten":
      return `${prefix}overwrite ${relativePath} (--force, legacy content discarded)`;
    default:
      return null;
  }
}

async function writeManagedEntrypoint(targetDir, relativePath, innerContent, options, actions) {
  const absolutePath = path.join(targetDir, relativePath);
  const currentContent = await readTextIfExists(absolutePath);
  const syntax = inferSyntaxFromPath(relativePath);

  const result = applyManagedBlock(currentContent, innerContent, {
    syntax,
    force: Boolean(options.force),
  });

  if (!result.content) {
    return;
  }

  let finalContent = result.content;

  // Cursor's .mdc requires YAML frontmatter at the top on first creation. We
  // emit it as a fixed prelude above the managed block; subsequent updates
  // hit the "block-updated" path and leave the existing frontmatter alone.
  if (relativePath.endsWith(".mdc") && result.state === "created") {
    finalContent = `${CURSOR_FRONTMATTER}\n\n${result.content}`;
  }

  const action = describeAction(result.state, relativePath, options.dryRun);
  if (action) {
    actions.push(action);
  }

  if (!options.dryRun) {
    await ensureDir(path.dirname(absolutePath), false, actions);
    await fs.writeFile(absolutePath, finalContent, "utf8");
  }
}

export async function syncProviderEntrypoints(targetDir, config, options, actions) {
  const adapterRulesByName = config.adapterRulesByName ?? {};

  const selectedFiles = config.providers.flatMap((provider) => {
    return getProviderEntrypoints(provider, config.sdd_dir, adapterRulesByName);
  });

  for (const [relativePath] of selectedFiles) {
    const parentDir = path.dirname(path.join(targetDir, relativePath));
    await ensureDir(parentDir, options.dryRun, actions);
  }

  for (const [relativePath, content] of selectedFiles) {
    await writeManagedEntrypoint(targetDir, relativePath, content, options, actions);
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

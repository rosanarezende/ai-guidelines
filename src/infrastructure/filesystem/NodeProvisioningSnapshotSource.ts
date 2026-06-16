import * as fs from "node:fs/promises";
import * as path from "node:path";
import { AssembleArtifact } from "../../app/use-cases/AssembleArtifact.js";
import type {
  ProvisioningSnapshot,
  ProvisioningSnapshotInput,
  ProvisioningSnapshotSource,
} from "../../app/ports/ProvisioningSnapshotSource.js";
import { buildAgentsRuntimeStub } from "../../app/services/AgentsRuntimeBootstrap.js";
import type {
  PrettierSnapshot,
  TemplateMirrorFile,
  TemplateMirrorSnapshot,
} from "../../domain/provisioning/ProvisioningPlan.js";
import {
  detectFormatterContext,
  FORMATTER_CONTEXT_FILES,
} from "../../domain/provisioning/FormatterContext.js";
import type { PackageJsonObject } from "../../domain/provisioning/PackageJson.js";
import {
  assertRequiredTemplatesPresent,
  DEFAULT_REQUIRED_TEMPLATE_RELATIVE_PATHS,
  deriveTemplateRecipeName,
  normalizeTemplateContent,
  normalizeTemplateRelativePath,
} from "../../domain/provisioning/TemplateMirror.js";
import { NodeRecipeStore } from "../yaml/NodeRecipeStore.js";

function isNotFound(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === "ENOENT";
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (isNotFound(error)) {
      return false;
    }
    throw error;
  }
}

async function listFilesRecursive(rootDir: string): Promise<string[]> {
  if (!(await pathExists(rootDir))) {
    return [];
  }

  const collected: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop() as string;
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

  return collected.sort((a, b) => a.localeCompare(b));
}

function toSourceRelativePath(sourceDir: string, absolutePath: string): string {
  return normalizeTemplateRelativePath(path.relative(sourceDir, absolutePath));
}

export class NodeTemplateMirrorSnapshotSource {
  private readonly sourceDir: string;
  private readonly recipesDir: string;
  private readonly assembler: AssembleArtifact;

  constructor(repoRoot: string) {
    this.sourceDir = path.join(repoRoot, ".specify", "templates");
    this.recipesDir = path.join(repoRoot, ".core", "governance", "recipes");
    this.assembler = new AssembleArtifact({ store: new NodeRecipeStore(repoRoot) });
  }

  async collect(input: ProvisioningSnapshotInput): Promise<TemplateMirrorSnapshot> {
    const sourceExists = await pathExists(this.sourceDir);
    if (!sourceExists) {
      assertRequiredTemplatesPresent(
        [],
        input.requiredTemplateRelativePaths ?? DEFAULT_REQUIRED_TEMPLATE_RELATIVE_PATHS
      );
      return { sourceExists: false, sourceFiles: [], targetRelativePaths: [] };
    }

    const sourceFilePaths = await listFilesRecursive(this.sourceDir);
    const sourceRelativePaths = sourceFilePaths.map((filePath) =>
      toSourceRelativePath(this.sourceDir, filePath)
    );
    assertRequiredTemplatesPresent(
      sourceRelativePaths,
      input.requiredTemplateRelativePaths ?? DEFAULT_REQUIRED_TEMPLATE_RELATIVE_PATHS
    );

    const sourceFiles: TemplateMirrorFile[] = [];
    for (const filePath of sourceFilePaths) {
      const relativePath = toSourceRelativePath(this.sourceDir, filePath);
      sourceFiles.push(await this.materializeTemplate(filePath, relativePath));
    }

    const targetTemplatesDir = path.join(input.targetDir, input.sddDir, "templates");
    const targetRelativePaths = (await listFilesRecursive(targetTemplatesDir)).map((filePath) =>
      normalizeTemplateRelativePath(path.relative(targetTemplatesDir, filePath))
    );

    return { sourceExists: true, sourceFiles, targetRelativePaths };
  }

  private async materializeTemplate(
    sourceFilePath: string,
    relativePath: string
  ): Promise<TemplateMirrorFile> {
    const sourceFilename = path.basename(sourceFilePath);
    const recipeName = deriveTemplateRecipeName(sourceFilename);

    if (recipeName && (await pathExists(path.join(this.recipesDir, `${recipeName}.recipe.yml`)))) {
      try {
        const composed = this.assembler.execute({ recipeName });
        return {
          relativePath,
          content: normalizeTemplateContent(composed.content),
          origin: "engine",
        };
      } catch (error) {
        throw new Error(
          `Falha ao renderizar template recipe "${recipeName}" para ${relativePath}: ${
            (error as Error).message
          }`
        );
      }
    }

    return {
      relativePath,
      content: await fs.readFile(sourceFilePath, "utf8"),
      origin: "mirror",
    };
  }
}

export class NodePrettierSnapshotSource {
  private readonly prettierIgnoreBaselinePath: string;

  constructor(repoRoot: string) {
    this.prettierIgnoreBaselinePath = path.join(
      repoRoot,
      ".core",
      "templates",
      ".prettierignore.tmpl"
    );
  }

  async collect(input: ProvisioningSnapshotInput): Promise<PrettierSnapshot> {
    const packageJson = await this.readPackageJson(input.targetDir);
    const prettierIgnoreContent = await this.readTextIfExists(
      path.join(input.targetDir, ".prettierignore")
    );
    const prettierIgnoreBaseline = await fs.readFile(this.prettierIgnoreBaselinePath, "utf8");
    const existingFormatterFiles = await this.collectExistingFormatterFiles(input.targetDir);

    return {
      packageJson,
      prettierIgnoreContent,
      prettierIgnoreBaseline,
      formatterContext: detectFormatterContext({
        existingFiles: existingFormatterFiles,
        packageJson,
      }),
    };
  }

  private async readPackageJson(targetDir: string): Promise<PackageJsonObject | null> {
    const content = await this.readTextIfExists(path.join(targetDir, "package.json"));
    if (content === null) {
      return null;
    }
    return JSON.parse(content) as PackageJsonObject;
  }

  private async readTextIfExists(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  private async collectExistingFormatterFiles(targetDir: string): Promise<string[]> {
    const existing: string[] = [];
    for (const relPath of FORMATTER_CONTEXT_FILES) {
      if (await pathExists(path.join(targetDir, relPath))) {
        existing.push(relPath);
      }
    }
    return existing;
  }
}

export class NodeProvisioningSnapshotSource implements ProvisioningSnapshotSource {
  private readonly templates: NodeTemplateMirrorSnapshotSource;
  private readonly prettier: NodePrettierSnapshotSource;

  constructor(repoRoot: string) {
    this.templates = new NodeTemplateMirrorSnapshotSource(repoRoot);
    this.prettier = new NodePrettierSnapshotSource(repoRoot);
  }

  async collect(input: ProvisioningSnapshotInput): Promise<ProvisioningSnapshot> {
    try {
      return {
        runtime: { runtimeStub: buildAgentsRuntimeStub(input.sddDir) },
        templates: await this.templates.collect(input),
        prettier: await this.prettier.collect(input),
      };
    } catch (error) {
      if (isNotFound(error)) {
        throw new Error(
          `Falha ao coletar snapshot de provisionamento: ${(error as Error).message}`
        );
      }
      throw error;
    }
  }
}

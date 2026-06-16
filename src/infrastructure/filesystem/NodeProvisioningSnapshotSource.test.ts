import * as fs from "node:fs/promises";
import * as nodeFs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { planProvisioningOperation } from "../../domain/provisioning/ProvisioningPlan.js";
import { normalizeTemplateContent } from "../../domain/provisioning/TemplateMirror.js";
import { ProvisionWorkspace } from "../../app/use-cases/ProvisionWorkspace.js";
import { NodeProvisioningFileSystem } from "./NodeProvisioningFileSystem.js";
import {
  NodeCiSnapshotSource,
  NodeGuidanceSnapshotSource,
  NodeHuskySnapshotSource,
  NodeInitGuardSnapshotSource,
  NodeInstallSnapshotSource,
  NodeProvisioningSnapshotSource,
  NodePrettierSnapshotSource,
  NodeTemplateMirrorSnapshotSource,
} from "./NodeProvisioningSnapshotSource.js";

async function mkRoot(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function write(root: string, relPath: string, content: string): Promise<void> {
  const abs = path.join(root, relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");
}

async function read(root: string, relPath: string): Promise<string> {
  return fs.readFile(path.join(root, relPath), "utf8");
}

function createSymlinkOrSkip(target: string, linkPath: string): boolean {
  try {
    nodeFs.symlinkSync(target, linkPath);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EPERM" || code === "EACCES" || code === "ENOTSUP") {
      return false;
    }
    throw error;
  }
}

async function writeRequiredTemplates(repoRoot: string): Promise<void> {
  await write(repoRoot, ".specify/templates/spec-boilerplate.md", "# Spec\n");
  await write(repoRoot, ".specify/templates/plan-boilerplate.md", "# Plan\n");
  await write(repoRoot, ".specify/templates/tasks-boilerplate.md", "# Tasks\n");
}

async function writePrettierBaseline(repoRoot: string): Promise<void> {
  await write(repoRoot, ".core/templates/.prettierignore.tmpl", "dist/\nnode_modules/\n");
}

async function writeGitattributesBaseline(repoRoot: string): Promise<void> {
  await write(repoRoot, ".core/templates/.gitattributes.tmpl", "* text=auto eol=lf\n");
}

async function writeCiTemplate(repoRoot: string): Promise<void> {
  await write(
    repoRoot,
    ".core/templates/.github/workflows/ai-guidelines-ci.yml.tmpl",
    [
      "name: {{ci_workflow_name}}",
      "",
      "jobs:",
      "  ai-guidelines-check:",
      "    steps:",
      "      - name: Install dependencies",
      "        run: {{install_command}}",
      "      - name: Validate AI-first baseline",
      "        run: {{check_command}}",
      "",
    ].join("\n")
  );
}

async function writeRecipe(repoRoot: string): Promise<void> {
  await write(
    repoRoot,
    ".core/governance/recipes/tasks-evidence-driven.recipe.yml",
    [
      "schemaVersion: v0",
      "artifactKind: tasks",
      "language: pt-BR",
      "slots:",
      "  - id: header",
      "    required: true",
      "    partials:",
      "      - tasks/header.md",
      "invariants:",
      "  canonicalOrder: slots",
      "  forbiddenHeadings: []",
      "",
    ].join("\n")
  );
  await write(repoRoot, ".core/governance/templates/partials/tasks/header.md", "# Header  \r\n");
}

describe("infrastructure/NodeProvisioningSnapshotSource — template/runtime snapshots", () => {
  let roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.map((root) => fs.rm(root, { recursive: true, force: true })));
    roots = [];
  });

  it("snapshot com templates presentes coleta runtime + template mirror sem escrever no target", async () => {
    const repoRoot = await mkRoot("prov-snapshot-repo-");
    const targetDir = await mkRoot("prov-snapshot-target-");
    roots.push(repoRoot, targetDir);
    await writeRequiredTemplates(repoRoot);
    await writePrettierBaseline(repoRoot);
    await writeGitattributesBaseline(repoRoot);
    await writeCiTemplate(repoRoot);
    await write(targetDir, "package.json", '{"workspaces":["packages/*"]}\n');
    await write(targetDir, "biome.json", "{}\n");
    await write(targetDir, ".gitattributes", "*.bin binary\n");
    await fs.mkdir(path.join(targetDir, ".git"), { recursive: true });
    await write(targetDir, ".ai-guidelines/templates/stale.md", "# Stale\n");

    const snapshot = await new NodeProvisioningSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    expect(snapshot.runtime.runtimeStub).toContain(
      "Consumer-local ai-guidelines assets live under `.ai-guidelines/`"
    );
    expect(snapshot.initGuard.conflicts).toEqual([".gitattributes", "package.json"]);
    expect(snapshot.templates.sourceExists).toBe(true);
    expect(snapshot.templates.sourceFiles.map((file) => file.relativePath)).toEqual([
      "plan-boilerplate.md",
      "spec-boilerplate.md",
      "tasks-boilerplate.md",
    ]);
    expect(snapshot.templates.sourceFiles.every((file) => file.origin === "mirror")).toBe(true);
    expect(snapshot.templates.targetRelativePaths).toEqual(["stale.md"]);
    expect(snapshot.prettier.prettierIgnoreBaseline).toBe("dist/\nnode_modules/\n");
    expect(snapshot.husky.packageManager.id).toBe("npm");
    expect(snapshot.ci.packageManager.id).toBe("npm");
    expect(snapshot.ci.workflowTemplate).toContain("{{install_command}}");
    expect(snapshot.install.packageManager.id).toBe("npm");
    expect(snapshot.install.yarnBerryReleaseExists).toBe(true);
    expect(snapshot.guidance.monorepoContext).toMatchObject({
      detected: true,
      flavor: "npm-yarn-bun",
    });
    expect(snapshot.guidance.formatterContext.rival?.label).toBe("Biome");
    expect(snapshot.guidance.gitattributes).toEqual({
      content: "*.bin binary\n",
      baseline: "* text=auto eol=lf\n",
    });
    expect(snapshot.guidance.hasGitRepo).toBe(true);
    expect(await read(targetDir, ".ai-guidelines/templates/stale.md")).toBe("# Stale\n");
  });

  it("InitGuard snapshot real coleta conflitos com paths POSIX sem escrever", async () => {
    const targetDir = await mkRoot("prov-init-guard-target-");
    roots.push(targetDir);
    await write(targetDir, "AGENTS.md", "# Local\n");
    await write(targetDir, ".github/workflows/ai-guidelines-ci.yml", "name: custom\n");

    const snapshot = await new NodeInitGuardSnapshotSource().collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    expect(snapshot.conflicts).toEqual(["AGENTS.md", ".github/workflows/ai-guidelines-ci.yml"]);
    expect(snapshot.conflicts.every((relPath) => !relPath.includes("\\"))).toBe(true);
    expect(await read(targetDir, "AGENTS.md")).toBe("# Local\n");
  });

  it("package manager explícito alimenta Husky, CI e install no snapshot agregado", async () => {
    const repoRoot = await mkRoot("prov-pm-repo-");
    const targetDir = await mkRoot("prov-pm-target-");
    roots.push(repoRoot, targetDir);
    await writeRequiredTemplates(repoRoot);
    await writePrettierBaseline(repoRoot);
    await writeGitattributesBaseline(repoRoot);
    await writeCiTemplate(repoRoot);
    await write(targetDir, "package.json", '{"name":"consumer"}\n');

    const snapshot = await new NodeProvisioningSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
      packageManager: "pnpm@9.0.0",
    });

    expect(snapshot.husky.packageManager).toMatchObject({ id: "pnpm", runner: "pnpm" });
    expect(snapshot.ci.packageManager).toMatchObject({ id: "pnpm", runner: "pnpm" });
    expect(snapshot.install.packageManager).toMatchObject({ id: "pnpm", runner: "pnpm" });
  });

  it("template obrigatório ausente lança erro acionável", async () => {
    const repoRoot = await mkRoot("prov-snapshot-missing-");
    const targetDir = await mkRoot("prov-snapshot-target-");
    roots.push(repoRoot, targetDir);
    await write(repoRoot, ".specify/templates/spec-boilerplate.md", "# Spec\n");

    await expect(
      new NodeProvisioningSnapshotSource(repoRoot).collect({
        targetDir,
        sddDir: ".ai-guidelines",
        requiredTemplateRelativePaths: ["spec-boilerplate.md", "tasks-boilerplate.md"],
      })
    ).rejects.toThrow(/Template obrigatório ausente.*tasks-boilerplate\.md/);
  });

  it("normaliza paths de source e target para POSIX", async () => {
    const repoRoot = await mkRoot("prov-snapshot-posix-");
    const targetDir = await mkRoot("prov-snapshot-target-");
    roots.push(repoRoot, targetDir);
    await write(repoRoot, ".specify/templates/nested/spec-boilerplate.md", "# Nested\n");
    await write(targetDir, ".ai-guidelines/templates/nested/stale.md", "# Stale\n");

    const snapshot = await new NodeTemplateMirrorSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
      requiredTemplateRelativePaths: ["nested/spec-boilerplate.md"],
    });

    expect(snapshot.sourceFiles.map((file) => file.relativePath)).toEqual([
      "nested/spec-boilerplate.md",
    ]);
    expect(snapshot.targetRelativePaths).toEqual(["nested/stale.md"]);
  });

  it("diretório de templates vazio retorna snapshot vazio quando não há obrigatórios", async () => {
    const repoRoot = await mkRoot("prov-snapshot-empty-");
    const targetDir = await mkRoot("prov-snapshot-target-");
    roots.push(repoRoot, targetDir);
    await fs.mkdir(path.join(repoRoot, ".specify", "templates"), { recursive: true });

    const snapshot = await new NodeTemplateMirrorSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
      requiredTemplateRelativePaths: [],
    });

    expect(snapshot).toEqual({ sourceExists: true, sourceFiles: [], targetRelativePaths: [] });
  });

  it("symlink em templates não torna o snapshot frágil em Windows", async () => {
    const repoRoot = await mkRoot("prov-snapshot-symlink-");
    const targetDir = await mkRoot("prov-snapshot-target-");
    roots.push(repoRoot, targetDir);
    await writeRequiredTemplates(repoRoot);
    const sourceDir = path.join(repoRoot, ".specify", "templates");
    const madeSymlink = createSymlinkOrSkip(
      path.join(sourceDir, "spec-boilerplate.md"),
      path.join(sourceDir, "spec-link.md")
    );

    const snapshot = await new NodeTemplateMirrorSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    expect(snapshot.sourceFiles.some((file) => file.relativePath === "spec-boilerplate.md")).toBe(
      true
    );
    if (madeSymlink) {
      expect(snapshot.sourceFiles.some((file) => file.relativePath === "spec-link.md")).toBe(false);
    }
  });

  it("recipe existente usa engine e falha sem fallback silencioso", async () => {
    const repoRoot = await mkRoot("prov-snapshot-recipe-");
    const targetDir = await mkRoot("prov-snapshot-target-");
    roots.push(repoRoot, targetDir);
    await writeRequiredTemplates(repoRoot);
    await write(repoRoot, ".specify/templates/tasks-evidence-driven-boilerplate.md", "# Legacy\n");
    await writeRecipe(repoRoot);

    const snapshot = await new NodeTemplateMirrorSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    const rendered = snapshot.sourceFiles.find(
      (file) => file.relativePath === "tasks-evidence-driven-boilerplate.md"
    );
    expect(rendered).toMatchObject({
      relativePath: "tasks-evidence-driven-boilerplate.md",
      origin: "engine",
      content: "# Header\n",
    });

    await fs.rm(path.join(repoRoot, ".core", "governance", "templates", "partials"), {
      recursive: true,
      force: true,
    });
    await expect(
      new NodeTemplateMirrorSnapshotSource(repoRoot).collect({
        targetDir,
        sddDir: ".ai-guidelines",
      })
    ).rejects.toThrow(/Falha ao renderizar template recipe "tasks-evidence-driven"/);
  });

  it("equivale ao legado: mirror copia spec e engine renderiza tasks-evidence-driven", async () => {
    const targetDir = await mkRoot("prov-snapshot-target-");
    roots.push(targetDir);
    const repoRoot = process.cwd();

    const snapshot = await new NodeTemplateMirrorSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });
    const spec = snapshot.sourceFiles.find((file) => file.relativePath === "spec-boilerplate.md");
    const tasks = snapshot.sourceFiles.find(
      (file) => file.relativePath === "tasks-evidence-driven-boilerplate.md"
    );

    expect(spec).toMatchObject({ origin: "mirror" });
    expect(spec?.content).toBe(await read(repoRoot, ".specify/templates/spec-boilerplate.md"));
    expect(tasks).toMatchObject({ origin: "engine" });
    expect(tasks?.content).toBe(
      normalizeTemplateContent(
        await read(repoRoot, ".specify/templates/tasks-evidence-driven-boilerplate.md")
      )
    );
  });

  it("ProvisionWorkspace consome snapshot real sem IO escondido no snapshot", async () => {
    const repoRoot = await mkRoot("prov-snapshot-apply-repo-");
    const targetDir = await mkRoot("prov-snapshot-apply-target-");
    roots.push(repoRoot, targetDir);
    await writeRequiredTemplates(repoRoot);
    await writePrettierBaseline(repoRoot);
    await writeGitattributesBaseline(repoRoot);
    await writeCiTemplate(repoRoot);
    await write(targetDir, ".ai-guidelines/templates/spec-boilerplate.md", "# Local drift\n");

    const snapshot = await new NodeProvisioningSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });
    expect(await read(targetDir, ".ai-guidelines/templates/spec-boilerplate.md")).toBe(
      "# Local drift\n"
    );

    const effects = planProvisioningOperation(
      {
        targetDir,
        projectName: "consumer",
        config: {
          sdd_dir: ".ai-guidelines",
          providers: ["claude"],
          features: ["ci"],
          lang: "pt",
        },
        adapterRulesByName: { claude: "RULES-CLAUDE" },
      },
      snapshot,
      {
        operation: "adopt",
        force: false,
        forcePrettier: false,
        prune: false,
        install: false,
        providersRequested: false,
      }
    );
    const result = await new ProvisionWorkspace(
      new NodeProvisioningFileSystem(targetDir),
      false
    ).applyEffects(effects);

    expect(result.actions).toContain(
      "modo conservador: sem --force, o adopt adiciona ou mescla baseline sem sobrescrever arquivos existentes"
    );
    expect(result.actions).toContain("write AGENTS.md (ai-guidelines runtime updated)");
    expect(result.actions).toContain("write .ai-guidelines/templates/spec-boilerplate.md");
    expect(result.actions).toContain("write CLAUDE.md");
    expect(result.actions).toContain("write .gitattributes (baseline sync)");
    expect(result.actions).toContain("write .github/workflows/ai-guidelines-ci.yml (CI baseline)");
    expect(await read(targetDir, ".ai-guidelines/templates/spec-boilerplate.md")).toBe("# Spec\n");
    expect(await read(targetDir, ".github/workflows/ai-guidelines-ci.yml")).toContain(
      "npm run check"
    );
  });

  it("Guidance snapshot real coleta monorepo, formatter, git e gitattributes sem escrever", async () => {
    const repoRoot = await mkRoot("prov-guidance-repo-");
    const targetDir = await mkRoot("prov-guidance-target-");
    roots.push(repoRoot, targetDir);
    await writeGitattributesBaseline(repoRoot);
    await write(
      targetDir,
      "package.json",
      JSON.stringify({
        name: "demo",
        devDependencies: { prettier: "3.0.0" },
        scripts: { format: "biome format ." },
      })
    );
    await write(targetDir, "pnpm-workspace.yaml", "packages:\n  - packages/*\n");
    await write(targetDir, ".gitattributes", "*.bin binary\n");
    await fs.mkdir(path.join(targetDir, ".git"), { recursive: true });

    const snapshot = await new NodeGuidanceSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    expect(snapshot.monorepoContext).toEqual({
      detected: true,
      flavor: "pnpm",
      source: "pnpm-workspace.yaml",
    });
    expect(snapshot.formatterContext).toMatchObject({
      rival: { label: "Biome" },
      hasPrettier: true,
    });
    expect(snapshot.gitattributes).toEqual({
      content: "*.bin binary\n",
      baseline: "* text=auto eol=lf\n",
    });
    expect(snapshot.hasGitRepo).toBe(true);
    expect(await read(targetDir, ".gitattributes")).toBe("*.bin binary\n");
  });

  it("Prettier snapshot real lê package.json, ignore, baseline e formatter rival sem escrever", async () => {
    const repoRoot = await mkRoot("prov-prettier-repo-");
    const targetDir = await mkRoot("prov-prettier-target-");
    roots.push(repoRoot, targetDir);
    await writePrettierBaseline(repoRoot);
    await write(targetDir, "package.json", '{"name":"consumer"}\n');
    await write(targetDir, ".prettierignore", "coverage/\n");
    await write(targetDir, "biome.json", "{}\n");

    const snapshot = await new NodePrettierSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    expect(snapshot).toEqual({
      packageJson: { name: "consumer" },
      prettierIgnoreContent: "coverage/\n",
      prettierIgnoreBaseline: "dist/\nnode_modules/\n",
      formatterContext: {
        rival: { id: "biome", label: "Biome" },
        hasPrettier: true,
        shouldSkipPrettier: false,
      },
    });
    expect(await read(targetDir, ".prettierignore")).toBe("coverage/\n");
  });

  it("Husky snapshot real lê package manager e hooks existentes sem escrever", async () => {
    const targetDir = await mkRoot("prov-husky-target-");
    roots.push(targetDir);
    await write(targetDir, "package.json", '{"packageManager":"yarn@1.22.22"}\n');
    await write(targetDir, ".husky/pre-commit", "echo ok\n");

    const snapshot = await new NodeHuskySnapshotSource().collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    expect(snapshot.packageManager).toMatchObject({
      id: "yarn-classic",
      runner: "yarn",
    });
    expect(snapshot.hooks).toEqual([
      { name: "pre-commit", content: "echo ok\n" },
      { name: "pre-push", content: null },
    ]);
    expect(await read(targetDir, ".husky/pre-commit")).toBe("echo ok\n");
  });

  it("CI snapshot real lê template, package manager e workflow existente sem escrever", async () => {
    const repoRoot = await mkRoot("prov-ci-repo-");
    const targetDir = await mkRoot("prov-ci-target-");
    roots.push(repoRoot, targetDir);
    await writeCiTemplate(repoRoot);
    await write(targetDir, "package.json", '{"packageManager":"pnpm@9.0.0"}\n');
    await write(targetDir, ".github/workflows/ai-guidelines-ci.yml", "custom\n");

    const snapshot = await new NodeCiSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    expect(snapshot.packageManager).toMatchObject({ id: "pnpm", runner: "pnpm" });
    expect(snapshot.workflowTemplate).toContain("{{check_command}}");
    expect(snapshot.workflowContent).toBe("custom\n");
    expect(await read(targetDir, ".github/workflows/ai-guidelines-ci.yml")).toBe("custom\n");
  });

  it("Install snapshot real lê package manager e presença do release Yarn Berry sem escrever", async () => {
    const targetDir = await mkRoot("prov-install-target-");
    roots.push(targetDir);
    await write(targetDir, "package.json", '{"packageManager":"yarn@4.1.1"}\n');

    const missing = await new NodeInstallSnapshotSource().collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    expect(missing.packageManager).toMatchObject({ id: "yarn-berry" });
    expect(missing.yarnBerryReleaseExists).toBe(false);

    await write(targetDir, ".yarn/releases/yarn-4.1.1.cjs", "// yarn\n");
    const present = await new NodeInstallSnapshotSource().collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    expect(present.yarnBerryReleaseExists).toBe(true);
    expect(await read(targetDir, ".yarn/releases/yarn-4.1.1.cjs")).toBe("// yarn\n");
  });
});

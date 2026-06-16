import * as fs from "node:fs/promises";
import * as nodeFs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  planAgentsRuntimeBootstrap,
  planTemplateMirror,
} from "../../domain/provisioning/ProvisioningPlan.js";
import { normalizeTemplateContent } from "../../domain/provisioning/TemplateMirror.js";
import { ProvisionWorkspace } from "../../app/use-cases/ProvisionWorkspace.js";
import { NodeProvisioningFileSystem } from "./NodeProvisioningFileSystem.js";
import {
  NodeProvisioningSnapshotSource,
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
    await write(targetDir, ".ai-guidelines/templates/stale.md", "# Stale\n");

    const snapshot = await new NodeProvisioningSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });

    expect(snapshot.runtime.runtimeStub).toContain(
      "Consumer-local ai-guidelines assets live under `.ai-guidelines/`"
    );
    expect(snapshot.templates.sourceExists).toBe(true);
    expect(snapshot.templates.sourceFiles.map((file) => file.relativePath)).toEqual([
      "plan-boilerplate.md",
      "spec-boilerplate.md",
      "tasks-boilerplate.md",
    ]);
    expect(snapshot.templates.sourceFiles.every((file) => file.origin === "mirror")).toBe(true);
    expect(snapshot.templates.targetRelativePaths).toEqual(["stale.md"]);
    expect(await read(targetDir, ".ai-guidelines/templates/stale.md")).toBe("# Stale\n");
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
    await write(targetDir, ".ai-guidelines/templates/spec-boilerplate.md", "# Local drift\n");

    const snapshot = await new NodeProvisioningSnapshotSource(repoRoot).collect({
      targetDir,
      sddDir: ".ai-guidelines",
    });
    expect(await read(targetDir, ".ai-guidelines/templates/spec-boilerplate.md")).toBe(
      "# Local drift\n"
    );

    const effects = [
      planAgentsRuntimeBootstrap(snapshot.runtime.runtimeStub),
      ...planTemplateMirror(".ai-guidelines", snapshot.templates, { prune: false }),
    ];
    const result = await new ProvisionWorkspace(
      new NodeProvisioningFileSystem(targetDir),
      false
    ).applyEffects(effects);

    expect(result.actions).toContain("write AGENTS.md (ai-guidelines runtime updated)");
    expect(result.actions).toContain("write .ai-guidelines/templates/spec-boilerplate.md");
    expect(await read(targetDir, ".ai-guidelines/templates/spec-boilerplate.md")).toBe("# Spec\n");
  });
});

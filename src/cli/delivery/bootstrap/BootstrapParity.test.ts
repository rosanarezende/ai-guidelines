import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawn } from "node:child_process";
import { Prompts } from "../../../app/ports/Prompts.js";
import { InstallRequest, ProcessRunner } from "../../../app/ports/ProcessRunner.js";
import { ProvisionWorkspace } from "../../../app/use-cases/ProvisionWorkspace.js";
import { BudgetReport } from "../../../app/services/TokenBudget.js";
import { NodeProvisioningFileSystem } from "../../../infrastructure/filesystem/NodeProvisioningFileSystem.js";
import { NodeBootstrapDeliveryRuntime } from "./composition.js";
import { BootstrapDelivery, buildBootstrapDeliveryRegistry } from "./registry.js";
import { BootstrapWizard } from "./wizard.js";
import { CreateProvisionWorkspaceInput } from "./runtime.js";

type BootstrapMode = "init" | "adopt" | "providers" | "update" | "check-budget";
type LegacyRawOptions = Record<string, unknown>;

interface CapturedRun {
  readonly exitCode: number;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
  readonly error: Error | null;
}

interface WorkspacePair {
  readonly root: string;
  readonly legacy: string;
  readonly modern: string;
}

class FakeProcessRunner implements ProcessRunner {
  readonly installs: InstallRequest[] = [];
  readonly executablePaths: string[] = [];
  installError: Error | null = null;

  async runInstall(request: InstallRequest): Promise<void> {
    this.installs.push(request);
    if (this.installError) {
      throw this.installError;
    }
  }

  async markExecutable(absolutePath: string): Promise<void> {
    this.executablePaths.push(absolutePath);
  }
}

class ParityRuntime extends NodeBootstrapDeliveryRuntime {
  constructor(
    repoRoot: string,
    private readonly processRunner: FakeProcessRunner
  ) {
    super(repoRoot);
  }

  override createProvisionWorkspace(input: CreateProvisionWorkspaceInput): ProvisionWorkspace {
    return new ProvisionWorkspace(
      new NodeProvisioningFileSystem(input.targetDir),
      input.dryRun,
      this.processRunner
    );
  }
}

class ScriptedPrompts implements Prompts {
  readonly selectCalls: string[] = [];
  readonly inputCalls: string[] = [];
  readonly confirmCalls: string[] = [];

  constructor(
    private readonly answers: {
      readonly select?: Record<string, string>;
      readonly input?: Record<string, string>;
      readonly confirm?: Record<string, boolean>;
    }
  ) {}

  async select<T>(options: { message: string; choices: ReadonlyArray<{ value: T }> }): Promise<T> {
    this.selectCalls.push(options.message);
    const answer = this.answers.select?.[options.message];
    if (answer !== undefined) {
      return answer as T;
    }
    return options.choices[0].value;
  }

  async input(options: { message: string; default?: string }): Promise<string> {
    this.inputCalls.push(options.message);
    return this.answers.input?.[options.message] ?? options.default ?? "";
  }

  async confirm(options: { message: string; default?: boolean }): Promise<boolean> {
    this.confirmCalls.push(options.message);
    return this.answers.confirm?.[options.message] ?? options.default ?? false;
  }
}

const REPO_ROOT = path.resolve(".");
const ALL_FEATURES = "prettier,husky,ci,quality-gates,tdd,bdd";
const TEMP_ROOTS: string[] = [];

describe("bootstrap delivery parity with legacy runtime", () => {
  beforeAll(async () => {
    await assertCompiledRuntimeAvailable();
  });

  afterEach(async () => {
    await Promise.all(
      TEMP_ROOTS.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))
    );
  });

  it("init em target vazio gera arquivos, plano e guidance equivalentes", async () => {
    const pair = await createWorkspacePair();

    const legacy = await runLegacy("init", pair.legacy, {
      name: "consumer",
      providers: "claude,openai",
      features: ALL_FEATURES,
    });
    const modern = await runModern("init", pair.modern, [
      "--name",
      "consumer",
      "--providers",
      "claude,openai",
      "--features",
      ALL_FEATURES,
    ]);

    expectSuccessful(legacy);
    expectSuccessful(modern);
    await expectSameFiles(pair, [
      ".ai-guidelines/config.json",
      "AGENTS.md",
      "CLAUDE.md",
      ".claudeignore",
      ".openai/instructions.md",
      ".gptignore",
      ".gitattributes",
      ".github/workflows/ai-guidelines-ci.yml",
    ]);
    await expectSameTemplateSet(pair);
    expect(actionText(legacy)).toEqual(expect.arrayContaining(["write AGENTS.md"]));
    expect(actionText(modern)).toEqual(expect.arrayContaining(["write AGENTS.md"]));
    expect(readConfigFeatures(pair.modern)).resolves.toEqual([
      "prettier",
      "husky",
      "ci",
      "quality-gates",
      "tdd",
      "bdd",
    ]);
  });

  it("init --dry-run preserva filesystem e reporta acoes equivalentes", async () => {
    const pair = await createWorkspacePair();

    const legacy = await runLegacy("init", pair.legacy, {
      name: "consumer",
      providers: "claude,openai",
      features: ALL_FEATURES,
      "dry-run": true,
    });
    const modern = await runModern("init", pair.modern, [
      "--name",
      "consumer",
      "--providers",
      "claude,openai",
      "--features",
      ALL_FEATURES,
      "--dry-run",
    ]);

    expectSuccessful(legacy);
    expectSuccessful(modern);
    await expectDirectoryFiles(pair.legacy, []);
    await expectDirectoryFiles(pair.modern, []);
    expect(actionText(legacy)).toEqual(expect.arrayContaining(["[dry-run] write AGENTS.md"]));
    expect(actionText(modern)).toEqual(expect.arrayContaining(["[dry-run] write AGENTS.md"]));
  });

  it("init preserva o guard de conflito sem force e permite force", async () => {
    const blocked = await createWorkspacePair({ "AGENTS.md": "# local\n" });

    const legacyBlocked = await runLegacy("init", blocked.legacy, {
      name: "consumer",
      providers: "claude",
      features: ALL_FEATURES,
    });
    const modernBlocked = await runModern("init", blocked.modern, [
      "--name",
      "consumer",
      "--providers",
      "claude",
      "--features",
      ALL_FEATURES,
    ]);

    expect(legacyBlocked.exitCode).toBe(1);
    expect(modernBlocked.exitCode).toBe(1);
    expect(errorText(legacyBlocked)).toMatch(/arquivos já presentes|conflito/);
    expect(errorText(modernBlocked)).toMatch(/arquivos já presentes|conflito/);

    const forced = await createWorkspacePair({ "AGENTS.md": "# local\n" });
    const legacyForced = await runLegacy("init", forced.legacy, {
      name: "consumer",
      providers: "claude",
      features: ALL_FEATURES,
      force: true,
    });
    const modernForced = await runModern("init", forced.modern, [
      "--name",
      "consumer",
      "--providers",
      "claude",
      "--features",
      ALL_FEATURES,
      "--force",
    ]);

    expectSuccessful(legacyForced);
    expectSuccessful(modernForced);
    await expectSameFiles(forced, ["AGENTS.md", "CLAUDE.md", ".ai-guidelines/config.json"]);
    await expectFileContains(forced.modern, "AGENTS.md", ["# local", "<AI_GUIDELINES>"]);
  });

  it("adopt preserva conteudo existente, aplica providers e features opt-in", async () => {
    const pair = await createWorkspacePair({
      "package.json": JSON.stringify({ name: "consumer", scripts: { test: "node --test" } }),
      "CLAUDE.md": "# Consumer Claude notes\n",
    });

    const legacy = await runLegacy("adopt", pair.legacy, {
      name: "consumer",
      providers: "claude,openai",
      features: "prettier,husky,ci",
      "package-manager": "npm",
    });
    const modern = await runModern("adopt", pair.modern, [
      "--name",
      "consumer",
      "--providers",
      "claude,openai",
      "--features",
      "prettier,husky,ci",
      "--package-manager",
      "npm",
    ]);

    expectSuccessful(legacy);
    expectSuccessful(modern);
    await expectSameFiles(pair, [
      ".ai-guidelines/config.json",
      "CLAUDE.md",
      ".openai/instructions.md",
      "AGENTS.md",
      ".prettierignore",
      "package.json",
      ".husky/pre-commit",
      ".github/workflows/ai-guidelines-ci.yml",
    ]);
    await expectFileContains(pair.modern, "CLAUDE.md", [
      "# Consumer Claude notes",
      "ai-guidelines:managed-start",
    ]);
    expect(modern.processRunner.executablePaths.map(normalizePath)).toEqual(
      expect.arrayContaining([expect.stringContaining(".husky/pre-commit")])
    );
  });

  it("adopt dry-run com install nao executa processo e documenta install explícito no novo plano", async () => {
    const pair = await createWorkspacePair({
      "package.json": JSON.stringify({ name: "consumer" }),
    });

    const legacy = await runLegacy("adopt", pair.legacy, {
      name: "consumer",
      providers: "claude",
      features: "prettier,husky",
      "package-manager": "npm",
      install: true,
      "dry-run": true,
    });
    const modern = await runModern("adopt", pair.modern, [
      "--name",
      "consumer",
      "--providers",
      "claude",
      "--features",
      "prettier,husky",
      "--package-manager",
      "npm",
      "--install",
      "--dry-run",
    ]);

    expectSuccessful(legacy);
    expectSuccessful(modern);
    expect(actionText(legacy)).not.toEqual(expect.arrayContaining(["[dry-run] install"]));
    expect(actionText(modern)).toEqual(expect.arrayContaining(["[dry-run] install"]));
    expect(modern.processRunner.installs).toEqual([]);
    await expectDirectoryFiles(pair.legacy, ["package.json"]);
    await expectDirectoryFiles(pair.modern, ["package.json"]);
  });

  it("adopt classifica formatter rival e documenta monorepo como diferença intencional", async () => {
    const pair = await createWorkspacePair({
      "package.json": JSON.stringify({ name: "consumer", workspaces: ["packages/*"] }),
      "biome.json": "{}\n",
    });

    const legacy = await runLegacy("adopt", pair.legacy, {
      name: "consumer",
      providers: "claude",
      features: "prettier",
      "package-manager": "npm",
    });
    const modern = await runModern("adopt", pair.modern, [
      "--name",
      "consumer",
      "--providers",
      "claude",
      "--features",
      "prettier",
      "--package-manager",
      "npm",
    ]);

    expectSuccessful(legacy);
    expectSuccessful(modern);
    expect(joinedActions(legacy)).not.toContain("monorepo detectado");
    expect(joinedActions(modern)).toContain("estrutura de monorepo detectada");
    expect(joinedActions(legacy)).toContain("formatter rival detectado");
    expect(joinedActions(modern)).toContain("formatter rival detectado");
    expect(joinedActions(modern)).toContain("skip prettier");
  });

  it("adopt --prune remove entrypoint gerenciado obsoleto como o legado", async () => {
    const staleGemini = [
      "<!-- ai-guidelines:managed-start v=1 -->",
      "stale managed block",
      "<!-- ai-guidelines:managed-end -->",
      "",
    ].join("\n");
    const pair = await createWorkspacePair({
      "package.json": JSON.stringify({ name: "consumer" }),
      "GEMINI.md": staleGemini,
    });

    const legacy = await runLegacy("adopt", pair.legacy, {
      name: "consumer",
      providers: "claude",
      features: "prettier",
      prune: true,
    });
    const modern = await runModern("adopt", pair.modern, [
      "--name",
      "consumer",
      "--providers",
      "claude",
      "--features",
      "prettier",
      "--prune",
    ]);

    expectSuccessful(legacy);
    expectSuccessful(modern);
    await expectSameFiles(pair, ["CLAUDE.md", ".ai-guidelines/config.json"]);
    await expectMissing(pair.legacy, "GEMINI.md");
    await expectMissing(pair.modern, "GEMINI.md");
  });

  it("update reusa config existente e reespelha runtime/templates sem efeitos de infra ocultos", async () => {
    const pair = await createWorkspacePair({
      "package.json": JSON.stringify({ name: "consumer" }),
      ".ai-guidelines/config.json": JSON.stringify({
        sdd_dir: ".ai-guidelines",
        providers: ["claude", "gemini", "openai"],
        features: ["prettier", "husky", "ci", "quality-gates", "tdd", "bdd"],
        lang: "pt",
      }),
    });

    const legacy = await runLegacy("update", pair.legacy, { target: pair.legacy });
    const modern = await runModern("update", pair.modern, []);

    expectSuccessful(legacy);
    expectSuccessful(modern);
    await expectSameFiles(pair, [
      ".ai-guidelines/config.json",
      "CLAUDE.md",
      ".openai/instructions.md",
      "AGENTS.md",
    ]);
    await expectSameTemplateSet(pair);
    await expectMissing(pair.legacy, ".prettierignore");
    await expectMissing(pair.modern, ".prettierignore");
    await expectMissing(pair.legacy, ".husky/pre-commit");
    await expectMissing(pair.modern, ".husky/pre-commit");
    await expectMissing(pair.legacy, ".github/workflows/ai-guidelines-ci.yml");
    await expectMissing(pair.modern, ".github/workflows/ai-guidelines-ci.yml");
  });

  it("legacy providers equivale ao novo update --providers e providers novo falha orientando update", async () => {
    const pair = await createWorkspacePair({
      ".ai-guidelines/config.json": JSON.stringify({
        sdd_dir: ".ai-guidelines",
        providers: ["gemini"],
        features: [],
        lang: "pt",
      }),
    });

    const legacy = await runLegacy("providers", pair.legacy, {
      providers: "claude,openai",
    });
    const modern = await runModern("update", pair.modern, ["--providers", "claude,openai"]);

    expectSuccessful(legacy);
    expectSuccessful(modern);
    await expectSameFiles(pair, [
      ".ai-guidelines/config.json",
      "GEMINI.md",
      "CLAUDE.md",
      ".openai/instructions.md",
    ]);
    await expectConfigProviders(pair.modern, ["gemini", "claude", "openai"]);

    const rejected = await runModern("providers", pair.modern, ["--providers", "claude"]);
    expect(rejected.exitCode).toBe(1);
    expect(errorText(rejected)).toContain("Use: guidelines update --providers <lista>");
  });

  it("check-budget preserva exit essencial e usa o servico TypeScript no delivery novo", async () => {
    const legacy = await runLegacy("check-budget", REPO_ROOT, {});
    const modern = await runModern("check-budget", REPO_ROOT, []);

    expectSuccessful(legacy);
    expectSuccessful(modern);
    expect(joinedOutput(legacy)).toContain("Token budget report");
    expect(joinedOutput(modern)).toContain("Token budget report");

    const failedRuntime = new ThrowingBudgetRuntime(REPO_ROOT, new FakeProcessRunner());
    const registry = buildBootstrapDeliveryRegistry(failedRuntime);
    const result = await captureModernDispatch(
      new BootstrapDelivery(registry, new BootstrapWizard(registry)),
      ["check-budget"],
      REPO_ROOT
    );
    expect(result.exitCode).toBe(1);
    expect(errorText(result)).toContain("budget unavailable");
  });

  it("wizard novo cobre init/adopt/update e documenta a diferenca intencional de providers", async () => {
    const pair = await createWorkspacePair({
      ".ai-guidelines/config.json": JSON.stringify({
        sdd_dir: ".ai-guidelines",
        providers: ["claude"],
        features: [],
        lang: "pt",
      }),
    });
    const update = await runModern(
      [],
      pair.modern,
      [],
      new ScriptedPrompts({
        select: { Operation: "update" },
        input: { Providers: "claude,openai" },
        confirm: { "Dry-run": true },
      })
    );

    expectSuccessful(update);
    expect(joinedActions(update)).toContain("modo update --providers");
    expect(joinedActions(update)).toContain("[dry-run] write .openai/instructions.md");
    expect(update.prompts?.selectCalls).toContain("Operation");

    const registry = buildBootstrapDeliveryRegistry(
      new ParityRuntime(REPO_ROOT, new FakeProcessRunner())
    );
    const wizard = new BootstrapWizard(registry);
    expect(wizard.listOperationNames()).toEqual(["adopt", "init", "update"]);
    expect(wizard.listOperationNames()).not.toContain("providers");
  });
});

class ThrowingBudgetRuntime extends ParityRuntime {
  override async runCheckBudget(): Promise<{ report: BudgetReport; exitCode: number }> {
    throw new Error("budget unavailable");
  }
}

async function assertCompiledRuntimeAvailable(): Promise<void> {
  try {
    await fs.access(path.join(REPO_ROOT, "dist", "app", "services", "AgentsRuntimeBootstrap.js"));
  } catch {
    throw new Error("Bootstrap parity tests require compiled dist/. Run `npm run build` first.");
  }
}

async function createWorkspacePair(seed: Record<string, string> = {}): Promise<WorkspacePair> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-guidelines-parity-"));
  TEMP_ROOTS.push(root);
  const pair = {
    root,
    legacy: path.join(root, "legacy"),
    modern: path.join(root, "modern"),
  };
  await fs.mkdir(pair.legacy, { recursive: true });
  await fs.mkdir(pair.modern, { recursive: true });
  await writeSeed(pair.legacy, seed);
  await writeSeed(pair.modern, seed);
  return pair;
}

async function writeSeed(root: string, seed: Record<string, string>): Promise<void> {
  for (const [relPath, content] of Object.entries(seed)) {
    const absolutePath = resolveRel(root, relPath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, content, "utf8");
  }
}

async function runLegacy(
  mode: BootstrapMode,
  targetDir: string,
  rawOptions: LegacyRawOptions
): Promise<CapturedRun> {
  const effectiveOptions = { ...rawOptions, target: rawOptions.target ?? targetDir };
  return runLegacyProcess([mode, ...rawOptionsToArgv(effectiveOptions)]);
}

async function runLegacyProcess(argv: readonly string[]): Promise<CapturedRun> {
  return new Promise<CapturedRun>((resolve) => {
    const child = spawn(
      process.execPath,
      ["--experimental-default-config-file", "cli/ai-guidelines-cli.mjs", ...argv],
      { cwd: REPO_ROOT, env: { ...process.env, NODE_NO_WARNINGS: "1" }, shell: false }
    );
    const stdout: string[] = [];
    const stderr: string[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk.toString("utf8")));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk.toString("utf8")));
    child.on("error", (error) => {
      resolve({ exitCode: 1, stdout, stderr, error });
    });
    child.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr, error: null });
    });
  });
}

function rawOptionsToArgv(options: LegacyRawOptions): string[] {
  const argv: string[] = [];
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null || value === false) {
      continue;
    }
    const flag = `--${key}`;
    if (value === true) {
      argv.push(flag);
      continue;
    }
    const serialized = Array.isArray(value) ? value.join(",") : String(value);
    argv.push(flag, serialized);
  }
  return argv;
}

async function runModern(
  commandOrArgv: BootstrapMode | readonly string[],
  targetDir: string,
  argv: readonly string[],
  prompts?: ScriptedPrompts
): Promise<
  CapturedRun & { readonly processRunner: FakeProcessRunner; readonly prompts?: ScriptedPrompts }
> {
  const processRunner = new FakeProcessRunner();
  const runtime = new ParityRuntime(REPO_ROOT, processRunner);
  const registry = buildBootstrapDeliveryRegistry(runtime);
  const delivery = new BootstrapDelivery(registry, new BootstrapWizard(registry));
  const dispatchArgv = Array.isArray(commandOrArgv) ? commandOrArgv : [commandOrArgv, ...argv];
  const captured = await captureModernDispatch(delivery, dispatchArgv, targetDir, prompts);
  return { ...captured, processRunner, ...(prompts ? { prompts } : {}) };
}

async function captureModernDispatch(
  delivery: BootstrapDelivery,
  argv: readonly string[],
  targetDir: string,
  prompts?: ScriptedPrompts
): Promise<CapturedRun> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const result = await delivery.dispatch(argv, {
    repoRoot: targetDir,
    logger: {
      info: (message) => stdout.push(message),
      error: (message) => stderr.push(message),
    },
    ...(prompts ? { prompts } : {}),
  });
  return { exitCode: result.exitCode, stdout, stderr, error: null };
}

function expectSuccessful(result: CapturedRun): void {
  expect(errorText(result)).toBe("");
  expect(result.exitCode).toBe(0);
}

async function expectSameFiles(pair: WorkspacePair, relPaths: readonly string[]): Promise<void> {
  for (const relPath of relPaths) {
    await expect(readText(pair.modern, relPath)).resolves.toBe(
      await readText(pair.legacy, relPath)
    );
  }
}

async function expectSameTemplateSet(pair: WorkspacePair): Promise<void> {
  const legacyTemplates = (
    await listFiles(path.join(pair.legacy, ".ai-guidelines", "templates"))
  ).sort();
  const modernTemplates = (
    await listFiles(path.join(pair.modern, ".ai-guidelines", "templates"))
  ).sort();
  expect(modernTemplates).toEqual(legacyTemplates);
}

async function expectDirectoryFiles(root: string, expected: readonly string[]): Promise<void> {
  await expect(listFiles(root)).resolves.toEqual([...expected].sort());
}

async function expectMissing(root: string, relPath: string): Promise<void> {
  await expect(exists(root, relPath)).resolves.toBe(false);
}

async function expectFileContains(
  root: string,
  relPath: string,
  fragments: readonly string[]
): Promise<void> {
  const content = await readText(root, relPath);
  for (const fragment of fragments) {
    expect(content).toContain(fragment);
  }
}

async function expectConfigProviders(root: string, providers: readonly string[]): Promise<void> {
  const config = JSON.parse(await readText(root, ".ai-guidelines/config.json")) as {
    providers: readonly string[];
  };
  expect(config.providers).toEqual(providers);
}

async function readConfigFeatures(root: string): Promise<readonly string[]> {
  const config = JSON.parse(await readText(root, ".ai-guidelines/config.json")) as {
    features: readonly string[];
  };
  return config.features;
}

async function listFiles(root: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const absolutePath = path.join(root, entry.name);
        if (entry.isDirectory()) {
          return (await listFiles(absolutePath)).map((relPath) => `${entry.name}/${relPath}`);
        }
        return [entry.name];
      })
    );
    return files.flat().sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function exists(root: string, relPath: string): Promise<boolean> {
  try {
    await fs.access(resolveRel(root, relPath));
    return true;
  } catch {
    return false;
  }
}

async function readText(root: string, relPath: string): Promise<string> {
  return normalizeContent(await fs.readFile(resolveRel(root, relPath), "utf8"));
}

function resolveRel(root: string, relPath: string): string {
  return path.join(root, ...relPath.split("/"));
}

function actionText(result: CapturedRun): readonly string[] {
  const lines = [...result.stdout, ...result.stderr];
  const actions: string[] = [];
  let insideActions = false;

  for (const rawLine of lines.flatMap((line) => line.split(/\r?\n/))) {
    const line = normalizeActionLine(rawLine);
    if (shouldIgnoreOutputLine(line)) {
      continue;
    }
    if (line === "Ações:") {
      insideActions = true;
      continue;
    }
    if (line.startsWith("- ")) {
      actions.push(canonicalAction(line.slice(2)));
      continue;
    }
    if (insideActions || isModernActionLine(line)) {
      actions.push(canonicalAction(line));
    }
  }

  return actions;
}

function shouldIgnoreOutputLine(line: string): boolean {
  return (
    line.trim() === "" ||
    line.startsWith("Modo:") ||
    line.startsWith("Target:") ||
    line.startsWith("Package manager:") ||
    line.startsWith("Nenhuma mudança necessária") ||
    line.startsWith("(node:") ||
    line.includes("ExperimentalWarning")
  );
}

function isModernActionLine(line: string): boolean {
  return (
    line.includes("write ") ||
    line.includes("sync templates") ||
    line.includes("skip ") ||
    line.includes("modo ") ||
    line.includes("monorepo ") ||
    line.includes("formatter ") ||
    line.includes("install ") ||
    line.includes("prune ") ||
    line.includes("mark executable")
  );
}

function joinedActions(result: CapturedRun): string {
  return actionText(result).join("\n");
}

function joinedOutput(result: CapturedRun): string {
  return [...result.stdout, ...result.stderr].join("\n");
}

function errorText(result: CapturedRun): string {
  return [result.error?.message ?? "", ...result.stderr].filter(Boolean).join("\n");
}

function canonicalAction(line: string): string {
  const normalized = normalizeActionLine(line);
  if (normalized.includes("install ")) {
    return normalized.includes("[dry-run]") ? "[dry-run] install" : "install";
  }
  if (normalized.includes("write AGENTS.md")) {
    return normalized.includes("[dry-run]") ? "[dry-run] write AGENTS.md" : "write AGENTS.md";
  }
  return normalized;
}

function normalizeActionLine(line: string): string {
  return normalizePath(line)
    .replace(/((?:\[dry-run\] )?(?:write|prune) )[^ ]*?\.ai-guidelines\//, "$1.ai-guidelines/")
    .replace(/((?:\[dry-run\] )?(?:write|prune) )[^ ]*?\.github\//, "$1.github/")
    .replace(/((?:\[dry-run\] )?(?:write|prune) )[^ ]*?\.husky\//, "$1.husky/")
    .trim();
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function normalizeContent(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

import * as os from "node:os";
import * as nodeFs from "node:fs/promises";
import * as path from "node:path";
import { ProvisioningFileSystem } from "../ports/ProvisioningFileSystem.js";
import {
  guidanceEffects,
  planAgentsRuntimeBootstrap,
  planGitattributes,
  planHusky,
  planInitGuard,
  planPrettier,
  planTemplateMirror,
  HuskySnapshot,
  PointersConfig,
  PrettierSnapshot,
} from "../../domain/provisioning/ProvisioningPlan.js";
import { ProcessRunner } from "../ports/ProcessRunner.js";
import { NodeProvisioningFileSystem } from "../../infrastructure/filesystem/NodeProvisioningFileSystem.js";
import { buildAgentsRuntimeStub } from "../services/AgentsRuntimeBootstrap.js";
import { ProvisionWorkspace, ProvisionWorkspaceInput } from "./ProvisionWorkspace.js";

/** Filesystem em memória — fake do port (padrão DDD da casa). */
class InMemoryFs implements ProvisioningFileSystem {
  readonly files = new Map<string, string>();

  async readText(relPath: string): Promise<string | null> {
    return this.files.has(relPath) ? (this.files.get(relPath) as string) : null;
  }
  async writeText(relPath: string, content: string): Promise<void> {
    this.files.set(relPath, content);
  }
  async exists(relPath: string): Promise<boolean> {
    return this.files.has(relPath);
  }
  async ensureDir(): Promise<void> {
    // diretórios são implícitos no fake
  }
  async remove(relPath: string): Promise<void> {
    this.files.delete(relPath);
  }
  resolvePath(relPath: string): string {
    return `C:/fake-target/${relPath}`;
  }
}

class SpyProcessRunner implements ProcessRunner {
  readonly markedExecutable: string[] = [];
  async runInstall(): Promise<void> {
    throw new Error("not used");
  }
  async markExecutable(absolutePath: string): Promise<void> {
    this.markedExecutable.push(absolutePath);
  }
}

const config: PointersConfig = {
  sdd_dir: ".ai-guidelines",
  providers: ["claude"],
  features: ["tdd"],
  lang: "pt",
};

const input: ProvisionWorkspaceInput = {
  config,
  adapterRulesByName: { claude: "RULES-CLAUDE" },
  force: false,
  prune: false,
};

describe("app/use-cases/ProvisionWorkspace (plano puro → aplicação via port)", () => {
  it("DADO consumidor pristino QUANDO execute ENTÃO escreve config + entrypoints com bloco gerenciado", async () => {
    const fs = new InMemoryFs();
    const result = await new ProvisionWorkspace(fs, false).execute(input);

    expect(result.idempotentNoop).toBe(false);
    expect(result.actions).toContain("write .ai-guidelines/config.json");
    expect(result.actions).toContain("write CLAUDE.md");
    expect(result.actions).toContain("write .claudeignore");

    const claudeMd = fs.files.get("CLAUDE.md") as string;
    expect(claudeMd).toContain("ai-guidelines:managed-start");
    expect(claudeMd).toContain("# SYSTEM DIRECTIVE: HARD REDIRECT");
    expect(claudeMd).toContain("RULES-CLAUDE");

    const cfg = JSON.parse(fs.files.get(".ai-guidelines/config.json") as string);
    expect(cfg).toEqual({
      sdd_dir: ".ai-guidelines",
      providers: ["claude"],
      features: ["tdd"],
      lang: "pt",
    });
  });

  it("DADO segunda execução idêntica ENTÃO é idempotente (no-op, sem ações)", async () => {
    const fs = new InMemoryFs();
    const uc = new ProvisionWorkspace(fs, false);
    await uc.execute(input);
    const second = await uc.execute(input);
    expect(second.idempotentNoop).toBe(true);
    expect(second.actions).toEqual([]);
  });

  it("DADO dry-run ENTÃO não escreve nada e prefixa as ações", async () => {
    const fs = new InMemoryFs();
    const result = await new ProvisionWorkspace(fs, true).execute(input);
    expect(fs.files.size).toBe(0);
    expect(result.actions.every((a) => a.startsWith("[dry-run] "))).toBe(true);
  });

  it("DADO cursor QUANDO cria .mdc ENTÃO injeta o frontmatter YAML no topo", async () => {
    const fs = new InMemoryFs();
    await new ProvisionWorkspace(fs, false).execute({
      ...input,
      config: { ...config, providers: ["cursor"] },
    });
    const mdc = fs.files.get(".cursor/rules/ai-guidelines.mdc") as string;
    expect(mdc.startsWith("---\ndescription: ai-guidelines hard redirect")).toBe(true);
    expect(mdc).toContain("ai-guidelines:managed-start");
  });

  it("DADO prune ENTÃO remove entrypoint de provider desmarcado já presente", async () => {
    const fs = new InMemoryFs();
    fs.files.set("GEMINI.md", "stale gemini entrypoint");
    const result = await new ProvisionWorkspace(fs, false).execute({ ...input, prune: true });
    expect(result.actions).toContain("prune GEMINI.md");
    expect(fs.files.has("GEMINI.md")).toBe(false);
    // o provider selecionado segue presente
    expect(fs.files.has("CLAUDE.md")).toBe(true);
  });

  it("DADO arquivo legado sem marcadores QUANDO aplica ENTÃO preserva o legado (legacy-prepended)", async () => {
    const fs = new InMemoryFs();
    fs.files.set("CLAUDE.md", "minhas regras locais antigas\n");
    const result = await new ProvisionWorkspace(fs, false).execute(input);
    expect(
      result.actions.some((a) => a.includes("prepend managed block to existing CLAUDE.md"))
    ).toBe(true);
    expect(fs.files.get("CLAUDE.md")).toContain("minhas regras locais antigas");
  });
});

const BASELINE = "* text=auto eol=lf\n*.png binary\n";

describe("app/use-cases/ProvisionWorkspace — efeitos estruturais 2b-1 (fake fs)", () => {
  it("merge-gitattributes: consumidor pristino ESCREVE o baseline com action de sync", async () => {
    const fs = new InMemoryFs();
    const result = await new ProvisionWorkspace(fs, false).applyEffects([
      planGitattributes(BASELINE),
    ]);
    expect(result.actions).toEqual(["write .gitattributes (baseline sync)"]);
    expect(fs.files.get(".gitattributes")).toBe(BASELINE);
  });

  it("merge-gitattributes: segunda aplicação é idempotente (no-op)", async () => {
    const fs = new InMemoryFs();
    const uc = new ProvisionWorkspace(fs, false);
    await uc.applyEffects([planGitattributes(BASELINE)]);
    const second = await uc.applyEffects([planGitattributes(BASELINE)]);
    expect(second.idempotentNoop).toBe(true);
    expect(second.actions).toEqual([]);
  });

  it("merge-gitattributes: conflito — .gitattributes parcial é mesclado NÃO-destrutivamente", async () => {
    const fs = new InMemoryFs();
    fs.files.set(".gitattributes", "*.bin binary\n");
    await new ProvisionWorkspace(fs, false).applyEffects([planGitattributes(BASELINE)]);
    const merged = fs.files.get(".gitattributes") as string;
    expect(merged).toContain("*.bin binary"); // conteúdo do consumidor preservado
    expect(merged).toContain("* text=auto eol=lf"); // baseline anexado
    expect(merged).toContain("# ai-guidelines baseline");
  });

  it("merge-gitattributes: dry-run não escreve e prefixa a action", async () => {
    const fs = new InMemoryFs();
    const result = await new ProvisionWorkspace(fs, true).applyEffects([
      planGitattributes(BASELINE),
    ]);
    expect(fs.files.has(".gitattributes")).toBe(false);
    expect(result.actions).toEqual(["[dry-run] write .gitattributes (baseline sync)"]);
  });

  it("assert-init-safe: lança quando há conflito sem force; ok com force", async () => {
    const fs = new InMemoryFs();
    const uc = new ProvisionWorkspace(fs, false);
    await expect(uc.applyEffects([planInitGuard(["AGENTS.md"], false)])).rejects.toThrow(
      /já presentes/
    );
    await expect(uc.applyEffects([planInitGuard(["AGENTS.md"], true)])).resolves.toMatchObject({
      idempotentNoop: true,
    });
  });

  it("guidance: efeito repassa a mensagem ao log sem tocar no filesystem", async () => {
    const fs = new InMemoryFs();
    const result = await new ProvisionWorkspace(fs, false).applyEffects(
      guidanceEffects(["modo conservador: ..."])
    );
    expect(result.actions).toEqual(["modo conservador: ..."]);
    expect(fs.files.size).toBe(0);
  });
});

describe("app/use-cases/ProvisionWorkspace — merge-gitattributes (temp fs real)", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await nodeFs.mkdtemp(path.join(os.tmpdir(), "prov-ga-"));
  });
  afterEach(async () => {
    await nodeFs.rm(dir, { recursive: true, force: true });
  });

  it("escreve .gitattributes real e relê o conteúdo mesclado", async () => {
    const fs = new NodeProvisioningFileSystem(dir);
    await new ProvisionWorkspace(fs, false).applyEffects([planGitattributes(BASELINE)]);
    const onDisk = await nodeFs.readFile(path.join(dir, ".gitattributes"), "utf8");
    expect(onDisk).toBe(BASELINE);
    // idempotência no fs real
    const again = await new ProvisionWorkspace(fs, false).applyEffects([
      planGitattributes(BASELINE),
    ]);
    expect(again.idempotentNoop).toBe(true);
  });
});

const RUNTIME_STUB = buildAgentsRuntimeStub(".ai-guidelines");
const SPEC_TEMPLATE_V2 = "<!-- ai-guidelines-template: spec-boilerplate v=2 -->\n\n# Spec\n";
const TASKS_TEMPLATE = "# Tasks\n";

describe("app/use-cases/ProvisionWorkspace — AGENTS/runtime bootstrap (2b-2)", () => {
  it("fake fs: cria AGENTS.md com bootstrap runtime e preserva idempotência", async () => {
    const fs = new InMemoryFs();
    const uc = new ProvisionWorkspace(fs, false);

    const first = await uc.applyEffects([planAgentsRuntimeBootstrap(RUNTIME_STUB)]);
    expect(first.actions).toEqual(["write AGENTS.md (ai-guidelines runtime updated)"]);
    expect(fs.files.get("AGENTS.md")).toContain("<AI_GUIDELINES>");
    expect(fs.files.get("AGENTS.md")).toContain("## Runtime Bootstrap");

    const second = await uc.applyEffects([planAgentsRuntimeBootstrap(RUNTIME_STUB)]);
    expect(second.idempotentNoop).toBe(true);
    expect(second.actions).toEqual([]);
  });

  it("fake fs: preserva conteúdo local fora do bloco governado", async () => {
    const fs = new InMemoryFs();
    fs.files.set("AGENTS.md", "# Projeto\n\n## Local\n\nRegra local.\n");

    await new ProvisionWorkspace(fs, false).applyEffects([
      planAgentsRuntimeBootstrap(RUNTIME_STUB),
    ]);

    const content = fs.files.get("AGENTS.md") as string;
    expect(content).toContain("Regra local.");
    expect(content).toContain("<AI_GUIDELINES>");
  });

  it("fake fs: dry-run não escreve AGENTS.md", async () => {
    const fs = new InMemoryFs();
    const result = await new ProvisionWorkspace(fs, true).applyEffects([
      planAgentsRuntimeBootstrap(RUNTIME_STUB),
    ]);

    expect(result.actions).toEqual(["[dry-run] write AGENTS.md (ai-guidelines runtime updated)"]);
    expect(fs.files.has("AGENTS.md")).toBe(false);
  });

  it("conflict: aborta quando o bloco AI_GUIDELINES está malformado", async () => {
    const fs = new InMemoryFs();
    fs.files.set("AGENTS.md", "# Projeto\n\n<AI_GUIDELINES>\n");

    await expect(
      new ProvisionWorkspace(fs, false).applyEffects([planAgentsRuntimeBootstrap(RUNTIME_STUB)])
    ).rejects.toThrow(/AI_GUIDELINES/);
  });

  it("equivalência: migra o bloco core legado e preserva conteúdo local", async () => {
    const fs = new InMemoryFs();
    const current = [
      "# AGENTS.md",
      "",
      "<!-- BEGIN:ai-guidelines-core -->",
      "ponteiro antigo",
      "<!-- END:ai-guidelines-core -->",
      "",
      "Regra local.",
      "",
    ].join("\n");
    fs.files.set("AGENTS.md", current);

    await new ProvisionWorkspace(fs, false).applyEffects([
      planAgentsRuntimeBootstrap(RUNTIME_STUB),
    ]);

    const content = fs.files.get("AGENTS.md") as string;
    expect(content).toContain("Regra local.");
    expect(content).toContain("<AI_GUIDELINES>");
    expect(content).not.toContain("ponteiro antigo");
    expect(content).not.toContain("BEGIN:ai-guidelines-core");
  });
});

describe("app/use-cases/ProvisionWorkspace — template mirror (2b-2)", () => {
  it("fake fs: aplica sync, mirror, engine-tag, prune e idempotência", async () => {
    const fs = new InMemoryFs();
    fs.files.set(
      ".ai-guidelines/templates/spec-boilerplate.md",
      "<!-- ai-guidelines-template: spec-boilerplate v=1 -->\n\n# Antigo\n"
    );
    fs.files.set(".ai-guidelines/templates/stale.md", "# Stale\n");
    const effects = planTemplateMirror(
      ".ai-guidelines",
      {
        sourceExists: true,
        sourceFiles: [
          {
            relativePath: "spec-boilerplate.md",
            content: SPEC_TEMPLATE_V2,
            origin: "mirror",
          },
          {
            relativePath: "tasks-boilerplate.md",
            content: TASKS_TEMPLATE,
            origin: "engine",
          },
        ],
        targetRelativePaths: ["spec-boilerplate.md", "stale.md"],
      },
      { prune: true }
    );
    const uc = new ProvisionWorkspace(fs, false);

    const first = await uc.applyEffects(effects);

    expect(first.actions).toEqual([
      "sync templates -> target",
      "write .ai-guidelines/templates/spec-boilerplate.md (template v=1 -> v=2)",
      "write .ai-guidelines/templates/tasks-boilerplate.md [engine]",
      "prune .ai-guidelines/templates/stale.md",
    ]);
    expect(fs.files.get(".ai-guidelines/templates/spec-boilerplate.md")).toBe(SPEC_TEMPLATE_V2);
    expect(fs.files.get(".ai-guidelines/templates/tasks-boilerplate.md")).toBe(TASKS_TEMPLATE);
    expect(fs.files.has(".ai-guidelines/templates/stale.md")).toBe(false);

    const second = await uc.applyEffects(
      planTemplateMirror(
        ".ai-guidelines",
        {
          sourceExists: true,
          sourceFiles: [
            { relativePath: "spec-boilerplate.md", content: SPEC_TEMPLATE_V2, origin: "mirror" },
            { relativePath: "tasks-boilerplate.md", content: TASKS_TEMPLATE, origin: "engine" },
          ],
          targetRelativePaths: ["spec-boilerplate.md", "tasks-boilerplate.md"],
        },
        { prune: true }
      )
    );
    expect(second.actions).toEqual(["sync templates -> target"]);
  });

  it("fake fs: dry-run registra ações sem escrever templates nem podar", async () => {
    const fs = new InMemoryFs();
    fs.files.set(".ai-guidelines/templates/stale.md", "# Stale\n");
    const result = await new ProvisionWorkspace(fs, true).applyEffects(
      planTemplateMirror(
        ".ai-guidelines",
        {
          sourceExists: true,
          sourceFiles: [
            { relativePath: "spec-boilerplate.md", content: SPEC_TEMPLATE_V2, origin: "mirror" },
          ],
          targetRelativePaths: ["stale.md"],
        },
        { prune: true }
      )
    );

    expect(result.actions).toEqual([
      "sync templates -> target",
      "[dry-run] write .ai-guidelines/templates/spec-boilerplate.md (template v=2)",
      "[dry-run] prune .ai-guidelines/templates/stale.md",
    ]);
    expect(fs.files.has(".ai-guidelines/templates/spec-boilerplate.md")).toBe(false);
    expect(fs.files.has(".ai-guidelines/templates/stale.md")).toBe(true);
  });
});

describe("app/use-cases/ProvisionWorkspace — AGENTS/runtime + templates (temp fs real)", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await nodeFs.mkdtemp(path.join(os.tmpdir(), "prov-rt-"));
  });
  afterEach(async () => {
    await nodeFs.rm(dir, { recursive: true, force: true });
  });

  it("aplica AGENTS.md e template mirror em filesystem real", async () => {
    const fs = new NodeProvisioningFileSystem(dir);
    const effects = [
      planAgentsRuntimeBootstrap(RUNTIME_STUB),
      ...planTemplateMirror(
        ".ai-guidelines",
        {
          sourceExists: true,
          sourceFiles: [
            { relativePath: "spec-boilerplate.md", content: SPEC_TEMPLATE_V2, origin: "mirror" },
          ],
          targetRelativePaths: [],
        },
        { prune: false }
      ),
    ];

    const result = await new ProvisionWorkspace(fs, false).applyEffects(effects);
    expect(result.actions).toContain("write AGENTS.md (ai-guidelines runtime updated)");
    expect(result.actions).toContain(
      "write .ai-guidelines/templates/spec-boilerplate.md (template v=2)"
    );

    const agents = await nodeFs.readFile(path.join(dir, "AGENTS.md"), "utf8");
    const template = await nodeFs.readFile(
      path.join(dir, ".ai-guidelines", "templates", "spec-boilerplate.md"),
      "utf8"
    );
    expect(agents).toContain("## Runtime Bootstrap");
    expect(template).toBe(SPEC_TEMPLATE_V2);
  });
});

const PRETTIER_BASELINE = "dist/\nnode_modules/\n";

function prettierSnapshotFromFs(fs: InMemoryFs): PrettierSnapshot {
  const packageJson = fs.files.has("package.json")
    ? (JSON.parse(fs.files.get("package.json") as string) as Record<string, unknown>)
    : null;
  return {
    packageJson,
    prettierIgnoreContent: fs.files.get(".prettierignore") ?? null,
    prettierIgnoreBaseline: PRETTIER_BASELINE,
    formatterContext: { rival: null, hasPrettier: false, shouldSkipPrettier: false },
  };
}

describe("app/use-cases/ProvisionWorkspace — Prettier (2b-3a)", () => {
  it("fake fs: aplica plano Prettier e preserva conteúdo existente", async () => {
    const fs = new InMemoryFs();
    fs.files.set(
      "package.json",
      `${JSON.stringify({ name: "consumer", scripts: { test: "node --test" } })}\n`
    );
    fs.files.set(".prettierignore", "coverage/\n");

    const result = await new ProvisionWorkspace(fs, false).applyEffects(
      planPrettier(prettierSnapshotFromFs(fs), {
        enabled: true,
        force: false,
        forcePrettier: false,
      })
    );

    expect(result.actions).toEqual([
      "novas dependências detectadas: prettier",
      "write package.json (prettier scripts & deps)",
      "write .prettierignore (prettier baseline)",
    ]);
    expect(JSON.parse(fs.files.get("package.json") as string)).toEqual({
      name: "consumer",
      scripts: { test: "node --test", format: "prettier --write ." },
      devDependencies: { prettier: "^3.0.0" },
    });
    expect(fs.files.get(".prettierignore")).toBe(
      "coverage/\n\n# ai-guidelines prettier baseline\ndist/\nnode_modules/\n"
    );
  });

  it("fake fs: segunda aplicação é idempotente", async () => {
    const fs = new InMemoryFs();
    fs.files.set("package.json", `${JSON.stringify({ name: "consumer" })}\n`);
    const uc = new ProvisionWorkspace(fs, false);

    await uc.applyEffects(
      planPrettier(prettierSnapshotFromFs(fs), {
        enabled: true,
        force: false,
        forcePrettier: false,
      })
    );
    const second = await uc.applyEffects(
      planPrettier(prettierSnapshotFromFs(fs), {
        enabled: true,
        force: false,
        forcePrettier: false,
      })
    );

    expect(second.idempotentNoop).toBe(true);
    expect(second.actions).toEqual([]);
  });

  it("fake fs: dry-run registra ações sem persistir", async () => {
    const fs = new InMemoryFs();
    fs.files.set("package.json", `${JSON.stringify({ name: "consumer" })}\n`);
    const before = fs.files.get("package.json");

    const result = await new ProvisionWorkspace(fs, true).applyEffects(
      planPrettier(prettierSnapshotFromFs(fs), {
        enabled: true,
        force: false,
        forcePrettier: false,
      })
    );

    expect(result.actions).toContain("[dry-run] write package.json (prettier scripts & deps)");
    expect(result.actions).toContain("[dry-run] write .prettierignore (prettier baseline)");
    expect(fs.files.get("package.json")).toBe(before);
    expect(fs.files.has(".prettierignore")).toBe(false);
  });
});

describe("app/use-cases/ProvisionWorkspace — Prettier (temp fs real)", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await nodeFs.mkdtemp(path.join(os.tmpdir(), "prov-prettier-"));
  });
  afterEach(async () => {
    await nodeFs.rm(dir, { recursive: true, force: true });
  });

  it("aplica package.json e .prettierignore em filesystem real", async () => {
    await nodeFs.writeFile(path.join(dir, "package.json"), `${JSON.stringify({ name: "real" })}\n`);
    const fs = new NodeProvisioningFileSystem(dir);
    const snapshot: PrettierSnapshot = {
      packageJson: { name: "real" },
      prettierIgnoreContent: null,
      prettierIgnoreBaseline: PRETTIER_BASELINE,
      formatterContext: { rival: null, hasPrettier: false, shouldSkipPrettier: false },
    };

    const result = await new ProvisionWorkspace(fs, false).applyEffects(
      planPrettier(snapshot, { enabled: true, force: false, forcePrettier: false })
    );

    expect(result.actions).toContain("write package.json (prettier scripts & deps)");
    expect(JSON.parse(await nodeFs.readFile(path.join(dir, "package.json"), "utf8"))).toMatchObject(
      {
        scripts: { format: "prettier --write ." },
        devDependencies: { prettier: "^3.0.0" },
      }
    );
    expect(await nodeFs.readFile(path.join(dir, ".prettierignore"), "utf8")).toBe(
      PRETTIER_BASELINE
    );
  });
});

function huskySnapshotFromFs(fs: InMemoryFs): HuskySnapshot {
  const packageJson = fs.files.has("package.json")
    ? (JSON.parse(fs.files.get("package.json") as string) as Record<string, unknown>)
    : null;
  return {
    packageJson,
    packageManager: {
      id: "npm",
      label: "npm",
      runner: "npm run",
      packageManagerField: null,
    },
    hooks: [
      { name: "pre-commit", content: fs.files.get(".husky/pre-commit") ?? null },
      { name: "pre-push", content: fs.files.get(".husky/pre-push") ?? null },
    ],
  };
}

describe("app/use-cases/ProvisionWorkspace — Husky (2b-3b)", () => {
  it("fake fs: cria hooks ausentes e executa markExecutable via ProcessRunner", async () => {
    const fs = new InMemoryFs();
    const runner = new SpyProcessRunner();
    fs.files.set("package.json", `${JSON.stringify({ name: "consumer" })}\n`);

    const result = await new ProvisionWorkspace(fs, false, runner).applyEffects(
      planHusky(huskySnapshotFromFs(fs), { enabled: true, force: false })
    );

    expect(result.actions).toEqual([
      "write package.json (husky prepare script)",
      "write .husky/pre-commit (husky pre-commit)",
      "mark executable .husky/pre-commit",
      "write .husky/pre-push (husky pre-push)",
      "mark executable .husky/pre-push",
    ]);
    expect(JSON.parse(fs.files.get("package.json") as string)).toEqual({
      name: "consumer",
      scripts: { prepare: "husky" },
      devDependencies: { husky: "^9.0.0" },
    });
    expect(fs.files.get(".husky/pre-commit")).toBe("npm run format\n");
    expect(fs.files.get(".husky/pre-push")).toBe("npm run check\n");
    expect(runner.markedExecutable).toEqual([
      "C:/fake-target/.husky/pre-commit",
      "C:/fake-target/.husky/pre-push",
    ]);
  });

  it("fake fs: mescla hook existente suportado preservando conteúdo", async () => {
    const fs = new InMemoryFs();
    const runner = new SpyProcessRunner();
    fs.files.set("package.json", `${JSON.stringify({ scripts: { test: "node --test" } })}\n`);
    fs.files.set(".husky/pre-commit", "echo ok\n");

    await new ProvisionWorkspace(fs, false, runner).applyEffects(
      planHusky(
        {
          ...huskySnapshotFromFs(fs),
          packageManager: {
            id: "yarn-classic",
            label: "yarn@1.22.22",
            runner: "yarn",
            packageManagerField: "yarn@1.22.22",
          },
        },
        { enabled: true, force: false }
      )
    );

    expect(fs.files.get(".husky/pre-commit")).toBe("echo ok\nyarn format\n");
  });

  it("fake fs: formato não suportado falha antes de escrever", async () => {
    const fs = new InMemoryFs();
    fs.files.set("package.json", `${JSON.stringify({ name: "consumer" })}\n`);
    fs.files.set(".husky/pre-push", '#!/bin/sh\nif [ -n "$CI" ]; then\nfi\n');

    expect(() => planHusky(huskySnapshotFromFs(fs), { enabled: true, force: false })).toThrow(
      /shape não suportado/
    );
    expect(fs.files.get("package.json")).toBe(`${JSON.stringify({ name: "consumer" })}\n`);
  });

  it("fake fs: dry-run não escreve nem executa markExecutable", async () => {
    const fs = new InMemoryFs();
    const runner = new SpyProcessRunner();
    fs.files.set("package.json", `${JSON.stringify({ name: "consumer" })}\n`);

    const result = await new ProvisionWorkspace(fs, true, runner).applyEffects(
      planHusky(huskySnapshotFromFs(fs), { enabled: true, force: false })
    );

    expect(result.actions).toContain("[dry-run] mark executable .husky/pre-commit");
    expect(fs.files.has(".husky/pre-commit")).toBe(false);
    expect(runner.markedExecutable).toEqual([]);
  });

  it("fake fs: segunda aplicação é idempotente", async () => {
    const fs = new InMemoryFs();
    const runner = new SpyProcessRunner();
    fs.files.set("package.json", `${JSON.stringify({ name: "consumer" })}\n`);
    const uc = new ProvisionWorkspace(fs, false, runner);

    await uc.applyEffects(planHusky(huskySnapshotFromFs(fs), { enabled: true, force: false }));
    const second = await uc.applyEffects(
      planHusky(huskySnapshotFromFs(fs), { enabled: true, force: false })
    );

    expect(second.idempotentNoop).toBe(true);
    expect(second.actions).toEqual([]);
  });
});

describe("app/use-cases/ProvisionWorkspace — Husky (temp fs real)", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await nodeFs.mkdtemp(path.join(os.tmpdir(), "prov-husky-"));
  });
  afterEach(async () => {
    await nodeFs.rm(dir, { recursive: true, force: true });
  });

  it("aplica hooks em filesystem real e chama ProcessRunner com paths absolutos", async () => {
    await nodeFs.writeFile(path.join(dir, "package.json"), `${JSON.stringify({ name: "real" })}\n`);
    const fs = new NodeProvisioningFileSystem(dir);
    const runner = new SpyProcessRunner();

    const result = await new ProvisionWorkspace(fs, false, runner).applyEffects(
      planHusky(
        {
          packageJson: { name: "real" },
          packageManager: {
            id: "npm",
            label: "npm",
            runner: "npm run",
            packageManagerField: null,
          },
          hooks: [
            { name: "pre-commit", content: null },
            { name: "pre-push", content: null },
          ],
        },
        { enabled: true, force: false }
      )
    );

    expect(result.actions).toContain("write .husky/pre-commit (husky pre-commit)");
    expect(await nodeFs.readFile(path.join(dir, ".husky", "pre-commit"), "utf8")).toBe(
      "npm run format\n"
    );
    expect(runner.markedExecutable).toEqual([
      path.resolve(dir, ".husky/pre-commit"),
      path.resolve(dir, ".husky/pre-push"),
    ]);
  });
});

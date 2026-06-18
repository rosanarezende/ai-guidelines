import * as path from "node:path";
import { Prompts } from "../../../app/ports/Prompts.js";
import {
  ProvisionResult,
  ProvisionWorkspaceOperationInput,
} from "../../../app/use-cases/ProvisionWorkspace.js";
import { BudgetReport } from "../../../app/services/TokenBudget.js";
import {
  PointersConfig,
  ProvisioningOperationSnapshot,
} from "../../../domain/provisioning/ProvisioningPlan.js";
import { CommandContext, Logger } from "../../registry/Command.js";
import { BootstrapDelivery, buildBootstrapDeliveryRegistry } from "./registry.js";
import {
  BootstrapDeliveryRuntime,
  CheckBudgetResult,
  CollectProvisioningSnapshotInput,
  CreateProvisionWorkspaceInput,
  ResolveProvisioningConfigInput,
} from "./runtime.js";
import { BootstrapWizard, deriveSuggestedOperation } from "./wizard.js";
import { ProvisioningCommandOptions } from "./options.js";

function capturingLogger(): { logger: Logger; infos: string[]; errors: string[] } {
  const infos: string[] = [];
  const errors: string[] = [];
  return {
    logger: { info: (message) => infos.push(message), error: (message) => errors.push(message) },
    infos,
    errors,
  };
}

function context(logger: Logger, prompts?: Prompts): CommandContext {
  return { repoRoot: path.resolve("repo"), logger, ...(prompts ? { prompts } : {}) };
}

class ScriptedPrompts implements Prompts {
  readonly selectCalls: Array<{ message: string; choices: readonly unknown[] }> = [];
  readonly multiselectCalls: Array<{ message: string; choices: readonly unknown[] }> = [];
  readonly groupMultiselectCalls: Array<{
    message: string;
    groups: Readonly<Record<string, readonly unknown[]>>;
  }> = [];
  readonly inputCalls: Array<{ message: string; defaultValue?: string }> = [];
  readonly confirmCalls: Array<{ message: string; defaultValue?: boolean }> = [];
  readonly spinnerStarts: string[] = [];
  readonly notes: Array<{ title?: string; message: string }> = [];
  readonly taskTitles: string[] = [];
  readonly taskMessages: string[] = [];
  readonly taskLogTitles: string[] = [];
  readonly taskLogMessages: string[] = [];

  constructor(
    private readonly answers: {
      readonly select?: Record<string, string>;
      readonly multiselect?: Record<string, readonly string[]>;
      readonly groupMultiselect?: Record<string, readonly string[]>;
      readonly input?: Record<string, string>;
      readonly confirm?: Record<string, boolean>;
    } = {}
  ) {}

  async select<T>(options: { message: string; choices: ReadonlyArray<{ value: T }> }): Promise<T> {
    this.selectCalls.push({ message: options.message, choices: options.choices });
    const answer = this.answers.select?.[options.message];
    if (answer !== undefined) {
      return answer as T;
    }
    return options.choices[0].value;
  }

  async multiselect<T>(options: {
    message: string;
    choices: ReadonlyArray<{ value: T }>;
    defaultValues?: ReadonlyArray<T>;
  }): Promise<readonly T[]> {
    this.multiselectCalls.push({ message: options.message, choices: options.choices });
    const answer = this.answers.multiselect?.[options.message];
    if (answer !== undefined) {
      return answer as readonly T[];
    }
    return options.defaultValues ?? [];
  }

  async groupMultiselect<T>(options: {
    message: string;
    groups: Readonly<Record<string, ReadonlyArray<{ value: T }>>>;
    defaultValues?: ReadonlyArray<T>;
  }): Promise<readonly T[]> {
    this.groupMultiselectCalls.push({ message: options.message, groups: options.groups });
    const answer = this.answers.groupMultiselect?.[options.message];
    if (answer !== undefined) {
      return answer as readonly T[];
    }
    return options.defaultValues ?? [];
  }

  async input(options: { message: string; default?: string }): Promise<string> {
    this.inputCalls.push({ message: options.message, defaultValue: options.default });
    return this.answers.input?.[options.message] ?? options.default ?? "";
  }

  async confirm(options: { message: string; default?: boolean }): Promise<boolean> {
    this.confirmCalls.push({ message: options.message, defaultValue: options.default });
    return this.answers.confirm?.[options.message] ?? options.default ?? false;
  }

  async spinner<T>(options: { start: string; task: () => T | Promise<T> }): Promise<T> {
    this.spinnerStarts.push(options.start);
    return options.task();
  }

  async note(message: string, title?: string): Promise<void> {
    this.notes.push({ title, message });
  }

  async taskList(
    tasks: readonly {
      title: string;
      task: (message: (value: string) => void) => string | Promise<string> | void | Promise<void>;
    }[]
  ): Promise<void> {
    for (const task of tasks) {
      this.taskTitles.push(task.title);
      const result = await task.task((value) => this.taskMessages.push(`${task.title}:${value}`));
      if (typeof result === "string") {
        this.taskMessages.push(`${task.title}:${result}`);
      }
    }
  }

  taskLog(options: { title: string }) {
    this.taskLogTitles.push(options.title);
    const messages = this.taskLogMessages;
    return {
      message(message: string): void {
        messages.push(`root:${message}`);
      },
      group(groupName: string) {
        return {
          message(message: string): void {
            messages.push(`${groupName}:message:${message}`);
          },
          success(message: string): void {
            messages.push(`${groupName}:success:${message}`);
          },
          error(message: string): void {
            messages.push(`${groupName}:error:${message}`);
          },
        };
      },
      success(message: string): void {
        messages.push(`success:${message}`);
      },
      error(message: string): void {
        messages.push(`error:${message}`);
      },
    };
  }
}

class FakeProvisioner {
  readonly calls: ProvisionWorkspaceOperationInput[] = [];
  error: Error | null = null;

  async executeOperation(input: ProvisionWorkspaceOperationInput): Promise<ProvisionResult> {
    this.calls.push(input);
    if (this.error) {
      throw this.error;
    }
    return { actions: [`planned ${input.operation}`], idempotentNoop: false };
  }
}

class FakeRuntime implements BootstrapDeliveryRuntime {
  readonly resolved: ResolveProvisioningConfigInput[] = [];
  readonly snapshots: CollectProvisioningSnapshotInput[] = [];
  readonly created: CreateProvisionWorkspaceInput[] = [];
  readonly compiledConfigs: PointersConfig[] = [];
  readonly provisioner = new FakeProvisioner();
  snapshot: ProvisioningOperationSnapshot = operationSnapshot();
  checkBudgetExitCode = 0;

  async resolveConfig(input: ResolveProvisioningConfigInput): Promise<PointersConfig> {
    this.resolved.push(input);
    return {
      sdd_dir: input.options["sdd-dir"] ?? ".ai-guidelines",
      providers: arrayOption(input.options.providers) ?? ["claude"],
      features: arrayOption(input.options.features) ?? [],
      lang: input.options.lang ?? "pt",
    };
  }

  async collectSnapshot(
    input: CollectProvisioningSnapshotInput
  ): Promise<ProvisioningOperationSnapshot> {
    this.snapshots.push(input);
    return this.snapshot;
  }

  async compileAdapterRules(config: PointersConfig): Promise<Readonly<Record<string, string>>> {
    this.compiledConfigs.push(config);
    return { claude: "RULES-CLAUDE", codex: "RULES-CODEX" };
  }

  createProvisionWorkspace(input: CreateProvisionWorkspaceInput): FakeProvisioner {
    this.created.push(input);
    return this.provisioner;
  }

  async runCheckBudget(): Promise<CheckBudgetResult> {
    return { report: budgetReport(), exitCode: this.checkBudgetExitCode };
  }
}

function arrayOption(value: unknown): readonly string[] | undefined {
  return Array.isArray(value) ? value.map(String) : undefined;
}

function delivery(runtime = new FakeRuntime()): {
  readonly runtime: FakeRuntime;
  readonly registry: ReturnType<typeof buildBootstrapDeliveryRegistry>;
  readonly delivery: BootstrapDelivery;
} {
  const registry = buildBootstrapDeliveryRegistry(runtime);
  return {
    runtime,
    registry,
    delivery: new BootstrapDelivery(registry, new BootstrapWizard(registry)),
  };
}

function operationSnapshot(): ProvisioningOperationSnapshot {
  const packageManager = {
    id: "npm" as const,
    label: "npm",
    runner: "npm run",
    packageManagerField: null,
  };
  return {
    initGuard: { conflicts: [] },
    runtime: { runtimeStub: "runtime-stub" },
    templates: { sourceExists: false, sourceFiles: [], targetRelativePaths: [] },
    prettier: {
      packageJson: null,
      prettierIgnoreContent: null,
      prettierIgnoreBaseline: "",
      formatterContext: { rival: null, hasPrettier: false, shouldSkipPrettier: false },
    },
    husky: { packageJson: null, packageManager, hooks: [] },
    ci: { packageManager, workflowTemplate: "", workflowContent: null },
    install: { packageManager, yarnBerryReleaseExists: true },
    guidance: {
      formatterContext: { rival: null, hasPrettier: false, shouldSkipPrettier: false },
      monorepoContext: { detected: false, flavor: null, source: null },
      gitattributes: { content: null, baseline: "" },
      platform: "linux",
      hasGitRepo: false,
    },
  };
}

function budgetReport(): BudgetReport {
  return {
    scopes: {
      universal: { tokens: 10, limit: 1500 },
      "opt-in": { tokens: 5, limit: 1200 },
    },
    agentsMd: { tokens: 50, limit: 2700 },
    perAdapter: [],
    warnings: [],
  };
}

describe("bootstrap delivery 2c — parse/help/registry", () => {
  it("parseia flags de init e adopt com options tipadas", () => {
    const { registry } = delivery();
    const init = registry.resolve("init") as {
      parse(argv: readonly string[]): ProvisioningCommandOptions;
    };
    const adopt = registry.resolve("adopt") as {
      parse(argv: readonly string[]): ProvisioningCommandOptions;
    };

    expect(
      init.parse([
        "--target",
        "./consumer",
        "--name=Consumer",
        "--providers=claude,openai",
        "--features=prettier,husky,ci",
        "--install",
      ])
    ).toMatchObject({
      operation: "init",
      target: "./consumer",
      name: "Consumer",
      providers: ["claude", "openai"],
      features: ["prettier", "husky", "ci"],
      install: true,
    });

    expect(adopt.parse(["--target=.", "--force", "--dry-run"])).toMatchObject({
      operation: "adopt",
      force: true,
      dryRun: true,
    });
  });

  it("update --providers produz update com provider selection", () => {
    const { registry } = delivery();
    const update = registry.resolve("update") as {
      parse(argv: readonly string[]): ProvisioningCommandOptions;
    };

    expect(update.parse(["--providers", "claude,openai"])).toMatchObject({
      operation: "update",
      providers: ["claude", "openai"],
    });
  });

  it.each(["init", "adopt", "update", "check-budget"])(
    "%s --help renderiza sem executar",
    async (name) => {
      const { runtime, registry } = delivery();
      const { logger, infos } = capturingLogger();

      const result = await registry.dispatch([name, "--help"], context(logger));

      expect(result.exitCode).toBe(0);
      expect(runtime.provisioner.calls).toEqual([]);
      expect(infos.join("\n")).toContain(name);
    }
  );

  it("help novo nao lista providers como comando, mas documenta update --providers", async () => {
    const { delivery: bootstrap } = delivery();
    const { logger, infos } = capturingLogger();

    const result = await bootstrap.dispatch(["--help"], context(logger));

    expect(result.exitCode).toBe(0);
    const help = infos.join("\n");
    expect(help).toContain("update --providers claude,openai");
    expect(help).not.toMatch(/^\s+providers\s*$/m);
  });

  it("providers falha como comando desconhecido e nao delega para update", async () => {
    const { runtime, delivery: bootstrap } = delivery();
    const { logger, errors } = capturingLogger();

    const result = await bootstrap.dispatch(
      ["providers", "--providers", "claude"],
      context(logger)
    );

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toContain("Use: npm run flow -- update --providers <lista>");
    expect(runtime.provisioner.calls).toEqual([]);
  });

  it("argumento desconhecido falha antes de executar", async () => {
    const { runtime, registry } = delivery();
    const { logger, errors } = capturingLogger();

    const result = await registry.dispatch(["init", "--unknown"], context(logger));

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toContain("Opcao desconhecida");
    expect(runtime.provisioner.calls).toEqual([]);
  });
});

describe("bootstrap delivery 2c — run", () => {
  it("comando chama ProvisionWorkspace.executeOperation com snapshot e config resolvidos", async () => {
    const { runtime, registry } = delivery();
    const { logger, infos } = capturingLogger();

    const result = await registry.dispatch(
      ["update", "--target", "./consumer", "--providers", "claude,openai"],
      context(logger)
    );

    expect(result.exitCode).toBe(0);
    expect(runtime.resolved).toHaveLength(1);
    expect(runtime.snapshots).toEqual([
      {
        targetDir: path.resolve(path.resolve("repo"), "./consumer"),
        sddDir: ".ai-guidelines",
        packageManager: undefined,
      },
    ]);
    expect(runtime.provisioner.calls).toHaveLength(1);
    expect(runtime.provisioner.calls[0]).toMatchObject({
      operation: "update",
      config: { providers: ["claude", "openai"] },
      providersRequested: true,
    });
    expect(infos).toContain("planned update");
  });

  it("dry-run cria ProvisionWorkspace em modo dry-run", async () => {
    const { runtime, registry } = delivery();
    const { logger } = capturingLogger();

    await registry.dispatch(["init", "--dry-run"], context(logger));

    expect(runtime.created).toEqual([
      { targetDir: path.resolve(path.resolve("repo"), "."), dryRun: true },
    ]);
  });

  it("erros de run sao apresentados de forma acionavel e retornam exitCode 1", async () => {
    const { runtime, registry } = delivery();
    runtime.provisioner.error = new Error("Falha acionavel no plano de provisionamento");
    const { logger, errors } = capturingLogger();

    const result = await registry.dispatch(["adopt"], context(logger));

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toContain("Falha acionavel");
  });

  it("check-budget executa o servico TS injetado e preserva exit code", async () => {
    const { runtime, registry } = delivery();
    runtime.checkBudgetExitCode = 7;
    const { logger, infos } = capturingLogger();

    const result = await registry.dispatch(["check-budget"], context(logger));

    expect(result.exitCode).toBe(7);
    expect(infos.join("\n")).toContain("Token budget report");
  });
});

describe("bootstrap delivery 2c — wizard", () => {
  it("sem argumentos abre fluxo interativo novo e escolhe init", async () => {
    const { runtime, delivery: bootstrap } = delivery();
    const prompts = new ScriptedPrompts({
      select: { Operation: "init" },
      confirm: { "Aplicar este plano?": true },
    });
    const { logger } = capturingLogger();

    const result = await bootstrap.dispatch([], context(logger, prompts));

    expect(result.exitCode).toBe(0);
    expect(runtime.provisioner.calls[0].operation).toBe("init");
    const operationChoices = prompts.selectCalls[0].choices as Array<{ value: string }>;
    expect(operationChoices.map((choice) => choice.value)).toEqual(
      expect.arrayContaining(["init", "adopt", "update"])
    );
    expect(operationChoices.map((choice) => choice.value)).not.toContain("providers");
    expect(prompts.notes[0]).toMatchObject({ title: "Iniciar projeto novo" });
    expect(prompts.taskLogTitles).toEqual(["Etapas do projeto novo"]);
    expect(prompts.taskTitles).toEqual([
      "Conferir contexto detectado",
      "Montar preview humano",
      "Checar travas de segurança",
    ]);
    expect(prompts.groupMultiselectCalls.map((call) => call.message)).toEqual([
      "Quais ferramentas de IA devem receber arquivos de orientação?",
      "Quais práticas quer instalar agora?",
    ]);
    const providerChoices = Object.values(prompts.groupMultiselectCalls[0].groups).flat() as Array<{
      name?: string;
      hint?: string;
    }>;
    expect(providerChoices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Claude",
          hint: "cria CLAUDE.md para sessões com Claude Code",
        }),
        expect.objectContaining({
          name: "OpenAI/Codex",
          hint: "prepara contexto e comandos para sessões com Codex",
        }),
      ])
    );
    const featureChoices = Object.values(prompts.groupMultiselectCalls[1].groups).flat() as Array<{
      name?: string;
      hint?: string;
    }>;
    expect(featureChoices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Hooks locais com Husky",
          hint: "roda checagens antes do commit",
        }),
        expect.objectContaining({
          name: "CI no GitHub Actions",
          hint: "valida o PR automaticamente no GitHub",
        }),
      ])
    );
  });

  it("wizard permite escolha adopt e preserva defaults", async () => {
    const { runtime, delivery: bootstrap } = delivery();
    const prompts = new ScriptedPrompts({
      select: { Operation: "adopt" },
      confirm: { "Aplicar este plano?": true },
    });
    const { logger } = capturingLogger();

    await bootstrap.dispatch([], context(logger, prompts));

    expect(runtime.provisioner.calls[0]).toMatchObject({
      operation: "adopt",
      projectName: path.basename(path.resolve("repo")),
      config: {
        providers: ["claude", "gemini", "openai"],
        features: ["prettier", "husky", "ci", "quality-gates", "tdd", "bdd"],
        lang: "pt",
      },
    });
    expect(prompts.notes[0]).toMatchObject({ title: "Adotar projeto existente" });
    expect(prompts.notes[0].message).toContain("preservação do conteúdo existente");
    expect(prompts.taskLogTitles).toEqual(["Etapas da adoção"]);
    expect(prompts.taskLogMessages.join("\n")).toContain(
      "Contexto:success:Destino .; nome derivado da pasta."
    );
    expect(prompts.taskMessages.join("\n")).toContain(
      "Conferir contexto detectado:Projeto existente: preservar arquivos atuais"
    );
  });

  it("wizard de adopt guia conflito, bloqueio e correção com recursos avançados", async () => {
    const runtime = new FakeRuntime();
    const { registry } = delivery(runtime);
    const firstLogger = capturingLogger();
    const firstPrompts = new ScriptedPrompts({
      select: {
        Operation: "adopt",
        "Idioma do baseline e das práticas TDD/BDD": "pt",
        "Gerenciador de pacotes": "npm",
      },
      input: {
        "Onde aplicar? Use . para este repositório": ".",
        "Nome do projeto": "consumer-existing",
      },
      groupMultiselect: {
        "Quais ferramentas de IA devem receber arquivos de orientação?": [
          "claude",
          "openai",
          "cursor",
        ],
        "Quais práticas quer instalar agora?": ["prettier", "husky", "ci", "tdd", "bdd"],
      },
      confirm: {
        "Só mostrar o plano, sem escrever arquivos?": false,
        "Permitir sobrescrever arquivos suportados quando houver conflito?": false,
        "Instalar dependências automaticamente no final?": false,
        "Abrir opções avançadas?": false,
        "Aplicar este plano?": true,
      },
    });
    runtime.provisioner.error = new Error(
      "Hook pre-commit possui shape não suportado para merge conservador. Use --force para sobrescrever."
    );

    const failed = await registry.dispatch(["adopt"], context(firstLogger.logger, firstPrompts));

    expect(failed.exitCode).toBe(1);
    expect(firstLogger.errors.join("\n")).toContain("Use --force para sobrescrever");
    expect(runtime.provisioner.calls[0]).toMatchObject({
      operation: "adopt",
      projectName: "consumer-existing",
      config: {
        providers: ["claude", "openai", "cursor"],
        features: ["prettier", "husky", "ci", "tdd", "bdd"],
        lang: "pt",
      },
      force: false,
      forcePrettier: false,
      prune: false,
      install: false,
    });
    expect(firstPrompts.groupMultiselectCalls.map((call) => call.message)).toEqual([
      "Quais ferramentas de IA devem receber arquivos de orientação?",
      "Quais práticas quer instalar agora?",
    ]);
    expect(Object.keys(firstPrompts.groupMultiselectCalls[0].groups)).toEqual([
      "Assistentes principais do repositório",
      "Editores e agentes locais",
    ]);
    expect(Object.keys(firstPrompts.groupMultiselectCalls[1].groups)).toEqual([
      "Infraestrutura do repositório",
      "Práticas de trabalho",
    ]);
    expect(firstPrompts.taskLogTitles).toEqual(["Etapas da adoção"]);
    expect(firstPrompts.taskTitles).toEqual([
      "Conferir contexto detectado",
      "Montar preview humano",
      "Checar travas de segurança",
    ]);
    expect(firstPrompts.notes.at(-1)?.message).toContain("Sobrescrever conflitos suportados: não");

    runtime.provisioner.error = null;
    const secondLogger = capturingLogger();
    const secondPrompts = new ScriptedPrompts({
      select: {
        Operation: "adopt",
        "Idioma do baseline e das práticas TDD/BDD": "pt",
        "Gerenciador de pacotes": "npm",
      },
      input: {
        "Onde aplicar? Use . para este repositório": ".",
        "Nome do projeto": "consumer-existing",
        "Diretório runtime do ai-guidelines": ".ai-guidelines",
      },
      groupMultiselect: {
        "Quais ferramentas de IA devem receber arquivos de orientação?": [
          "claude",
          "openai",
          "cursor",
        ],
        "Quais práticas quer instalar agora?": ["prettier", "husky", "ci", "tdd", "bdd"],
      },
      confirm: {
        "Só mostrar o plano, sem escrever arquivos?": false,
        "Permitir sobrescrever arquivos suportados quando houver conflito?": true,
        "Instalar dependências automaticamente no final?": false,
        "Abrir opções avançadas?": true,
        "Forçar Prettier mesmo se houver formatter rival?": true,
        "Remover artefatos gerenciados que não fazem mais parte da seleção?": true,
        "Aplicar este plano?": true,
      },
    });

    const corrected = await registry.dispatch(
      ["adopt"],
      context(secondLogger.logger, secondPrompts)
    );

    expect(corrected.exitCode).toBe(0);
    expect(secondLogger.infos).toContain("planned adopt");
    expect(runtime.provisioner.calls[1]).toMatchObject({
      operation: "adopt",
      projectName: "consumer-existing",
      force: true,
      forcePrettier: true,
      prune: true,
      install: false,
    });
    expect(secondPrompts.notes.at(-1)?.message).toContain("Sobrescrever conflitos suportados: sim");
    expect(secondPrompts.notes.at(-1)?.message).toContain(
      "Forçar Prettier com formatter rival: sim"
    );
    expect(secondPrompts.notes.at(-1)?.message).toContain(
      "Remover arquivos órfãos gerenciados: sim"
    );
  });

  it("wizard permite escolher idioma das práticas TDD/BDD", async () => {
    const { runtime, delivery: bootstrap } = delivery();
    const prompts = new ScriptedPrompts({
      select: {
        Operation: "init",
        "Idioma do baseline e das práticas TDD/BDD": "en",
      },
      confirm: { "Aplicar este plano?": true },
    });
    const { logger } = capturingLogger();

    await bootstrap.dispatch([], context(logger, prompts));

    expect(runtime.provisioner.calls[0]).toMatchObject({
      operation: "init",
      config: { lang: "en" },
    });
    const languageSelect = prompts.selectCalls.find(
      (call) => call.message === "Idioma do baseline e das práticas TDD/BDD"
    );
    expect(languageSelect?.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Português", value: "pt" }),
        expect.objectContaining({ name: "English", value: "en" }),
      ])
    );
    expect(prompts.notes.at(-1)?.message).toContain("- Idioma do baseline e TDD/BDD: English");
    expect(prompts.taskLogMessages.join("\n")).toContain("Idioma:success:English selecionado.");
  });

  it("wizard expõe opções avançadas que antes só existiam na CLI direta", async () => {
    const { runtime, delivery: bootstrap } = delivery();
    const prompts = new ScriptedPrompts({
      select: { Operation: "adopt" },
      input: {
        "Diretório runtime do ai-guidelines": ".custom-guidelines",
      },
      confirm: {
        "Abrir opções avançadas?": true,
        "Forçar Prettier mesmo se houver formatter rival?": true,
        "Remover artefatos gerenciados que não fazem mais parte da seleção?": true,
        "Aplicar este plano?": true,
      },
    });
    const { logger } = capturingLogger();

    await bootstrap.dispatch([], context(logger, prompts));

    expect(runtime.resolved[0].options["sdd-dir"]).toBe(".custom-guidelines");
    expect(runtime.provisioner.calls[0]).toMatchObject({
      operation: "adopt",
      forcePrettier: true,
      prune: true,
    });
    expect(prompts.notes.at(-1)?.message).toContain("- Diretório runtime: .custom-guidelines");
    expect(prompts.notes.at(-1)?.message).toContain("- Forçar Prettier com formatter rival: sim");
    expect(prompts.notes.at(-1)?.message).toContain("- Remover arquivos órfãos gerenciados: sim");
  });

  it("wizard seleciona providers dentro de update", async () => {
    const { runtime, delivery: bootstrap } = delivery();
    const prompts = new ScriptedPrompts({
      select: { Operation: "update" },
      groupMultiselect: {
        "Quais ferramentas de IA devem receber arquivos de orientação?": ["claude", "openai"],
      },
      confirm: { "Aplicar este plano?": true },
    });
    const { logger } = capturingLogger();

    await bootstrap.dispatch([], context(logger, prompts));

    expect(runtime.provisioner.calls[0]).toMatchObject({
      operation: "update",
      providersRequested: true,
      config: { providers: ["claude", "openai"] },
    });
    expect(prompts.groupMultiselectCalls[0].message).toBe(
      "Quais ferramentas de IA devem receber arquivos de orientação?"
    );
    expect(Object.keys(prompts.groupMultiselectCalls[0].groups)).toEqual([
      "Assistentes principais do repositório",
      "Editores e agentes locais",
    ]);
    expect(prompts.spinnerStarts).toEqual(["Montando e aplicando plano update..."]);
  });

  it("deriva operacao sugerida por snapshot sem conhecer filesystem concreto", () => {
    expect(deriveSuggestedOperation({ configExists: true, packageJsonExists: true })).toBe(
      "update"
    );
    expect(deriveSuggestedOperation({ configExists: false, packageJsonExists: true })).toBe(
      "adopt"
    );
    expect(deriveSuggestedOperation({ configExists: false, packageJsonExists: false })).toBe(
      "init"
    );
  });

  it("wizard deriva opcoes do registry e nao oferece providers", () => {
    const { registry } = delivery();
    const wizard = new BootstrapWizard(registry);
    expect(wizard.listOperationNames()).toEqual(["adopt", "init", "update"]);
    expect(wizard.listOperationNames()).not.toContain("providers");
  });
});

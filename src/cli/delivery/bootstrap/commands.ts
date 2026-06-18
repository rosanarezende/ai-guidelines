import { Command, CommandContext, CommandResult } from "../../registry/Command.js";
import { PromptCancelledError, Prompts } from "../../../app/ports/Prompts.js";
import { ProvisioningOperation } from "../../../domain/provisioning/ProvisioningPlan.js";
import {
  getSupportedProviders,
  DEFAULT_PROVIDERS,
  Provider,
} from "../../../domain/provisioning/ProviderCatalog.js";
import {
  EDITORIAL_FEATURES,
  FEATURE_OPTIONS,
  INFRASTRUCTURE_FEATURES,
} from "../../../domain/provisioning/FeatureCatalog.js";
import {
  parseProvisioningCommandOptions,
  ProvisioningCommandOptions,
  renderOptionUsage,
  resolveProjectName,
  resolveTargetDir,
  PROVISIONING_OPTION_DEFINITIONS,
} from "./options.js";
import { BootstrapDeliveryRuntime } from "./runtime.js";
import { renderBudgetReportLines } from "./renderers.js";

export interface WizardCommandMetadata {
  readonly enabled: boolean;
  readonly label: string;
}

export interface BootstrapDeliveryCommand<TOptions = unknown> extends Command<TOptions> {
  readonly wizard: WizardCommandMetadata;
}

abstract class ProvisioningDeliveryCommand implements BootstrapDeliveryCommand<ProvisioningCommandOptions> {
  readonly wizard: WizardCommandMetadata;
  readonly usage: readonly string[];

  protected constructor(
    readonly name: ProvisioningOperation,
    readonly description: string,
    readonly runtime: BootstrapDeliveryRuntime,
    usage: readonly string[],
    wizardLabel: string
  ) {
    this.usage = [...usage, ...renderOptionUsage(PROVISIONING_OPTION_DEFINITIONS)];
    this.wizard = { enabled: true, label: wizardLabel };
  }

  parse(argv: readonly string[]): ProvisioningCommandOptions {
    return parseProvisioningCommandOptions(this.name, argv);
  }

  async prompt(context: CommandContext): Promise<ProvisioningCommandOptions> {
    const prompts = requirePrompts(context, this.name);
    await prompts.note?.(renderProvisioningIntro(this.name), provisioningFlowTitle(this.name));
    const taskLog = prompts.taskLog?.({
      title: provisioningFlowTaskLogTitle(this.name),
      limit: 8,
      retainLog: true,
    });

    taskLog?.group("Contexto").message("Escolhendo destino e nome do projeto.");
    const target = await promptString(prompts, "Onde aplicar? Use . para este repositório", ".");
    const projectName = await promptString(prompts, "Nome do projeto", "");
    taskLog
      ?.group("Contexto")
      .success(`Destino ${target}; nome ${projectName || "derivado da pasta"}.`);

    taskLog?.group("Integrações").message("Escolhendo ferramentas de IA e práticas.");
    const providers = await promptProviderList(prompts);
    const features = this.name === "update" ? undefined : await promptFeatureList(prompts);
    taskLog
      ?.group("Integrações")
      .success(
        [
          `${providers.length} provider(s) selecionado(s)`,
          features === undefined ? null : `${features.length} prática(s) selecionada(s)`,
        ]
          .filter((item): item is string => item !== null)
          .join("; ")
      );

    taskLog?.group("Execução").message("Definindo pacote, segurança e instalação.");
    const packageManager = await prompts.select<string>({
      message: "Gerenciador de pacotes",
      choices: [
        { name: "Detectar automaticamente", value: "" },
        { name: "npm", value: "npm" },
        { name: "pnpm", value: "pnpm" },
        { name: "yarn classic", value: "yarn@1.22.22" },
        { name: "yarn berry", value: "yarn@4.1.1" },
      ],
    });
    const dryRun = await prompts.confirm({
      message: "Só mostrar o plano, sem escrever arquivos?",
      default: true,
    });
    const force = await prompts.confirm({
      message: "Permitir sobrescrever arquivos suportados quando houver conflito?",
      default: false,
    });
    const install = await prompts.confirm({
      message: "Instalar dependências automaticamente no final?",
      default: false,
    });
    taskLog
      ?.group("Execução")
      .success(
        [
          `pacote ${packageManager || "auto"}`,
          dryRun ? "dry-run" : "aplicar arquivos",
          force ? "force habilitado" : "force desligado",
          install ? "install habilitado" : "install desligado",
        ].join("; ")
      );

    const options: ProvisioningCommandOptions = {
      operation: this.name,
      target,
      name: projectName || undefined,
      packageManager: packageManager || undefined,
      providers,
      features,
      lang: "pt",
      force,
      forcePrettier: false,
      dryRun,
      install,
      prune: false,
      yes: false,
      skippedFeatures: [],
    };

    if (prompts.taskList) {
      await prompts.taskList([
        {
          title: "Conferir contexto detectado",
          task: (message) => {
            message(provisioningContextTaskMessage(this.name));
            return "Contexto coerente com a operação escolhida.";
          },
        },
        {
          title: "Montar preview humano",
          task: (message) => {
            message(
              `Providers: ${(options.providers ?? []).join(", ") || "nenhum"}; ` +
                `práticas: ${options.features?.join(", ") ?? "não alteradas"}`
            );
            return "Preview pronto para confirmação.";
          },
        },
        {
          title: "Checar travas de segurança",
          task: (message) => {
            message(
              [
                dryRun ? "dry-run ligado" : "dry-run desligado por escolha humana",
                force ? "force ligado por escolha humana" : "force desligado",
                install ? "install ligado por escolha humana" : "install desligado",
              ].join("; ")
            );
            return "Nenhuma escrita será feita sem confirmação final.";
          },
        },
      ]);
    }

    await prompts.note?.(renderProvisioningPreview(options), `Prévia: ${this.name}`);
    const confirmed = await prompts.confirm({
      message: "Aplicar este plano?",
      default: false,
    });
    if (!confirmed) {
      throw new PromptCancelledError("Provisionamento cancelado.");
    }

    return options;
  }

  async run(options: ProvisioningCommandOptions, context: CommandContext): Promise<CommandResult> {
    const runOperation = async () => {
      const targetDir = resolveTargetDir(context.repoRoot, options.target);
      const config = await this.runtime.resolveConfig({
        targetDir,
        options: {
          mode: options.operation,
          "sdd-dir": options.sddDir,
          providers: options.providers,
          features: options.features,
          lang: options.lang,
          prune: options.prune,
        },
      });
      const snapshot = await this.runtime.collectSnapshot({
        targetDir,
        sddDir: config.sdd_dir,
        packageManager: options.packageManager,
      });
      const adapterRulesByName = await this.runtime.compileAdapterRules(config);
      const provisioner = this.runtime.createProvisionWorkspace({
        targetDir,
        dryRun: options.dryRun,
      });
      return provisioner.executeOperation({
        operation: options.operation,
        targetDir,
        projectName: resolveProjectName(targetDir, options.name),
        config,
        adapterRulesByName,
        snapshot,
        force: options.force,
        forcePrettier: options.forcePrettier,
        prune: options.prune,
        install: options.install,
        providersRequested: options.operation === "update" && options.providers !== undefined,
      });
    };
    const result = context.prompts?.spinner
      ? await context.prompts.spinner({
          start: `Montando e aplicando plano ${options.operation}...`,
          stop: `Plano ${options.operation} concluído.`,
          task: runOperation,
        })
      : await runOperation();

    for (const action of result.actions) {
      context.logger.info(action);
    }
    return { exitCode: 0 };
  }
}

export class InitCommand extends ProvisioningDeliveryCommand {
  constructor(runtime: BootstrapDeliveryRuntime) {
    super(
      "init",
      "Cria baseline ai-guidelines em projeto novo.",
      runtime,
      ["init --target ./project --providers claude,openai --features prettier,husky,ci"],
      "Initialize new workspace"
    );
  }
}

export class AdoptCommand extends ProvisioningDeliveryCommand {
  constructor(runtime: BootstrapDeliveryRuntime) {
    super(
      "adopt",
      "Adota ai-guidelines em repositorio existente.",
      runtime,
      ["adopt --target . --providers claude,gemini --features prettier"],
      "Adopt existing workspace"
    );
  }
}

export class UpdateCommand extends ProvisioningDeliveryCommand {
  constructor(runtime: BootstrapDeliveryRuntime) {
    super(
      "update",
      "Atualiza runtime, templates e provider entrypoints do consumidor.",
      runtime,
      ["update --target .", "update --providers claude,openai"],
      "Update workspace"
    );
  }
}

export class CheckBudgetCommand implements BootstrapDeliveryCommand<void> {
  readonly name = "check-budget";
  readonly description = "Imprime o relatorio TypeScript de orcamento de tokens.";
  readonly usage = ["check-budget"];
  readonly wizard = { enabled: false, label: "Check token budget" };

  constructor(private readonly runtime: BootstrapDeliveryRuntime) {}

  parse(argv: readonly string[]): void {
    if (argv.length > 0) {
      throw new Error(`Argumento inesperado: ${argv[0]}`);
    }
  }

  async run(_options: void, context: CommandContext): Promise<CommandResult> {
    const result = await this.runtime.runCheckBudget();
    for (const line of renderBudgetReportLines(result.report)) {
      context.logger.info(line);
    }
    return { exitCode: result.exitCode };
  }
}

function requirePrompts(context: CommandContext, commandName: string): Prompts {
  if (!context.prompts) {
    throw new Error(`${commandName}.prompt() requer context.prompts.`);
  }
  return context.prompts;
}

async function promptString(
  prompts: Prompts,
  message: string,
  defaultValue: string
): Promise<string> {
  const value = await prompts.input({ message, default: defaultValue });
  return value.trim() || defaultValue;
}

async function promptList(
  prompts: Prompts,
  message: string,
  defaultValue: string,
  allowedValues: readonly string[]
): Promise<readonly string[]> {
  const value = await promptString(prompts, message, defaultValue);
  const allowed = new Set(allowedValues);
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "" && allowed.has(item));
}

async function promptChoiceList(
  prompts: Prompts,
  message: string,
  defaultValues: readonly string[],
  allowedValues: readonly string[],
  required: boolean
): Promise<readonly string[]> {
  if (prompts.multiselect) {
    return prompts.multiselect({
      message,
      choices: allowedValues.map((value) => ({ name: value, value })),
      defaultValues,
      required,
    });
  }
  return promptList(prompts, message, defaultValues.join(","), allowedValues);
}

async function promptProviderList(prompts: Prompts): Promise<readonly string[]> {
  const supported = getSupportedProviders();
  if (prompts.groupMultiselect) {
    return prompts.groupMultiselect({
      message: "Quais ferramentas de IA devem receber arquivos de orientação?",
      groups: {
        "Assistentes principais do repositório": providerChoices(
          supported.filter((provider) =>
            ["claude", "gemini", "openai", "copilot"].includes(provider)
          )
        ),
        "Editores e agentes locais": providerChoices(
          supported.filter((provider) => ["cursor", "windsurf", "aider"].includes(provider))
        ),
      },
      defaultValues: DEFAULT_PROVIDERS,
      required: true,
      maxItems: 7,
      groupSpacing: 1,
    });
  }
  return promptChoiceList(prompts, "Ferramentas de IA", DEFAULT_PROVIDERS, supported, true);
}

async function promptFeatureList(prompts: Prompts): Promise<readonly string[]> {
  if (prompts.groupMultiselect) {
    return prompts.groupMultiselect({
      message: "Quais práticas quer instalar agora?",
      groups: {
        "Infraestrutura do repositório": INFRASTRUCTURE_FEATURES.map((value) => ({
          name: value,
          value,
          hint: featureHint(value),
        })),
        "Práticas de trabalho": EDITORIAL_FEATURES.map((value) => ({
          name: value,
          value,
          hint: featureHint(value),
        })),
      },
      defaultValues: FEATURE_OPTIONS,
      required: false,
      maxItems: 6,
      groupSpacing: 1,
    });
  }
  return promptChoiceList(prompts, "Práticas", FEATURE_OPTIONS, FEATURE_OPTIONS, false);
}

function providerChoices(providers: readonly Provider[]) {
  return providers.map((value) => ({ name: value, value, hint: providerHint(value) }));
}

function providerHint(provider: Provider): string {
  if (provider === "claude") return "CLAUDE.md";
  if (provider === "gemini") return "GEMINI.md";
  if (provider === "openai") return "AGENTS.md / Codex";
  if (provider === "copilot") return "GitHub Copilot";
  if (provider === "cursor") return "Cursor";
  if (provider === "windsurf") return "Windsurf";
  return "Aider";
}

function featureHint(feature: string): string {
  if (feature === "prettier") return "formatação";
  if (feature === "husky") return "hooks locais";
  if (feature === "ci") return "workflow GitHub Actions";
  if (feature === "quality-gates") return "gates editoriais";
  if (feature === "tdd") return "prática TDD";
  return "prática BDD";
}

function provisioningFlowTitle(operation: ProvisioningOperation): string {
  if (operation === "init") return "Iniciar projeto novo";
  if (operation === "adopt") return "Adotar projeto existente";
  return "Atualizar repositório governado";
}

function provisioningFlowTaskLogTitle(operation: ProvisioningOperation): string {
  if (operation === "init") return "Etapas do projeto novo";
  if (operation === "adopt") return "Etapas da adoção";
  return "Etapas do update";
}

function renderProvisioningIntro(operation: ProvisioningOperation): string {
  if (operation === "init") {
    return [
      "Use este fluxo quando o diretório ainda não tem um projeto configurado.",
      "",
      "O assistente vai guiar:",
      "- destino e nome do projeto;",
      "- ferramentas de IA que receberão orientação;",
      "- práticas opcionais como Prettier, Husky e CI;",
      "- preview antes de qualquer escrita.",
      "",
      "Por segurança, o padrão é começar em dry-run.",
    ].join("\n");
  }
  if (operation === "adopt") {
    return [
      "Use este fluxo quando já existe um projeto e você quer adicionar ai-guidelines.",
      "",
      "O assistente vai guiar:",
      "- preservação do conteúdo existente;",
      "- ferramentas de IA que receberão orientação;",
      "- práticas opcionais que podem ser adicionadas sem tratar o repo como vazio;",
      "- preview de conflitos e efeitos antes de qualquer escrita.",
      "",
      "Por segurança, o padrão é começar em dry-run e sem force.",
    ].join("\n");
  }
  return [
    "Use este fluxo para manter um repositório que já usa ai-guidelines.",
    "",
    "O assistente atualiza runtime, templates, providers e práticas governadas.",
  ].join("\n");
}

function provisioningContextTaskMessage(operation: ProvisioningOperation): string {
  if (operation === "init") return "Projeto novo: criar baseline sem assumir conteúdo existente.";
  if (operation === "adopt")
    return "Projeto existente: preservar arquivos atuais e aplicar só efeitos governados.";
  return "Repo governado: atualizar sem recriar init/adopt.";
}

function renderProvisioningPreview(options: ProvisioningCommandOptions): string {
  const lines = [
    "O que será feito",
    `- Fluxo: ${provisioningFlowTitle(options.operation)}`,
    `- Destino: ${options.target}`,
    `- Nome: ${options.name ?? "(derivado da pasta)"}`,
    `- Gerenciador de pacotes: ${options.packageManager ?? "auto"}`,
    "",
    "Integrações",
    `- Ferramentas de IA: ${(options.providers ?? []).join(", ") || "(nenhuma)"}`,
  ];
  if (options.features !== undefined) {
    lines.push(`- Práticas: ${options.features.join(", ") || "(nenhuma)"}`);
  }
  lines.push("");
  lines.push("Segurança");
  lines.push(`- Só prévia: ${options.dryRun ? "sim" : "não"}`);
  lines.push(`- Sobrescrever conflitos suportados: ${options.force ? "sim" : "não"}`);
  lines.push(`- Instalar dependências: ${options.install ? "sim" : "não"}`);
  lines.push(`- Remover arquivos órfãos gerenciados: ${options.prune ? "sim" : "não"}`);
  return lines.join("\n");
}

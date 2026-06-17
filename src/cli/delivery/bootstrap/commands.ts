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
    const target = await promptString(prompts, "Target directory", ".");
    const projectName = await promptString(prompts, "Project name", "");
    const providers = await promptProviderList(prompts);
    const features = this.name === "update" ? undefined : await promptFeatureList(prompts);
    const packageManager = await prompts.select<string>({
      message: "Package manager",
      choices: [
        { name: "auto", value: "" },
        { name: "npm", value: "npm" },
        { name: "pnpm", value: "pnpm" },
        { name: "yarn classic", value: "yarn@1.22.22" },
        { name: "yarn berry", value: "yarn@4.1.1" },
      ],
    });
    const dryRun = await prompts.confirm({ message: "Dry-run", default: false });
    const force = await prompts.confirm({ message: "Force supported overwrites", default: false });
    const install = await prompts.confirm({ message: "Install dependencies", default: false });

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

    await prompts.note?.(renderProvisioningPreview(options), `Preview: ${this.name}`);
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
      message: "Providers",
      groups: {
        "Entrypoints com adapter runtime": providerChoices(
          supported.filter((provider) =>
            ["claude", "gemini", "openai", "copilot"].includes(provider)
          )
        ),
        "Entrypoints editoriais": providerChoices(
          supported.filter((provider) => ["cursor", "windsurf", "aider"].includes(provider))
        ),
      },
      defaultValues: DEFAULT_PROVIDERS,
      required: true,
      maxItems: 7,
      groupSpacing: 1,
    });
  }
  return promptChoiceList(prompts, "Providers", DEFAULT_PROVIDERS, supported, true);
}

async function promptFeatureList(prompts: Prompts): Promise<readonly string[]> {
  if (prompts.groupMultiselect) {
    return prompts.groupMultiselect({
      message: "Features",
      groups: {
        Infraestrutura: INFRASTRUCTURE_FEATURES.map((value) => ({
          name: value,
          value,
          hint: featureHint(value),
        })),
        "Práticas editoriais": EDITORIAL_FEATURES.map((value) => ({
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
  return promptChoiceList(prompts, "Features", FEATURE_OPTIONS, FEATURE_OPTIONS, false);
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

function renderProvisioningPreview(options: ProvisioningCommandOptions): string {
  const lines = [
    `operation: ${options.operation}`,
    `target: ${options.target}`,
    `name: ${options.name ?? "(derivado do target)"}`,
    `package manager: ${options.packageManager ?? "auto"}`,
    `providers: ${(options.providers ?? []).join(", ") || "(nenhum)"}`,
  ];
  if (options.features !== undefined) {
    lines.push(`features: ${options.features.join(", ") || "(nenhuma)"}`);
  }
  lines.push(`dry-run: ${options.dryRun ? "sim" : "não"}`);
  lines.push(`force: ${options.force ? "sim" : "não"}`);
  lines.push(`install: ${options.install ? "sim" : "não"}`);
  lines.push(`prune: ${options.prune ? "sim" : "não"}`);
  return lines.join("\n");
}

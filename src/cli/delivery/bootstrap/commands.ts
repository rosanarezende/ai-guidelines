import { Command, CommandContext, CommandResult } from "../../registry/Command.js";
import { Prompts } from "../../../app/ports/Prompts.js";
import { ProvisioningOperation } from "../../../domain/provisioning/ProvisioningPlan.js";
import {
  getSupportedProviders,
  DEFAULT_PROVIDERS,
} from "../../../domain/provisioning/ProviderCatalog.js";
import { FEATURE_OPTIONS } from "../../../domain/provisioning/FeatureCatalog.js";
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
    const providers = await promptList(
      prompts,
      "Providers",
      DEFAULT_PROVIDERS.join(","),
      getSupportedProviders()
    );
    const features = await promptList(prompts, "Features", "prettier,husky,ci", FEATURE_OPTIONS);
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

    return {
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
  }

  async run(options: ProvisioningCommandOptions, context: CommandContext): Promise<CommandResult> {
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
    const result = await provisioner.executeOperation({
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

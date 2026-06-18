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
  FLOW_COPY,
  copyLines,
  featureCopy,
  formatCopy,
  providerCopy,
} from "../../copy/flowCopy.js";
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

const COMMON_COPY = FLOW_COPY.common;
const PROVISIONING_COPY = FLOW_COPY.provisioning;
const COMMAND_COPY = FLOW_COPY.commands.bootstrap;

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

    taskLog
      ?.group(PROVISIONING_COPY.flow.taskGroups.context)
      .message(PROVISIONING_COPY.flow.taskMessages.context);
    const target = await promptString(prompts, PROVISIONING_COPY.flow.prompts.target, ".");
    const projectName = await promptString(prompts, PROVISIONING_COPY.flow.prompts.projectName, "");
    taskLog
      ?.group(PROVISIONING_COPY.flow.taskGroups.context)
      .success(
        `Destino ${target}; nome ${projectName || PROVISIONING_COPY.flow.preview.derivedNameLog}.`
      );

    taskLog
      ?.group(PROVISIONING_COPY.flow.taskGroups.language)
      .message(PROVISIONING_COPY.flow.taskMessages.language);
    const lang = await promptLanguage(prompts);
    taskLog
      ?.group(PROVISIONING_COPY.flow.taskGroups.language)
      .success(`${languageLabel(lang)} selecionado.`);

    taskLog
      ?.group(PROVISIONING_COPY.flow.taskGroups.integrations)
      .message(PROVISIONING_COPY.flow.taskMessages.integrations);
    const providers = await promptProviderList(prompts);
    const features = this.name === "update" ? undefined : await promptFeatureList(prompts);
    taskLog
      ?.group(PROVISIONING_COPY.flow.taskGroups.integrations)
      .success(
        [
          `${providers.length} provider(s) selecionado(s)`,
          features === undefined ? null : `${features.length} prática(s) selecionada(s)`,
        ]
          .filter((item): item is string => item !== null)
          .join("; ")
      );

    taskLog
      ?.group(PROVISIONING_COPY.flow.taskGroups.execution)
      .message(PROVISIONING_COPY.flow.taskMessages.execution);
    const packageManager = await prompts.select<string>({
      message: PROVISIONING_COPY.flow.prompts.packageManager,
      choices: [
        { name: PROVISIONING_COPY.flow.packageManagers.auto, value: "" },
        { name: "npm", value: "npm" },
        { name: "pnpm", value: "pnpm" },
        { name: PROVISIONING_COPY.flow.packageManagers.yarnClassic, value: "yarn@1.22.22" },
        { name: PROVISIONING_COPY.flow.packageManagers.yarnBerry, value: "yarn@4.1.1" },
      ],
    });
    const dryRun = await prompts.confirm({
      message: PROVISIONING_COPY.flow.prompts.dryRun,
      default: true,
    });
    const force = await prompts.confirm({
      message: PROVISIONING_COPY.flow.prompts.force,
      default: false,
    });
    const install = await prompts.confirm({
      message: PROVISIONING_COPY.flow.prompts.install,
      default: false,
    });
    const advanced = await promptAdvancedProvisioningOptions(prompts, this.name);
    taskLog
      ?.group(PROVISIONING_COPY.flow.taskGroups.execution)
      .success(
        [
          `pacote ${packageManager || COMMON_COPY.auto}`,
          dryRun
            ? PROVISIONING_COPY.flow.stateLabels.dryRunOn
            : PROVISIONING_COPY.flow.stateLabels.dryRunOff,
          force
            ? PROVISIONING_COPY.flow.stateLabels.forceOn
            : PROVISIONING_COPY.flow.stateLabels.forceOff,
          install
            ? PROVISIONING_COPY.flow.stateLabels.installOn
            : PROVISIONING_COPY.flow.stateLabels.installOff,
          advanced.enabled
            ? PROVISIONING_COPY.flow.stateLabels.advancedOn
            : PROVISIONING_COPY.flow.stateLabels.advancedOff,
        ].join("; ")
      );

    const options: ProvisioningCommandOptions = {
      operation: this.name,
      target,
      name: projectName || undefined,
      packageManager: packageManager || undefined,
      providers,
      features,
      lang,
      sddDir: advanced.sddDir,
      force,
      forcePrettier: advanced.forcePrettier,
      dryRun,
      install,
      prune: advanced.prune,
      yes: false,
      skippedFeatures: [],
    };

    if (prompts.taskList) {
      await prompts.taskList([
        {
          title: PROVISIONING_COPY.flow.taskList.contextTitle,
          task: (message) => {
            message(provisioningContextTaskMessage(this.name));
            return PROVISIONING_COPY.flow.taskList.contextDone;
          },
        },
        {
          title: PROVISIONING_COPY.flow.taskList.previewTitle,
          task: (message) => {
            message(
              `Providers: ${(options.providers ?? []).join(", ") || COMMON_COPY.none}; ` +
                `práticas: ${options.features?.join(", ") ?? "não alteradas"}; ` +
                `idioma: ${languageLabel(options.lang)}`
            );
            return PROVISIONING_COPY.flow.taskList.previewDone;
          },
        },
        {
          title: PROVISIONING_COPY.flow.taskList.safetyTitle,
          task: (message) => {
            message(
              [
                dryRun
                  ? PROVISIONING_COPY.flow.stateLabels.dryRunOn
                  : "dry-run desligado por escolha humana",
                force
                  ? "force ligado por escolha humana"
                  : PROVISIONING_COPY.flow.stateLabels.forceOff,
                install
                  ? PROVISIONING_COPY.flow.stateLabels.installOn
                  : PROVISIONING_COPY.flow.stateLabels.installOff,
              ].join("; ")
            );
            return PROVISIONING_COPY.flow.taskList.safetyDone;
          },
        },
      ]);
    }

    await prompts.note?.(
      renderProvisioningPreview(options),
      `${PROVISIONING_COPY.flow.preview.title}: ${this.name}`
    );
    const confirmed = await prompts.confirm({
      message: PROVISIONING_COPY.flow.prompts.confirmApply,
      default: false,
    });
    if (!confirmed) {
      throw new PromptCancelledError(PROVISIONING_COPY.flow.cancelled);
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
          start: formatCopy(PROVISIONING_COPY.flow.spinnerStart, {
            operation: options.operation,
          }),
          stop: formatCopy(PROVISIONING_COPY.flow.spinnerStop, {
            operation: options.operation,
          }),
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
      COMMAND_COPY.init.description,
      runtime,
      ["init --target ./project --providers claude,openai --features prettier,husky,ci"],
      COMMAND_COPY.init.wizardLabel
    );
  }
}

export class AdoptCommand extends ProvisioningDeliveryCommand {
  constructor(runtime: BootstrapDeliveryRuntime) {
    super(
      "adopt",
      COMMAND_COPY.adopt.description,
      runtime,
      ["adopt --target . --providers claude,gemini --features prettier"],
      COMMAND_COPY.adopt.wizardLabel
    );
  }
}

export class UpdateCommand extends ProvisioningDeliveryCommand {
  constructor(runtime: BootstrapDeliveryRuntime) {
    super(
      "update",
      COMMAND_COPY.update.description,
      runtime,
      ["update --target .", "update --providers claude,openai"],
      COMMAND_COPY.update.wizardLabel
    );
  }
}

export class CheckBudgetCommand implements BootstrapDeliveryCommand<void> {
  readonly name = "check-budget";
  readonly description = COMMAND_COPY.checkBudget.description;
  readonly usage = ["check-budget"];
  readonly wizard = { enabled: false, label: COMMAND_COPY.checkBudget.wizardLabel };

  constructor(private readonly runtime: BootstrapDeliveryRuntime) {}

  parse(argv: readonly string[]): void {
    if (argv.length > 0) {
      throw new Error(formatCopy(COMMAND_COPY.unexpectedArgument, { argument: argv[0] }));
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
    throw new Error(formatCopy(COMMAND_COPY.requiresPrompts, { command: commandName }));
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

async function promptLanguage(prompts: Prompts): Promise<string> {
  return prompts.select<string>({
    message: PROVISIONING_COPY.flow.prompts.language,
    choices: [
      {
        name: PROVISIONING_COPY.flow.language.pt,
        value: "pt",
        hint: PROVISIONING_COPY.flow.language.ptHint,
      },
      {
        name: PROVISIONING_COPY.flow.language.en,
        value: "en",
        hint: PROVISIONING_COPY.flow.language.enHint,
      },
    ],
  });
}

interface AdvancedProvisioningPromptOptions {
  readonly enabled: boolean;
  readonly sddDir?: string;
  readonly forcePrettier: boolean;
  readonly prune: boolean;
}

async function promptAdvancedProvisioningOptions(
  prompts: Prompts,
  operation: ProvisioningOperation
): Promise<AdvancedProvisioningPromptOptions> {
  const enabled = await prompts.confirm({
    message: PROVISIONING_COPY.flow.prompts.advanced,
    default: false,
  });
  if (!enabled) {
    return { enabled: false, forcePrettier: false, prune: false };
  }

  const sddDir = await promptString(
    prompts,
    PROVISIONING_COPY.flow.prompts.runtimeDir,
    ".ai-guidelines"
  );
  const forcePrettier = await prompts.confirm({
    message: PROVISIONING_COPY.flow.prompts.forcePrettier,
    default: false,
  });
  const prune =
    operation === "init"
      ? false
      : await prompts.confirm({
          message: PROVISIONING_COPY.flow.prompts.prune,
          default: false,
        });

  return {
    enabled,
    sddDir: sddDir === ".ai-guidelines" ? undefined : sddDir,
    forcePrettier,
    prune,
  };
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
      message: PROVISIONING_COPY.providerQuestion,
      groups: {
        [PROVISIONING_COPY.providerGroups.primary]: providerChoices(
          supported.filter((provider) =>
            ["claude", "gemini", "openai", "copilot"].includes(provider)
          )
        ),
        [PROVISIONING_COPY.providerGroups.local]: providerChoices(
          supported.filter((provider) => ["cursor", "windsurf", "aider"].includes(provider))
        ),
      },
      defaultValues: DEFAULT_PROVIDERS,
      required: true,
      maxItems: 7,
      groupSpacing: 1,
    });
  }
  return promptChoiceList(
    prompts,
    PROVISIONING_COPY.providerQuestion,
    DEFAULT_PROVIDERS,
    supported,
    true
  );
}

async function promptFeatureList(prompts: Prompts): Promise<readonly string[]> {
  if (prompts.groupMultiselect) {
    return prompts.groupMultiselect({
      message: PROVISIONING_COPY.featureInstallQuestion,
      groups: {
        [PROVISIONING_COPY.featureGroups.infrastructure]: INFRASTRUCTURE_FEATURES.map((value) => ({
          name: featureName(value),
          value,
          hint: featureHint(value),
        })),
        [PROVISIONING_COPY.featureGroups.editorial]: EDITORIAL_FEATURES.map((value) => ({
          name: featureName(value),
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
  return promptChoiceList(
    prompts,
    PROVISIONING_COPY.featureInstallQuestion,
    FEATURE_OPTIONS,
    FEATURE_OPTIONS,
    false
  );
}

function languageLabel(lang?: string): string {
  if (lang === "en") return PROVISIONING_COPY.flow.language.en;
  return PROVISIONING_COPY.flow.language.pt;
}

function providerChoices(providers: readonly Provider[]) {
  return providers.map((value) => ({
    name: providerCopy(value).label,
    value,
    hint: providerHint(value),
  }));
}

function providerHint(provider: Provider): string {
  return providerCopy(provider).hint;
}

function featureHint(feature: string): string {
  return featureCopy(feature).hint;
}

function featureName(feature: string): string {
  return featureCopy(feature).label;
}

function provisioningFlowTitle(operation: ProvisioningOperation): string {
  return PROVISIONING_COPY.operationTitles[operation];
}

function provisioningFlowTaskLogTitle(operation: ProvisioningOperation): string {
  return PROVISIONING_COPY.taskLogTitles[operation];
}

function renderProvisioningIntro(operation: ProvisioningOperation): string {
  return copyLines(PROVISIONING_COPY.flow.intro[operation]);
}

function provisioningContextTaskMessage(operation: ProvisioningOperation): string {
  return PROVISIONING_COPY.flow.contextTask[operation];
}

function renderProvisioningPreview(options: ProvisioningCommandOptions): string {
  const lines = [
    PROVISIONING_COPY.flow.preview.heading,
    `- ${PROVISIONING_COPY.flow.preview.flow}: ${provisioningFlowTitle(options.operation)}`,
    `- ${PROVISIONING_COPY.flow.preview.target}: ${options.target}`,
    `- ${PROVISIONING_COPY.flow.preview.name}: ${options.name ?? PROVISIONING_COPY.flow.preview.derivedName}`,
    `- ${PROVISIONING_COPY.flow.preview.packageManager}: ${options.packageManager ?? COMMON_COPY.auto}`,
    `- ${PROVISIONING_COPY.flow.preview.language}: ${languageLabel(options.lang)}`,
    `- ${PROVISIONING_COPY.flow.preview.runtimeDir}: ${options.sddDir ?? ".ai-guidelines"}`,
    "",
    PROVISIONING_COPY.flow.preview.integrations,
    `- ${PROVISIONING_COPY.flow.preview.providers}: ${(options.providers ?? []).join(", ") || COMMON_COPY.none}`,
  ];
  if (options.features !== undefined) {
    lines.push(
      `- ${PROVISIONING_COPY.flow.preview.features}: ${options.features.join(", ") || COMMON_COPY.none}`
    );
  }
  lines.push("");
  lines.push(PROVISIONING_COPY.flow.preview.safety);
  lines.push(
    `- ${PROVISIONING_COPY.flow.preview.dryRun}: ${options.dryRun ? COMMON_COPY.yes : COMMON_COPY.no}`
  );
  lines.push(
    `- ${PROVISIONING_COPY.flow.preview.force}: ${options.force ? COMMON_COPY.yes : COMMON_COPY.no}`
  );
  lines.push(
    `- ${PROVISIONING_COPY.flow.preview.forcePrettier}: ${
      options.forcePrettier ? COMMON_COPY.yes : COMMON_COPY.no
    }`
  );
  lines.push(
    `- ${PROVISIONING_COPY.flow.preview.install}: ${options.install ? COMMON_COPY.yes : COMMON_COPY.no}`
  );
  lines.push(
    `- ${PROVISIONING_COPY.flow.preview.prune}: ${options.prune ? COMMON_COPY.yes : COMMON_COPY.no}`
  );
  return lines.join("\n");
}

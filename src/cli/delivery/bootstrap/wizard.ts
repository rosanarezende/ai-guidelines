import { CommandRegistry } from "../../registry/CommandRegistry.js";
import { Command, CommandContext, CommandResult } from "../../registry/Command.js";
import { BootstrapDeliveryCommand } from "./commands.js";
import { ProvisioningOperation } from "../../../domain/provisioning/ProvisioningPlan.js";

export interface BootstrapWizardSnapshot {
  readonly configExists: boolean;
  readonly packageJsonExists: boolean;
}

export class BootstrapWizard {
  constructor(
    private readonly registry: CommandRegistry,
    private readonly snapshot: BootstrapWizardSnapshot | null = null
  ) {}

  listOperationNames(): readonly string[] {
    return this.wizardCommands().map((command) => command.name);
  }

  async run(context: CommandContext): Promise<CommandResult> {
    if (!context.prompts) {
      throw new Error("Wizard requer context.prompts.");
    }

    const commands = this.wizardCommands();
    const suggested = deriveSuggestedOperation(this.snapshot);
    const ordered = suggested ? moveFirst(commands, suggested) : commands;
    const selected = await context.prompts.select<string>({
      message: "Operation",
      choices: ordered.map((command) => ({
        name: command.wizard.label,
        value: command.name,
      })),
    });
    const command = this.registry.resolve(selected);
    if (!command?.prompt) {
      throw new Error(`Comando sem prompt no wizard: ${selected}`);
    }

    const options = await command.prompt(context);
    return command.run(options, context);
  }

  private wizardCommands(): readonly BootstrapDeliveryCommand[] {
    return this.registry.commands().filter(isWizardCommand);
  }
}

export function deriveSuggestedOperation(
  snapshot: BootstrapWizardSnapshot | null
): ProvisioningOperation {
  if (snapshot?.configExists) {
    return "update";
  }
  if (snapshot?.packageJsonExists) {
    return "adopt";
  }
  return "init";
}

function isWizardCommand(command: Command<unknown>): command is BootstrapDeliveryCommand {
  return "wizard" in command && (command as BootstrapDeliveryCommand).wizard.enabled;
}

function moveFirst(
  commands: readonly BootstrapDeliveryCommand[],
  commandName: ProvisioningOperation
): readonly BootstrapDeliveryCommand[] {
  const selected = commands.find((command) => command.name === commandName);
  if (!selected) {
    return commands;
  }
  return [selected, ...commands.filter((command) => command.name !== commandName)];
}

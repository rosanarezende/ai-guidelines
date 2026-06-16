import { CommandRegistry } from "../../registry/CommandRegistry.js";
import { CommandContext, CommandResult } from "../../registry/Command.js";
import { AdoptCommand, CheckBudgetCommand, InitCommand, UpdateCommand } from "./commands.js";
import { BootstrapDeliveryRuntime } from "./runtime.js";

export function buildBootstrapDeliveryRegistry(runtime: BootstrapDeliveryRuntime): CommandRegistry {
  return new CommandRegistry()
    .register(new InitCommand(runtime))
    .register(new AdoptCommand(runtime))
    .register(new UpdateCommand(runtime))
    .register(new CheckBudgetCommand(runtime));
}

export class BootstrapDelivery {
  constructor(
    private readonly registry: CommandRegistry,
    private readonly wizard: { run(context: CommandContext): Promise<CommandResult> }
  ) {}

  async dispatch(argv: readonly string[], context: CommandContext): Promise<CommandResult> {
    if (argv.length === 0) {
      return this.wizard.run(context);
    }

    const [name] = argv;
    if (name === "--help" || name === "-h") {
      context.logger.info(this.registry.renderHelp());
      return { exitCode: 0 };
    }

    if (name === "providers") {
      context.logger.error(
        'Comando desconhecido: "providers". Use: guidelines update --providers <lista>'
      );
      return { exitCode: 1 };
    }

    return this.registry.dispatch(argv, context);
  }
}

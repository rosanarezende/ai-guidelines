import { Command, CommandContext, CommandResult } from "../Command.js";
import { runCockpit } from "../../cockpit.js";

export class CockpitCommand implements Command<void> {
  readonly name = "cockpit";
  readonly description =
    "Mostra o resumo atual: onde estamos, próximo passo, decisões disponíveis, bloqueios e ações proibidas. Read-only.";
  readonly usage = ["cockpit"];

  parse(argv: readonly string[]): void {
    if (argv.length > 0) {
      throw new Error(`Argumento inesperado para cockpit: ${argv[0]}`);
    }
  }

  async run(_options: void, context: CommandContext): Promise<CommandResult> {
    return { exitCode: runCockpit(context.repoRoot, context.logger) };
  }
}

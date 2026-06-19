import { runChangedValidation } from "../../changedValidation.js";
import { Command, CommandContext, CommandResult } from "../Command.js";
import { boolFlag, parseFlags, stringFlag } from "../parseFlags.js";

export interface ValidateCommandOptions {
  readonly kind: "changed";
  readonly base?: string;
  readonly fix?: boolean;
}

export class ValidateCommand implements Command<ValidateCommandOptions> {
  readonly name = "validate";
  readonly description =
    "Valida rapidamente o diff atual; use o gate completo configurado pelo repositório antes de Ready/Human Gate.";
  readonly usage = [
    "validate changed",
    "validate changed --fix",
    "validate changed --base origin/main",
  ];
  readonly subcommands = ["changed"];

  parse(argv: readonly string[]): ValidateCommandOptions {
    const { positionals, flags } = parseFlags(argv, { booleans: ["fix"] });
    if (positionals.length !== 1 || positionals[0] !== "changed") {
      throw new Error("Uso: npx ai-guidelines validate changed [--fix] [--base <ref>]");
    }

    const allowed = new Set(["fix", "base"]);
    for (const flag of flags.keys()) {
      if (!allowed.has(flag)) throw new Error(`Flag desconhecida para validate changed: --${flag}`);
    }

    const options: { kind: "changed"; base?: string; fix?: boolean } = { kind: "changed" };
    const base = stringFlag(flags, "base");
    if (base !== undefined) options.base = base;
    if (boolFlag(flags, "fix")) options.fix = true;
    return options;
  }

  async run(options: ValidateCommandOptions, context: CommandContext): Promise<CommandResult> {
    const exitCode = runChangedValidation(context.repoRoot, options, { logger: context.logger });
    return { exitCode };
  }
}

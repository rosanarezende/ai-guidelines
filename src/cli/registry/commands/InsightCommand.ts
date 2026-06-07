import { Command, CommandContext, CommandResult } from "../Command.js";
import { InsightRunOptions, main as insightMain } from "../../insight.js";

/** Assinatura injetável do entrypoint de insight — real por default, fake em teste. */
export type InsightMainFn = (
  argv: readonly string[],
  options: InsightRunOptions
) => Promise<number>;

export interface InsightOptions {
  /** Subcomando + args (add | saw | list | promote | discard), repassados ao insight.main. */
  readonly rest: readonly string[];
}

/**
 * Adapter de `insight` ao contrato `Command`. Comando **passthrough**: o próprio
 * `insight.main` já parseia o subcomando (`argv[1]`) e seus args — então o
 * `parse` aqui só segura o `rest`, e o `run` reconstrói `["insight", ...rest]`.
 */
export class InsightCommand implements Command<InsightOptions> {
  readonly name = "insight";
  readonly description =
    "Captura e maturação de percepções recorrentes (PIT): add | saw | list | promote | discard.";
  readonly usage = ["insight list", "insight add"];

  constructor(private readonly insightMainFn: InsightMainFn = insightMain) {}

  parse(argv: readonly string[]): InsightOptions {
    return { rest: argv };
  }

  async run(options: InsightOptions, context: CommandContext): Promise<CommandResult> {
    const code = await this.insightMainFn(["insight", ...options.rest], {
      repoRoot: context.repoRoot,
      logger: context.logger,
    });
    return { exitCode: code };
  }
}

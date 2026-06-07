import { Command, CommandContext, CommandResult } from "../Command.js";
import { RunOptions, runContinue } from "../../workflow.js";

/** Assinatura injetável de `runContinue` — real por default, fake em teste. */
export type RunContinueFn = (options: RunOptions, identifier?: string) => Promise<number>;

export interface ContinueOptions {
  /** Slug/id da spec a continuar; ausente = spec corrente (detectada pela branch). */
  readonly identifier?: string;
}

/**
 * Comando-piloto do cutover (pr-cli-cutover, #35). Adapta `continue` ao
 * contrato `Command`: `parse` extrai o identifier posicional; `run` delega ao
 * `runContinue` existente (use case read-only de workflow.ts), sem reimplementar
 * lógica. Prova o roteamento argv → parse → run num comando real.
 */
export class ContinueCommand implements Command<ContinueOptions> {
  readonly name = "continue";
  readonly description =
    "Briefing + próxima ação da spec (lookup de state.yml); recusa se faltar tasks.md ou gate≠closed. Sem argumento = spec da branch atual.";
  readonly usage = ["continue", "continue 0023"];

  constructor(private readonly runContinueFn: RunContinueFn = runContinue) {}

  parse(argv: readonly string[]): ContinueOptions {
    const identifier = argv[0];
    return identifier !== undefined && identifier !== "" ? { identifier } : {};
  }

  async run(options: ContinueOptions, context: CommandContext): Promise<CommandResult> {
    const runOptions: RunOptions = { repoRoot: context.repoRoot, logger: context.logger };
    const code = await this.runContinueFn(runOptions, options.identifier);
    return { exitCode: code };
  }
}

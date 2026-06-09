import { Command, CommandContext, CommandResult } from "../Command.js";
import { main as runHandoff } from "../../handoff.js";

export interface HandoffCommandOptions {
  readonly identifier?: string;
  readonly hybrid: boolean;
}

/**
 * Comando `handoff` — bootstrap situado de sessao IA (ADR 0022).
 *
 * Read-only e deterministico: monta contexto a partir de git local + artefatos
 * versionados. Nao chama LLM, nao decide fluxo e nao altera arquivos.
 */
export class HandoffCommand implements Command<HandoffCommandOptions> {
  readonly name = "handoff";
  readonly description =
    "Gera handoff situado read-only para iniciar sessao IA a partir de state.yml/topology.";
  readonly usage = ["handoff", "handoff 0024", "handoff 0024 --hybrid"];

  parse(argv: readonly string[]): HandoffCommandOptions {
    return {
      identifier: argv.find((arg) => arg !== "--hybrid"),
      hybrid: argv.includes("--hybrid"),
    };
  }

  async run(options: HandoffCommandOptions, context: CommandContext): Promise<CommandResult> {
    const argv = [options.identifier, options.hybrid ? "--hybrid" : undefined].filter(
      (value): value is string => value !== undefined
    );
    const exitCode = await runHandoff(argv, context.repoRoot, context.logger);
    return { exitCode };
  }
}

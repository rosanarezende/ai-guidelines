import { Command, CommandContext, CommandResult } from "../Command.js";
import { main as runHandoff } from "../../handoff.js";

export interface HandoffCommandOptions {
  readonly identifier?: string;
  readonly hybrid: boolean;
  readonly noRemote: boolean;
}

/**
 * Comando `handoff` — bootstrap situado de sessao IA (ADR 0022 + CO-4).
 *
 * Read-only e deterministico: monta contexto a partir de git local, artefatos
 * versionados e (quando disponivel) gh; deriva proxima acao unica + proibicoes
 * + selo de geracao. Nao chama LLM, nao decide fluxo, nao persiste arquivo —
 * stdout e a superficie primaria. `--no-remote` pula a fonte gh (offline).
 */
export class HandoffCommand implements Command<HandoffCommandOptions> {
  readonly name = "handoff";
  readonly description =
    "Gera handoff situado read-only (fatos + proxima acao + selo) a partir de state.yml/topology/git/gh.";
  readonly usage = ["handoff", "handoff 0024", "handoff 0024 --hybrid", "handoff 0024 --no-remote"];

  parse(argv: readonly string[]): HandoffCommandOptions {
    return {
      identifier: argv.find((arg) => !arg.startsWith("--")),
      hybrid: argv.includes("--hybrid"),
      noRemote: argv.includes("--no-remote"),
    };
  }

  async run(options: HandoffCommandOptions, context: CommandContext): Promise<CommandResult> {
    const argv = [
      options.identifier,
      options.hybrid ? "--hybrid" : undefined,
      options.noRemote ? "--no-remote" : undefined,
    ].filter((value): value is string => value !== undefined);
    const exitCode = await runHandoff(argv, context.repoRoot, context.logger);
    return { exitCode };
  }
}

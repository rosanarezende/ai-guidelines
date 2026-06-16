import { Command, CommandContext, CommandResult } from "../Command.js";
import { runWorkBrief } from "../../workBrief.js";

/** Assinatura injetável do briefing — real por default, fake em teste. */
export type RunWorkBriefFn = typeof runWorkBrief;

export interface WorkCommandOptions {
  readonly noRemote: boolean;
  /** Valor bruto de --authorization (validado pelo runner; fail-closed). */
  readonly authorization?: string;
}

/**
 * Comando `work` — briefing GOVERNADO e situado de TRABALHO (CO-4 / dogfood do
 * PR #42). Projeta o contrato de implementação/entrega (modo inferido, objeto,
 * permissões, validações, parada e report contract governado) a partir do mesmo
 * snapshot do handoff + `work-policy.yml`. Read-only: não edita arquivos, não
 * commita, não faz push, não executa validações. Zero LLM (ADR 0018).
 *
 *   work                                     → briefing informativo (sem autoridade).
 *   work --authorization explicit-work-request → autoriza commit/push no objeto inferido.
 *   work --no-remote                         → pula a fonte gh (offline).
 */
export class WorkCommand implements Command<WorkCommandOptions> {
  readonly name = "work";
  readonly description =
    "Briefing governado de trabalho (modo inferido + escopo/autoridade/validações/parada/report contract) a partir de work-policy.yml + snapshot situado. Read-only.";
  readonly usage = ["work", "work --authorization explicit-work-request", "work --no-remote"];

  constructor(private readonly runBriefFn: RunWorkBriefFn = runWorkBrief) {}

  parse(argv: readonly string[]): WorkCommandOptions {
    let authorization: string | undefined;
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === "--authorization") {
        authorization = argv[++i];
      } else if (arg.startsWith("--authorization=")) {
        authorization = arg.slice("--authorization=".length);
      }
    }
    return {
      noRemote: argv.includes("--no-remote"),
      ...(authorization !== undefined ? { authorization } : {}),
    };
  }

  async run(options: WorkCommandOptions, context: CommandContext): Promise<CommandResult> {
    const exitCode = this.runBriefFn(
      context.repoRoot,
      context.logger,
      options.noRemote ? null : undefined,
      options.authorization
    );
    return { exitCode };
  }
}

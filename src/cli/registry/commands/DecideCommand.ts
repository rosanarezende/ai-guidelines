import { Command, CommandContext, CommandResult } from "../Command.js";
import { DecideArgs, parseDecideArgs, runDecide } from "../../decide/decide.js";

/** Assinatura injetável do runner — real por default, fake em teste. */
export type RunDecideFn = typeof runDecide;

/**
 * Comando `decide` — superfície GOVERNADA das decisões reservadas à owner
 * (CO-3 / PR #42). Prepara o briefing humano ANTES de pedir qualquer escolha;
 * coleta a decisão; mostra a prévia; exige confirmação; só então registra o
 * efeito governado autorizado. Zero LLM no runtime (ADR 0018).
 *
 *   decide                              → wizard interativo (confirmação = autorização).
 *   decide --brief-only [--type X] [--technical]
 *                                       → só explica (zero escrita).
 *   decide --type X --decision Y --authorization explicit-human-decision --confirm
 *                                       → modo direto (escrita sob autoridade).
 *
 * O wizard usa `context.prompts` quando presente (superfície humana do
 * `workflow`); na CLI direta, o runner instancia o provider real em TTY.
 */
export class DecideCommand implements Command<DecideArgs> {
  readonly name = "decide";
  readonly description =
    "Decisões reservadas ao humano (close-dispositions, mark-readiness, advance-subcheckpoint, human-gate): briefing humano → escolha → prévia → confirmação → registro governado. Zero LLM.";
  readonly usage = [
    "decide",
    "decide --brief-only",
    "decide --type mark-readiness --brief-only",
    "decide --type close-dispositions --brief-only",
    "decide --type advance-subcheckpoint --brief-only",
    "decide --type human-gate --brief-only",
    "decide --type close-dispositions --technical",
    "decide --type mark-readiness --decision mark-ready --authorization explicit-human-decision --confirm",
    "decide --type close-dispositions --decision accept-all --authorization explicit-human-decision --confirm",
  ];

  constructor(private readonly runFn: RunDecideFn = runDecide) {}

  parse(argv: readonly string[]): DecideArgs {
    return parseDecideArgs(argv);
  }

  async run(options: DecideArgs, context: CommandContext): Promise<CommandResult> {
    const exitCode = await this.runFn(context.repoRoot, options, {
      logger: context.logger,
      ...(context.prompts ? { prompts: context.prompts } : {}),
    });
    return { exitCode };
  }
}

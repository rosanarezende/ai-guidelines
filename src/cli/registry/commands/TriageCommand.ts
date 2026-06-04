import { Command, CommandContext, CommandResult } from "../Command.js";
import { ReviewCliArgs, ReviewRunOptions, main as triageMain } from "../../review.js";

/**
 * Assinatura injetável do entrypoint de triagem (módulo `review.ts` — rename do
 * módulo p/ `triage.ts` fica para o passo de deleção do legado no DONE do #35).
 */
export type TriageMainFn = (
  argv: readonly string[],
  opts: ReviewRunOptions & { reviewArgs?: ReviewCliArgs }
) => Promise<number>;

export interface TriageOptions {
  /** PR a triar; ausente = detecta pelo PR aberto da branch atual. */
  readonly pr?: number;
}

/**
 * Comando `triage` — triagem determinística dos review comments de um PR
 * (busca + agrupa sem-resposta × respondidos; read-only; cf. [DEC-0023-N01]).
 *
 * Renomeado de `review` no cutover (investigação 2026-06-04): o comportamento
 * real é TRIAGEM (use case `TriageReview`, renderer `renderTriage`), e `review`
 * colidia com a linguagem ubíqua de governança (review-as-artifact / lanes
 * technical_audit·architectural_review / `review:check`). `review` permanece
 * como ALIAS transitório (compat) — a arquitetura nova nasce com o nome certo.
 */
export class TriageCommand implements Command<TriageOptions> {
  readonly name = "triage";
  readonly aliases: readonly string[] = ["review"];

  constructor(private readonly triageMainFn: TriageMainFn = triageMain) {}

  parse(argv: readonly string[]): TriageOptions {
    const raw = argv[0];
    if (raw === undefined || raw === "") return {};
    const pr = Number(raw);
    if (!Number.isInteger(pr) || pr <= 0) {
      throw new Error(`PR inválido: "${raw}". Use um inteiro positivo.`);
    }
    return { pr };
  }

  async run(options: TriageOptions, context: CommandContext): Promise<CommandResult> {
    const code = await this.triageMainFn([], {
      repoRoot: context.repoRoot,
      logger: context.logger,
      reviewArgs: options.pr !== undefined ? { pr: options.pr } : {},
    });
    return { exitCode: code };
  }
}

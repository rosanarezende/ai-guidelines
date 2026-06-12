import { Command, CommandContext, CommandResult } from "../Command.js";
import { normalizeRole, runReviewBrief } from "../../reviewBrief.js";
import { TriageCommand } from "./TriageCommand.js";

/** Assinatura injetável do briefing — real por default, fake em teste. */
export type RunReviewBriefFn = typeof runReviewBrief;

export interface ReviewCommandOptions {
  /** Papel normalizado quando o argumento é uma lane de review. */
  readonly role?: string;
  /** Args originais para delegação ao triage (compat `review [<pr>]`). */
  readonly rest: readonly string[];
  readonly noRemote: boolean;
}

/**
 * Comando `review` — a linguagem ubíqua de governança assume o verbo (CO-4):
 *
 *   `review technical-audit` | `review architectural-review`
 *     → briefing GOVERNADO situado da lane (papel, modo inferido, objeto
 *       auditado, artefato-alvo, vetores, proibições, validações). Projeção
 *       determinística do contrato; zero LLM (ADR 0018).
 *
 *   `review [<pr>]` (numérico/vazio)
 *     → DELEGA ao `triage` (compat com o contrato publicado v1.1.0 — o alias
 *       transitório virou delegação; `triage` segue como nome canônico da
 *       triagem de comentários).
 */
export class ReviewCommand implements Command<ReviewCommandOptions> {
  readonly name = "review";
  readonly description =
    "Briefing governado de review por lane (technical-audit | architectural-review); `review [<pr>]` delega ao triage (compat).";
  readonly usage = ["review technical-audit", "review architectural-review", "review 26"];

  constructor(
    private readonly runBriefFn: RunReviewBriefFn = runReviewBrief,
    private readonly triage: TriageCommand = new TriageCommand()
  ) {}

  parse(argv: readonly string[]): ReviewCommandOptions {
    const positional = argv.filter((arg) => !arg.startsWith("--"));
    const role = positional[0] !== undefined ? normalizeRole(positional[0]) : null;
    return {
      ...(role ? { role } : {}),
      rest: argv,
      noRemote: argv.includes("--no-remote"),
    };
  }

  async run(options: ReviewCommandOptions, context: CommandContext): Promise<CommandResult> {
    if (options.role) {
      const exitCode = this.runBriefFn(
        context.repoRoot,
        options.role,
        context.logger,
        options.noRemote ? null : undefined
      );
      return { exitCode };
    }
    // Compat: `review` sem lane = triagem de comentários de PR (contrato v1.1.0).
    const triageOptions = this.triage.parse(options.rest);
    return this.triage.run(triageOptions, context);
  }
}

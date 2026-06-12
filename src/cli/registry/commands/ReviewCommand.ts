import { Command, CommandContext, CommandResult } from "../Command.js";
import { runReviewBrief } from "../../reviewBrief.js";
import {
  parseTypeAddArgs,
  runReviewPolicy,
  runReviewTypeAdd,
  runReviewTypes,
} from "../../reviewTypesCli.js";
import { TriageCommand } from "./TriageCommand.js";

/** Assinatura injetável do briefing — real por default, fake em teste. */
export type RunReviewBriefFn = typeof runReviewBrief;

export interface ReviewCommandOptions {
  /** Subcomando de configuração (types | policy | type-add) quando presente. */
  readonly subcommand?: "types" | "policy" | "type-add";
  /** Argumento bruto de tipo/lane (resolvido contra o catálogo no run). */
  readonly typeArg?: string;
  /** Args originais para delegação ao triage (compat `review [<pr>]`). */
  readonly rest: readonly string[];
  readonly noRemote: boolean;
  /** Valor bruto de --authorization (validado pelo runner; fail-closed). */
  readonly authorization?: string;
}

/**
 * Comando `review` — a linguagem ubíqua de governança assume o verbo (CO-4):
 *
 *   `review <tipo>`           → briefing GOVERNADO situado do tipo (nativo OU
 *                               customizado — catálogo em review_types).
 *   `review types`            → lista o catálogo (origem, status, aliases,
 *                               requirement default, aplicabilidade).
 *   `review policy`           → requirements EFETIVOS no contexto atual.
 *   `review type add <slug>`  → cria tipo customizado na policy canônica.
 *   `review [<pr>]`           → DELEGA ao `triage` (compat contrato v1.1.0).
 *
 * Projeção determinística do contrato; zero LLM (ADR 0018).
 */
export class ReviewCommand implements Command<ReviewCommandOptions> {
  readonly name = "review";
  readonly description =
    "Briefing governado por tipo de review (catálogo extensível: `review types`); `review [<pr>]` delega ao triage (compat).";
  readonly usage = [
    "review technical-audit",
    "review technical-audit --authorization explicit-review-request",
    "review architectural-review",
    "review types",
    "review policy",
    "review type add security-review --title 'Security Review' --objective '...' --vector secrets",
    "review 26",
  ];

  constructor(
    private readonly runBriefFn: RunReviewBriefFn = runReviewBrief,
    private readonly triage: TriageCommand = new TriageCommand()
  ) {}

  parse(argv: readonly string[]): ReviewCommandOptions {
    let authorization: string | undefined;
    const positional: string[] = [];
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === "--authorization") {
        authorization = argv[++i];
      } else if (arg.startsWith("--authorization=")) {
        authorization = arg.slice("--authorization=".length);
      } else if (!arg.startsWith("--")) {
        positional.push(arg);
      }
    }
    const head = positional[0];
    let subcommand: ReviewCommandOptions["subcommand"];
    if (head === "types") subcommand = "types";
    else if (head === "policy") subcommand = "policy";
    else if (head === "type" && positional[1] === "add") subcommand = "type-add";
    const typeArg =
      subcommand === undefined && head !== undefined && !/^\d+$/.test(head) ? head : undefined;
    return {
      ...(subcommand ? { subcommand } : {}),
      ...(typeArg !== undefined ? { typeArg } : {}),
      rest: argv,
      noRemote: argv.includes("--no-remote"),
      ...(authorization !== undefined ? { authorization } : {}),
    };
  }

  async run(options: ReviewCommandOptions, context: CommandContext): Promise<CommandResult> {
    if (options.subcommand === "types") {
      return { exitCode: runReviewTypes(context.repoRoot, context.logger) };
    }
    if (options.subcommand === "policy") {
      return { exitCode: runReviewPolicy(context.repoRoot, context.logger) };
    }
    if (options.subcommand === "type-add") {
      // rest contém ["type", "add", <slug>, ...flags] — corta o prefixo.
      const addArgv = options.rest.slice(options.rest.indexOf("add") + 1);
      const parsed = parseTypeAddArgs(addArgv);
      if (!parsed) {
        context.logger.error(
          "❌ uso: review type add <slug> --title ... --objective ... --vector ..."
        );
        return { exitCode: 2 };
      }
      return { exitCode: runReviewTypeAdd(context.repoRoot, parsed, context.logger) };
    }
    if (options.typeArg) {
      const exitCode = this.runBriefFn(
        context.repoRoot,
        options.typeArg,
        context.logger,
        options.noRemote ? null : undefined,
        options.authorization
      );
      return { exitCode };
    }
    // Compat: `review` sem lane = triagem de comentários de PR (contrato v1.1.0).
    const triageOptions = this.triage.parse(options.rest);
    return this.triage.run(triageOptions, context);
  }
}

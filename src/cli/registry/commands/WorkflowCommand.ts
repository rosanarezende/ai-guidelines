import { Command, CommandContext, CommandResult } from "../Command.js";
import { RunPublishStateOptions, PublishStateArgs, main as workflowMain } from "../../workflow.js";
import { parseFlags, stringFlag } from "../parseFlags.js";

export type WorkflowMainFn = (
  argv: readonly string[],
  opts: RunPublishStateOptions
) => Promise<number>;

/**
 * Options do `workflow` — união discriminada por subcomando. `workflow` sem
 * subcomando abre o wizard interativo; `workflow publish-state` projeta o estado
 * com os args declarados. O contrato `Command` (um `parse → TOptions`) acomoda
 * subcomando via união, sem precisar de um "tipo de Command" novo.
 */
export type WorkflowOptions =
  | { readonly kind: "wizard" }
  | { readonly kind: "publish-state"; readonly args: PublishStateArgs };

/**
 * Adapter de `workflow` ao contrato `Command`. `parse` distingue wizard vs
 * `publish-state` (+ flags kebab→camel via tokenizador); `run` delega ao
 * `workflow.main` existente.
 */
export class WorkflowCommand implements Command<WorkflowOptions> {
  readonly name = "workflow";
  readonly description =
    "Operações avançadas da spec/stack (publish-state, Integration PR, merge, índice, drift, prompt visual). O guia humano principal é `npm run flow`.";
  readonly usage = ["workflow", "workflow publish-state --status=active --updated-by=@maintainer"];
  /** Subcomandos introspectáveis (read-only) — base do resolver `registry-command:workflow/<sub>` (CO-3). */
  readonly subcommands = ["publish-state"] as const;

  constructor(private readonly workflowMainFn: WorkflowMainFn = workflowMain) {}

  parse(argv: readonly string[]): WorkflowOptions {
    const { positionals, flags } = parseFlags(argv);
    if (positionals[0] === "publish-state") {
      const args: {
        status?: string;
        updatedBy?: string;
        title?: string;
        baseBranch?: string;
        lastSyncCommit?: string;
      } = {};
      const status = stringFlag(flags, "status");
      if (status !== undefined) args.status = status;
      const updatedBy = stringFlag(flags, "updated-by");
      if (updatedBy !== undefined) args.updatedBy = updatedBy;
      const title = stringFlag(flags, "title");
      if (title !== undefined) args.title = title;
      const baseBranch = stringFlag(flags, "base-branch");
      if (baseBranch !== undefined) args.baseBranch = baseBranch;
      const lastSyncCommit = stringFlag(flags, "last-sync-commit");
      if (lastSyncCommit !== undefined) args.lastSyncCommit = lastSyncCommit;
      return { kind: "publish-state", args };
    }
    return { kind: "wizard" };
  }

  async run(options: WorkflowOptions, context: CommandContext): Promise<CommandResult> {
    if (options.kind === "publish-state") {
      const code = await this.workflowMainFn(["workflow", "publish-state"], {
        repoRoot: context.repoRoot,
        logger: context.logger,
        publishStateArgs: options.args,
      });
      return { exitCode: code };
    }
    const code = await this.workflowMainFn(["workflow"], {
      repoRoot: context.repoRoot,
      logger: context.logger,
      ...(context.prompts ? { prompts: context.prompts } : {}),
    });
    return { exitCode: code };
  }
}

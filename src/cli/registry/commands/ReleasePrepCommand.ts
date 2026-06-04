import { Command, CommandContext, CommandResult } from "../Command.js";
import {
  ReleasePrepCliArgs,
  ReleasePrepRunOptions,
  main as releasePrepMain,
} from "../../release-prep.js";
import { parseFlags, stringFlag, boolFlag } from "../parseFlags.js";

export type ReleasePrepMainFn = (
  argv: readonly string[],
  opts: ReleasePrepRunOptions & { releasePrepArgs?: ReleasePrepCliArgs }
) => Promise<number>;

/**
 * Adapter de `release-prep` (tier-3 standalone) ao contrato `Command`. `parse`
 * lê as flags (--version=, --remote=, --dry-run, --skip-working-tree-check) via
 * o tokenizador compartilhado; `run` delega ao `release-prep.main` existente.
 */
export class ReleasePrepCommand implements Command<ReleasePrepCliArgs> {
  readonly name = "release-prep";

  constructor(private readonly releasePrepMainFn: ReleasePrepMainFn = releasePrepMain) {}

  parse(argv: readonly string[]): ReleasePrepCliArgs {
    const { flags } = parseFlags(argv, { booleans: ["dry-run", "skip-working-tree-check"] });
    const args: {
      version?: string;
      remote?: string;
      dryRun?: boolean;
      skipWorkingTreeCheck?: boolean;
    } = {};
    const version = stringFlag(flags, "version");
    if (version !== undefined) args.version = version;
    const remote = stringFlag(flags, "remote");
    if (remote !== undefined) args.remote = remote;
    if (boolFlag(flags, "dry-run")) args.dryRun = true;
    if (boolFlag(flags, "skip-working-tree-check")) args.skipWorkingTreeCheck = true;
    return args;
  }

  async run(options: ReleasePrepCliArgs, context: CommandContext): Promise<CommandResult> {
    const code = await this.releasePrepMainFn([], {
      repoRoot: context.repoRoot,
      logger: context.logger,
      releasePrepArgs: options,
    });
    return { exitCode: code };
  }
}

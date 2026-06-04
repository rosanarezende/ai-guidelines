import { Command, CommandContext, CommandResult } from "../Command.js";
import { renderActiveSpecsIndex } from "../../workflow.js";
import { LoadActiveSpecsIndex, loadActiveSpecsIndex } from "./loadActiveSpecsIndex.js";

/**
 * Comando `specs` — lista as specs ativas do índice operacional público
 * (`.governance/runtime/active-specs.yml`). Read-only, sem prompts (etapa 2 do
 * #35: convergência da op avançada "list-active-specs" para Command + Intent).
 *
 * Reaproveita o renderer puro `renderActiveSpecsIndex` (lookup de estado
 * declarado, sem inferência — cf. memory `feedback-lookup-not-coordination`).
 * `showWhenAbsent` preserva o comportamento do handler legado: mostra o bloco do
 * índice mesmo quando ausente, com a dica de `publish-state`.
 *
 * Nome provisório (`specs`) — a taxonomia final (`state` namespace) está deferida;
 * a ESTRUTURA (Command read-only registrado + Intent) é o que está cravado.
 */
export class ListActiveSpecsCommand implements Command<void> {
  readonly name = "specs";

  constructor(private readonly loadIndex: LoadActiveSpecsIndex = loadActiveSpecsIndex) {}

  parse(_argv: readonly string[]): void {
    return undefined;
  }

  async run(_options: void, context: CommandContext): Promise<CommandResult> {
    const result = this.loadIndex(context.repoRoot);
    for (const line of renderActiveSpecsIndex(result, undefined, { showWhenAbsent: true })) {
      context.logger.info(line);
    }
    return { exitCode: 0 };
  }
}

import { Command, CommandContext, CommandResult } from "../Command.js";
import { LoadActiveSpecsIndex, loadActiveSpecsIndex } from "./loadActiveSpecsIndex.js";

/**
 * Comando `drift` — diagnostica drift do índice operacional público: entries cujo
 * `spec_path` declarado não existe no filesystem local (branch não checada ou path
 * renomeado desde o último `publish-state`). Read-only, sem prompts (etapa 2 do
 * #35: convergência da op avançada "diagnose-drift" para Command + Intent).
 *
 * Drift guard SOFT (cf. ListActiveSpecs): paths ausentes não falham — apenas
 * informam. Lookup de estado declarado, sem inferência (memory
 * `feedback-lookup-not-coordination`). A lógica migrou verbatim do handler legado
 * `runAdvancedOps` (que a perde na etapa 5).
 *
 * Nome `drift` provisório (taxonomia `state` deferida); a ESTRUTURA é o cravado.
 */
export class DiagnoseDriftCommand implements Command<void> {
  readonly name = "drift";
  readonly description =
    "Diagnostica drift do índice público: spec_path declarado que não existe no filesystem local. Read-only.";
  readonly usage = ["drift"];

  constructor(private readonly loadIndex: LoadActiveSpecsIndex = loadActiveSpecsIndex) {}

  parse(_argv: readonly string[]): void {
    return undefined;
  }

  async run(_options: void, context: CommandContext): Promise<CommandResult> {
    const { logger } = context;
    const result = this.loadIndex(context.repoRoot);

    if (!result.indexAvailable) {
      logger.info(
        "Índice operacional público (.governance/runtime/specs/active.yml) não encontrado."
      );
      logger.info("Dica: rode `npx ai-guidelines workflow publish-state` na branch da spec.");
      return { exitCode: 0 };
    }

    const drifted = result.entries.filter((resolved) => !resolved.specPathExists);
    if (drifted.length === 0) {
      logger.info("Nenhum drift detectado: todos os spec_path existem no filesystem.");
    } else {
      logger.info(`${drifted.length} entry(ies) com drift:`);
      for (const resolved of drifted) {
        logger.info(
          `  - ${resolved.entry.slug} (${resolved.entry.branch}): spec_path "${resolved.entry.specPath}" inexistente.`
        );
      }
    }
    return { exitCode: 0 };
  }
}

import { Command, CommandContext, CommandResult } from "../Command.js";
import {
  diagnoseGovernanceDrift,
  GovernanceDoctorDeps,
  renderGovernanceDoctorReport,
} from "../../governanceDoctor.js";
import { LoadActiveSpecsIndex } from "./loadActiveSpecsIndex.js";

/**
 * Comando `drift` — roda o Governance Doctor em modo read-only.
 *
 * O comando não aplica reparos. Ele agrega checks já existentes e explica, em
 * linguagem humana, qual drift foi encontrado, por que importa e qual caminho
 * governado deve ser usado para reparar sem edição manual espalhada.
 */
export class DiagnoseDriftCommand implements Command<void> {
  readonly name = "drift";
  readonly description = "Diagnostica drift de governança e explica reparos seguros. Read-only.";
  readonly usage = ["drift"];

  private readonly deps: GovernanceDoctorDeps;

  constructor(depsOrLoadIndex: GovernanceDoctorDeps | LoadActiveSpecsIndex = {}) {
    this.deps =
      typeof depsOrLoadIndex === "function" ? { loadIndex: depsOrLoadIndex } : depsOrLoadIndex;
  }

  parse(_argv: readonly string[]): void {
    return undefined;
  }

  async run(_options: void, context: CommandContext): Promise<CommandResult> {
    const { logger } = context;
    const report = diagnoseGovernanceDrift(context.repoRoot, this.deps);
    for (const line of renderGovernanceDoctorReport(report)) logger.info(line);
    return { exitCode: 0 };
  }
}

import { Command, CommandContext, CommandResult } from "../Command.js";
import {
  diagnoseGovernanceDrift,
  GovernanceDoctorDeps,
  renderGovernanceDoctorReport,
} from "../../governanceDoctor.js";
import { deriveGovernancePreflight, renderGovernancePreflight } from "../../governancePreflight.js";
import { LoadActiveSpecsIndex } from "./loadActiveSpecsIndex.js";

export interface DiagnoseDriftOptions {
  readonly check: boolean;
}

/**
 * Comando `drift` — roda o Governance Doctor em modo read-only.
 *
 * O comando não aplica reparos. Ele agrega checks já existentes e explica, em
 * linguagem humana, qual drift foi encontrado, por que importa e qual caminho
 * governado deve ser usado para reparar sem edição manual espalhada.
 */
export class DiagnoseDriftCommand implements Command<DiagnoseDriftOptions> {
  readonly name = "drift";
  readonly description = "Diagnostica drift de governança e explica reparos seguros. Read-only.";
  readonly usage = ["drift", "drift --check"];

  private readonly deps: GovernanceDoctorDeps;

  constructor(depsOrLoadIndex: GovernanceDoctorDeps | LoadActiveSpecsIndex = {}) {
    this.deps =
      typeof depsOrLoadIndex === "function" ? { loadIndex: depsOrLoadIndex } : depsOrLoadIndex;
  }

  parse(argv: readonly string[]): DiagnoseDriftOptions {
    return { check: argv.includes("--check") };
  }

  async run(options: DiagnoseDriftOptions, context: CommandContext): Promise<CommandResult> {
    const { logger } = context;
    const report = diagnoseGovernanceDrift(context.repoRoot, this.deps);
    if (options.check) {
      const preflight = deriveGovernancePreflight(report, "hook");
      if (preflight.shouldRender) {
        for (const line of renderGovernancePreflight(preflight)) logger.info(line);
      } else {
        for (const line of renderGovernanceDoctorReport(report)) logger.info(line);
      }
      return { exitCode: preflight.shouldBlock ? 1 : 0 };
    }

    for (const line of renderGovernanceDoctorReport(report)) logger.info(line);
    return { exitCode: 0 };
  }
}

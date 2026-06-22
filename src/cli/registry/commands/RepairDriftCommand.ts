import { Command, CommandContext, CommandResult } from "../Command.js";
import { boolFlag, parseFlags, stringFlag } from "../parseFlags.js";
import { diagnoseGovernanceDrift, GovernanceDoctorReport } from "../../governanceDoctor.js";
import { FLOW_COPY, formatCopy } from "../../copy/flowCopy.js";
import { NodeWorkflowFileSystem } from "../../../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { WorkflowFileSystem } from "../../../app/ports/WorkflowFileSystem.js";
import { applyRepairPlan } from "../../repair/RepairPlan.js";
import {
  BranchProjectionPlanResult,
  buildBranchProjectionRepairPlan,
} from "../../repair/branchProjectionRepair.js";
import {
  renderNonAutomaticIssues,
  renderRepairPlan,
  selectBranchStaleIssues,
  selectNonAutomaticIssues,
} from "../../repair/governanceRepair.js";

const COPY = FLOW_COPY.governanceRepair;

export interface RepairDriftOptions {
  /** `--apply`: escreve de fato (com confirmação). Sem ela, só preview. */
  readonly apply: boolean;
  /** `--updated-by=@autor`: quem autoriza o reparo. */
  readonly updatedBy?: string;
}

/**
 * Dependências injetáveis (testes). Em produção, defaults reais.
 */
export interface RepairDriftDeps {
  readonly diagnose?: (repoRoot: string) => GovernanceDoctorReport;
  readonly buildPlan?: (
    issueId: string,
    repoRoot: string,
    opts: { updatedBy?: string }
  ) => BranchProjectionPlanResult;
  readonly fs?: (repoRoot: string) => WorkflowFileSystem;
  readonly confirm?: (context: CommandContext) => Promise<boolean>;
}

/**
 * Comando `repair` — camada de reparo do Governance Doctor (CO-10.8.1).
 *
 * Por padrão é PREVIEW (read-only): diagnostica, monta o plano e mostra o que
 * mudaria — sem escrever. `--apply` aplica, mas só depois de confirmação
 * (interativa quando há wizard; o próprio `--apply` é o gesto deliberado na CLI
 * scriptada). Depois de aplicar, revalida e confirma que o drift sumiu.
 *
 * O comando `drift` segue puramente read-only; o reparo vive aqui para não
 * misturar diagnóstico e escrita na mesma superfície.
 *
 * Escopo atual: só Drift #1 (branch ≠ active.yml), autoridade `confirm`. Drifts
 * de topologia/Ready/Human Gate NÃO são reparados aqui (decisão humana).
 */
export class RepairDriftCommand implements Command<RepairDriftOptions> {
  readonly name = "repair";
  readonly description = COPY.command.description;
  readonly usage = COPY.command.usage;

  constructor(private readonly deps: RepairDriftDeps = {}) {}

  parse(argv: readonly string[]): RepairDriftOptions {
    const { flags } = parseFlags(argv, { booleans: ["apply"] });
    return {
      apply: boolFlag(flags, "apply"),
      updatedBy: stringFlag(flags, "updated-by"),
    };
  }

  async run(options: RepairDriftOptions, context: CommandContext): Promise<CommandResult> {
    const { logger, repoRoot } = context;
    const diagnose = this.deps.diagnose ?? diagnoseGovernanceDrift;

    const report = diagnose(repoRoot);
    const repairable = selectBranchStaleIssues(report);
    const nonAutomatic = selectNonAutomaticIssues(report);
    if (repairable.length === 0) {
      logger.info(COPY.status.noneRepairable);
      if (nonAutomatic.length > 0) {
        logger.info(COPY.status.nonAutomaticIntro);
        for (const line of renderNonAutomaticIssues(nonAutomatic)) logger.info(line);
      }
      return { exitCode: 0 };
    }

    const buildPlan = this.deps.buildPlan ?? defaultBuildPlan;
    const planResult = buildPlan(repairable[0].id, repoRoot, { updatedBy: options.updatedBy });
    if (planResult.kind === "needs-updated-by") {
      logger.info(COPY.status.needsUpdatedBy);
      return { exitCode: 0 };
    }
    if (planResult.kind === "not-applicable") {
      logger.info(COPY.status.noneRepairable);
      return { exitCode: 0 };
    }

    const plan = planResult.plan;
    for (const line of renderRepairPlan(plan)) logger.info(line);

    if (!options.apply) {
      logger.info("");
      logger.info(COPY.status.previewOnly);
      return { exitCode: 0 };
    }

    const confirm = this.deps.confirm ?? defaultConfirm;
    const confirmed = await confirm(context);
    if (!confirmed) {
      logger.info(COPY.status.cancelled);
      return { exitCode: 0 };
    }

    const fs = (this.deps.fs ?? ((root) => new NodeWorkflowFileSystem(root)))(repoRoot);
    const result = applyRepairPlan(plan, fs);
    logger.info(formatCopy(COPY.status.applied, { files: result.written.join(", ") }));

    const after = diagnose(repoRoot);
    const stillStale = selectBranchStaleIssues(after).length > 0;
    logger.info(stillStale ? COPY.status.validatedStill : COPY.status.validatedOk);

    return { exitCode: 0 };
  }
}

function defaultBuildPlan(
  issueId: string,
  repoRoot: string,
  opts: { updatedBy?: string }
): BranchProjectionPlanResult {
  const fs = new NodeWorkflowFileSystem(repoRoot);
  return buildBranchProjectionRepairPlan(issueId, { fs, updatedBy: opts.updatedBy });
}

async function defaultConfirm(context: CommandContext): Promise<boolean> {
  // Na superfície humana (wizard) pergunta; na CLI scriptada, `--apply` já é o
  // gesto deliberado de autorização.
  if (context.prompts) {
    return context.prompts.confirm({ message: COPY.confirm.message });
  }
  return true;
}

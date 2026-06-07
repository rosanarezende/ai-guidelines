/**
 * CLI standalone para `yarn guidelines release-prep` (tier 3).
 *
 * Cravado em `[DEC-0023-L01]` (Bloco L). Repo-specific (não framework):
 * só faz sentido para repos que publicam em npm. Distinção cravada em
 * ADR 0024 seção "Operational CLI commands" — tier 3 fica standalone
 * para não poluir wizard de consumer repos sem publish flow.
 *
 * Flow:
 *   1. `ReleasePrep.plan(input)` — detecta versão, valida pre-flight
 *   2. Mostra plan completo via logger (sempre, mesmo em execute)
 *   3. Se `--dry-run`: retorna sem executar
 *   4. Caso contrário: confirma via prompt + executa (bump + commit + tag + push)
 *   5. Tag push dispara `.github/workflows/release.yml` automaticamente
 *
 * Flags suportadas (recebidas via `ReleasePrepCliArgs`):
 *   --version <X.Y.Z>            override da versão alvo
 *   --remote <name>              remote para push (default "origin")
 *   --dry-run                    mostra plan e sai (sem side-effect)
 *   --skip-working-tree-check    bypass do check de working tree clean (emergência)
 */

import { GitOps } from "../app/ports/GitOps.js";
import { Prompts } from "../app/ports/Prompts.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { ReleasePrep, ReleasePrepError, ReleasePrepPlan } from "../app/workflow/ReleasePrep.js";
import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { NodeGit } from "../infrastructure/git/NodeGit.js";
import { InquirerPrompts } from "../infrastructure/io/InquirerPrompts.js";
import { Logger } from "./workflow.js";

export interface ReleasePrepCliArgs {
  readonly version?: string;
  readonly remote?: string;
  readonly dryRun?: boolean;
  readonly skipWorkingTreeCheck?: boolean;
}

export interface ReleasePrepRunOptions {
  readonly repoRoot: string;
  readonly logger?: Logger;
  readonly prompts?: Prompts;
  readonly fs?: WorkflowFileSystem;
  /** Injetável para tests. Default: `NodeGit` real (execFileSync). */
  readonly git?: GitOps;
  /** Injetável para tests. Default: hoje (ISO YYYY-MM-DD). */
  readonly today?: string;
}

const stdoutLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export async function runReleasePrep(
  options: ReleasePrepRunOptions,
  args: ReleasePrepCliArgs = {}
): Promise<number> {
  const logger = options.logger ?? stdoutLogger;
  const fs = options.fs ?? new NodeWorkflowFileSystem(options.repoRoot);
  const git = options.git ?? new NodeGit(options.repoRoot);
  const prompts = options.prompts ?? new InquirerPrompts();

  const useCase = new ReleasePrep(fs, git);

  let plan: ReleasePrepPlan;
  try {
    plan = useCase.plan({
      versionOverride: args.version,
      remote: args.remote,
      today: options.today,
      skipWorkingTreeCheck: args.skipWorkingTreeCheck,
    });
  } catch (err) {
    if (err instanceof ReleasePrepError) {
      logger.error(err.message);
    } else {
      logger.error(
        `Falha ao planejar release: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return 1;
  }

  // Plan sempre mostrado (mesmo em execute) — auditoria visível.
  logger.info("");
  logger.info("📦 Release prep plan");
  logger.info("");
  logger.info(`  Branch:           ${plan.branch}`);
  logger.info(`  Versão atual:     ${plan.currentVersion}`);
  logger.info(`  Versão alvo:      ${plan.targetVersion}`);
  logger.info(`  Tag:              ${plan.tag}`);
  logger.info(`  Remote:           ${plan.remote}`);
  logger.info(`  Data CHANGELOG:   ${plan.date}`);
  logger.info(`  Pre-release:      ${plan.isPrerelease ? "sim" : "não"}`);
  logger.info(`  dist-tag npm:     ${plan.distTag}`);
  logger.info("");
  logger.info(`  Steps (${plan.steps.length}):`);
  for (let i = 0; i < plan.steps.length; i++) {
    logger.info(`    ${i + 1}. ${plan.steps[i].description}`);
  }
  logger.info("");

  if (args.dryRun) {
    logger.info("--dry-run: plan mostrado, nenhum side-effect executado.");
    return 0;
  }

  logger.info(
    "ATENÇÃO: side-effects IRREVERSÍVEIS — bump de version, commit, push, tag, publish em npm via workflow."
  );
  logger.info("");

  const confirmed = await prompts.confirm({
    message: `Confirmar release ${plan.targetVersion} (dist-tag '${plan.distTag}')?`,
    default: false,
  });
  if (!confirmed) {
    logger.info("Release cancelada.");
    return 0;
  }

  try {
    useCase.execute(plan);
    logger.info("");
    logger.info(`✓ Release ${plan.targetVersion} preparada e tag ${plan.tag} pushed.`);
    logger.info(
      `→ Workflow .github/workflows/release.yml dispara automaticamente. Acompanhe em GitHub Actions.`
    );
    return 0;
  } catch (err) {
    if (err instanceof ReleasePrepError) {
      logger.error(err.message);
    } else {
      logger.error(
        `Falha ao executar release-prep: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return 1;
  }
}

/**
 * Entrypoint invocado por `ReleasePrepCommand` (registry) via
 * `dist/cli/release-prep.js`. As flags vêm via `opts.releasePrepArgs`.
 */
export async function main(
  opts: ReleasePrepRunOptions & { releasePrepArgs?: ReleasePrepCliArgs }
): Promise<number> {
  return runReleasePrep(opts, opts.releasePrepArgs ?? {});
}

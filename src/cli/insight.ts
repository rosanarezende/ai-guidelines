/**
 * CLI do tier "Percepções em Trânsito".
 *
 * Comandos:
 *   `ai-guidelines insight add "<texto>" [--note ...] [--link PIT-NNNN]`
 *   `ai-guidelines insight saw <PIT-NNNN> [--note ...]`
 *   `ai-guidelines insight list`
 *
 * Composition root: monta FileInsightStore + SystemClock + use-cases e deriva
 * a origem (spec/cursor) da spec ativa. Nenhuma lógica de domínio vive aqui.
 */
import { OriginContext } from "../domain/insight/Insight.js";
import { recurrenceOf, specsTouched } from "../domain/insight/Insight.js";
import { GovernanceError } from "../domain/shared/errors.js";
import { Clock } from "../app/ports/Clock.js";
import { InsightStore } from "../app/ports/InsightStore.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { CaptureInsight } from "../app/use-cases/CaptureInsight.js";
import { ListOpenInsights } from "../app/use-cases/ListOpenInsights.js";
import { RecordRecurrence } from "../app/use-cases/RecordRecurrence.js";
import { DetectActiveSpec } from "../app/workflow/DetectActiveSpec.js";
import { ReadWorkflowState } from "../app/workflow/ReadWorkflowState.js";
import { deriveOrigin } from "../app/workflow/deriveOrigin.js";
import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { SystemClock } from "../infrastructure/time/SystemClock.js";
import { FileInsightStore } from "../infrastructure/yaml/FileInsightStore.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";

export interface Logger {
  info(msg: string): void;
  error(msg: string): void;
}

const stdoutLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export interface InsightRunOptions {
  readonly repoRoot: string;
  readonly logger?: Logger;
  readonly fs?: WorkflowFileSystem;
  readonly clock?: Clock;
  /** Injetável para tests; default lê `.governance/runtime/insights.yml`. */
  readonly store?: InsightStore;
}

interface ParsedArgs {
  readonly positionals: ReadonlyArray<string>;
  readonly note?: string;
  readonly links: ReadonlyArray<string>;
}

function parseInsightArgs(args: ReadonlyArray<string>): ParsedArgs {
  const positionals: string[] = [];
  const links: string[] = [];
  let note: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--note") note = args[++i];
    else if (arg.startsWith("--note=")) note = arg.slice("--note=".length);
    else if (arg === "--link") {
      const value = args[++i];
      if (value) links.push(value);
    } else if (arg.startsWith("--link=")) links.push(arg.slice("--link=".length));
    else positionals.push(arg);
  }
  return { positionals, note, links };
}

function buildFs(options: InsightRunOptions): WorkflowFileSystem {
  return options.fs ?? new NodeWorkflowFileSystem(options.repoRoot);
}

function buildStore(options: InsightRunOptions, fs: WorkflowFileSystem): InsightStore {
  return options.store ?? new FileInsightStore(fs);
}

function resolveOrigin(fs: WorkflowFileSystem, logger: Logger): OriginContext | null {
  const detected = new DetectActiveSpec(fs).run();
  if (!detected.location) {
    logger.error(`Não foi possível detectar spec ativa: ${detected.reason}`);
    logger.error(`Dica: confira o branch (esperado: feat/spec-NNNN-slug).`);
    return null;
  }
  const { state } = new ReadWorkflowState(fs, parseWorkflowState).run(detected.location);
  return deriveOrigin(detected.location, state);
}

function reportError(err: unknown, logger: Logger): number {
  if (err instanceof GovernanceError) {
    logger.error(`[${err.code}] ${err.message}`);
    return 1;
  }
  logger.error(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
  return 1;
}

function runAdd(rest: ReadonlyArray<string>, options: InsightRunOptions, logger: Logger): number {
  const { positionals, note, links } = parseInsightArgs(rest);
  const text = positionals.join(" ").trim();
  if (!text) {
    logger.error(`Uso: ai-guidelines insight add "<texto>" [--note "..."] [--link PIT-NNNN]`);
    return 2;
  }
  const fs = buildFs(options);
  const store = buildStore(options, fs);
  const clock = options.clock ?? new SystemClock();
  const origin = resolveOrigin(fs, logger);
  if (!origin) return 1;
  try {
    const insight = new CaptureInsight({ store, clock }).execute({
      text,
      origin,
      ...(note !== undefined ? { note } : {}),
      ...(links.length > 0 ? { links } : {}),
    });
    logger.info(
      `Capturada ${insight.id} (spec ${origin.spec}${origin.cursor ? ` / ${origin.cursor}` : ""}).`
    );
    return 0;
  } catch (err) {
    return reportError(err, logger);
  }
}

function runSaw(rest: ReadonlyArray<string>, options: InsightRunOptions, logger: Logger): number {
  const { positionals, note } = parseInsightArgs(rest);
  const id = positionals[0];
  if (!id) {
    logger.error(`Uso: ai-guidelines insight saw <PIT-NNNN> [--note "..."]`);
    return 2;
  }
  const fs = buildFs(options);
  const store = buildStore(options, fs);
  const clock = options.clock ?? new SystemClock();
  const origin = resolveOrigin(fs, logger);
  if (!origin) return 1;
  try {
    const updated = new RecordRecurrence({ store, clock }).execute({
      id,
      origin,
      ...(note !== undefined ? { note } : {}),
    });
    logger.info(`Recorrência registrada em ${updated.id} (visto ${updated.occurrences.length}×).`);
    return 0;
  } catch (err) {
    return reportError(err, logger);
  }
}

function runList(options: InsightRunOptions, logger: Logger): number {
  const fs = buildFs(options);
  const store = buildStore(options, fs);
  try {
    const open = new ListOpenInsights({ store }).execute();
    if (open.length === 0) {
      logger.info("Nenhuma percepção viva no ledger.");
      return 0;
    }
    logger.info(`Percepções vivas (${open.length}):`);
    for (const insight of open) {
      const specs = specsTouched(insight).join(",");
      logger.info(`  ${insight.id} · visto ${recurrenceOf(insight)}× [${specs}] — ${insight.text}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, logger);
  }
}

/** Entrypoint (argv[0] === "insight"). Retorna exit code. */
export async function main(
  argv: ReadonlyArray<string>,
  options: InsightRunOptions
): Promise<number> {
  const logger = options.logger ?? stdoutLogger;
  const sub = argv[1];
  const rest = argv.slice(2);
  switch (sub) {
    case "add":
      return runAdd(rest, options, logger);
    case "saw":
      return runSaw(rest, options, logger);
    case "list":
      return runList(options, logger);
    default:
      logger.error(`Subcomando desconhecido: ${sub ?? "(vazio)"} (use: add | saw | list).`);
      return 2;
  }
}

/**
 * CLI do tier "Percepções em Trânsito".
 *
 * Comandos:
 *   `ai-guidelines insight add "<texto>" [--note ...]`
 *   `ai-guidelines insight saw <PIT-NNNN> [--note ...]`
 *   `ai-guidelines insight list`
 *   `ai-guidelines insight promote <PIT-NNNN> --to <backlog|adr|guardrail|dec> --ref <ID> [--by @actor]`
 *   `ai-guidelines insight discard <PIT-NNNN> --reason "<motivo>" [--by @actor]`
 *
 * Composition root: monta FileInsightStore + SystemClock + use-cases e deriva
 * a origem (spec/cursor) da spec ativa. Fachada fina sobre os casos de uso —
 * nenhuma regra de domínio é reimplementada aqui.
 */
import { OriginContext } from "../domain/insight/Insight.js";
import {
  isPromotionKind,
  PROMOTION_KINDS,
  recurrenceOf,
  specsTouched,
} from "../domain/insight/Insight.js";
import { GovernanceError } from "../domain/shared/errors.js";
import { Clock } from "../app/ports/Clock.js";
import { InsightStore } from "../app/ports/InsightStore.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { CaptureInsight } from "../app/use-cases/CaptureInsight.js";
import { DiscardInsight } from "../app/use-cases/DiscardInsight.js";
import { ListOpenInsights } from "../app/use-cases/ListOpenInsights.js";
import { PromoteInsight } from "../app/use-cases/PromoteInsight.js";
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
  readonly flags: ReadonlyMap<string, ReadonlyArray<string>>;
}

/**
 * Parser genérico: positionais + flags `--key value` / `--key=value`
 * (repetíveis). O parse fino por subcomando usa {@link flagValue}/{@link flagValues}.
 */
function parseInsightArgs(args: ReadonlyArray<string>): ParsedArgs {
  const positionals: string[] = [];
  const flags = new Map<string, string[]>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      const key = eq >= 0 ? arg.slice(2, eq) : arg.slice(2);
      const value = eq >= 0 ? arg.slice(eq + 1) : (args[++i] ?? "");
      const bucket = flags.get(key) ?? [];
      bucket.push(value);
      flags.set(key, bucket);
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, flags };
}

/** Último valor não-vazio de um flag; `undefined` se ausente/vazio. */
function flagValue(parsed: ParsedArgs, name: string): string | undefined {
  const bucket = parsed.flags.get(name);
  if (!bucket || bucket.length === 0) return undefined;
  const last = bucket[bucket.length - 1];
  return last.trim() === "" ? undefined : last;
}

function buildFs(options: InsightRunOptions): WorkflowFileSystem {
  return options.fs ?? new NodeWorkflowFileSystem(options.repoRoot);
}

function buildStore(options: InsightRunOptions, fs: WorkflowFileSystem): InsightStore {
  return options.store ?? new FileInsightStore(fs);
}

function resolveOrigin(fs: WorkflowFileSystem, logger: Logger): OriginContext | null {
  const detected = new DetectActiveSpec(fs).run();
  if (!detected.location || detected.specId === undefined) {
    logger.error(`Não foi possível detectar spec ativa: ${detected.reason}`);
    logger.error(`Dica: confira o branch (esperado: feat/spec-NNNN-slug).`);
    return null;
  }
  const { state } = new ReadWorkflowState(fs, parseWorkflowState).run(detected.location);
  return deriveOrigin(detected.specId, state);
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
  const parsed = parseInsightArgs(rest);
  const text = parsed.positionals.join(" ").trim();
  if (!text) {
    logger.error(`Uso: ai-guidelines insight add "<texto>" [--note "..."]`);
    return 2;
  }
  const note = flagValue(parsed, "note");
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
  const parsed = parseInsightArgs(rest);
  const id = parsed.positionals[0];
  if (!id) {
    logger.error(`Uso: ai-guidelines insight saw <PIT-NNNN> [--note "..."]`);
    return 2;
  }
  const note = flagValue(parsed, "note");
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

function runPromote(
  rest: ReadonlyArray<string>,
  options: InsightRunOptions,
  logger: Logger
): number {
  const parsed = parseInsightArgs(rest);
  const id = parsed.positionals[0];
  const kind = flagValue(parsed, "to");
  const ref = flagValue(parsed, "ref");
  if (!id || !kind || !ref) {
    logger.error(
      `Uso: ai-guidelines insight promote <PIT-NNNN> --to <${PROMOTION_KINDS.join("|")}> --ref <ID>`
    );
    return 2;
  }
  if (!isPromotionKind(kind)) {
    logger.error(`--to inválido: "${kind}" (use: ${PROMOTION_KINDS.join(" | ")}).`);
    return 2;
  }
  const by = flagValue(parsed, "by");
  const store = buildStore(options, buildFs(options));
  const clock = options.clock ?? new SystemClock();
  try {
    const promoted = new PromoteInsight({ store, clock }).execute({
      id,
      target: { kind, ref },
      ...(by !== undefined ? { by } : {}),
    });
    logger.info(
      `Promovida ${promoted.id} → ${promoted.promotion?.kind} ${promoted.promotion?.ref}` +
        `${promoted.resolvedBy ? ` (por ${promoted.resolvedBy})` : ""}.`
    );
    return 0;
  } catch (err) {
    return reportError(err, logger);
  }
}

function runDiscard(
  rest: ReadonlyArray<string>,
  options: InsightRunOptions,
  logger: Logger
): number {
  const parsed = parseInsightArgs(rest);
  const id = parsed.positionals[0];
  const reason = flagValue(parsed, "reason");
  if (!id || !reason) {
    logger.error(`Uso: ai-guidelines insight discard <PIT-NNNN> --reason "<motivo>" [--by @actor]`);
    return 2;
  }
  const by = flagValue(parsed, "by");
  const store = buildStore(options, buildFs(options));
  const clock = options.clock ?? new SystemClock();
  try {
    const discarded = new DiscardInsight({ store, clock }).execute({
      id,
      reason,
      ...(by !== undefined ? { by } : {}),
    });
    logger.info(
      `Descartada ${discarded.id} (${discarded.discardReason})` +
        `${discarded.resolvedBy ? ` (por ${discarded.resolvedBy})` : ""}.`
    );
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
    case "promote":
      return runPromote(rest, options, logger);
    case "discard":
      return runDiscard(rest, options, logger);
    default:
      logger.error(
        `Subcomando desconhecido: ${sub ?? "(vazio)"} (use: add | saw | list | promote | discard).`
      );
      return 2;
  }
}

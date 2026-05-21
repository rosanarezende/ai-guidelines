/**
 * Workflow CLI entrypoint.
 *
 * Comandos:
 *   `ai-guidelines workflow`   — wizard interativo (REPL).
 *   `ai-guidelines continue`   — atalho: imprime briefing e a
 *                                próxima ação registrada em `state.next`
 *                                (sem REPL; não executa ações).
 *
 * Princípio (cf. decision-brief.md § DEC-0023-A03):
 *   - texto livre vira **context bundle** copy-paste para sessão IA;
 *   - **não** chamamos LLM internamente; AI-as-Channel preservado.
 */
import * as readline from "node:readline";
import { DetectActiveSpec } from "../app/workflow/DetectActiveSpec.js";
import { ReadWorkflowState } from "../app/workflow/ReadWorkflowState.js";
import {
  ListActiveSpecs,
  ListActiveSpecsResult,
  ResolvedActiveSpec,
} from "../app/workflow/ListActiveSpecs.js";
import {
  PublishState,
  PublishStateError,
  PublishStateInput,
  PublishStateResult,
} from "../app/workflow/PublishState.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";
import {
  parseActiveSpecs,
  stringifyActiveSpecs,
} from "../infrastructure/yaml/activeSpecsSerializer.js";
import { ActiveSpecStatus } from "../domain/workflow/ActiveSpecEntry.js";
import {
  SpecHeaders,
  assembleBriefing,
  extractSpecHeaders,
} from "../app/workflow/AssembleBriefing.js";
import { SpecLocation } from "../domain/workflow/SpecLocation.js";
import { WorkflowState } from "../domain/workflow/WorkflowState.js";
import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";

export interface Logger {
  info(msg: string): void;
  error(msg: string): void;
}

export interface InputReader {
  question(prompt: string): Promise<string>;
  close(): void;
}

export interface ClipboardWriter {
  copy(text: string): Promise<boolean>;
}

const stdoutLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

class StdinReader implements InputReader {
  private rl: readline.Interface;
  constructor() {
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }
  question(prompt: string): Promise<string> {
    return new Promise((resolve) => this.rl.question(prompt, resolve));
  }
  close(): void {
    this.rl.close();
  }
}

class NoopClipboard implements ClipboardWriter {
  async copy(): Promise<boolean> {
    return false;
  }
}

export interface RunOptions {
  readonly repoRoot: string;
  readonly logger?: Logger;
  readonly reader?: InputReader;
  readonly clipboard?: ClipboardWriter;
  readonly fs?: WorkflowFileSystem;
  /**
   * Injetável para tests. Default lê
   * `.governance/runtime/active-specs.yml` via `ListActiveSpecs` com o
   * parser real.
   */
  readonly loadActiveSpecsIndex?: () => ListActiveSpecsResult;
}

interface ResolvedContext {
  readonly location: SpecLocation;
  readonly state: WorkflowState;
  readonly defaulted: boolean;
  readonly headers: SpecHeaders;
}

function resolveContextFromLocation(
  fs: WorkflowFileSystem,
  location: SpecLocation
): ResolvedContext {
  const reader = new ReadWorkflowState(fs, parseWorkflowState);
  const { state, defaulted } = reader.run(location);
  const specPrefix = location.source === "governance" ? ".governance/specs" : ".specify/specs";
  const specPath = `${specPrefix}/${location.slug}`;
  const specMd = safeRead(fs, `${specPath}/spec.md`);
  const researchMd = safeRead(fs, `${specPath}/research.md`);
  const headers = extractSpecHeaders(specMd, researchMd);
  return { location, state, defaulted, headers };
}

function resolveContext(fs: WorkflowFileSystem, logger: Logger): ResolvedContext | null {
  const detect = new DetectActiveSpec(fs);
  const detected = detect.run();
  if (!detected.location) {
    logger.error(`Não foi possível detectar spec ativa: ${detected.reason}`);
    logger.error(`Dica: confira o branch (esperado: feat/spec-NNNN-slug) ou a pasta da spec.`);
    return null;
  }
  return resolveContextFromLocation(fs, detected.location);
}

/**
 * Procura no índice público uma entry cujo identifier dado case com `id`,
 * `slug` ou `${id}-${slug}` (três aliases válidos para o mesmo registro).
 * Match exato; sem fuzzy, sem partial, sem ordenação. Primeiro match ganha.
 *
 * **Lookup-only** (cf. memory `feedback-lookup-not-coordination`).
 */
export function findActiveSpecByIdentifier(
  entries: ReadonlyArray<ResolvedActiveSpec>,
  identifier: string
): ResolvedActiveSpec | null {
  for (const resolved of entries) {
    const e = resolved.entry;
    if (identifier === e.id || identifier === e.slug || identifier === `${e.id}-${e.slug}`) {
      return resolved;
    }
  }
  return null;
}

/**
 * Reconstrói `ResolvedContext` a partir de uma entry do índice público,
 * **sem auto-checkout**. Retorna `null` quando o `spec_path` não existe
 * localmente — caller orienta o humano a fazer checkout da branch.
 */
function resolveContextFromIndexEntry(
  fs: WorkflowFileSystem,
  resolved: ResolvedActiveSpec
): ResolvedContext | null {
  if (!resolved.specPathExists) return null;
  const source: SpecLocation["source"] = resolved.entry.specPath.startsWith(".governance/")
    ? "governance"
    : "specify-legacy";
  // O slug do SpecLocation é o nome do diretório final do spec_path
  // (e.g. "0023-workflow-runtime"), distinto do entry.slug do índice
  // (e.g. "workflow-runtime"). Convenção do filesystem vs convenção
  // editorial do índice.
  const dirSlug = resolved.entry.specPath.split("/").pop() ?? resolved.entry.slug;
  const location: SpecLocation = {
    slug: dirSlug,
    absolutePath: fs.resolveAbsolute(resolved.entry.specPath),
    source,
  };
  return resolveContextFromLocation(fs, location);
}

function safeRead(fs: WorkflowFileSystem, relPath: string): string | null {
  if (!fs.fileExists(relPath)) return null;
  try {
    return fs.readTextFile(relPath);
  } catch {
    return null;
  }
}

export function buildMenu(state: WorkflowState): ReadonlyArray<{ key: string; label: string }> {
  const items: { key: string; label: string }[] = [];
  items.push({ key: "1", label: "ver briefing novamente" });
  items.push({ key: "2", label: "ver lacunas do gate (research §8)" });
  if (state.gate.status !== "closed") {
    items.push({ key: "3", label: "ver lacunas e critérios do gate" });
  }
  if (state.next.length > 0) {
    items.push({ key: "4", label: `executar próxima ação (${state.next[0]})` });
  }
  items.push({ key: "q", label: "sair" });
  return items;
}

export function buildContextBundle(ctx: ResolvedContext, question: string): string {
  const lines: string[] = [];
  lines.push(`── Context bundle (copie para sua sessão IA) ──`);
  lines.push("");
  lines.push(`Spec: ${ctx.location.slug}${ctx.headers.title ? ` — ${ctx.headers.title}` : ""}`);
  lines.push(`Stage: ${ctx.state.stage}    Gate: ${ctx.state.gate.status}`);
  if (ctx.state.focus.length > 0) lines.push(`Foco: ${ctx.state.focus.join(", ")}`);
  if (ctx.state.next.length > 0) lines.push(`Próxima ação prevista: ${ctx.state.next.join("; ")}`);
  if (ctx.headers.openHypotheses.length > 0) {
    lines.push("");
    lines.push("Hipóteses no research:");
    for (const h of ctx.headers.openHypotheses.slice(0, 4)) lines.push(`  - ${h}`);
  }
  lines.push("");
  lines.push(`Pergunta: ${question}`);
  lines.push("");
  lines.push(`────────────────────────────────────────────`);
  return lines.join("\n");
}

/**
 * Renderiza a seção "Specs ativas no índice público" como lista de linhas
 * prontas para `logger.info`. Função pura: recebe o resultado de
 * `ListActiveSpecs.run()` e o slug da spec corrente (opcional, marca com `*`)
 * e devolve linhas — sem efeitos colaterais.
 *
 * **Lookup-oriented por design** (cf. memory `feedback-lookup-not-coordination`):
 * nenhuma inferência de "próxima spec", ordenação de rollout, dependência
 * cross-spec ou freshness automática. Apenas mostra estado descoberto.
 */
export function renderActiveSpecsIndex(
  result: ListActiveSpecsResult,
  currentSlug?: string,
  options: { showWhenAbsent?: boolean } = {}
): ReadonlyArray<string> {
  const lines: string[] = [];

  if (!result.indexAvailable) {
    if (!options.showWhenAbsent) return lines;
    lines.push("");
    lines.push("Índice operacional público (.governance/runtime/active-specs.yml):");
    for (const warning of result.warnings) {
      lines.push(`  (${warning})`);
    }
    return lines;
  }

  if (result.entries.length === 0) return lines;

  lines.push("");
  lines.push("Specs ativas no índice público:");
  for (const resolved of result.entries) {
    const { entry, specPathExists } = resolved;
    // Match tri-form (id | slug | id-slug) — espelha findActiveSpecByIdentifier.
    // DetectActiveSpec devolve ctx.location.slug no formato "id-slug" (nome do
    // diretório); o entry do índice carrega `id` e `slug` separados. Match
    // robusto aceita as três formas equivalentes.
    const isCurrent =
      currentSlug !== undefined &&
      (entry.id === currentSlug ||
        entry.slug === currentSlug ||
        `${entry.id}-${entry.slug}` === currentSlug);
    const marker = isCurrent ? "*" : " ";
    const presence = specPathExists ? "✓" : "✗";
    lines.push(
      `  ${marker} ${presence} ${entry.slug.padEnd(28)} ` +
        `${entry.stage}/${entry.status}`.padEnd(28) +
        `  ${entry.branch}`
    );
  }
  for (const warning of result.warnings) {
    lines.push(`  (drift) ${warning}`);
  }
  return lines;
}

export type CommandKind =
  | { kind: "menu"; key: string }
  | { kind: "structured"; name: "briefing" | "gaps" | "gate" | "next" | "quit" }
  | { kind: "free-text"; text: string };

export function classifyInput(line: string): CommandKind {
  const trimmed = line.trim();
  if (trimmed === "") return { kind: "structured", name: "briefing" };
  if (/^[1-9]$/.test(trimmed) || trimmed === "q") return { kind: "menu", key: trimmed };
  if (/^(briefing|gaps|gate|next|quit|exit)$/i.test(trimmed)) {
    const name = trimmed.toLowerCase();
    const normalized = name === "exit" ? "quit" : name;
    return {
      kind: "structured",
      name: normalized as "briefing" | "gaps" | "gate" | "next" | "quit",
    };
  }
  return { kind: "free-text", text: trimmed };
}

async function runReplOnce(
  ctx: ResolvedContext,
  reader: InputReader,
  logger: Logger,
  clipboard: ClipboardWriter
): Promise<"continue" | "quit"> {
  const menu = buildMenu(ctx.state);
  logger.info("");
  logger.info("Ações:");
  for (const item of menu) {
    logger.info(`  ${item.key}. ${item.label}`);
  }
  logger.info(`  ou digite uma pergunta em texto livre para gerar context bundle.`);
  logger.info("");
  const line = await reader.question("workflow> ");
  const cmd = classifyInput(line);

  if (cmd.kind === "menu") {
    if (cmd.key === "q") return "quit";
    if (cmd.key === "1") {
      logger.info(assembleBriefing(ctx));
      return "continue";
    }
    if (cmd.key === "2" || cmd.key === "3") {
      if (ctx.headers.blockers.length === 0) {
        logger.info("(nenhum blocker extraído de research §8 — confira manualmente)");
      } else {
        logger.info("Lacunas/blockers do gate:");
        for (const b of ctx.headers.blockers) logger.info(`  - ${b}`);
      }
      return "continue";
    }
    if (cmd.key === "4") {
      if (ctx.state.next.length === 0) {
        logger.info("(state.next vazio — atualize state.yml com a próxima ação)");
      } else {
        logger.info(`Próxima ação registrada: ${ctx.state.next[0]}`);
        logger.info(
          `(execução automática não está no escopo do PR1 — registre o resultado em state.yml manualmente)`
        );
      }
      return "continue";
    }
  }

  if (cmd.kind === "structured") {
    if (cmd.name === "quit") return "quit";
    if (cmd.name === "briefing") {
      logger.info(assembleBriefing(ctx));
      return "continue";
    }
    if (cmd.name === "gaps") {
      if (ctx.headers.blockers.length === 0) {
        logger.info("(nenhum blocker extraído)");
      } else {
        for (const b of ctx.headers.blockers) logger.info(`  - ${b}`);
      }
      return "continue";
    }
    if (cmd.name === "gate") {
      logger.info(`Gate atual: ${ctx.state.gate.status}`);
      return "continue";
    }
    if (cmd.name === "next") {
      logger.info(ctx.state.next.length > 0 ? ctx.state.next.join("\n") : "(vazio)");
      return "continue";
    }
  }

  if (cmd.kind === "free-text") {
    const bundle = buildContextBundle(ctx, cmd.text);
    logger.info(bundle);
    const copied = await clipboard.copy(bundle);
    if (copied) logger.info("(copiado para o clipboard)");
    return "continue";
  }

  return "continue";
}

function defaultLoadActiveSpecsIndex(fs: WorkflowFileSystem): () => ListActiveSpecsResult {
  return () => new ListActiveSpecs(fs, parseActiveSpecs).run();
}

export async function runWorkflow(options: RunOptions): Promise<number> {
  const logger = options.logger ?? stdoutLogger;
  const fs = options.fs ?? new NodeWorkflowFileSystem(options.repoRoot);
  const reader = options.reader ?? new StdinReader();
  const clipboard = options.clipboard ?? new NoopClipboard();
  const loadIndex = options.loadActiveSpecsIndex ?? defaultLoadActiveSpecsIndex(fs);

  const ctx = resolveContext(fs, logger);
  if (!ctx) {
    // Branch não casa: humano precisa de orientação cross-spec; mostra o
    // índice mesmo quando ausente (warning informativo do publish-state).
    for (const line of renderActiveSpecsIndex(loadIndex(), undefined, { showWhenAbsent: true })) {
      logger.info(line);
    }
    reader.close();
    return 1;
  }

  logger.info(assembleBriefing(ctx));
  // Branch detectada: índice é sinal secundário; só mostra quando há entries.
  for (const line of renderActiveSpecsIndex(loadIndex(), ctx.location.slug)) {
    logger.info(line);
  }

  try {
    let outcome: "continue" | "quit" = "continue";
    while (outcome === "continue") {
      outcome = await runReplOnce(ctx, reader, logger, clipboard);
    }
    return 0;
  } finally {
    reader.close();
  }
}

export async function runContinue(options: RunOptions, identifier?: string): Promise<number> {
  const logger = options.logger ?? stdoutLogger;
  const fs = options.fs ?? new NodeWorkflowFileSystem(options.repoRoot);

  let ctx: ResolvedContext | null;

  if (identifier !== undefined && identifier !== "") {
    const loadIndex = options.loadActiveSpecsIndex ?? defaultLoadActiveSpecsIndex(fs);
    const result = loadIndex();

    if (!result.indexAvailable) {
      logger.error(
        `Índice operacional público (.governance/runtime/active-specs.yml) não encontrado.`
      );
      logger.error(`Dica: rode \`yarn workflow publish-state\` na branch da spec primeiro.`);
      return 1;
    }

    const found = findActiveSpecByIdentifier(result.entries, identifier);
    if (!found) {
      logger.error(`Spec "${identifier}" não encontrada no índice público.`);
      if (result.entries.length > 0) {
        logger.info(`Specs disponíveis no índice:`);
        for (const r of result.entries) {
          logger.info(`  - ${r.entry.id} / ${r.entry.slug}  (branch ${r.entry.branch})`);
        }
      }
      return 1;
    }

    if (!found.specPathExists) {
      logger.error(
        `Spec "${found.entry.slug}" declarada no índice em "${found.entry.specPath}", ` +
          `mas o diretório não existe localmente.`
      );
      logger.error(
        `Dica: \`git fetch origin && git checkout ${found.entry.branch}\` ` +
          `para carregar o working tree da spec, depois rode \`yarn guidelines continue\` de novo.`
      );
      return 1;
    }

    ctx = resolveContextFromIndexEntry(fs, found);
    if (!ctx) return 1;
  } else {
    ctx = resolveContext(fs, logger);
    if (!ctx) return 1;
  }

  logger.info(assembleBriefing(ctx));
  if (ctx.state.next.length > 0) {
    logger.info("");
    logger.info(`Próxima ação: ${ctx.state.next[0]}`);
  }
  return 0;
}

/**
 * Argumentos parseados de `yarn workflow publish-state ...`.
 * Estritamente declarativos — nenhum valor é inferido (nem `updatedBy`
 * via git config, nem `lastSyncCommit` via HEAD). Cf. memory
 * `feedback-lookup-not-coordination` — sem inferência de intenção.
 */
export interface PublishStateArgs {
  readonly status?: string;
  readonly updatedBy?: string;
  readonly title?: string;
  readonly baseBranch?: string;
  readonly lastSyncCommit?: string;
}

export interface RunPublishStateOptions extends RunOptions {
  /** Construtor injetável para testabilidade. Default usa parseActiveSpecs + stringifyActiveSpecs reais. */
  readonly buildPublishState?: (fs: WorkflowFileSystem) => PublishState;
  /** Args declarados pelo humano via CLI; usado também por main() para dispatch. */
  readonly publishStateArgs?: PublishStateArgs;
}

function defaultBuildPublishState(fs: WorkflowFileSystem): PublishState {
  return new PublishState(fs, parseActiveSpecs, stringifyActiveSpecs, parseWorkflowState);
}

export async function runPublishState(
  options: RunPublishStateOptions,
  args: PublishStateArgs
): Promise<number> {
  const logger = options.logger ?? stdoutLogger;
  const fs = options.fs ?? new NodeWorkflowFileSystem(options.repoRoot);

  if (!args.status || args.status.trim() === "") {
    logger.error(
      `Flag --status=<active|blocked|paused|completed> é obrigatória ` +
        `(per [DEC-0023-G04]; status declarado manualmente, sem fallback).`
    );
    return 1;
  }
  if (!args.updatedBy || args.updatedBy.trim() === "") {
    logger.error(
      `Flag --updated-by=<quem-autorizou> é obrigatória. ` +
        `Convenção: quem AUTORIZOU a publicação (não quem executou nem qual agente IA rodou).`
    );
    return 1;
  }

  const builder = options.buildPublishState ?? defaultBuildPublishState;
  const useCase = builder(fs);

  const input: PublishStateInput = {
    status: args.status as ActiveSpecStatus,
    updatedBy: args.updatedBy,
    ...(args.title !== undefined ? { title: args.title } : {}),
    ...(args.baseBranch !== undefined ? { baseBranch: args.baseBranch } : {}),
    ...(args.lastSyncCommit !== undefined ? { lastSyncCommit: args.lastSyncCommit } : {}),
  };

  let result: PublishStateResult;
  try {
    result = useCase.run(input);
  } catch (err) {
    if (err instanceof PublishStateError) {
      logger.error(err.message);
      return 1;
    }
    throw err;
  }

  const verb = result.wasUpdate ? "atualizada" : "publicada";
  logger.info(
    `Spec ${result.entry.id} / ${result.entry.slug} ${verb} no índice (${result.indexPath}).`
  );
  logger.info(
    `  stage=${result.entry.stage}  status=${result.entry.status}  updated_at=${result.entry.updatedAt}`
  );
  return 0;
}

export async function main(argv: readonly string[], opts: RunOptions): Promise<number> {
  const sub = argv[0];
  if (sub === "continue") {
    const identifier = argv[1];
    return runContinue(opts, identifier);
  }
  if (sub === "workflow" && argv[1] === "publish-state") {
    const pubOpts = opts as RunPublishStateOptions;
    return runPublishState(pubOpts, pubOpts.publishStateArgs ?? {});
  }
  return runWorkflow(opts);
}

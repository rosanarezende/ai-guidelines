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
import { CheckExecutionAuthorized } from "../app/workflow/CheckExecutionAuthorized.js";
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
import { NodeClipboard } from "../infrastructure/io/NodeClipboard.js";
import { ClipboardWriter } from "../app/ports/ClipboardWriter.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { parseContextTarget } from "./visual-prompts/parseContextTarget.js";
import { collectLocalContext } from "./visual-prompts/collectLocalContext.js";
import { renderVisualPrompt } from "./visual-prompts/renderVisualPrompt.js";

export { renderVisualPrompt };

export interface Logger {
  info(msg: string): void;
  error(msg: string): void;
}

export interface InputReader {
  question(prompt: string): Promise<string>;
  close(): void;
}

const stdoutLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

class StdinReader implements InputReader {
  private rl: readline.Interface | null = null;
  private lines: string[] = [];
  private isClosed = false;
  private readAllPromise: Promise<void> | null = null;

  constructor() {
    if (process.stdin.isTTY) {
      this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      this.rl.on("close", () => {
        this.isClosed = true;
      });
    } else {
      let data = "";
      process.stdin.resume();
      this.readAllPromise = new Promise<void>((resolve) => {
        process.stdin.on("data", (chunk) => {
          data += chunk.toString();
        });
        process.stdin.on("end", () => {
          this.lines = data.split(/\r?\n/);
          if (this.lines.length > 0 && this.lines[this.lines.length - 1] === "") {
            this.lines.pop();
          }
          resolve();
        });
      });
    }
  }

  async question(prompt: string): Promise<string> {
    if (this.rl) {
      if (this.isClosed) return "";
      return new Promise((resolve) => this.rl!.question(prompt, resolve));
    }

    if (this.readAllPromise) {
      await this.readAllPromise;
    }
    return this.lines.shift() ?? "";
  }

  close(): void {
    this.rl?.close();
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

/**
 * Wizard CLI operacional mínimo — menu declarativo no boot de `workflow`.
 *
 * Cravado em `[DEC-0023-B06]`: 5 opções fixas, cada uma mapeia 1:1 para
 * comando existente. Sem ranking, sem ordering, sem inferência de "próxima
 * ação recomendada" — wizard é shell visual sobre comandos, não engine
 * de fluxo. Cf. memory `feedback-lookup-not-coordination`.
 *
 * Anti-patterns vetados (cf. [DEC-0023-B06]): auto-detecção, NLP-lite,
 * sugestão de spec mais relevante, autocomplete fuzzy.
 */
export type WizardChoice =
  | { kind: "continue-current" }
  | { kind: "continue-other"; identifier: string }
  | { kind: "publish-state-help" }
  | { kind: "list-active" }
  | { kind: "diagnose-drift" }
  | {
      kind: "visual-prompt";
      mode: VisualPromptMode;
      slug?: string;
      targetLabel?: string;
      context: string;
      placeholderMessage?: string;
    }
  | { kind: "quit" };

const WIZARD_OPTIONS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "1", label: "Continuar spec atual (briefing + REPL)" },
  { key: "2", label: "Continuar outra spec (por slug ou id)" },
  { key: "3", label: "Publicar estado (instruções)" },
  { key: "4", label: "Ver specs ativas (índice público)" },
  { key: "5", label: "Diagnosticar drift do índice" },
  { key: "6", label: "Gerar prompt visual (para gerador de imagem externo)" },
  { key: "q", label: "Sair" },
];

/**
 * Templates de prompts visuais disponíveis em `.governance/visual-prompts/`.
 *
 * - `single-stage`: 1 prompt único, cola direto no gerador de imagem.
 * - `two-stage`: 2 prompts consecutivos — etapa 1 vai para IA conversacional
 *   (investigação); etapa 2 vai para gerador de imagem (humano cola síntese
 *   da etapa 1 no `{{summary}}` antes de usar).
 * - `placeholder`: opção registrada no menu mas ainda não implementada
 *   (sinaliza "em breve" e referencia candidata no backlog).
 *
 * Variáveis `{{nome}}` são substituídas pelo wizard com base nos inputs do
 * usuário; variáveis não fornecidas (ex.: `{{summary}}`) permanecem literais
 * no output e o humano preenche antes de usar.
 */
type VisualPromptMode = "prompt" | "placeholder";

interface VisualPromptOption {
  readonly key: string;
  readonly label: string;
  readonly mode: VisualPromptMode;
  /** Slug do arquivo `.prompt.md` em `.governance/visual-prompts/`. */
  readonly slug?: string;
  readonly needsContext?: boolean;
  /** Frase indicando onde colar; renderizada no header do delimitador. */
  readonly targetLabel?: string;
  /** Mensagem exibida quando `mode === "placeholder"`. */
  readonly placeholderMessage?: string;
}

const VISUAL_PROMPT_TEMPLATES: ReadonlyArray<VisualPromptOption> = [
  {
    key: "a",
    label: "Arquitetura ponta-a-ponta (cola direto no gerador de imagem)",
    mode: "prompt",
    slug: "architecture-end-to-end",
    needsContext: false,
    targetLabel: "cola no gerador de imagem (Midjourney, DALL-E, etc.)",
  },
  {
    key: "b",
    label:
      "Valor entregue — via IA conversacional (Claude, ChatGPT, Antigravity); ela investiga + devolve prompt de imagem pronto",
    mode: "prompt",
    slug: "value-delivered",
    needsContext: true,
    targetLabel:
      "cola na IA conversacional — ela vai investigar o repo e devolver um prompt de imagem JÁ PRONTO para colar no gerador",
  },
  {
    key: "c",
    label: "Valor entregue — investigação automática local [em breve, vide candidata no backlog]",
    mode: "placeholder",
    placeholderMessage:
      "Investigação automática local (via git/gh) será implementada como sub-escopo da candidata `governance-dashboard-and-visual-artifacts` no backlog Now. Por enquanto, use a opção [b].",
  },
];

export function renderWizardMenu(): ReadonlyArray<string> {
  const lines: string[] = [];
  lines.push("");
  lines.push("─── Wizard operacional (workflow runtime) ───");
  lines.push("");
  for (const opt of WIZARD_OPTIONS) {
    lines.push(`  [${opt.key}] ${opt.label}`);
  }
  lines.push("");
  return lines;
}

async function runWizard(reader: InputReader, logger: Logger): Promise<WizardChoice> {
  for (const line of renderWizardMenu()) logger.info(line);
  const answer = (await reader.question("Escolha: ")).trim();
  switch (answer) {
    case "1":
      return { kind: "continue-current" };
    case "2": {
      const identifier = (await reader.question("Slug ou id da spec: ")).trim();
      if (identifier === "") {
        logger.error("Identificador vazio — voltando ao menu.");
        return { kind: "quit" };
      }
      return { kind: "continue-other", identifier };
    }
    case "3":
      return { kind: "publish-state-help" };
    case "4":
      return { kind: "list-active" };
    case "5":
      return { kind: "diagnose-drift" };
    case "6":
      return runVisualPromptSubWizard(reader, logger);
    case "q":
    case "":
      return { kind: "quit" };
    default:
      logger.error(`Opção desconhecida: "${answer}".`);
      return { kind: "quit" };
  }
}

async function runVisualPromptSubWizard(
  reader: InputReader,
  logger: Logger
): Promise<WizardChoice> {
  logger.info("");
  logger.info("Que tipo de imagem?");
  for (const tpl of VISUAL_PROMPT_TEMPLATES) {
    logger.info(`  [${tpl.key}] ${tpl.label}`);
  }
  logger.info("");
  const typeAnswer = (await reader.question("Tipo: ")).trim();
  const template = VISUAL_PROMPT_TEMPLATES.find((t) => t.key === typeAnswer);
  if (!template) {
    logger.error(`Tipo desconhecido: "${typeAnswer}".`);
    return { kind: "quit" };
  }

  if (template.mode === "placeholder") {
    return {
      kind: "visual-prompt",
      mode: "placeholder",
      context: "",
      placeholderMessage: template.placeholderMessage,
    };
  }

  let context = "";
  if (template.needsContext) {
    context = (await reader.question("Contexto (ex.: PR #25, spec 0023): ")).trim();
    if (context === "") {
      logger.error("Contexto vazio — voltando ao menu.");
      return { kind: "quit" };
    }
  }

  return {
    kind: "visual-prompt",
    mode: template.mode,
    slug: template.slug,
    targetLabel: template.targetLabel,
    context,
  };
}

// A função pura renderVisualPrompt foi migrada para src/cli/visual-prompts/renderVisualPrompt.ts

export async function runWorkflow(options: RunOptions): Promise<number> {
  const logger = options.logger ?? stdoutLogger;
  const fs = options.fs ?? new NodeWorkflowFileSystem(options.repoRoot);
  const reader = options.reader ?? new StdinReader();
  const clipboard = options.clipboard ?? new NodeClipboard();
  const loadIndex = options.loadActiveSpecsIndex ?? defaultLoadActiveSpecsIndex(fs);

  // Wizard CLI operacional mínimo (cf. [DEC-0023-B06]).
  // Apresenta 5 opções fixas declarativas no boot do REPL; cada opção
  // mapeia 1:1 para um comando existente.
  let choice: WizardChoice;
  try {
    choice = await runWizard(reader, logger);
  } catch (err) {
    logger.error(`Wizard interrompido: ${err instanceof Error ? err.message : String(err)}`);
    reader.close();
    return 1;
  }

  if (choice.kind === "quit") {
    reader.close();
    return 0;
  }

  if (choice.kind === "list-active") {
    for (const line of renderActiveSpecsIndex(loadIndex(), undefined, { showWhenAbsent: true })) {
      logger.info(line);
    }
    reader.close();
    return 0;
  }

  if (choice.kind === "diagnose-drift") {
    const result = loadIndex();
    if (!result.indexAvailable) {
      logger.info(
        "Índice operacional público (.governance/runtime/active-specs.yml) não encontrado."
      );
      logger.info("Dica: rode `yarn guidelines workflow publish-state` na branch da spec.");
      reader.close();
      return 0;
    }
    const driftCount = result.entries.filter((e) => !e.specPathExists).length;
    if (driftCount === 0) {
      logger.info("Nenhum drift detectado: todos os spec_path existem no filesystem.");
    } else {
      logger.info(`${driftCount} entry(ies) com drift:`);
      for (const resolved of result.entries) {
        if (!resolved.specPathExists) {
          logger.info(
            `  - ${resolved.entry.slug} (${resolved.entry.branch}): spec_path "${resolved.entry.specPath}" inexistente.`
          );
        }
      }
    }
    reader.close();
    return 0;
  }

  if (choice.kind === "publish-state-help") {
    logger.info(
      "Comando: yarn guidelines workflow publish-state --status=<active|blocked|paused|completed> --updated-by=<@autor> [--title=<título>]"
    );
    logger.info("Estado da spec corrente é projetado de state.yml para active-specs.yml.");
    logger.info("Detalhes: .governance/specs/0023-workflow-runtime/decision-brief.md § Bloco G.");
    reader.close();
    return 0;
  }

  if (choice.kind === "visual-prompt") {
    if (choice.mode === "placeholder") {
      logger.info("");
      logger.info(choice.placeholderMessage ?? "Em breve.");
      logger.info("");
      reader.close();
      return 0;
    }

    // mode === "prompt": imprime 1 prompt; targetLabel descreve onde colar.
    const slug = choice.slug ?? "";
    let localContext = "";
    if (choice.context) {
      const target = parseContextTarget(choice.context);
      localContext = collectLocalContext(target, { repoRoot: options.repoRoot, fs });
    }
    const rendered = renderVisualPrompt(fs, slug, { context: choice.context, localContext });
    if (rendered === null) {
      logger.error(`Template "${slug}" não encontrado em .governance/visual-prompts/.`);
      reader.close();
      return 1;
    }
    const target = choice.targetLabel ?? "cola no destino apropriado";
    logger.info("");
    logger.info(`──── COPIE A PARTIR DAQUI — ${target} ────`);
    logger.info(rendered.trimEnd());
    logger.info("──── ATÉ AQUI ────");
    logger.info("");
    reader.close();
    return 0;
  }

  if (choice.kind === "continue-other") {
    reader.close();
    return runContinue(options, choice.identifier);
  }

  // choice.kind === "continue-current" — fluxo legado (briefing + REPL interno)
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
      logger.error(
        `Dica: rode \`yarn guidelines workflow publish-state\` na branch da spec primeiro.`
      );
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

  const checker = new CheckExecutionAuthorized(fs);
  const checkResult = checker.run(ctx.location, ctx.state);

  if (!checkResult.authorized) {
    logger.error("Execution locked.");
    logger.error("Missing:");
    if (checkResult.missingTasksFile) {
      logger.error(`- tasks.md em ${checkResult.checkedTasksPath} (não encontrado)`);
    }
    if (checkResult.gateNotClosed) {
      logger.error(`- planning gate.status == closed (atual: ${checkResult.actualGateStatus})`);
    }
    return 1;
  }

  logger.info(assembleBriefing(ctx));
  if (ctx.state.next.length > 0) {
    logger.info("");
    logger.info(`Próxima ação: ${ctx.state.next[0]}`);
  }
  return 0;
}

/**
 * Argumentos parseados de `yarn guidelines workflow publish-state ...`.
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

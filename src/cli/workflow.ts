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
 *   - texto livre gera **contexto da spec pronto para colar** na IA externa;
 *   - **não** chamamos LLM internamente; AI-as-Channel preservado.
 *
 * Vocabulário interno legado (`buildContextBundle()` + variável `bundle`)
 * preservado intencionalmente — rename interno é candidato a follow-up
 * cosmético pós-merge da 0023, não bloqueador. Cf. `NEXT.md § Pós-PR5 review`.
 */
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
import {
  buildInsightsProjection,
  renderResumptionInsights,
} from "../app/workflow/InsightsProjection.js";
import { FileInsightStore } from "../infrastructure/yaml/FileInsightStore.js";
import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { NodeClipboard, clipboardInstallHint } from "../infrastructure/io/NodeClipboard.js";
import { InquirerPrompts } from "../infrastructure/io/InquirerPrompts.js";
import { ClipboardWriter } from "../app/ports/ClipboardWriter.js";
import { Prompts } from "../app/ports/Prompts.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { PullRequestData, StackOps } from "../app/ports/StackOps.js";
import { GhCli } from "../infrastructure/git/GhCli.js";
import {
  OpenIntegrationPR,
  OpenIntegrationPRError,
  OpenIntegrationPRPlan,
} from "../app/workflow/OpenIntegrationPR.js";
import {
  LandingMode,
  MergeStack,
  MergeStackError,
  MergeStackPlan,
} from "../app/workflow/MergeStack.js";
import {
  CheckIntegrationReadiness,
  IntegrationReadinessResult,
  parseChecklistGates,
} from "../app/workflow/CheckIntegrationReadiness.js";
import { parseContextTarget } from "./visual-prompts/parseContextTarget.js";
import { collectLocalContext } from "./visual-prompts/collectLocalContext.js";
import { renderVisualPrompt } from "./visual-prompts/renderVisualPrompt.js";
import { VISUAL_PROMPT_OPTIONS, VisualPromptValue } from "./visual-prompts/visualPromptCatalog.js";
import type { CommandRegistry } from "./registry/CommandRegistry.js";
import { INTENT_CATALOG } from "./registry/intentCatalog.js";
import type { Intent, IntentAction } from "./registry/Intent.js";

export { renderVisualPrompt };

export interface Logger {
  info(msg: string): void;
  error(msg: string): void;
}

const stdoutLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export interface RunOptions {
  readonly repoRoot: string;
  readonly logger?: Logger;
  readonly prompts?: Prompts;
  readonly clipboard?: ClipboardWriter;
  readonly fs?: WorkflowFileSystem;
  /**
   * Injetável para tests. Default lê
   * `.governance/runtime/active-specs.yml` via `ListActiveSpecs` com o
   * parser real.
   */
  readonly loadActiveSpecsIndex?: () => ListActiveSpecsResult;
  /**
   * Adapter para operações de PR via `gh`. Cravado em `[DEC-0023-L01]`
   * para suportar wizard options 4 (Integration PR) + 5 (merge-stack).
   * Default: `GhCli` real (execFileSync). Tests injetam `FakeStackOps`.
   */
  readonly stack?: StackOps;
  /**
   * Registry de comandos para a navegação por Intent do wizard. Injetável p/
   * teste; default = catálogo real via import dinâmico (quebra o ciclo
   * workflow↔buildRegistry). Não afeta as superfícies de execução existentes.
   */
  readonly registry?: CommandRegistry;
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

/**
 * Ações semânticas do REPL. Estáveis (não dependem da posição do item no menu);
 * usadas pelo dispatch em vez do `key` literal — `key` é só display posicional.
 */
export type MenuAction = "briefing" | "blockers" | "execute-next" | "quit";

export interface MenuItem {
  /** Display key — número sequencial (1, 2, 3, ...) ou `q`. Posicional, NÃO semântico. */
  readonly key: string;
  readonly label: string;
  /** Identificador semântico estável; usado pelo dispatch. */
  readonly action: MenuAction;
}

/**
 * Monta o menu do REPL. Keys numéricas são **posicionais** (renumeradas
 * dinamicamente) — quando uma opção opcional é omitida (e.g. critério-3
 * com gate fechado), as subsequentes são renumeradas para nunca exibir
 * gaps (1, 2, 4 → 1, 2, 3). Bug fix de integridade UX observado em
 * runtime ao vivo (2026-05-23): inconsistência posicional destrói
 * confiança operacional do wizard.
 */
export function buildMenu(state: WorkflowState): ReadonlyArray<MenuItem> {
  const ordered: { label: string; action: MenuAction }[] = [];
  ordered.push({ label: "ver briefing novamente", action: "briefing" });
  ordered.push({ label: "ver lacunas do gate (research §8)", action: "blockers" });
  if (state.gate.status !== "closed") {
    ordered.push({ label: "ver lacunas e critérios do gate", action: "blockers" });
  }
  if (state.next.length > 0) {
    ordered.push({
      label: `executar próxima ação (${state.next[0]})`,
      action: "execute-next",
    });
  }
  const items: MenuItem[] = ordered.map((a, i) => ({
    key: String(i + 1),
    label: a.label,
    action: a.action,
  }));
  items.push({ key: "q", label: "sair", action: "quit" });
  return items;
}

export function buildContextBundle(ctx: ResolvedContext, question: string): string {
  const lines: string[] = [];
  lines.push(`── Contexto da spec (pronto para colar na sua IA externa) ──`);
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
  prompts: Prompts,
  logger: Logger,
  clipboard: ClipboardWriter
): Promise<"continue" | "quit"> {
  const menu = buildMenu(ctx.state);
  logger.info("");
  logger.info("Ações:");
  for (const item of menu) {
    logger.info(`  ${item.key}. ${item.label}`);
  }
  logger.info(`  ou digite uma pergunta para gerar contexto pronto para colar na sua IA.`);
  logger.info("");
  const line = await prompts.input({ message: "workflow>" });
  const cmd = classifyInput(line);

  if (cmd.kind === "menu") {
    // Dispatch por action semântica (estável), não por key literal
    // (posicional). Renumeração dinâmica do menu não quebra a lógica.
    const item = menu.find((m) => m.key === cmd.key);
    if (item) {
      switch (item.action) {
        case "quit":
          return "quit";
        case "briefing":
          logger.info(assembleBriefing(ctx));
          return "continue";
        case "blockers":
          if (ctx.headers.blockers.length === 0) {
            logger.info("(nenhum blocker extraído de research §8 — confira manualmente)");
          } else {
            logger.info("Lacunas/blockers do gate:");
            for (const b of ctx.headers.blockers) logger.info(`  - ${b}`);
          }
          return "continue";
        case "execute-next":
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
  | { kind: "open-integration-pr" }
  | { kind: "merge-stack" }
  | { kind: "list-active" }
  | { kind: "diagnose-drift" }
  | {
      kind: "visual-prompt";
      slug: string;
      targetLabel: string;
      instructions: ReadonlyArray<string>;
      context: string;
    }
  | { kind: "quit" };

type WizardMenuValue =
  | "continue-current"
  | "continue-other"
  | "publish-state-help"
  | "open-integration-pr"
  | "merge-stack"
  | "list-active"
  | "diagnose-drift"
  | "visual-prompt"
  | "quit";

// Ordem cravada em [DEC-0023-L01]:
//   1-2 (navegação 📍) / 3 (publicar 📡) / 4-5 (governance ops 🔗 🔀)
//   / 6-7 (inspeção 📋 🔍) / 8 (utilidade 🎨) / q (sair)
//
// Anti-patterns vetados (cf. [DEC-0023-B06] + ADR 0024 reafirmados em L01):
// sem auto-detecção, sem ranking dinâmico, sem inferência de intenção.
// Agrupamento por posição é implícito (não algorítmico).
const WIZARD_MENU: ReadonlyArray<{ name: string; value: WizardMenuValue }> = [
  { name: "📍 Continuar spec atual (briefing + REPL)", value: "continue-current" },
  { name: "📍 Continuar outra spec (por slug ou id)", value: "continue-other" },
  { name: "📡 Publicar estado (instruções)", value: "publish-state-help" },
  { name: "🔗 Abrir Integration PR da spec ativa", value: "open-integration-pr" },
  { name: "🔀 Executar merge atômico da stack", value: "merge-stack" },
  { name: "📋 Ver specs ativas (índice público)", value: "list-active" },
  { name: "🔍 Diagnosticar drift do índice", value: "diagnose-drift" },
  {
    name: "🎨 Gerar prompt visual (para gerador de imagem externo)",
    value: "visual-prompt",
  },
  { name: "Sair", value: "quit" },
];

async function runWizard(prompts: Prompts, logger: Logger): Promise<WizardChoice> {
  const choice = await prompts.select<WizardMenuValue>({
    message: "Wizard operacional (workflow runtime)",
    choices: WIZARD_MENU.map((o) => ({ name: o.name, value: o.value })),
  });
  switch (choice) {
    case "continue-current":
      return { kind: "continue-current" };
    case "continue-other": {
      const identifier = (await prompts.input({ message: "Slug ou id da spec" })).trim();
      if (identifier === "") {
        logger.error("Identificador vazio — encerrando wizard.");
        return { kind: "quit" };
      }
      return { kind: "continue-other", identifier };
    }
    case "publish-state-help":
      return { kind: "publish-state-help" };
    case "open-integration-pr":
      return { kind: "open-integration-pr" };
    case "merge-stack":
      return { kind: "merge-stack" };
    case "list-active":
      return { kind: "list-active" };
    case "diagnose-drift":
      return { kind: "diagnose-drift" };
    case "visual-prompt":
      return runVisualPromptSubWizard(prompts, logger);
    case "quit":
      return { kind: "quit" };
  }
}

async function runVisualPromptSubWizard(prompts: Prompts, logger: Logger): Promise<WizardChoice> {
  const value = await prompts.select<VisualPromptValue>({
    message:
      "Que tipo de prompt visual? (todos os tipos hoje seguem fluxo em 2 etapas — você cola o prompt em uma IA conversacional com acesso ao repo, ela devolve um prompt de imagem pronto)",
    choices: VISUAL_PROMPT_OPTIONS.map((o) => ({ name: o.label, value: o.value })),
  });
  const template = VISUAL_PROMPT_OPTIONS.find((t) => t.value === value);
  if (!template) {
    logger.error(`Tipo desconhecido: "${value}".`);
    return { kind: "quit" };
  }

  let context = "";
  if (template.needsContext) {
    context = (await prompts.input({ message: "Contexto (ex.: PR #25, spec 0023)" })).trim();
    if (context === "") {
      logger.error("Contexto vazio — encerrando wizard.");
      return { kind: "quit" };
    }
    // Valida formato — parseContextTarget aceita "PR #N", "pr N", "spec <id>"
    // e o id numérico bruto (ex.: "0023"). Inputs ambíguos como "spec" sem
    // identificador caem em "unknown" — rejeita aqui antes de gerar prompt
    // inútil para a IA conversacional.
    const target = parseContextTarget(context);
    if (target.kind === "unknown") {
      logger.error(
        `Contexto não reconhecido: "${context}". Exemplos válidos: "PR #25", "pr 25", "spec 0023", "0023".`
      );
      return { kind: "quit" };
    }
  }

  return {
    kind: "visual-prompt",
    slug: template.slug,
    targetLabel: template.targetLabel,
    instructions: template.instructions,
    context,
  };
}

// A função pura renderVisualPrompt foi migrada para src/cli/visual-prompts/renderVisualPrompt.ts

/**
 * Resolve adapter `StackOps`. Default: `GhCli` real (execFileSync).
 * Tests injetam via `options.stack`.
 */
function resolveStackOps(options: RunOptions): StackOps {
  return options.stack ?? new GhCli(options.repoRoot);
}

/**
 * Topo-sort de PRs por relação base→head, partindo de `mainBranch` como raiz.
 *
 * Stack governance-first canônico: linear chain (base=main → base=#1.head →
 * base=#2.head → …). Cravado em `[DEC-0023-L01]`. Anti-patterns vetados:
 * sem ranking, sem heurística. Determinístico.
 *
 * Edge cases (todos viram erro narrativo):
 *   - 0 PRs com base=main → sem raiz detectável
 *   - ≥ 2 PRs com mesma base → stack ambíguo (branching)
 *   - Chain incompleto vs total de PRs → algum PR fora da chain
 */
function topoSortStack(
  prs: ReadonlyArray<PullRequestData>,
  mainBranch: string
): ReadonlyArray<PullRequestData> {
  if (prs.length === 0) return [];

  const byBase = new Map<string, PullRequestData[]>();
  for (const pr of prs) {
    const arr = byBase.get(pr.baseRefName) ?? [];
    arr.push(pr);
    byBase.set(pr.baseRefName, arr);
  }

  const result: PullRequestData[] = [];
  let currentBase = mainBranch;
  // Loop bound: max prs.length iterações + 1 safety.
  for (let safety = 0; safety <= prs.length; safety++) {
    const next = byBase.get(currentBase) ?? [];
    if (next.length === 0) break;
    if (next.length > 1) {
      const candidates = next.map((p) => `#${p.number}`).join(", ");
      throw new Error(
        `Stack ambíguo: ${next.length} PRs com base "${currentBase}" (${candidates}). ` +
          `Stack governance-first canônico é linear; reconcilie bases antes de merge-stack.`
      );
    }
    result.push(next[0]);
    currentBase = next[0].headRefName;
  }

  if (result.length !== prs.length) {
    const missing = prs.filter((p) => !result.includes(p)).map((p) => `#${p.number}`);
    throw new Error(
      `Stack incompleto: ${result.length}/${prs.length} PRs em chain ` +
        `(fora da chain: ${missing.join(", ")}). Verifique bases dos PRs da spec.`
    );
  }

  return result;
}

/**
 * Detecta stack governance-first da spec ativa para `merge-stack`.
 *
 * Filtra PRs abertos com `[Spec NNNN]` no título (convenção cravada em
 * `.core/process/pr-title-conventions.md`), excluindo Integration PR
 * (`[Integration]` na label/título) — Integration é homologation artifact,
 * não é mergeado na stack atomic per ADR 0024.
 */
function detectStackForSpec(
  prs: ReadonlyArray<PullRequestData>,
  specId: string,
  mainBranch: string
): ReadonlyArray<PullRequestData> {
  const specPrs = prs.filter(
    (pr) => pr.title.includes(`[Spec ${specId}]`) && !pr.title.includes("[Integration]")
  );
  return topoSortStack(specPrs, mainBranch);
}

/**
 * Detecta o Integration PR (homologação) da spec entre os PRs abertos —
 * `[Spec NNNN]` + `[Integration]` no título. Usado no modo `unit`: se já
 * aponta para main, é o **veículo** (evita conflito de edit-base); caso
 * contrário fecha via landed-via reconciliation.
 * Retorna `undefined` se não houver (stack sem Integration PR).
 */
function detectIntegrationPr(
  prs: ReadonlyArray<PullRequestData>,
  specId: string
): PullRequestData | undefined {
  return prs.find(
    (pr) => pr.title.includes(`[Spec ${specId}]`) && pr.title.includes("[Integration]")
  );
}

/** Primitivos do contexto da spec usados no bloco de readiness (testável puro). */
export interface ReadinessContextInput {
  readonly specId: string;
  readonly specSlug: string;
  readonly stage: string;
  readonly gateStatus: string;
  readonly branch: string | null;
}

export interface ReadinessRender {
  /** Diagnóstico completo para o terminal. */
  readonly lines: ReadonlyArray<string>;
  /** Bloco pronto para colar numa IA externa (subconjunto das linhas). */
  readonly clipboardContext: string;
}

function readinessContextOf(ctx: ResolvedContext, fs: WorkflowFileSystem): ReadinessContextInput {
  const m = /^(\d{4})-(.+)$/.exec(ctx.location.slug);
  return {
    specId: m ? m[1] : ctx.location.slug,
    specSlug: m ? m[2] : ctx.location.slug,
    stage: ctx.state.stage,
    gateStatus: ctx.state.gate.status,
    branch: fs.currentBranch(),
  };
}

/**
 * Render narrativo determinístico do bloqueio de readiness — **sem IA**.
 * Produz (a) diagnóstico para o terminal e (b) contexto copiável para uso
 * intencional numa IA externa. Cf. `[DEC-0023-L01]` + memory
 * `feedback-lookup-not-coordination` (descrição de estado declarado, não
 * inferência de fluxo).
 */
export function renderIntegrationReadinessBlock(
  result: IntegrationReadinessResult,
  ctx: ReadinessContextInput
): ReadinessRender {
  const isIntegration = result.kind === "integration-pr";
  const header = isIntegration
    ? "🔒 Integration PR bloqueado — homologação (review.md) ainda aberta."
    : "🔒 Merge atômico bloqueado — homologação/merge authorization (review.md) ainda aberta.";
  const nextSteps = result.missingFile
    ? [
        `Crie o boundary de homologação em ${result.checkedPath} (gates R1–R8).`,
        "Veja o boilerplate em review-boundary v=1; o #26 abre com R1–R7 [x].",
      ]
    : isIntegration
      ? [
          "Feche os gates R1–R7 no review.md (homologação) e marque-os [x].",
          "Rode `yarn guidelines workflow` de novo — a opção 4 abre quando R1–R7 fecharem.",
        ]
      : [
          "Feche R1–R8 no review.md, incluindo R8 (merge authorization explícita do owner).",
          "Só então a opção 5 (merge-stack) prossegue.",
        ];

  const openLines: string[] = [];
  if (result.missingFile) {
    openLines.push(`  - review.md não encontrado em ${result.checkedPath}`);
  } else {
    for (const gate of result.openGates) openLines.push(`  ${gate.line}`);
    for (const id of result.missingGateIds) {
      openLines.push(`  - **${id}** (gate exigido não encontrado no review.md)`);
    }
  }

  const clipboardContext = [
    `Spec: ${ctx.specId} / ${ctx.specSlug}`,
    `Stage: ${ctx.stage}    Gate: ${ctx.gateStatus}`,
    `Branch: ${ctx.branch ?? "(HEAD detached / desconhecida)"}`,
    `Gate de readiness: ${result.kind}`,
    `Itens abertos em ${result.checkedPath}:`,
    ...openLines,
  ].join("\n");

  const lines = [
    "",
    header,
    "",
    `Itens abertos detectados em ${result.checkedPath}:`,
    ...openLines,
    "",
    "Próximos passos:",
    ...nextSteps.map((s) => `  - ${s}`),
    "",
    "──── Contexto pronto para colar na sua IA externa ────",
    clipboardContext,
    "──── FIM ────",
    "",
  ];

  return { lines, clipboardContext };
}

function specBoundaryPath(location: SpecLocation, file: string): string {
  const prefix = location.source === "governance" ? ".governance/specs" : ".specify/specs";
  return `${prefix}/${location.slug}/${file}`;
}

/**
 * Sumário determinístico dos 3 boundaries da spec (cf. `[DEC-0023-M01]`):
 * Execution (`tasks.md`) / Integration readiness (`review.md`) / Closure
 * (`release-log.md`). Lookup de estado declarado, sem inferência nem recomendação.
 */
export function summarizeBoundaries(
  fs: WorkflowFileSystem,
  location: SpecLocation
): ReadonlyArray<string> {
  // Execution — tasks.md 100% [x]?
  const tasksPath = specBoundaryPath(location, "tasks.md");
  let execution: string;
  if (!fs.fileExists(tasksPath)) {
    execution = "tasks.md ausente";
  } else {
    const gates = parseChecklistGates(fs.readTextFile(tasksPath));
    const open = gates.filter((g) => !g.checked).length;
    execution = gates.length > 0 && open === 0 ? "complete" : `in progress (${open} aberto(s))`;
  }

  // Integration readiness — review.md R1–R7 (gates de abertura do #26).
  const ir = new CheckIntegrationReadiness(fs).run(location, "integration-pr");
  let integration: string;
  if (ir.missingFile) {
    integration = "BLOCKED — review.md ausente (crie-o antes do #26)";
  } else if (ir.ready) {
    integration = "PASS — pronto para abrir Integration PR (#26)";
  } else {
    const n = ir.openGates.length + ir.missingGateIds.length;
    integration = `BLOCKED (${n} item(ns) aberto(s) em review.md)`;
  }

  // Release log — release-log.md (registro pós-merge, CONDICIONAL — só existe com
  // release/operação pós-merge). Usa checkboxes simples (sem `**id**`); conta-os direto.
  const releaseLogPath = specBoundaryPath(location, "release-log.md");
  let releaseLog: string;
  if (!fs.fileExists(releaseLogPath)) {
    releaseLog = "não iniciado (condicional — só com release/pós-merge)";
  } else {
    const boxes = fs
      .readTextFile(releaseLogPath)
      .split("\n")
      .filter((l) => /^\s*-\s*\[[ xX/]\]/.test(l));
    const done = boxes.filter((l) => /^\s*-\s*\[[xX]\]/.test(l)).length;
    if (boxes.length === 0) releaseLog = "registrado (sem checklist)";
    else
      releaseLog = done === boxes.length ? "concluído" : `em andamento (${done}/${boxes.length})`;
  }

  return [
    "Boundaries da spec:",
    `  Execution (tasks.md):           ${execution}`,
    `  Integration readiness (review): ${integration}`,
    `  Release log (release-log.md):   ${releaseLog}`,
  ];
}

/**
 * Wizard handler para opção 4 (Abrir Integration PR).
 *
 * Flow: gate de readiness (Fase 3) → detect spec via use case → mostra plan →
 * confirma → executa. Cravado em `[DEC-0023-L01]`. Side-effect: PR aparece em GitHub.
 */
async function runOpenIntegrationPRWizard(opts: {
  logger: Logger;
  prompts: Prompts;
  fs: WorkflowFileSystem;
  stack: StackOps;
  clipboard: ClipboardWriter;
}): Promise<number> {
  const { logger, prompts, fs, stack, clipboard } = opts;

  // Gate determinístico de Integration readiness (closing hardening): bloqueia
  // a abertura do Integration PR enquanto a homologação real (3.3–3.6) não fecha.
  const gateCtx = resolveContext(fs, logger);
  if (!gateCtx) return 1;
  const readiness = new CheckIntegrationReadiness(fs).run(gateCtx.location, "integration-pr");
  if (!readiness.ready) {
    const render = renderIntegrationReadinessBlock(readiness, readinessContextOf(gateCtx, fs));
    for (const line of render.lines) logger.info(line);
    await clipboard.copy(render.clipboardContext);
    return 1;
  }

  const useCase = new OpenIntegrationPR(fs, stack);

  let plan: OpenIntegrationPRPlan;
  try {
    plan = useCase.plan();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(msg);
    return 1;
  }

  logger.info("");
  logger.info("🔗 Abrir Integration PR da spec ativa");
  logger.info("");
  logger.info(`  Spec:        ${plan.specId}-${plan.specSlug}`);
  logger.info(`  Title:       ${plan.title}`);
  logger.info(`  Base:        ${plan.base}`);
  logger.info(`  Head:        ${plan.head}`);
  logger.info(`  Draft:       ${plan.draft} (per CORE-09)`);
  logger.info(`  Body source: ${plan.bodyFilePath} (${plan.body.length} chars)`);
  logger.info("");
  logger.info(
    "Side-effect: PR aparece em GitHub UI. Owner converte Draft→Ready depois (per CORE-10 + ADR 0024)."
  );
  logger.info("");

  const confirmed = await prompts.confirm({
    message: "Confirmar abertura do Integration PR?",
    default: false,
  });
  if (!confirmed) {
    logger.info("Abertura cancelada.");
    return 0;
  }

  try {
    const pr = useCase.execute(plan);
    logger.info(`✓ PR #${pr.number} aberto: ${pr.url}`);
    return 0;
  } catch (err) {
    if (err instanceof OpenIntegrationPRError) {
      logger.error(err.message);
    } else {
      logger.error(`Falha ao abrir PR: ${err instanceof Error ? err.message : String(err)}`);
    }
    return 1;
  }
}

/**
 * Wizard handler para opção 5 (Executar merge atômico da stack).
 *
 * Flow: detecta spec → fetch PRs abertos → filtra+topo-sort → mostra plan →
 * confirma → executa. Cravado em `[DEC-0023-L01]`. Side-effect: merge atômico
 * irreversível em main + delete branches.
 */
async function runMergeStackWizard(opts: {
  logger: Logger;
  prompts: Prompts;
  fs: WorkflowFileSystem;
  stack: StackOps;
  clipboard: ClipboardWriter;
}): Promise<number> {
  const { logger, prompts, fs, stack, clipboard } = opts;

  // Detectar spec (per [DEC-0023-I01]) + estado, para o gate de readiness.
  const ctx = resolveContext(fs, logger);
  if (!ctx) {
    logger.error("Faça checkout de uma branch da stack antes de invocar merge-stack.");
    return 1;
  }

  // Gate determinístico de merge authorization (closing hardening): bloqueia o
  // merge atômico enquanto os gates humanos 1.H.[REVIEW] e 4.9 não fecham.
  const readiness = new CheckIntegrationReadiness(fs).run(ctx.location, "merge-stack");
  if (!readiness.ready) {
    const render = renderIntegrationReadinessBlock(readiness, readinessContextOf(ctx, fs));
    for (const line of render.lines) logger.info(line);
    await clipboard.copy(render.clipboardContext);
    return 1;
  }

  const dirMatch = /^(\d{4})-(.+)$/.exec(ctx.location.slug);
  if (!dirMatch) {
    logger.error(`Slug do diretório "${ctx.location.slug}" não segue padrão NNNN-slug.`);
    return 1;
  }
  const [, specId] = dirMatch;
  const mainBranch = "main";

  // Fetch PRs abertos; detecta a stack de implementação + o Integration PR.
  let stackPrs: ReadonlyArray<PullRequestData>;
  let integrationPr: PullRequestData | undefined;
  try {
    const openPrs = stack.listOpenPullRequests();
    stackPrs = detectStackForSpec(openPrs, specId, mainBranch);
    integrationPr = detectIntegrationPr(openPrs, specId);
  } catch (err) {
    logger.error(`Falha ao detectar stack: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  if (stackPrs.length === 0) {
    logger.error(
      `Nenhum PR aberto com "[Spec ${specId}]" no título. Stack já mergeada ou ausente.`
    );
    return 1;
  }

  // Escolha de modo de aterrissagem — explícita, sem inferência (DEC-0023-O03).
  const mode = await prompts.select<LandingMode>({
    message: "Modo de aterrissagem da stack",
    choices: [
      {
        name: "unit (default) — aterrissa como unidade: 1 SHA canônico, rollback de 1 comando",
        value: "unit",
      },
      {
        name: "sequential — aterrissa cada PR (fatias independentes / deploy train; rollback granular)",
        value: "sequential",
      },
    ],
  });

  // Build plan
  const useCase = new MergeStack(stack);
  let plan: MergeStackPlan;
  try {
    plan = useCase.plan({
      prNumbers: stackPrs.map((p) => p.number),
      mainBranch,
      mergeStrategy: "squash",
      mode,
      ...(mode === "unit" && integrationPr ? { integrationPrNumber: integrationPr.number } : {}),
    });
  } catch (err) {
    logger.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  logger.info("");
  logger.info("🔀 Executar merge atômico da stack");
  logger.info("");
  logger.info(`  Spec:     ${ctx.location.slug} (id ${specId})`);
  logger.info(`  Modo:     ${plan.mode}`);
  logger.info(`  Target:   ${plan.mainBranch}`);
  logger.info(`  Strategy: --${plan.mergeStrategy} --delete-branch`);
  logger.info("");
  if (plan.mode === "unit") {
    const vehicle = plan.items[0];
    const baseNote = vehicle.needsBaseEdit
      ? `(edit-base ${vehicle.currentBase} → ${plan.mainBranch} + merge)`
      : `(merge direto; base já é ${plan.mainBranch})`;
    logger.info(`  Veículo:  PR #${vehicle.prNumber}: ${vehicle.prTitle}`);
    logger.info(`            ${baseNote}`);
    const reconcile = plan.reconcilePrNumbers.map((n) => `#${n}`).join(", ") || "(nenhum)";
    logger.info(`  Fecha (landed-via reconciliation): ${reconcile}`);
  } else {
    logger.info(`  Stack:    ${plan.items.length} PRs em ordem`);
    for (let i = 0; i < plan.items.length; i++) {
      const item = plan.items[i];
      const baseNote = item.needsBaseEdit
        ? `(edit-base ${item.currentBase} → ${plan.mainBranch} + merge)`
        : `(merge direto; base já é ${plan.mainBranch})`;
      logger.info(`  ${i + 1}. PR #${item.prNumber}: ${item.prTitle}`);
      logger.info(`     ${baseNote}`);
    }
  }
  logger.info("");
  logger.info("ATENÇÃO: side-effects IRREVERSÍVEIS — merge em main + delete de branches remotas.");
  logger.info(`  ${plan.rollbackRecipe}`);
  logger.info("");

  const confirmed = await prompts.confirm({
    message: "Confirmar e iniciar merge atômico da stack?",
    default: false,
  });
  if (!confirmed) {
    logger.info("Merge cancelado.");
    return 0;
  }

  try {
    useCase.execute(plan, {
      onItemStart: (item, i) => {
        logger.info(`[${i + 1}/${plan.items.length}] Mergeando PR #${item.prNumber}...`);
      },
      onItemDone: (item, i) => {
        logger.info(`[${i + 1}/${plan.items.length}] ✓ PR #${item.prNumber} mergeado.`);
      },
      onReconcile: (prNumber) => {
        logger.info(`  ↳ landed-via reconciliation: fechando PR #${prNumber}...`);
      },
    });
    logger.info("");
    if (plan.mode === "unit") {
      logger.info(
        `✓ Atomic merge (unit) completo: veículo #${plan.items[0].prNumber} em ${plan.mainBranch}; ` +
          `${plan.reconcilePrNumbers.length} PR(s) reconciliado(s) via landed-via.`
      );
    } else {
      logger.info(`✓ Stack atomic merge completo: ${plan.items.length} PRs em ${plan.mainBranch}.`);
    }
    return 0;
  } catch (err) {
    if (err instanceof MergeStackError) {
      logger.error(err.message);
    } else {
      logger.error(
        `Falha inesperada em merge-stack: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return 1;
  }
}

const ADVANCED_OPS_VALUE = "advanced-ops";

/**
 * Menu do topo orientado por INTENÇÃO (Spec 0024): projeção do catálogo curado —
 * cada Intent vira uma entrada + a seção transitória de ops avançadas + sair.
 * Função pura (testável).
 */
export function buildTopMenu(catalog: readonly Intent[]) {
  return [
    ...catalog.map((intent) => ({ name: intent.title, value: `intent:${intent.id}` })),
    {
      name: "⚙️  Operações avançadas (wizard legado)",
      value: ADVANCED_OPS_VALUE,
    },
    { name: "Sair", value: "quit" },
  ];
}

/**
 * Superfície humana principal (Spec 0024): navega Intent → Action → Command;
 * execução SEMPRE via Registry. Sem conceito intermediário novo — o menu é
 * projeção do catálogo; a seção "Operações avançadas" é a única entrada não-Intent
 * (transitória, `runAdvancedOps`).
 */
export async function runWorkflow(options: RunOptions): Promise<number> {
  const logger = options.logger ?? stdoutLogger;
  const prompts = options.prompts ?? new InquirerPrompts();

  let choice: string;
  try {
    choice = await prompts.select<string>({
      message: "O que você quer fazer?",
      choices: buildTopMenu(INTENT_CATALOG),
    });
  } catch (err) {
    logger.error(`Wizard interrompido: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  if (choice === "quit") return 0;
  if (choice === ADVANCED_OPS_VALUE) return runAdvancedOps(options);

  const intent = INTENT_CATALOG.find((i) => `intent:${i.id}` === choice);
  if (!intent) {
    logger.error(`Intenção desconhecida: ${choice}`);
    return 1;
  }
  return runIntent(intent, options, logger, prompts);
}

/**
 * Navega as Actions de uma Intent e delega ao Registry. Intent NUNCA executa —
 * só referencia; a execução flui por Command → Use Case via `registry.dispatch`.
 * Registry injetável (`options.registry`) p/ teste; default = catálogo real via
 * import dinâmico (quebra o ciclo workflow↔buildRegistry).
 */
async function runIntent(
  intent: Intent,
  options: RunOptions,
  logger: Logger,
  prompts: Prompts
): Promise<number> {
  const action = await selectIntentAction(intent, prompts);
  if (!action) return 0;
  const registry =
    options.registry ?? (await import("./registry/buildRegistry.js")).buildRegistry();
  const argv = [action.command, ...(action.args ?? [])];
  // Injeta `prompts` no contexto: comandos interativos (com `prompt`) usam a
  // superfície humana; read-only ignoram. A seleção do produtor é do dispatch.
  const result = await registry.dispatch(argv, { repoRoot: options.repoRoot, logger, prompts });
  return result.exitCode;
}

/** Seleção da Action (valor = índice; testável). `undefined` se a Intent não tem ações. */
async function selectIntentAction(
  intent: Intent,
  prompts: Prompts
): Promise<IntentAction | undefined> {
  if (intent.actions.length === 0) return undefined;
  const value = await prompts.select<string>({
    message: intent.title,
    choices: intent.actions.map((action, index) => ({
      name: action.label ?? action.command,
      value: String(index),
    })),
  });
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index < intent.actions.length
    ? intent.actions[index]
    : undefined;
}

/**
 * SEÇÃO TRANSITÓRIA — wizard legado da 0023 (`runWizard`). Status real após a
 * falsificação de 2026-06-06 (ADR 0026 — não era "dívida de convergência"):
 *  - `list-active`/`diagnose-drift`/`visual-prompt` JÁ são Commands+Intents — aqui
 *    são DUPLICATAS removíveis (o caminho canônico é o Intent).
 *  - `integration-open`/`merge-stack` NÃO convergem a Commands: são PASSOS do rito
 *    de encerramento (operações do `workflow`), não capabilities de 1ª classe.
 *  - `continue-other`/`publish-state-help`: affordances humanas (ADR 0026 §4).
 * Cleanup OPCIONAL: remover as 3 entradas duplicadas; os ops de encerramento +
 * affordances permanecem operações do wizard (sua casa legítima).
 */
export async function runAdvancedOps(options: RunOptions): Promise<number> {
  const logger = options.logger ?? stdoutLogger;
  const fs = options.fs ?? new NodeWorkflowFileSystem(options.repoRoot);
  const prompts = options.prompts ?? new InquirerPrompts();
  const clipboard = options.clipboard ?? new NodeClipboard();
  const loadIndex = options.loadActiveSpecsIndex ?? defaultLoadActiveSpecsIndex(fs);

  // Wizard CLI operacional mínimo (cf. [DEC-0023-B06]).
  // Apresenta opções fixas declarativas no boot; cada opção mapeia 1:1
  // para um comando existente.
  let choice: WizardChoice;
  try {
    choice = await runWizard(prompts, logger);
  } catch (err) {
    logger.error(`Wizard interrompido: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  if (choice.kind === "quit") {
    return 0;
  }

  if (choice.kind === "list-active") {
    for (const line of renderActiveSpecsIndex(loadIndex(), undefined, { showWhenAbsent: true })) {
      logger.info(line);
    }
    return 0;
  }

  if (choice.kind === "diagnose-drift") {
    const result = loadIndex();
    if (!result.indexAvailable) {
      logger.info(
        "Índice operacional público (.governance/runtime/active-specs.yml) não encontrado."
      );
      logger.info("Dica: rode `yarn guidelines workflow publish-state` na branch da spec.");
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
    return 0;
  }

  if (choice.kind === "publish-state-help") {
    logger.info(
      "Comando: yarn guidelines workflow publish-state --status=<active|blocked|paused|completed> --updated-by=<@autor> [--title=<título>]"
    );
    logger.info("Estado da spec corrente é projetado de state.yml para active-specs.yml.");
    logger.info("Detalhes: .governance/specs/0023-workflow-runtime/decision-brief.md § Bloco G.");
    return 0;
  }

  if (choice.kind === "open-integration-pr") {
    return runOpenIntegrationPRWizard({
      logger,
      prompts,
      fs,
      stack: resolveStackOps(options),
      clipboard,
    });
  }

  if (choice.kind === "merge-stack") {
    return runMergeStackWizard({
      logger,
      prompts,
      fs,
      stack: resolveStackOps(options),
      clipboard,
    });
  }

  if (choice.kind === "visual-prompt") {
    let localContext = "";
    if (choice.context) {
      const target = parseContextTarget(choice.context);
      localContext = collectLocalContext(target, { repoRoot: options.repoRoot, fs });
    }
    const rendered = renderVisualPrompt(fs, choice.slug, {
      context: choice.context,
      localContext,
    });
    if (rendered === null) {
      logger.error(`Template "${choice.slug}" não encontrado em .governance/visual-prompts/.`);
      return 1;
    }
    const target = choice.targetLabel;

    // Tenta copiar automaticamente para o clipboard — elimina o passo
    // "selecionar manualmente entre os delimitadores + Ctrl+C".
    const copied = await clipboard.copy(rendered);

    logger.info("");
    if (choice.instructions.length > 0) {
      logger.info(`COMO USAR (destino: ${target}):`);
      for (const line of choice.instructions) {
        logger.info(`  ${line}`);
      }
      logger.info("");
    }

    if (copied) {
      // Por design não imprimimos o prompt completo no terminal quando o
      // clipboard funcionou — o conteúdo já está disponível para colar.
      // Mostrar só polui o terminal (prompts são grandes). Se você precisa
      // ver o conteúdo, cole em qualquer editor após o copy.
      logger.info(`✓ Prompt copiado para o clipboard (${rendered.length} caracteres).`);
      logger.info("");
    } else {
      // Fallback: clipboard indisponível — mostra o prompt entre delimitadores
      // para copy manual. Único caso em que renderizamos o conteúdo no logger.
      logger.info(
        "(clipboard indisponível — copie manualmente o texto abaixo entre os delimitadores)"
      );
      const hint = clipboardInstallHint();
      if (hint) logger.info(hint);
      logger.info(`──── PROMPT (destino: ${target}) ────`);
      logger.info(rendered.trimEnd());
      logger.info("──── FIM ────");
      logger.info("");
    }
    return 0;
  }

  if (choice.kind === "continue-other") {
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
    return 1;
  }

  logger.info(assembleBriefing(ctx));
  // Status dos 3 boundaries (execution/integration/release-log) — estado declarado,
  // sem recomendação de próxima ação (cf. [DEC-0023-M01] + memory lookup-not-coordination).
  logger.info("");
  for (const line of summarizeBoundaries(fs, ctx.location)) {
    logger.info(line);
  }
  // Branch detectada: índice é sinal secundário; só mostra quando há entries.
  for (const line of renderActiveSpecsIndex(loadIndex(), ctx.location.slug)) {
    logger.info(line);
  }

  let outcome: "continue" | "quit" = "continue";
  while (outcome === "continue") {
    outcome = await runReplOnce(ctx, prompts, logger, clipboard);
  }
  return 0;
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
  projectInsights(fs, logger);
  return 0;
}

/**
 * Projeta a fila viva de "Percepções em Trânsito" na retomada (derivada, situada).
 * Degrada graciosamente: um ledger corrompido emite aviso e NÃO derruba o briefing.
 */
function projectInsights(fs: WorkflowFileSystem, logger: Logger): void {
  try {
    const open = new FileInsightStore(fs).load().open();
    const block = renderResumptionInsights(buildInsightsProjection(open));
    if (block) logger.info(block);
  } catch (err) {
    logger.error(
      `(aviso: ledger de percepções ilegível — ${err instanceof Error ? err.message : String(err)})`
    );
  }
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

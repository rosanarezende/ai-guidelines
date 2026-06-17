/**
 * `decide` — superfície GOVERNADA, humana e interativa das decisões reservadas
 * à owner (CO-3 / PR #42).
 *
 * Fluxo: snapshot governado → briefing humano determinístico → escolha → prévia
 * → confirmação explícita → registro do efeito governado. Zero LLM no runtime
 * (ADR 0018): nenhuma narrativa é gerada por modelo; tudo deriva de fontes.
 *
 * Três modos:
 *   - --brief-only            → só explica (zero escrita);
 *   - --type X --decision Y --authorization explicit-human-decision --confirm
 *                             → modo direto não interativo (escrita sob autoridade);
 *   - (sem flags)             → wizard interativo (a confirmação final = autorização).
 *
 * Anti-TOCTOU (Etapa 11): UMA coleta por execução; antes de aplicar, RE-coleta e
 * compara o selo — mudou ⟹ aborta e pede recarga.
 */
import { execFileSync } from "node:child_process";
import {
  DecisionApplyContext,
  DecisionChoiceParams,
  DecisionGitOps,
  DecisionPlan,
  HumanDecisionDefinition,
  Logger,
  ResolvedActor,
} from "./model.js";
import { Prompts } from "../../app/ports/Prompts.js";
import {
  DecisionSnapshot,
  DecisionSnapshotOptions,
  collectDecisionSnapshot,
  ghRemotePrCollector,
} from "./snapshot.js";
import { DecisionRegistry, buildDecisionRegistry } from "./registry.js";
import { findDecisionType } from "../../infrastructure/yaml/humanDecisionPolicyReader.js";
import { DecisionListItem, renderBrief, renderDecisionList, renderPlanPreview } from "./render.js";
import { HandoffOptions } from "../handoff.js";
import type { StackOps } from "../../app/ports/StackOps.js";
import { GhCli } from "../../infrastructure/git/GhCli.js";

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export const DECISION_AUTHORIZATION = "explicit-human-decision";

export interface DecideArgs {
  readonly type?: string;
  readonly decision?: string;
  readonly briefOnly: boolean;
  readonly technical: boolean;
  readonly authorization?: string;
  readonly confirm: boolean;
  /** Subconjunto de findings (review-individually no modo direto). */
  readonly findings?: readonly string[];
  readonly noRemote: boolean;
}

export function parseDecideArgs(argv: readonly string[]): DecideArgs {
  let type: string | undefined;
  let decision: string | undefined;
  let authorization: string | undefined;
  let briefOnly = false;
  let technical = false;
  let confirm = false;
  let noRemote = false;
  const findings: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const eat = (flag: string): string | undefined =>
      arg === flag
        ? argv[++i]
        : arg.startsWith(`${flag}=`)
          ? arg.slice(flag.length + 1)
          : undefined;
    if (arg === "--brief-only") briefOnly = true;
    else if (arg === "--technical") technical = true;
    else if (arg === "--confirm") confirm = true;
    else if (arg === "--no-remote") noRemote = true;
    else {
      const t = eat("--type");
      if (t !== undefined) {
        type = t;
        continue;
      }
      const d = eat("--decision");
      if (d !== undefined) {
        decision = d;
        continue;
      }
      const a = eat("--authorization");
      if (a !== undefined) {
        authorization = a;
        continue;
      }
      const f = eat("--finding");
      if (f !== undefined) {
        findings.push(f);
        continue;
      }
    }
  }
  return {
    ...(type !== undefined ? { type } : {}),
    ...(decision !== undefined ? { decision } : {}),
    ...(authorization !== undefined ? { authorization } : {}),
    ...(findings.length > 0 ? { findings } : {}),
    briefOnly,
    technical,
    confirm,
    noRemote,
  };
}

// ── Actor + git (injetáveis para teste) ──────────────────────────────────────

export type GitConfigReader = (repoRoot: string, key: string) => string | null;

export const nodeGitConfigReader: GitConfigReader = (repoRoot, key) => {
  try {
    return execFileSync("git", ["config", "--get", key], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

/** Resolve o actor da decisão pela identidade git; handle normalizado pela policy. */
export function resolveActor(
  snapshot: DecisionSnapshot,
  read: GitConfigReader = nodeGitConfigReader
): ResolvedActor {
  const name = read(snapshot.repoRoot, "user.name");
  const email = read(snapshot.repoRoot, "user.email");
  let handle: string | null = null;
  const owner = snapshot.policy?.owner;
  if (owner && email && email.toLowerCase() === owner.email.toLowerCase()) {
    handle = owner.handle;
  } else if (email) {
    handle = `@${email.split("@")[0]}`;
  } else if (name) {
    handle = `@${name.replace(/\s+/g, "").toLowerCase()}`;
  }
  return { name, email, handle };
}

class NodeDecisionGitOps implements DecisionGitOps {
  constructor(private readonly repoRoot: string) {}
  porcelainPaths(): readonly string[] | null {
    let out: string;
    try {
      out = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
        cwd: this.repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      return null;
    }
    return out
      .split(/\r?\n/)
      .filter((line) => line.length > 3)
      .map((line) => {
        const raw = line.slice(3);
        const arrow = raw.indexOf(" -> ");
        return (arrow >= 0 ? raw.slice(arrow + 4) : raw).replace(/^"|"$/g, "");
      });
  }
  revParseShortHead(): string | null {
    try {
      return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
        cwd: this.repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return null;
    }
  }
  add(relFile: string): void {
    execFileSync("git", ["add", "--", relFile], { cwd: this.repoRoot, stdio: "ignore" });
  }
  commit(message: string): void {
    execFileSync("git", ["commit", "-m", message], {
      cwd: this.repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  push(): void {
    execFileSync("git", ["push"], { cwd: this.repoRoot, stdio: ["ignore", "pipe", "pipe"] });
  }
  createBranch(branchName: string, startPoint: string): void {
    execFileSync("git", ["checkout", "-b", branchName, startPoint], {
      cwd: this.repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  pushBranch(branchName: string): void {
    execFileSync("git", ["push", "-u", "origin", branchName], {
      cwd: this.repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
}

// ── Dependências injetáveis ──────────────────────────────────────────────────

export interface DecideDeps {
  readonly logger?: Logger;
  readonly prompts?: Prompts;
  readonly registry?: DecisionRegistry;
  readonly remote?: HandoffOptions["remote"];
  readonly collect?: (repoRoot: string, options: DecisionSnapshotOptions) => DecisionSnapshot;
  readonly git?: DecisionGitOps;
  readonly stack?: StackOps;
  readonly gitConfig?: GitConfigReader;
  readonly externalChecks?: DecisionSnapshotOptions["externalChecks"];
  /** Override de TTY para o modo interativo (default: process.stdin.isTTY). */
  readonly isTTY?: boolean;
}

/**
 * Itens da lista (Tela 1): oculta decisões `not-applicable` (não pertinentes ao
 * estado) e renumera 1..n. `available` e `blocked` aparecem (a owner precisa ver
 * por que algo está bloqueado).
 */
function buildListItems(
  registry: DecisionRegistry,
  snapshot: DecisionSnapshot
): DecisionListItem[] {
  return registry
    .definitions()
    .map((def) => ({ def, availability: def.detect(snapshot) }))
    .filter((x) => x.availability.status !== "not-applicable")
    .map((x, i) => ({
      index: i + 1,
      id: x.def.id,
      title: x.def.title,
      availability: x.availability,
    }));
}

function collectSnapshot(repoRoot: string, deps: DecideDeps, noRemote: boolean): DecisionSnapshot {
  const options: DecisionSnapshotOptions = {
    remote: noRemote ? null : deps.remote !== undefined ? deps.remote : ghRemotePrCollector,
    ...(deps.externalChecks ? { externalChecks: deps.externalChecks } : {}),
  };
  return (deps.collect ?? collectDecisionSnapshot)(repoRoot, options);
}

// ── Entrada principal ────────────────────────────────────────────────────────

export async function runDecide(
  repoRoot: string,
  args: DecideArgs,
  deps: DecideDeps = {}
): Promise<number> {
  const logger = deps.logger ?? defaultLogger;
  const registry = deps.registry ?? buildDecisionRegistry();

  let snapshot: DecisionSnapshot;
  try {
    snapshot = collectSnapshot(repoRoot, deps, args.noRemote);
  } catch (e) {
    logger.error(
      `❌ decide — estado irrecuperável na coleta: ${e instanceof Error ? e.message : String(e)}`
    );
    return 1;
  }
  if (snapshot.policyError) {
    logger.error(`❌ decide — contrato de decisões inválido/ausente: ${snapshot.policyError}`);
    return 1;
  }

  // Autorização (fail-closed): só uma forma válida.
  const authValid = args.authorization === DECISION_AUTHORIZATION;
  if (args.authorization !== undefined && !authValid) {
    logger.error(
      `❌ decide — autorização desconhecida: "${args.authorization}". Única forma válida: ${DECISION_AUTHORIZATION}.`
    );
    return 2;
  }

  // ── Modo BRIEF-ONLY / briefing de um tipo (zero escrita) ───────────────────
  // `--brief-only` (lista + briefings) OU `--type X` sem decisão/confirm (briefing
  // daquele tipo, com `--technical` opcional). Read-only — nunca entra no wizard.
  if (args.briefOnly || (args.type !== undefined && args.decision === undefined && !args.confirm)) {
    return runBriefOnly(snapshot, registry, args, logger);
  }

  // ── Modo DIRETO (não interativo) ───────────────────────────────────────────
  // Ativa quando há --decision OU --confirm (uma confirmação isolada deve falhar
  // explicitamente, não cair no wizard).
  if (args.decision !== undefined || args.confirm) {
    return runDirect(repoRoot, snapshot, registry, args, deps, logger, authValid);
  }

  // ── Modo WIZARD interativo ─────────────────────────────────────────────────
  return runWizard(repoRoot, snapshot, registry, args, deps, logger);
}

function runBriefOnly(
  snapshot: DecisionSnapshot,
  registry: DecisionRegistry,
  args: DecideArgs,
  logger: Logger
): number {
  if (args.type) {
    const def = registry.resolve(args.type);
    if (!def) {
      logger.error(
        `❌ decide — decisão desconhecida: "${args.type}". Disponíveis: ${registry.ids().join(", ")}.`
      );
      return 2;
    }
    logger.info(
      renderBrief(def.buildBrief(snapshot, { technical: args.technical }), {
        technical: args.technical,
      })
    );
    return 0;
  }
  logger.info(renderDecisionList(buildListItems(registry, snapshot)));
  // Briefings só das decisões pertinentes (não-`not-applicable`).
  for (const def of registry.definitions()) {
    if (def.detect(snapshot).status === "not-applicable") continue;
    logger.info("");
    logger.info("────────────────────────────────────────");
    logger.info("");
    logger.info(
      renderBrief(def.buildBrief(snapshot, { technical: args.technical }), {
        technical: args.technical,
      })
    );
  }
  return 0;
}

function buildApplyContext(
  repoRoot: string,
  snapshot: DecisionSnapshot,
  deps: DecideDeps,
  logger: Logger
): DecisionApplyContext {
  return {
    repoRoot,
    logger,
    actor: resolveActor(snapshot, deps.gitConfig ?? nodeGitConfigReader),
    git: deps.git ?? new NodeDecisionGitOps(repoRoot),
    stack: deps.stack ?? new GhCli(repoRoot),
    authorization: DECISION_AUTHORIZATION,
  };
}

/** Verifica autoridade do actor (requires_owner) para um tipo de decisão. */
function actorAuthorized(
  snapshot: DecisionSnapshot,
  typeId: string,
  actor: ResolvedActor
): string | null {
  const policy = snapshot.policy ? findDecisionType(snapshot.policy, typeId) : undefined;
  if (!policy || !policy.requiresOwner) return null;
  const owner = snapshot.policy!.owner;
  if (!actor.email || actor.email.toLowerCase() !== owner.email.toLowerCase()) {
    return `Esta decisão é reservada à owner (${owner.handle}); identidade git atual: ${actor.email ?? "desconhecida"}.`;
  }
  return null;
}

async function runDirect(
  repoRoot: string,
  snapshot: DecisionSnapshot,
  registry: DecisionRegistry,
  args: DecideArgs,
  deps: DecideDeps,
  logger: Logger,
  authValid: boolean
): Promise<number> {
  if (!args.type || !args.decision) {
    logger.error(
      "❌ decide (modo direto) exige --type <tipo> --decision <escolha> --authorization " +
        `${DECISION_AUTHORIZATION} --confirm.`
    );
    return 2;
  }
  if (!authValid) {
    logger.error(
      `❌ decide (modo direto) — autorização ausente/ inválida. Use --authorization ${DECISION_AUTHORIZATION}. Nada foi escrito.`
    );
    return 1;
  }
  if (!args.confirm) {
    logger.error(
      "❌ decide (modo direto) — falta --confirm. A autorização sozinha NÃO aplica. Nada foi escrito."
    );
    return 1;
  }
  const def = registry.resolve(args.type);
  if (!def) {
    logger.error(
      `❌ decide — decisão desconhecida: "${args.type}". Disponíveis: ${registry.ids().join(", ")}.`
    );
    return 2;
  }

  // Autorização NÃO cria elegibilidade.
  const availability = def.detect(snapshot);
  const choice = def.choices(snapshot).find((c) => c.id === args.decision);
  if (!choice) {
    logger.error(
      `❌ decide — escolha "${args.decision}" desconhecida para ${def.id}. Disponíveis: ${def
        .choices(snapshot)
        .map((c) => c.id)
        .join(", ")}.`
    );
    return 2;
  }
  if (choice.mutating && availability.status !== "available") {
    logger.error("❌ decide — decisão indisponível não pode ser forçada:");
    for (const r of availability.reasons) logger.error(`  - ${r}`);
    return 1;
  }

  const ctx = buildApplyContext(repoRoot, snapshot, deps, logger);
  const authErr = actorAuthorized(snapshot, def.id, ctx.actor);
  if (authErr) {
    logger.error(`❌ decide — ${authErr}`);
    return 1;
  }

  const params: DecisionChoiceParams = args.findings ? { findings: args.findings } : {};
  const plan = def.plan(snapshot, args.decision, params);
  if (!plan.mutating) {
    logger.info(renderPlanPreview(plan));
    return 0;
  }

  // Anti-TOCTOU: re-coleta e compara o selo antes de aplicar.
  const fresh = collectSnapshot(repoRoot, deps, args.noRemote);
  const freshPlan = def.plan(fresh, args.decision, params);
  if (freshPlan.seal !== plan.seal || freshPlan.gitHead !== plan.gitHead) {
    logger.error(
      "❌ decide — o estado mudou entre o plano e a aplicação (selo/HEAD divergente). Nada foi escrito; recarregue e refaça."
    );
    return 1;
  }
  return applyPlan(def, freshPlan, ctx, logger);
}

async function applyPlan(
  def: HumanDecisionDefinition,
  plan: DecisionPlan,
  ctx: DecisionApplyContext,
  logger: Logger
): Promise<number> {
  const result = await def.apply(plan, ctx);
  for (const m of result.messages)
    logger[result.ok ? "info" : "error"](result.ok ? `✅ ${m}` : `❌ ${m}`);
  if (!result.ok) return 1;
  if (plan.nextHuman.length > 0) {
    logger.info("");
    for (const n of plan.nextHuman) logger.info(n);
  }
  return 0;
}

// ── Wizard interativo ────────────────────────────────────────────────────────

const TECHNICAL_CHOICE = "__technical__";

async function runWizard(
  repoRoot: string,
  snapshot: DecisionSnapshot,
  registry: DecisionRegistry,
  args: DecideArgs,
  deps: DecideDeps,
  logger: Logger
): Promise<number> {
  const prompts = deps.prompts;
  const tty = deps.isTTY ?? process.stdin.isTTY ?? false;
  if (!prompts && !tty) {
    // Sem terminal interativo nem provider injetado: degrada para leitura.
    logger.info(renderDecisionList(buildListItems(registry, snapshot)));
    logger.info("");
    logger.info(
      "Terminal não interativo. Use `decide --brief-only` (e `--type <tipo>`/`--technical`) para ler, " +
        `ou o modo direto (--type … --decision … --authorization ${DECISION_AUTHORIZATION} --confirm).`
    );
    return 0;
  }
  const io = prompts ?? (await loadPrompts());

  // Tela 1 — decisões pendentes.
  const items = buildListItems(registry, snapshot);
  logger.info(renderDecisionList(items));
  logger.info("");
  const selected = await io.select<string>({
    message: "Qual decisão você quer revisar?",
    choices: [
      ...items.map((it) => ({
        name: `${it.title} — ${it.availability.status === "available" ? "Disponível" : "Indisponível"}`,
        value: it.id,
      })),
      { name: "Sair", value: "__quit__" },
    ],
  });
  if (selected === "__quit__") {
    logger.info("Saindo. Nada foi alterado.");
    return 0;
  }
  const def = registry.resolve(selected)!;

  // Tela 2/3 — briefing humano + escolha (detalhes técnicos sob demanda).
  let technical = args.technical;
  for (;;) {
    const brief = def.buildBrief(snapshot, { technical });
    logger.info("");
    logger.info(renderBrief(brief, { technical }));
    logger.info("");

    // O wizard RENDERIZA o briefing governado; não injeta escolhas de decisão.
    // O cancelamento sem efeito já é uma escolha não-mutante do contrato (toda
    // decisão a declara e ela é sempre `available`), então não há um "Cancelar"
    // hardcoded além dela — isso geraria duas opções de cancelamento. A única
    // afordância de UI injetada é o toggle de detalhes técnicos.
    const choiceOptions = [
      ...brief.choices.filter((c) => c.available).map((c) => ({ name: c.label, value: c.id })),
      ...(brief.technicalDetails.length > 0 && !technical
        ? [{ name: "Ver detalhes técnicos", value: TECHNICAL_CHOICE }]
        : []),
    ];
    const picked = await io.select<string>({
      message: "O que você decide?",
      choices: choiceOptions,
    });
    if (picked === TECHNICAL_CHOICE) {
      technical = true;
      continue;
    }

    // Coleta de parâmetros (review-individually).
    let params: DecisionChoiceParams = {};
    if (picked === "review-individually") {
      const sel = await collectIndividual(snapshot, io, logger);
      if (sel === null) {
        logger.info("Operação cancelada. Nada foi alterado.");
        return 0;
      }
      params = { findings: sel };
    }

    const plan = def.plan(snapshot, picked, params);

    // Tela 4 — prévia.
    logger.info("");
    logger.info(renderPlanPreview(plan));
    logger.info("");

    if (!plan.mutating) {
      for (const n of plan.note) logger.info(n);
      return 0;
    }

    // Tela 5 — confirmação (= autorização).
    const confirmed = await io.confirm({
      message: "Registrar esta decisão e publicar o commit exclusivo?",
      default: false,
    });
    if (!confirmed) {
      logger.info("Cancelado. Nada foi alterado.");
      return 0;
    }

    // Anti-TOCTOU: re-coleta + compara selo antes de aplicar.
    const fresh = collectSnapshot(repoRoot, deps, args.noRemote);
    const freshPlan = def.plan(fresh, picked, params);
    if (freshPlan.seal !== plan.seal || freshPlan.gitHead !== plan.gitHead) {
      logger.error(
        "❌ O estado mudou desde o briefing (selo/HEAD divergente). Nada foi escrito; recarregue e refaça."
      );
      return 1;
    }
    const ctx = buildApplyContext(repoRoot, fresh, deps, logger);
    const authErr = actorAuthorized(fresh, def.id, ctx.actor);
    if (authErr) {
      logger.error(`❌ ${authErr}`);
      return 1;
    }
    return applyPlan(def, freshPlan, ctx, logger);
  }
}

async function collectIndividual(
  snapshot: DecisionSnapshot,
  io: Prompts,
  logger: Logger
): Promise<string[] | null> {
  const accepted: string[] = [];
  for (const f of snapshot.openFindings) {
    logger.info("");
    logger.info(`${f.localId}: ${f.description.replace(/\s+/g, " ").trim().slice(0, 160)}`);
    const action = await io.select<string>({
      message: `O que fazer com ${f.localId}?`,
      choices: [
        { name: "Aceitar (encerrar)", value: "accept" },
        { name: "Manter aberto", value: "keep" },
        { name: "Cancelar toda a operação", value: "abort" },
      ],
    });
    if (action === "abort") return null;
    if (action === "accept") accepted.push(f.qualified);
  }
  return accepted;
}

async function loadPrompts(): Promise<Prompts> {
  const mod = await import("../../infrastructure/io/ClackPrompts.js");
  return new mod.ClackPrompts();
}

export function runDecideCli(
  repoRoot: string,
  argv: readonly string[],
  logger: Logger = defaultLogger,
  deps: DecideDeps = {}
): Promise<number> {
  return runDecide(repoRoot, parseDecideArgs(argv), { logger, ...deps });
}

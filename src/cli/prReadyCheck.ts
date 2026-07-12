/**
 * `pr-ready:check` — precondições da conversão Draft → Ready (FU-2, Spec 0024).
 *
 * A sequência canônica de fechamento de PR não pode depender da memória do
 * agente (PIT-0010):
 *
 *   plano situado de revisões decidido → PR body final → CI verde no HEAD final
 *   → reviews obrigatórios current+approved → Draft → Ready → Human Gate da owner
 *   → registro do gate artifact → próximo checkpoint.
 *
 * Este comando é READ-ONLY: valida as precondições ANTES da conversão e nunca
 * converte o PR — o ato Draft → Ready e o Human Gate seguem sendo atos
 * explícitos da owner. Distinções preservadas:
 *   - Draft/Ready é estado nativo do GitHub (flag `draft`).
 *   - Ready NÃO autoriza merge (ADR 0024).
 *   - Human Gate decide o próximo movimento; o gate artifact só nasce DEPOIS
 *     da decisão humana (registrá-lo antes é inconsistência — este check falha).
 *   - Em stack modo `unit`, Human Gate intermediário não mergeia em `main`.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

import { parseSpecBranch } from "../app/workflow/DetectActiveSpec.js";
import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { runGovernancePrCheck } from "./governance-pr-check.js";
import { normalizePrBody, resolveVersionedPrBodyPath } from "./prBodyVersioned.js";
import { consolidate, discover, observedReviewStates } from "./reviewCheck.js";
import {
  buildReviewTypeRegistry,
  deriveEffectiveReviewStatuses,
} from "../app/reviews/reviewRequirements.js";
import {
  deriveSmokeReadinessPolicy,
  normalizeCheckRuns,
  type ReadyCheckRun,
  type ReadyCheckSmokePolicy,
  type SmokeNodeFact,
} from "../app/readiness/readiness.js";
import { parseSteps } from "../app/handoff/handoffFacts.js";
import { deriveFrenteProgression } from "../app/workflow/frenteProgression.js";
import { collectFunctionalFreshness } from "./reviewFreshness.js";
import { derivePrReadyFlow, prReadyFlowFactsFromReadySnapshot } from "./flow/GovernedFlow.js";

export interface ReadyCheckPr {
  readonly number: number;
  readonly state: string;
  readonly isDraft: boolean;
  readonly title: string;
  readonly body: string;
  readonly labels: ReadonlyArray<string>;
  readonly headRefOid: string;
  readonly headRefName: string;
  /** Branch base do PR (posição na stack). Opcional para compat com snapshots antigos. */
  readonly baseRefName?: string;
}

/**
 * Status efetivo de um tipo de review no checkpoint (CO-4, rodada 8):
 * catálogo × aplicabilidade × requisito × estado. SOMENTE `blocking`
 * (required não satisfeito) trava o Ready; recommended vira advisory.
 */
export interface ReadyCheckReviewStatus {
  readonly typeId: string;
  readonly applicability: "yes" | "no" | "unknown";
  readonly requirement: "disabled" | "optional" | "recommended" | "required";
  readonly state: "missing" | "current" | "stale" | "in-progress";
  readonly decision: string | null;
  readonly blocking: boolean;
  readonly source: string;
  readonly notes?: ReadonlyArray<string>;
  /** Conflitos de policy (mesma prioridade, valores incompatíveis) — falham o check. */
  readonly errors: ReadonlyArray<string>;
}

export interface ReadyCheckCheckpoint {
  readonly id: string;
  /** Decisão do gate artifact, se já existir (`gates/c-<checkpoint>.yml`). */
  readonly gateDecision: "approved" | "changes_requested" | null;
  readonly openBlockingCount: number;
  readonly reviewDecisions: ReadonlyArray<{ readonly role: string; readonly decision: string }>;
  /** Decisões humanas pendentes no plano situado de reviews do PR. */
  readonly reviewPlanDecisionReasons?: ReadonlyArray<string>;
  /** Etapa `[/]` ativa do checkpoint (frenteProgression); undefined = fato não observável. */
  readonly activeStep?: { readonly id: string; readonly readiness: string | null } | null;
  readonly reviewStatuses: ReadonlyArray<ReadyCheckReviewStatus>;
}

// Derivações puras da família readiness vivem em src/app/readiness (fatia 2 do
// refactor); a CLI re-exporta a superfície pública para compatibilidade.
export {
  deriveSmokeReadinessPolicy,
  normalizeCheckRuns,
  smokeRelevantChangedPaths,
} from "../app/readiness/readiness.js";
export type { ReadyCheckRun, ReadyCheckSmokePolicy } from "../app/readiness/readiness.js";

export interface ReadyCheckSnapshot {
  readonly pr: ReadyCheckPr;
  /** Checks de CI no HEAD atual do PR (bucket: pass | fail | pending | skipping | cancel). */
  readonly checks: ReadonlyArray<{ readonly name: string; readonly bucket: string }>;
  /** Razões de falha do contrato READY do body (governance-pr-check com isDraft=false). */
  readonly readyBodyContractReasons: ReadonlyArray<string>;
  /** Razões de divergência entre o body publicado no GitHub e o body versionado no repo. */
  readonly versionedPrBodyReasons?: ReadonlyArray<string>;
  /** SHA do HEAD local (null = indisponível). */
  readonly localHeadSha: string | null;
  /** Working tree local limpa (null = indisponível). */
  readonly workingTreeClean: boolean | null;
  /** Estado de reviews/gate do checkpoint do cursor (null = PR fora de spec/topologia). */
  readonly checkpoint: ReadyCheckCheckpoint | null;
  /** Suspensão temporária governada dos smoke tests. Compat: use smokePolicy quando disponível. */
  readonly smokeTestsSuspended?: boolean;
  /** Política factual de quando smoke real é obrigatório para Ready/Human Gate. */
  readonly smokePolicy?: ReadyCheckSmokePolicy;
}

export interface ReadyCheckResult {
  readonly ok: boolean;
  readonly failures: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
}

const READY_IS_NOT_MERGE =
  "Ready NÃO autoriza merge (ADR 0024): a conversão apenas apresenta o PR para decisão humana; o Human Gate decide o próximo movimento e, em stack modo unit, não há merge isolado em main.";

/** Pure: avalia as precondições de Ready sobre um snapshot. */
export function evaluateReadyPreconditions(snapshot: ReadyCheckSnapshot): ReadyCheckResult {
  const result = derivePrReadyFlow(prReadyFlowFactsFromReadySnapshot(snapshot));
  return { ok: result.failures.length === 0, failures: result.failures, warnings: result.warnings };
}

function collectVersionedPrBodyReasons(input: {
  readonly repoRoot: string;
  readonly pr: ReadyCheckPr;
}): string[] {
  const parsed = parseSpecBranch(input.pr.headRefName);
  if (!parsed) return [];

  let file: string;
  try {
    file = resolveVersionedPrBodyPath({
      repoRoot: input.repoRoot,
      prNumber: input.pr.number,
      specId: parsed.specId,
    });
  } catch (error) {
    return [
      `body versionado do PR #${input.pr.number} não pôde ser localizado: ${
        error instanceof Error ? error.message : String(error)
      }`,
    ];
  }

  if (!fs.existsSync(file)) {
    return [`body versionado do PR #${input.pr.number} não encontrado: ${file}.`];
  }

  const local = normalizePrBody(fs.readFileSync(file, "utf8"));
  const remote = normalizePrBody(input.pr.body);
  if (local === remote) return [];

  return [
    `body publicado do PR #${input.pr.number} diverge do body versionado (${path.relative(
      input.repoRoot,
      file
    )}); rode pr-body:pull ou pr-body:publish antes de Ready.`,
  ];
}

// ── Coleta do snapshot (gh + git + artefatos locais) ─────────────────────────

export interface SnapshotCollector {
  collect(prNumber: number, repo: string, repoRoot: string): ReadyCheckSnapshot;
}

function gh(args: ReadonlyArray<string>): string {
  return execFileSync("gh", [...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function gitOrNull(repoRoot: string, args: ReadonlyArray<string>): string | null {
  try {
    return execFileSync("git", [...args], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

/** Paths alterados base..HEAD; null = base não observável localmente (⇒ unknown). */
function changedPathsOrNull(repoRoot: string, baseRefName: string | undefined): string[] | null {
  if (!baseRefName) return null;
  const out = gitOrNull(repoRoot, ["diff", "--name-only", `origin/${baseRefName}...HEAD`]);
  if (out === null) return null;
  return out.split(/\r?\n/).filter((line) => line.length > 0);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function nodeFact(value: unknown): SmokeNodeFact | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = record.id;
  if (typeof id !== "string") return null;
  return {
    id,
    role: typeof record.role === "string" ? record.role : null,
    terminal: record.terminal === true,
  };
}

function nodeCheckpoints(value: unknown): readonly string[] {
  return asArray(asRecord(value)?.checkpoints).filter((cp): cp is string => typeof cp === "string");
}

function collectSmokeTopology(
  repoRoot: string,
  specDir: string
): { activeNode: SmokeNodeFact | null; nextNode: SmokeNodeFact | null } {
  const statePath = path.join(repoRoot, ".governance", "specs", specDir, "state.yml");
  if (!fs.existsSync(statePath)) return { activeNode: null, nextNode: null };
  const state = asRecord(parseYaml(fs.readFileSync(statePath, "utf-8")));
  const topology = asRecord(state?.topology);
  const prs = asRecord(topology?.prs);
  const cursor = asRecord(topology?.cursor);
  const checkpoint = typeof cursor?.checkpoint === "string" ? cursor.checkpoint : null;
  const activeNodes = asArray(prs?.active);
  const plannedNodes = asArray(prs?.planned);
  const active =
    activeNodes.find((n) => checkpoint !== null && nodeCheckpoints(n).includes(checkpoint)) ??
    activeNodes[0] ??
    null;
  return {
    activeNode: nodeFact(active),
    nextNode: nodeFact(plannedNodes[0] ?? null),
  };
}

function collectCheckpoint(
  repoRoot: string,
  headRefName: string,
  prLabels: readonly string[],
  changedPaths: readonly string[] | null
): ReadyCheckCheckpoint | null {
  const parsed = parseSpecBranch(headRefName);
  if (!parsed) return null;
  const fs = new NodeWorkflowFileSystem(repoRoot);
  const dirs = fs.directoryExists(".governance/specs") ? fs.listDirectory(".governance/specs") : [];
  const specDir = dirs.find((d) => d.startsWith(`${parsed.specId}-`));
  if (!specDir) return null;

  const statePath = fs.resolveAbsolute(`.governance/specs/${specDir}/state.yml`);
  if (!fs.fileExists(statePath)) return null;
  // Cursor do state.yml: o checkpoint operacional corrente da spec.
  const cursorMatch = /^\s*checkpoint:\s*(\S+)\s*$/m.exec(fs.readTextFile(statePath));
  if (!cursorMatch) return null;
  const cursor = cursorMatch[1];

  // Etapa ativa via derivação CANÔNICA da Frente (frenteProgression + parseSteps):
  // Ready não pode parecer semanticamente concluído com a etapa em implementação.
  const tasksPath = fs.resolveAbsolute(`.governance/specs/${specDir}/tasks.md`);
  const activeStep = fs.fileExists(tasksPath)
    ? deriveFrenteProgression({
        steps: parseSteps(fs.readTextFile(tasksPath), cursor),
        nextPlannedNode: null,
        gateApproved: false,
      }).activeStep
    : null;

  const { artifacts } = discover(repoRoot);
  const { byCheckpoint } = consolidate(artifacts);
  const entry = byCheckpoint.find(
    (cp) => normalizeCheckpoint(cp.checkpoint) === normalizeCheckpoint(cursor)
  );

  // Status efetivo por tipo (CO-4, rodada 8): aqui o contexto é o mais rico —
  // labels do PR observadas e changed paths deriváveis (base local).
  const nodeCtx =
    artifacts.topologyByCheckpoint?.[cursor] ??
    artifacts.topologyByCheckpoint?.[normalizeCheckpoint(cursor)];
  const freshness = collectFunctionalFreshness(repoRoot, `.governance/specs/${specDir}/reviews`);
  const statuses = deriveEffectiveReviewStatuses({
    registry: artifacts.registry ?? buildReviewTypeRegistry(null).registry,
    policy: artifacts.reviewPolicy ?? null,
    ctx: {
      prProfile: nodeCtx?.nodeRole ?? null,
      labels: prLabels,
      changedPaths,
    },
    ...(nodeCtx?.overrides || nodeCtx?.reviewPlanOverrides
      ? {
          nodeOverrides: {
            ...(nodeCtx.overrides ?? {}),
            ...(nodeCtx.reviewPlanOverrides ?? {}),
          },
        }
      : {}),
    ...(nodeCtx?.reviewPlan ? { reviewPlan: nodeCtx.reviewPlan } : {}),
    observed: observedReviewStates(artifacts, cursor),
    functionalHead: freshness.effectiveFunctionalHead,
  });

  return {
    id: cursor,
    gateDecision: entry?.gate?.decision ?? null,
    openBlockingCount: entry?.openBlocking.length ?? 0,
    reviewDecisions: entry?.reviewDecisions ?? [],
    reviewPlanDecisionReasons: nodeCtx?.reviewPlanIssues ?? [],
    activeStep: activeStep ? { id: activeStep.id, readiness: activeStep.readiness ?? null } : null,
    reviewStatuses: statuses.map((s) => ({
      typeId: s.typeId,
      applicability: s.applicability,
      requirement: s.requirement,
      state: s.state,
      decision: s.decision,
      blocking: s.blocking,
      source: s.requirementSource,
      notes: s.notes,
      errors: s.errors,
    })),
  };
}

export function detectSmokeTestsSuspended(repoRoot: string): boolean {
  const workflowPath = path.join(repoRoot, ".github", "workflows", "smoke-multi-os.yml");
  if (!fs.existsSync(workflowPath)) return false;
  const content = fs.readFileSync(workflowPath, "utf-8");
  return /AI_GUIDELINES_SMOKE_TEMPORARILY_SUSPENDED:\s*["']?true["']?/i.test(content);
}

function collectSmokePolicy(
  repoRoot: string,
  headRefName: string,
  changedPaths: readonly string[] | null,
  suspended: boolean
): ReadyCheckSmokePolicy {
  const parsed = parseSpecBranch(headRefName);
  if (!parsed) {
    return deriveSmokeReadinessPolicy({
      suspended,
      changedPaths,
      activeNode: null,
      nextNode: null,
    });
  }
  const specsDir = path.join(repoRoot, ".governance", "specs");
  const specDir = fs.existsSync(specsDir)
    ? (fs.readdirSync(specsDir).find((d) => d.startsWith(`${parsed.specId}-`)) ?? null)
    : null;
  const topology =
    specDir === null
      ? { activeNode: null, nextNode: null }
      : collectSmokeTopology(repoRoot, specDir);
  return deriveSmokeReadinessPolicy({
    suspended,
    changedPaths,
    activeNode: topology.activeNode,
    nextNode: topology.nextNode,
  });
}

export class GhSnapshotCollector implements SnapshotCollector {
  collect(prNumber: number, repo: string, repoRoot: string): ReadyCheckSnapshot {
    const raw = JSON.parse(gh(["api", `repos/${repo}/pulls/${prNumber}`])) as {
      number: number;
      state: string;
      draft?: boolean;
      title: string;
      body: string | null;
      labels: ReadonlyArray<{ name: string }>;
      head: { sha: string; ref: string };
      base: { ref: string };
    };
    const pr: ReadyCheckPr = {
      number: raw.number,
      state: raw.state,
      isDraft: Boolean(raw.draft),
      title: raw.title,
      body: raw.body ?? "",
      labels: raw.labels.map((l) => l.name),
      headRefOid: raw.head.sha,
      headRefName: raw.head.ref,
      baseRefName: raw.base.ref,
    };

    // REST check-runs (não GraphQL): funciona em gh antigos (sem `pr checks
    // --json`) e evita o erro Projects-classic visto no `gh pr edit` (FU-1).
    let checks: Array<{ name: string; bucket: string }> = [];
    try {
      const runs = JSON.parse(
        gh(["api", `repos/${repo}/commits/${raw.head.sha}/check-runs`, "--paginate"])
      ) as { check_runs: ReadyCheckRun[] };
      checks = normalizeCheckRuns(runs.check_runs);
    } catch {
      checks = [];
    }

    const changedPaths = changedPathsOrNull(repoRoot, pr.baseRefName);
    const smokeTestsSuspended = detectSmokeTestsSuspended(repoRoot);

    // Contrato READY do body: o MESMO validador do CI, forçando isDraft=false.
    const bodyResult = runGovernancePrCheck(
      {
        prNumber: pr.number,
        prTitle: pr.title,
        prBody: pr.body,
        prLabels: pr.labels,
        repo,
        prBranch: pr.headRefName,
        isDraft: false,
      },
      new NodeWorkflowFileSystem(repoRoot)
    );
    const readyBodyContractReasons = bodyResult.kind === "fail" ? bodyResult.reasons : [];
    const versionedPrBodyReasons = collectVersionedPrBodyReasons({ repoRoot, pr });

    const status = gitOrNull(repoRoot, ["status", "--porcelain"]);
    return {
      pr,
      checks,
      readyBodyContractReasons,
      versionedPrBodyReasons,
      localHeadSha: gitOrNull(repoRoot, ["rev-parse", "HEAD"]),
      workingTreeClean: status === null ? null : status === "",
      checkpoint: collectCheckpoint(repoRoot, pr.headRefName, pr.labels, changedPaths),
      smokeTestsSuspended,
      smokePolicy: collectSmokePolicy(repoRoot, pr.headRefName, changedPaths, smokeTestsSuspended),
    };
  }
}

// ── Entrada CLI (`cli/pr-ready-check.mjs`) ───────────────────────────────────

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

const stdoutLogger: Logger = {
  info: (m) => process.stdout.write(`${m}\n`),
  error: (m) => process.stderr.write(`${m}\n`),
};

export interface MainOptions {
  readonly logger?: Logger;
  readonly collector?: SnapshotCollector;
  readonly repoRoot?: string;
}

/** `owner/repo` via gh — exportado para reuso (handoff: mesma fonte remota, sem 2º gateway). */
export function detectRepo(): string {
  return gh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).trim();
}

export function main(argv: ReadonlyArray<string> = [], options: MainOptions = {}): number {
  const logger = options.logger ?? stdoutLogger;
  let pr: number | undefined;
  let repo: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--pr") pr = Number(argv[++i]);
    else if (arg === "--repo") repo = argv[++i];
    else {
      logger.error(`Argumento desconhecido: ${arg}`);
      return 2;
    }
  }
  if (!pr || !Number.isInteger(pr)) {
    logger.error("Uso: npm run pr-ready:check -- --pr <n> [--repo owner/repo]");
    return 2;
  }

  const collector = options.collector ?? new GhSnapshotCollector();
  const snapshot = collector.collect(pr, repo ?? detectRepo(), options.repoRoot ?? process.cwd());
  const result = evaluateReadyPreconditions(snapshot);

  for (const warning of result.warnings) logger.info(`⚠️  ${warning}`);
  if (!result.ok) {
    logger.error(`❌ pr-ready:check — PR #${pr} NÃO está pronto para Ready:`);
    for (const failure of result.failures) logger.error(`   - ${failure}`);
    logger.error(
      `\nSequência canônica: plano situado de revisões decidido → PR body final → CI verde no HEAD final → reviews obrigatórios current+approved → Draft → Ready → Human Gate → registro do gate → próximo checkpoint.`
    );
    return 1;
  }

  logger.info(`✅ pr-ready:check — PR #${pr} satisfaz as precondições de Ready.`);
  logger.info(`   ${READY_IS_NOT_MERGE}`);
  logger.info(
    `   A conversão Draft → Ready e o Human Gate seguem sendo atos explícitos da owner — este check não converte nada.`
  );
  return 0;
}

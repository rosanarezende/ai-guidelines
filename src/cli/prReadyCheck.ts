/**
 * `pr-ready:check` — precondições da conversão Draft → Ready (FU-2, Spec 0024).
 *
 * A sequência canônica de fechamento de PR não pode depender da memória do
 * agente (PIT-0010):
 *
 *   PR body final → CI verde no HEAD final → Draft → Ready → Human Gate da
 *   owner → registro do gate artifact → próximo checkpoint.
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

import { parseSpecBranch } from "../app/workflow/DetectActiveSpec.js";
import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { runGovernancePrCheck } from "./governance-pr-check.js";
import { consolidate, discover } from "./reviewCheck.js";

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

export interface ReadyCheckCheckpoint {
  readonly id: string;
  /** Decisão do gate artifact, se já existir (`gates/c-<checkpoint>.yml`). */
  readonly gateDecision: "approved" | "changes_requested" | null;
  readonly openBlockingCount: number;
  readonly reviewDecisions: ReadonlyArray<{ readonly role: string; readonly decision: string }>;
  readonly requiredReviewRoles: ReadonlyArray<string>;
}

export interface ReadyCheckSnapshot {
  readonly pr: ReadyCheckPr;
  /** Checks de CI no HEAD atual do PR (bucket: pass | fail | pending | skipping | cancel). */
  readonly checks: ReadonlyArray<{ readonly name: string; readonly bucket: string }>;
  /** Razões de falha do contrato READY do body (governance-pr-check com isDraft=false). */
  readonly readyBodyContractReasons: ReadonlyArray<string>;
  /** SHA do HEAD local (null = indisponível). */
  readonly localHeadSha: string | null;
  /** Working tree local limpa (null = indisponível). */
  readonly workingTreeClean: boolean | null;
  /** Estado de reviews/gate do checkpoint do cursor (null = PR fora de spec/topologia). */
  readonly checkpoint: ReadyCheckCheckpoint | null;
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
  const failures: string[] = [];
  const warnings: string[] = [];
  const { pr } = snapshot;

  if (pr.state.toLowerCase() !== "open") {
    failures.push(`PR #${pr.number} não está OPEN (estado: ${pr.state}).`);
  }
  if (!pr.isDraft) {
    warnings.push(
      `PR #${pr.number} já está Ready — este check é pré-conversão; precondições avaliadas mesmo assim.`
    );
  }

  for (const reason of snapshot.readyBodyContractReasons) {
    failures.push(`contrato Ready do body: ${reason}`);
  }

  if (snapshot.checks.length === 0) {
    failures.push("nenhum check de CI encontrado no HEAD atual — CI verde é precondição de Ready.");
  }
  for (const check of snapshot.checks) {
    if (check.bucket === "fail" || check.bucket === "cancel") {
      failures.push(`CI não está verde no HEAD final: check "${check.name}" = ${check.bucket}.`);
    } else if (check.bucket === "pending") {
      failures.push(`CI ainda não terminou no HEAD final: check "${check.name}" pendente.`);
    }
  }

  if (snapshot.localHeadSha === null) {
    warnings.push(
      "HEAD local indisponível — não foi possível confirmar que o body/CI cobrem o HEAD final."
    );
  } else if (
    !pr.headRefOid.startsWith(snapshot.localHeadSha) &&
    !snapshot.localHeadSha.startsWith(pr.headRefOid)
  ) {
    failures.push(
      `HEAD local (${snapshot.localHeadSha.slice(0, 7)}) difere do HEAD remoto do PR (${pr.headRefOid.slice(0, 7)}) — push/pull antes de apresentar o PR como final.`
    );
  }

  if (snapshot.workingTreeClean === null) {
    warnings.push("estado da working tree indisponível.");
  } else if (!snapshot.workingTreeClean) {
    failures.push(
      "working tree local não está limpa — implementação não está concluída/commitada."
    );
  }

  const checkpoint = snapshot.checkpoint;
  if (checkpoint === null) {
    warnings.push("PR sem checkpoint/topologia associado — reviews/gate não avaliados.");
  } else {
    if (checkpoint.gateDecision === "approved") {
      failures.push(
        `Human Gate do checkpoint "${checkpoint.id}" já está registrado como approved ANTES do Ready — inconsistência na sequência canônica (o gate artifact nasce DEPOIS da decisão humana sobre o PR em Ready).`
      );
    }
    if (checkpoint.openBlockingCount > 0) {
      failures.push(
        `há ${checkpoint.openBlockingCount} finding(s) bloqueante(s) (critical/high) aberto(s) no checkpoint "${checkpoint.id}".`
      );
    }
    for (const role of checkpoint.requiredReviewRoles) {
      const decision = checkpoint.reviewDecisions.find((r) => r.role === role)?.decision;
      if (decision === undefined) {
        failures.push(`review obrigatória "${role}" ausente para o checkpoint "${checkpoint.id}".`);
      } else if (decision !== "approved") {
        failures.push(
          `review obrigatória "${role}" do checkpoint "${checkpoint.id}" está "${decision}" (precisa de approved).`
        );
      }
    }
  }

  return { ok: failures.length === 0, failures, warnings };
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

function collectCheckpoint(repoRoot: string, headRefName: string): ReadyCheckCheckpoint | null {
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

  const { artifacts } = discover(repoRoot);
  const { byCheckpoint } = consolidate(artifacts);
  const entry = byCheckpoint.find(
    (cp) => normalizeCheckpoint(cp.checkpoint) === normalizeCheckpoint(cursor)
  );
  const requiredReviewRoles = artifacts.requiredReviewRolesByCheckpoint?.[cursor] ?? [];

  return {
    id: cursor,
    gateDecision: entry?.gate?.decision ?? null,
    openBlockingCount: entry?.openBlocking.length ?? 0,
    reviewDecisions: entry?.reviewDecisions ?? [],
    requiredReviewRoles,
  };
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
      ) as { check_runs: Array<{ name: string; status: string; conclusion: string | null }> };
      checks = runs.check_runs.map((run) => ({
        name: run.name,
        bucket:
          run.status !== "completed"
            ? "pending"
            : run.conclusion === "success"
              ? "pass"
              : run.conclusion === "skipped" || run.conclusion === "neutral"
                ? "skipping"
                : "fail",
      }));
    } catch {
      checks = [];
    }

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

    const status = gitOrNull(repoRoot, ["status", "--porcelain"]);
    return {
      pr,
      checks,
      readyBodyContractReasons,
      localHeadSha: gitOrNull(repoRoot, ["rev-parse", "HEAD"]),
      workingTreeClean: status === null ? null : status === "",
      checkpoint: collectCheckpoint(repoRoot, pr.headRefName),
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
      `\nSequência canônica: PR body final → CI verde no HEAD final → Draft → Ready → Human Gate → registro do gate → próximo checkpoint.`
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

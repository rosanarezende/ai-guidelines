/**
 * `review:publish` — fechamento operacional SEGURO do artefato de review
 * (CO-4, rodada 8): commit EXCLUSIVO + push normal do review/evento derivado
 * pelo briefing, sob autorização capability-scoped.
 *
 * Contrato de autoridade (review-policy.yml § publication.canonical_artifact):
 * o PEDIDO HUMANO EXPLÍCITO do review já autoriza este ciclo limitado — sem
 * segunda confirmação. FAIL-CLOSED: sem `--authorization
 * explicit-review-request`, nada é commitado/pushado. A autorização NUNCA
 * cobre: código funcional, outros arquivos, GitHub comments/reviews, Ready,
 * Human Gate, gate artifact, merge, force-push, --no-verify.
 *
 * Guard EXECUTÁVEL de diff: a working tree deve conter EXATAMENTE o artefato
 * esperado (path canônico da lane/checkpoint do cursor) — qualquer outro path
 * (funcional, docs, segundo artefato, untracked extra) bloqueia ANTES do
 * commit, listando os inesperados. Mensagem de commit é DERIVADA
 * (determinística); hooks preservados; push normal (nunca force; nunca
 * --no-verify — as validações obrigatórias rodam nos hooks de commit/push).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { parseReview, parseReviewEvent } from "../infrastructure/yaml/reviewArtifactsReader.js";
import { consolidate, discover } from "./reviewCheck.js";
import { HandoffOptions } from "./handoff.js";
import {
  collectReviewBrief,
  deriveReviewCommitMessage,
  parseAuthorization,
} from "./reviewBrief.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export interface ReviewPublishArgs {
  readonly file?: string;
  readonly authorization?: string;
}

export function parseArgs(argv: readonly string[]): ReviewPublishArgs {
  const args: { file?: string; authorization?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--file") args.file = argv[++i];
    else if (arg.startsWith("--file=")) args.file = arg.slice("--file=".length);
    else if (arg === "--authorization") args.authorization = argv[++i];
    else if (arg.startsWith("--authorization=")) {
      args.authorization = arg.slice("--authorization=".length);
    }
  }
  return args;
}

function git(repoRoot: string, args: readonly string[]): string {
  return execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitOrNull(repoRoot: string, args: readonly string[]): string | null {
  try {
    return git(repoRoot, args).trim();
  } catch {
    return null;
  }
}

function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

/** Paths do porcelain (sem trim; formato `XY <path>`; rename "a -> b"). */
function porcelainPaths(repoRoot: string): string[] | null {
  let out: string;
  try {
    out = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
      cwd: repoRoot,
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

export function runReviewPublish(
  repoRoot: string,
  args: ReviewPublishArgs,
  logger: Logger = defaultLogger,
  remoteOverride?: HandoffOptions["remote"]
): number {
  // ── Autorização (fail-closed) ───────────────────────────────────────────────
  const authorization = parseAuthorization(args.authorization);
  if (authorization === null) {
    logger.error(
      "❌ review:publish — autorização AUSENTE. O commit/push do artefato só é autorizado " +
        "por pedido humano explícito do review (--authorization explicit-review-request). " +
        "Nada foi commitado ou pushado."
    );
    return 1;
  }
  if (authorization === "invalid") {
    logger.error(
      `❌ review:publish — autorização inválida: "${args.authorization}". Única forma válida: ` +
        "explicit-review-request. Nada foi commitado ou pushado."
    );
    return 1;
  }

  if (!args.file) {
    logger.error("❌ review:publish — argumento obrigatório --file ausente.");
    return 2;
  }
  const relFile = toPosix(
    path.isAbsolute(args.file) ? path.relative(repoRoot, args.file) : args.file
  );
  const absFile = path.join(repoRoot, relFile);
  if (!fs.existsSync(absFile)) {
    logger.error(`❌ review:publish — artefato não encontrado: ${relFile}.`);
    return 1;
  }

  // ── Artefato: parse valida schema + selo (fingerprint correto ⇔ seal no-op) ─
  const rawText = fs.readFileSync(absFile, "utf8");
  const isEvent = /^event_id\s*:/m.test(rawText);
  let artifactRole: string;
  let artifactCheckpoint: string;
  let artifactKind: "review" | "verification-event";
  let eventId: string | null = null;
  try {
    if (isEvent) {
      const event = parseReviewEvent(rawText, relFile);
      artifactRole = event.role;
      artifactCheckpoint = event.checkpoint;
      artifactKind = "verification-event";
      eventId = event.eventId;
    } else {
      const review = parseReview(rawText, relFile);
      artifactRole = review.role;
      artifactCheckpoint = review.checkpoint;
      artifactKind = "review";
    }
  } catch (e) {
    logger.error(
      `❌ review:publish — artefato inválido/não selado (${e instanceof Error ? e.message : String(e)}). ` +
        "Sele com: npm run review:seal -- --file " +
        relFile
    );
    return 1;
  }

  // ── Briefing do MESMO estado (o artefato no disco fecha a lane ⇒ current) ──
  const collected = collectReviewBrief(repoRoot, artifactRole, {
    remote: remoteOverride !== undefined ? remoteOverride : null,
    authorization: "explicit-review-request",
  });
  const facts = collected.snapshot.collected.facts;
  const brief = collected.brief;
  const failures: string[] = [];

  // 1-3. branch/upstream/behind
  if (!facts.git.branch) failures.push("branch atual não observável (detached HEAD?).");
  if (!facts.git.upstream) {
    failures.push("branch sem upstream — configure antes de publicar (git push -u ...).");
  } else if ((facts.git.behind ?? 0) > 0) {
    failures.push(
      `branch está BEHIND do upstream (${facts.git.behind} commit(s)) — reconcilie (pull) antes de publicar.`
    );
  }

  // 4-5/18-19. path canônico + checkpoint/role do cursor
  const cursor = facts.cursor;
  if (!cursor) {
    failures.push("state.yml sem cursor — não há checkpoint ativo.");
  } else {
    if (normalizeCheckpoint(artifactCheckpoint) !== normalizeCheckpoint(cursor.checkpoint)) {
      failures.push(
        `checkpoint do artefato ("${artifactCheckpoint}") ≠ checkpoint do cursor ("${cursor.checkpoint}").`
      );
    }
    const norm = normalizeCheckpoint(cursor.checkpoint);
    const expectedPath =
      artifactKind === "review"
        ? `${facts.spec.path}/reviews/c-${norm}-${artifactRole}.yml`
        : `${facts.spec.path}/reviews/events/c-${norm}-${artifactRole}-${eventId}.yml`;
    if (relFile !== expectedPath) {
      failures.push(
        `path do artefato fora do canônico: esperado "${expectedPath}", recebido "${relFile}".`
      );
    }
  }

  // 5 (mode). O artefato correto recém-criado COBRE a cabeça funcional ⇒ a lane
  // fica CURRENT. blocked/create/verification aqui = artefato não corresponde.
  if (brief.mode === "blocked") {
    failures.push(`lane BLOCKED — ${brief.modeBasis[0] ?? "reconcilie antes de publicar"}`);
  } else if (brief.mode !== "current") {
    failures.push(
      `o artefato não fecha a lane (briefing ainda infere ${brief.mode.toUpperCase()}): o subject_ref ` +
        `não cobre a cabeça funcional auditável (${brief.effectiveFunctionalHead ?? "?"}) ou o artefato diverge do derivado.`
    );
  }

  // 10/14-17. Guard de diff: working tree EXATAMENTE o artefato esperado.
  const dirty = porcelainPaths(repoRoot);
  if (dirty === null) {
    failures.push("git status indisponível — guard de diff não pôde rodar.");
  } else {
    const unexpected = dirty.map(toPosix).filter((p) => p !== relFile);
    if (!dirty.map(toPosix).includes(relFile)) {
      failures.push(`o artefato ${relFile} não está pendente na working tree (já commitado?).`);
    }
    if (unexpected.length > 0) {
      failures.push(
        `diff NÃO é review-only — paths inesperados (mixed_diff: block):\n` +
          unexpected.map((p) => `    ${p}`).join("\n")
      );
    }
  }

  // 8. review:check composto (mesmos leitores; sem reimplementar).
  const { artifacts, errors } = discover(repoRoot);
  if (errors.length > 0) {
    failures.push(`review:check — ${errors.length} erro(s) de schema: ${errors[0]}`);
  } else {
    const { violations } = consolidate(artifacts);
    if (violations.length > 0) {
      failures.push(`review:check — ${violations.length} violação(ões): ${violations[0]}`);
    }
  }

  if (failures.length > 0) {
    logger.error("❌ review:publish — BLOCKED; nenhum commit, nenhum push. Pré-condições falhas:");
    for (const f of failures) logger.error(`  - ${f}`);
    return 1;
  }

  // ── Commit exclusivo (mensagem DERIVADA; hooks preservados) ────────────────
  const message = deriveReviewCommitMessage(
    brief.specId,
    facts.activeNode?.id ?? cursor?.pr ?? null,
    artifactRole,
    artifactKind
  );
  try {
    git(repoRoot, ["add", "--", relFile]);
    git(repoRoot, ["commit", "-m", message]);
  } catch (e) {
    logger.error(
      `❌ review:publish — commit falhou (hooks preservados; nada foi pushado): ${e instanceof Error ? e.message : String(e)}`
    );
    return 1;
  }
  const commitSha = gitOrNull(repoRoot, ["rev-parse", "--short", "HEAD"]) ?? "?";
  logger.info(`✅ commit exclusivo criado: ${commitSha} — "${message}"`);

  // ── Push normal (nunca force; nunca --no-verify) ───────────────────────────
  try {
    git(repoRoot, ["push"]);
  } catch (e) {
    logger.error(
      `⚠️ review:publish — PUSH FALHOU; o commit ${commitSha} permanece LOCAL (nada foi perdido). ` +
        `Reconcilie e rode \`git push\` (normal) quando possível. Detalhe: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`
    );
    return 1;
  }
  logger.info(
    `✅ review:publish — artefato publicado (push normal). Fim do escopo autorizado: PARE aqui ` +
      `(sem GitHub comments, sem Ready/gate/merge).`
  );
  return 0;
}

/** Composition root do bin físico. */
export function main(
  repoRoot: string,
  argv: readonly string[] = [],
  logger: Logger = defaultLogger
): number {
  return runReviewPublish(repoRoot, parseArgs(argv), logger);
}

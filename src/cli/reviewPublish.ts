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
import { HandoffFacts } from "./handoffFacts.js";
import { HandoffOptions } from "./handoff.js";
import {
  ReviewBrief,
  collectReviewBrief,
  deriveReviewCommitMessage,
  parseAuthorization,
} from "./reviewBrief.js";
import { readReceiptText } from "./handoffReceipt.js";
import { emitReceiptAdvisory } from "./handoff.js";

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

/** Metadados do artefato candidato (já parseado/selado). */
export interface CandidateArtifact {
  readonly role: string;
  readonly checkpoint: string;
  readonly kind: "review" | "verification-event";
  readonly eventId: string | null;
  readonly relFile: string;
}

export interface ProspectivePublicationContext {
  readonly facts: HandoffFacts;
  /**
   * Briefing derivado do estado PROSPECTIVO — o estado em disco que JÁ inclui o
   * artefato candidato (criado/selado, ainda não commitado). O candidato é
   * descoberto por `discover` exatamente como ficaria após o commit; a única
   * diferença é o commit em si. Assim a publicação avalia "a lane FECHARIA como
   * current?" sem exigir que o evento já esteja commitado (quebra a
   * circularidade: o evento não precisa ser publicado para a lane virar current).
   */
  readonly brief: ReviewBrief;
  readonly artifact: CandidateArtifact;
  /** Paths pendentes na working tree (porcelain); null = git status indisponível. */
  readonly dirtyPaths: readonly string[] | null;
  /** Resultado do `review:check` composto sobre o conjunto descoberto (com candidato). */
  readonly consolidation: {
    readonly errors: readonly string[];
    readonly violations: readonly string[];
  };
}

/**
 * Avaliação PROSPECTIVA da publicação (pura): dado o estado situado + o artefato
 * candidato já incluído no conjunto descoberto, retorna as pré-condições falhas.
 * Vazio ⟹ publicar (commit review-only + push) é seguro. NÃO grava o artefato
 * nem altera seu fingerprint — apenas decide.
 */
export function evaluateProspectiveReviewPublication(ctx: ProspectivePublicationContext): {
  ok: boolean;
  failures: string[];
} {
  const { facts, brief, artifact, dirtyPaths, consolidation } = ctx;
  const failures: string[] = [];

  // 1-3. branch/upstream/behind.
  if (!facts.git.branch) failures.push("branch atual não observável (detached HEAD?).");
  if (!facts.git.upstream) {
    failures.push("branch sem upstream — configure antes de publicar (git push -u ...).");
  } else if ((facts.git.behind ?? 0) > 0) {
    failures.push(
      `branch está BEHIND do upstream (${facts.git.behind} commit(s)) — reconcilie (pull) antes de publicar.`
    );
  }

  // 4-5/18-19. checkpoint/role do cursor + path canônico.
  const cursor = facts.cursor;
  if (!cursor) {
    failures.push("state.yml sem cursor — não há checkpoint ativo.");
  } else {
    if (normalizeCheckpoint(artifact.checkpoint) !== normalizeCheckpoint(cursor.checkpoint)) {
      failures.push(
        `checkpoint do artefato ("${artifact.checkpoint}") ≠ checkpoint do cursor ("${cursor.checkpoint}").`
      );
    }
    const norm = normalizeCheckpoint(cursor.checkpoint);
    const expectedPath =
      artifact.kind === "review"
        ? `${facts.spec.path}/reviews/c-${norm}-${artifact.role}.yml`
        : `${facts.spec.path}/reviews/events/c-${norm}-${artifact.role}-${artifact.eventId}.yml`;
    if (artifact.relFile !== expectedPath) {
      failures.push(
        `path do artefato fora do canônico: esperado "${expectedPath}", recebido "${artifact.relFile}".`
      );
    }
  }

  // 5 (mode prospectivo). O candidato JÁ está no conjunto descoberto: se a lane
  // fecha como CURRENT, ele cobre a cabeça funcional. blocked/create/verification
  // = o candidato NÃO fecha a lane (subject_ref não cobre o functional HEAD, ou
  // diverge do derivado, ou a lane prospectiva continua VERIFICATION).
  if (brief.mode === "blocked") {
    failures.push(`lane BLOCKED — ${brief.modeBasis[0] ?? "reconcilie antes de publicar"}`);
  } else if (brief.mode !== "current") {
    failures.push(
      `lane prospectiva NÃO fecha como current (briefing infere ${brief.mode.toUpperCase()} com o candidato incluído): ` +
        `o subject_ref não cobre a cabeça funcional auditável (${brief.effectiveFunctionalHead ?? "?"}) ou o artefato diverge do derivado.`
    );
  }

  // 10/14-17. Guard de diff: working tree EXATAMENTE o artefato candidato.
  if (dirtyPaths === null) {
    failures.push("git status indisponível — guard de diff não pôde rodar.");
  } else {
    const unexpected = dirtyPaths.map(toPosix).filter((p) => p !== artifact.relFile);
    if (!dirtyPaths.map(toPosix).includes(artifact.relFile)) {
      failures.push(
        `o artefato ${artifact.relFile} não está pendente na working tree (já commitado?).`
      );
    }
    if (unexpected.length > 0) {
      failures.push(
        `diff NÃO é review-only — paths inesperados (mixed_diff: block):\n` +
          unexpected.map((p) => `    ${p}`).join("\n")
      );
    }
  }

  // 8. review:check composto (mesmos leitores; sem reimplementar).
  if (consolidation.errors.length > 0) {
    failures.push(
      `review:check — ${consolidation.errors.length} erro(s) de schema: ${consolidation.errors[0]}`
    );
  } else if (consolidation.violations.length > 0) {
    failures.push(
      `review:check — ${consolidation.violations.length} violação(ões): ${consolidation.violations[0]}`
    );
  }

  return { ok: failures.length === 0, failures };
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

  // CO-3.4 — Captura o estado do recibo ANTES do briefing. `collectReviewBrief`
  // reusa `loadHandoffSnapshot`, que é um ATO DE CARGA: reescreve o recibo como
  // fresh por design. Ler aqui preserva a evidência de uma retomada não
  // reconciliada — caso contrário o advisory desta superfície seria código morto
  // (validaria contra um recibo que ele mesmo acabou de atualizar).
  const priorReceiptText = readReceiptText(repoRoot);

  // ── Briefing do MESMO estado (o artefato no disco fecha a lane ⇒ current) ──
  const collected = collectReviewBrief(repoRoot, artifactRole, {
    remote: remoteOverride !== undefined ? remoteOverride : null,
    authorization: "explicit-review-request",
  });
  const facts = collected.snapshot.collected.facts;
  const brief = collected.brief;
  const cursor = facts.cursor;

  // Advisory-first do recibo de carga (não-lançante): valida o recibo PRÉVIO
  // contra um snapshot derivado com o mesmo default de remote da carga.
  emitReceiptAdvisory(repoRoot, priorReceiptText, logger);

  // review:check composto (mesmos leitores; o conjunto descoberto JÁ inclui o
  // candidato em disco — é o estado prospectivo).
  const { artifacts, errors } = discover(repoRoot);
  const violations = errors.length === 0 ? consolidate(artifacts).violations.map(String) : [];

  const { failures } = evaluateProspectiveReviewPublication({
    facts,
    brief,
    artifact: {
      role: artifactRole,
      checkpoint: artifactCheckpoint,
      kind: artifactKind,
      eventId,
      relFile,
    },
    dirtyPaths: porcelainPaths(repoRoot),
    consolidation: { errors: errors.map(String), violations },
  });

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

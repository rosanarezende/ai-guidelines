/**
 * `review <papel>` — briefing GOVERNADO e situado de reviews (CO-4).
 *
 * Dor absorvida (dogfood 2026-06-12, rodada 5 / PIT-0011): para pedir "faça
 * uma auditoria técnica" a owner precisava de um mega-prompt reconstruindo
 * papel/escopo/path/schema/selo/validações/proibições — e mesmo assim o agente
 * publicou comentário redundante no GitHub e narrou fingerprint divergente.
 * O contrato (review-policy, schemas, templates, review:seal, review:check)
 * EXISTIA, mas não era projetado no momento da ação.
 *
 * Este comando NÃO realiza julgamento técnico/arquitetural (zero LLM no
 * runtime — ADR 0018): ele PROJETA o contrato que o agente revisor deve
 * cumprir, derivado do MESMO snapshot do ato de carga do handoff
 * (`loadHandoffSnapshot` — anti-TOCTOU; recibo atualizado na mesma execução):
 *
 *   review-policy (lanes/publicação) + estado do checkpoint + reviews/
 *   findings/resolutions/events existentes + Git/PR/HEAD + templates
 *   → briefing operacional situado (papel, modo inferido, objeto auditado,
 *     artefato-alvo, vetores, ações permitidas/proibidas, validações,
 *     formato do relatório final).
 *
 * Publicação (política machine-readable em review-policy.yml § publication):
 * o canal canônico é o ARTEFATO versionado na spec; comentário/review no
 * GitHub é projeção opcional, PROIBIDA por default — só com autorização
 * humana explícita. Nenhuma publicação automática aqui.
 */
import * as path from "node:path";
import * as fs from "node:fs";
import {
  ReviewArtifact,
  ReviewEventArtifact,
  ResolutionArtifact,
} from "../infrastructure/yaml/reviewArtifactsReader.js";
import {
  ReviewLanePolicy,
  ReviewPolicy,
  ReviewPublicationPolicy,
  parseReviewPolicy,
} from "../infrastructure/yaml/reviewPolicyReader.js";
import {
  EffectiveReviewStatus,
  ReviewTypeDef,
  ReviewTypeRegistry,
  availableTypesLine,
  buildReviewTypeRegistry,
  deriveEffectiveReviewStatuses,
  legacyDeprecationWarnings,
  resolveReviewType,
} from "../app/reviews/reviewRequirements.js";
import { HandoffFacts } from "./handoffFacts.js";
import {
  HandoffLoadSnapshot,
  HandoffOptions,
  ghRemotePrCollector,
  loadHandoffSnapshot,
} from "./handoff.js";
import { discover, observedReviewStates } from "./reviewCheck.js";
import { WorkingTreeState, collectFunctionalFreshness } from "./reviewFreshness.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

/**
 * Governança de reviews carregada da policy do repositório (CO-4, rodada 8):
 * catálogo resolvido (framework defaults + tipos do repositório) + policy.
 * Sem review-policy.yml o catálogo são os defaults distribuídos (TA/AR,
 * enabled, optional) — consumidores não precisam de arquivo para ter os tipos.
 */
export interface ReviewGovernance {
  readonly policy: ReviewPolicy | null;
  readonly registry: ReviewTypeRegistry;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export function loadReviewGovernance(repoRoot: string): ReviewGovernance {
  let policy: ReviewPolicy | null = null;
  const errors: string[] = [];
  const policyPath = path.join(repoRoot, ".governance/review-policy.yml");
  if (fs.existsSync(policyPath)) {
    try {
      policy = parseReviewPolicy(fs.readFileSync(policyPath, "utf-8"));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  const build = buildReviewTypeRegistry(policy);
  return {
    policy,
    registry: build.registry,
    errors: [...errors, ...build.errors],
    warnings: [...build.warnings, ...(policy ? legacyDeprecationWarnings(policy) : [])],
  };
}

/**
 * Resolve o argumento da CLI → tipo do catálogo. Mantido o nome legado
 * `normalizeRole` para compat: agora é registry-driven (tipos customizados
 * entram pelos aliases declarados na policy, sem mudança no core).
 */
export function normalizeRole(raw: string, registry: ReviewTypeRegistry): string | null {
  return resolveReviewType(registry, raw)?.id ?? null;
}

export type ReviewBriefMode = "create" | "current" | "verification" | "blocked";

/**
 * Autorização capability-scoped (rodada 7→8): o PEDIDO HUMANO EXPLÍCITO de um
 * review ("Faça o Technical Audit do checkpoint atual.") JÁ autoriza o ciclo
 * governado completo e LIMITADO daquele review — investigar, criar o artefato
 * canônico, selar, validar, commit EXCLUSIVO e push normal — sem segunda
 * confirmação. NÃO autoriza: mudança funcional, GitHub, Ready, gate, merge.
 * O runtime não interpreta linguagem natural: o AGENTS.md ensina o agente a
 * mapear o pedido explícito para `--authorization explicit-review-request`;
 * execução espontânea (sem pedido humano) = sem autorização (fail-closed).
 */
export type ReviewAuthorization = "explicit-review-request";

export function parseAuthorization(
  raw: string | undefined
): ReviewAuthorization | null | "invalid" {
  if (raw === undefined) return null;
  return raw === "explicit-review-request" ? "explicit-review-request" : "invalid";
}

/** Mensagem de commit DERIVADA (determinística) do artefato de review. */
export function deriveReviewCommitMessage(
  specId: string,
  nodeId: string | null,
  role: string,
  kind: "review" | "verification-event"
): string {
  const roleLabel = role.replace(/_/g, " ");
  return kind === "verification-event"
    ? `docs(spec-${specId}): registra verification do ${roleLabel}`
    : `docs(spec-${specId}): registra ${roleLabel} do ${nodeId ?? "checkpoint"}`;
}

export interface ReviewSubjectFact {
  /** Branch base do PR (posição na stack), quando observável. */
  readonly baseRef: string | null;
  /** HEAD atual (objeto a auditar/revalidar). */
  readonly headSha: string | null;
  /** Intervalo recomendado (base..head ou delta de revalidação). */
  readonly range: string | null;
  /** Token VÁLIDO para preencher subject_ref (sem espaços; SHA quando base desconhecida). */
  readonly refSuggestion: string | null;
  /** Ref do review anterior (subject_ref declarado) quando houver. */
  readonly previousRef: string | null;
  /** declared = subject_ref machine-readable; unknown = review sem proveniência. */
  readonly provenance: "declared" | "unknown" | "none";
}

export interface ReviewArtifactPlan {
  /** Path exato do artefato a criar (review novo ou evento append-only). */
  readonly path: string;
  readonly kind: "review" | "verification-event" | "none";
  readonly template: string | null;
  /** Próximo event_id (EV<N>) quando kind = verification-event. */
  readonly nextEventId: string | null;
  /**
   * Escopo da verification (kind = verification-event):
   *   findings = revalida findings específicos pós-resolutions (`verifies`);
   *   review   = revalida o review INTEIRO contra novo subject (zero findings
   *              incluso; `review_fingerprint` + `subject_ref`; SEM verifies).
   */
  readonly verificationScope: "findings" | "review" | null;
}

export interface ExistingReviewFact {
  readonly file: string;
  readonly decision: string;
  readonly findingsEmitted: number;
  readonly fingerprint: string | null;
  readonly subjectRef: string | null;
  readonly executor: string | null;
}

export interface ReviewBrief {
  readonly specId: string;
  readonly checkpoint: string | null;
  readonly role: string;
  /** HEAD git real (referência) — pode conter commits review-only. */
  readonly gitHead: string | null;
  /** Cabeça FUNCIONAL auditável (comparações de freshness usam esta). */
  readonly effectiveFunctionalHead: string | null;
  readonly workingTreeState: WorkingTreeState;
  readonly mode: ReviewBriefMode;
  /** Base factual citável da inferência do modo. */
  readonly modeBasis: ReadonlyArray<string>;
  /** Degradação declarada (proveniência insuficiente, fonte remota etc.). */
  readonly degraded: ReadonlyArray<string>;
  readonly subject: ReviewSubjectFact;
  readonly existingReview: ExistingReviewFact | null;
  readonly findings: ReadonlyArray<string>;
  readonly resolutions: ReadonlyArray<string>;
  readonly events: ReadonlyArray<string>;
  readonly artifact: ReviewArtifactPlan;
  readonly lane: ReviewLanePolicy | null;
  /** Tipo do catálogo (origem framework|repository, título, template). */
  readonly typeDef: ReviewTypeDef | null;
  /** Status efetivo: aplicabilidade × requisito × estado × blocking. */
  readonly effectiveStatus: EffectiveReviewStatus | null;
  readonly publication: ReviewPublicationPolicy | null;
  readonly allowedActions: ReadonlyArray<string>;
  readonly prohibitedActions: ReadonlyArray<string>;
  readonly validationCommands: ReadonlyArray<string>;
  readonly finalReportSections: ReadonlyArray<string>;
  readonly authorization: ReviewAuthorization | null;
  /** Comando canônico de publicação segura (quando autorizado e há artefato). */
  readonly publishCommand: string | null;
  /** Mensagem de commit derivada (o publish a usa; agente não inventa). */
  readonly derivedCommitMessage: string | null;
}

export type { WorkingTreeState } from "./reviewFreshness.js";

export interface ReviewBriefInput {
  readonly facts: HandoffFacts;
  readonly role: string;
  readonly existingReview: ReviewArtifact | null;
  readonly roleEvents: ReadonlyArray<ReviewEventArtifact>;
  readonly resolutions: ReadonlyArray<ResolutionArtifact>;
  readonly lane: ReviewLanePolicy | null;
  readonly typeDef?: ReviewTypeDef | null;
  readonly effectiveStatus?: EffectiveReviewStatus | null;
  readonly publication: ReviewPublicationPolicy | null;
  /**
   * Último commit que altera algo FORA do diretório canônico de reviews da
   * spec — a cabeça AUDITÁVEL. Commits review-only (registrar EV, selar) não a
   * movem ⇒ sem ciclo de self-staleness. Ausente ⇒ usa git HEAD.
   */
  readonly effectiveFunctionalHead?: string | null;
  readonly workingTreeState?: WorkingTreeState;
  /** Arquivos funcionais não commitados (diagnóstico do blocked). */
  readonly functionalDirtyFiles?: ReadonlyArray<string>;
  /** Autorização carregada pelo pedido humano explícito; ausente = só briefing. */
  readonly authorization?: ReviewAuthorization | null;
}

function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

/** Cabeça de um subject_ref (`base..head` → head; SHA único → ele mesmo). */
function refHead(subjectRef: string): string {
  const parts = subjectRef.split("..");
  return parts[parts.length - 1].replace(/^\.+/, "");
}

/** SHAs iguais por prefixo (7..40 chars; reviews podem registrar short SHA). */
function sameSha(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.startsWith(y) || y.startsWith(x);
}

const FINAL_REPORT_SECTIONS = [
  "Retomada factual",
  "Veredito",
  "Cobertura",
  "Findings bloqueantes",
  "Findings não bloqueantes",
  "Riscos residuais",
  "Validações executadas",
  "Registro governado (path + fingerprint REAL do artefato)",
  "Estado final (git status/HEAD)",
  "Próxima ação",
] as const;

/**
 * Inferência DETERMINÍSTICA do modo + derivação completa do briefing.
 * Puro: nenhuma leitura de filesystem/Git/GitHub aqui — tudo vem do snapshot.
 */
export function deriveReviewBrief(input: ReviewBriefInput): ReviewBrief {
  const { facts, role, existingReview, roleEvents, resolutions, lane, publication } = input;
  const specId = /^(\d{4})/.exec(facts.spec.label)?.[1] ?? facts.spec.label;
  const checkpoint = facts.cursor?.checkpoint ?? null;
  const gitHead = facts.git.head;
  const workingTreeState = input.workingTreeState ?? "unknown";
  // Comparações de freshness usam a cabeça FUNCIONAL (commits review-only não
  // tornam um review stale — e não tornam um review stale ATUAL falso current,
  // porque mudança funcional não commitada bloqueia antes; rodada 7).
  const head = input.effectiveFunctionalHead ?? gitHead;
  const baseRef = facts.pullRequest?.baseRefName ?? null;
  const degraded: string[] = [];
  const modeBasis: string[] = [];

  const reviewsDir = `${facts.spec.path}/reviews`;
  const norm = checkpoint ? normalizeCheckpoint(checkpoint) : null;
  const reviewPath = norm ? `${reviewsDir}/c-${norm}-${role}.yml` : null;
  const nextEventId = `EV${roleEvents.length + 1}`;
  const eventPath = norm ? `${reviewsDir}/events/c-${norm}-${role}-${nextEventId}.yml` : null;

  const existing: ExistingReviewFact | null = existingReview
    ? {
        file: existingReview.file,
        decision: existingReview.decision,
        findingsEmitted: existingReview.findingsEmitted,
        fingerprint: existingReview.reviewFingerprint,
        subjectRef: existingReview.subjectRef ?? null,
        executor: existingReview.executor
          ? `${existingReview.executor.platform} · ${existingReview.executor.model}`
          : (existingReview.actor ?? null),
      }
    : null;

  const findings = (existingReview?.findings ?? []).map(
    (f) => `${f.id} · ${f.severity} · ${f.disposition} · ${f.location} — ${f.description}`
  );
  const resolutionLines = resolutions.flatMap((r) =>
    r.resolutions
      .filter((res) => res.finding.startsWith(`${role}#`))
      .map((res) => `${res.finding} → ${res.action} (${r.file})`)
  );
  const eventLines = roleEvents.map(
    (e) =>
      `${e.eventId} · ${e.kind} · ${e.decision} · verifica ${e.verifies.join(", ")} (${e.file})`
  );

  // ── Modo (precedência: blocked > create > current/verification) ────────────
  let mode: ReviewBriefMode;
  let artifact: ReviewArtifactPlan = {
    path: "(n/a)",
    kind: "none",
    template: null,
    nextEventId: null,
    verificationScope: null,
  };

  // PR/HEAD divergentes só BLOQUEIAM quando o remoto tem commits que o local
  // não tem (behind > 0 — pull pendente). Local à frente (push pendente) é
  // estado normal de review local-first: degrada, não bloqueia.
  // SINCRONIZAÇÃO usa o git HEAD (relação de commits do branch), NUNCA o
  // functional HEAD (que é só freshness) — senão um commit review-only à frente
  // do functional HEAD produz "falso drift" com o PR head == git HEAD.
  const prHeadDiffers =
    facts.pullRequest !== null &&
    gitHead !== null &&
    !sameSha(facts.pullRequest.headRefOid, gitHead);
  const prHeadDiverges = prHeadDiffers && (facts.git.behind ?? 0) > 0;

  if (!checkpoint) {
    mode = "blocked";
    modeBasis.push("state.yml sem topology/cursor — não há checkpoint ativo para revisar.");
  } else if (facts.driftWarnings.length > 0) {
    mode = "blocked";
    modeBasis.push(
      "fontes/projeções divergentes ou contrato obrigatório ausente — reconcilie antes de revisar:"
    );
    for (const w of facts.driftWarnings) modeBasis.push(w);
  } else if (workingTreeState === "functional-dirty") {
    mode = "blocked";
    modeBasis.push(
      "working tree com MUDANÇAS FUNCIONAIS não commitadas — o objeto real de trabalho " +
        "diverge de qualquer commit; review não pode ser current/create/verification. " +
        "Commite (ou descarte) antes de pedir review. Arquivos funcionais sujos:"
    );
    for (const file of input.functionalDirtyFiles ?? []) {
      modeBasis.push(`  ${file}`);
    }
  } else if (prHeadDiverges) {
    mode = "blocked";
    modeBasis.push(
      `PR/HEAD divergentes com remoto À FRENTE (behind ${facts.git.behind}): PR #${facts.pullRequest!.number} head ${facts.pullRequest!.headRefOid.slice(0, 7)} ≠ git HEAD local ${gitHead} — pull/reconcilie antes de revisar.`
    );
  } else if (facts.lifecycle?.gateDecision === "approved") {
    mode = "blocked";
    modeBasis.push(
      `gate do checkpoint ${checkpoint} já está approved — review novo após o gate é estado incompatível; confira o cursor (reconcile:check) ou abra o próximo nó.`
    );
  } else if (!existingReview) {
    mode = "create";
    modeBasis.push(`nenhum review da lane ${role} para o checkpoint ${checkpoint}.`);
    artifact = {
      path: reviewPath ?? "(n/a)",
      kind: "review",
      // Template do tipo quando declarado; fallback no genérico (tipos
      // customizados funcionam sem template próprio).
      template: input.typeDef?.template
        ? `${reviewsDir}/${input.typeDef.template}`
        : `${reviewsDir}/_TEMPLATE.review.yml`,
      nextEventId: null,
      verificationScope: null,
    };
  } else {
    // O subject auditado AVANÇA com as verifications: o último evento da lane
    // com subject_ref representa a cobertura mais recente (review original
    // permanece imutável — quem progride é o ledger append-only).
    const lastVerifiedRef = [...roleEvents].reverse().find((e) => e.subjectRef)?.subjectRef ?? null;
    const subjectRef = lastVerifiedRef ?? existingReview.subjectRef ?? null;
    const openWithResolution = (existingReview.findings ?? []).filter(
      (f) =>
        f.disposition === "open" &&
        resolutionLines.some((line) => line.startsWith(`${role}#${f.id} `))
    );
    // Findings já REVALIDADOS por um evento que cobre o HEAD funcional atual NÃO
    // mantêm a lane em `verification` — senão um EV de verification jamais fecha
    // a própria lane (a disposition `open` permanece; só reviewer/owner fecha) e
    // `review:publish` (que exige `current`) entra em circularidade: o evento
    // precisa estar publicado para a lane virar current, mas publish exige
    // current. O ledger append-only que cobre o HEAD JÁ torna a lane current.
    const verifiedAtHead = new Set<string>();
    for (const e of roleEvents) {
      if (e.subjectRef && head && sameSha(refHead(e.subjectRef), head)) {
        for (const v of e.verifies) verifiedAtHead.add(v);
      }
    }
    const openNeedingVerification = openWithResolution.filter(
      (f) => !verifiedAtHead.has(`${role}#${f.id}`)
    );
    if (
      subjectRef &&
      head &&
      sameSha(refHead(subjectRef), head) &&
      openNeedingVerification.length === 0
    ) {
      mode = "current";
      modeBasis.push(
        verifiedAtHead.size > 0 && openWithResolution.length > 0
          ? `review existente (${existingReview.file}) com finding(s) open já REVALIDADOS por evento cobrindo o HEAD ${head} (subject_ref ${subjectRef}); o FECHAMENTO da disposition é do reviewer/owner — a lane está current.`
          : `review existente (${existingReview.file}) auditou subject_ref ${subjectRef}, cuja cabeça coincide com o HEAD atual ${head} — nova revisão seria duplicada.`
      );
    } else {
      mode = "verification";
      if (!subjectRef) {
        degraded.push(
          "review existente NÃO declara subject_ref (proveniência unknown) — nunca assumir fresh; revalide a cobertura completa do checkpoint."
        );
        modeBasis.push(
          `review existente (${existingReview.file}) sem proveniência machine-readable do objeto auditado.`
        );
      } else {
        modeBasis.push(
          `review existente auditou ${subjectRef}; implementação avançou até ${head ?? "?"} — revalidar o delta.`
        );
      }
      if (openNeedingVerification.length > 0) {
        modeBasis.push(
          `finding(s) open com resolution posterior (${openNeedingVerification.map((f) => f.id).join(", ")}) — revalide as evidências; o FECHAMENTO (disposition) é autoridade do reviewer/owner, não do implementador.`
        );
      }
      // scope (rodada 6): findings = revalidar findings específicos após
      // resolutions; review = revalidar o review INTEIRO (zero findings ou
      // delta sem resolutions pendentes) — NUNCA finding artificial.
      const verificationScope: "findings" | "review" =
        openNeedingVerification.length > 0 ? "findings" : "review";
      artifact = {
        path: eventPath ?? "(n/a)",
        kind: "verification-event",
        template: `${reviewsDir}/_TEMPLATE.review-event.yml`,
        nextEventId,
        verificationScope,
      };
    }
  }

  const previousRef =
    [...roleEvents].reverse().find((e) => e.subjectRef)?.subjectRef ??
    existingReview?.subjectRef ??
    null;
  const range =
    mode === "verification" && previousRef && head
      ? `${refHead(previousRef)}..${head}`
      : mode === "verification" && head
        ? `(base desconhecida — revalidar cobertura completa)..${head}`
        : baseRef && head
          ? `origin/${baseRef}..${head}`
          : null;
  // Token válido p/ subject_ref (sem espaços): com base desconhecida, o SHA
  // auditado basta — a cobertura completa fica narrada em scope/coverage.
  const refSuggestion =
    mode === "verification" && previousRef && head
      ? `${refHead(previousRef)}..${head}`
      : head
        ? baseRef && mode === "create"
          ? `origin/${baseRef}..${head}`
          : head
        : null;
  const subject: ReviewSubjectFact = {
    baseRef,
    headSha: head,
    range,
    refSuggestion,
    previousRef,
    provenance: existingReview ? (previousRef ? "declared" : "unknown") : "none",
  };

  if (workingTreeState === "review-only") {
    degraded.push(
      "working tree contém APENAS artefatos de review não commitados (criação de artefato " +
        "em curso) — código funcional inalterado; commite o artefato em commit exclusivo."
    );
  }
  if (prHeadDiffers && !prHeadDiverges && mode !== "blocked") {
    degraded.push(
      `PR #${facts.pullRequest!.number} head remoto (${facts.pullRequest!.headRefOid.slice(0, 7)}) está atrás do git HEAD local ${gitHead} — push pendente; o review cobre o HEAD LOCAL.`
    );
  }

  const prSource = facts.sources.find((s) => s.id === "pull-request");
  if (prSource && prSource.status !== "fresh") {
    degraded.push(
      `fonte remota (PR) ${prSource.status}${prSource.detail ? ` — ${prSource.detail}` : ""}; fatos de PR/CI não observados (nada foi inventado).`
    );
  }

  const allowedActions = [
    "investigar o código/artefatos do checkpoint (read-only sobre a implementação)",
    "executar testes e validações locais",
    mode === "verification"
      ? artifact.verificationScope === "review"
        ? `criar o EVENTO append-only ${artifact.path} (kind: verification; scope: review; review_fingerprint: ${existingReview?.reviewFingerprint ?? "<fp-do-review>"}; previous_subject_ref: "${previousRef ?? "unknown"}"; subject_ref: "${subject.refSuggestion ?? "<head>"}" — valores de ref SEMPRE entre aspas; SEM verifies — não invente finding)`
        : `criar o EVENTO append-only ${artifact.path} (kind: verification; scope: findings; verifies: findings com resolution; subject_ref: "${subject.refSuggestion ?? "<base>..<head>"}")`
      : mode === "create"
        ? `criar o artefato ${artifact.path} (copie ${artifact.template}; preencha subject_ref: "${subject.refSuggestion ?? "<base>..<head>"}" — entre aspas)`
        : "nenhuma escrita necessária (review atual cobre o HEAD)",
    `selar com \`npm run review:seal -- --file ${artifact.kind === "none" ? "<arquivo>" : artifact.path}\` (sela reviews E eventos) e validar com \`npm run review:check\``,
    "commit EXCLUSIVO do artefato de review (nunca misturar com implementação)",
    "push somente com autorização humana explícita",
  ];

  const prohibitedActions = [
    "corrigir findings/implementação durante o review (papéis separados)",
    "editar/reescrever review selado (verification é APPEND-ONLY)",
    "fechar disposition de finding sendo o implementador (autoridade do reviewer/owner)",
    publication
      ? `publicar comentário/review no GitHub (${publication.githubComments}; exceção: ${publication.githubException ?? "autorização explícita da owner"})`
      : "publicar comentário/review no GitHub sem autorização explícita da owner",
    "converter PR para Ready / exercer Human Gate / criar gate artifact / merge",
    "abrir o próximo nó da topologia",
  ];

  const validationCommands = [
    ...(artifact.kind !== "none" ? [`npm run review:seal -- --file ${artifact.path}`] : []),
    "npm run review:check",
    "npm run validate",
    `npm run handoff:check -- --spec ${specId}`,
  ];

  const authorization = input.authorization ?? null;
  const producesArtifact =
    (mode === "create" || mode === "verification") && artifact.kind !== "none";
  const derivedCommitMessage = producesArtifact
    ? deriveReviewCommitMessage(
        specId,
        facts.activeNode?.id ?? facts.cursor?.pr ?? null,
        role,
        artifact.kind as "review" | "verification-event"
      )
    : null;
  const publishCommand =
    authorization && producesArtifact
      ? `npm run review:publish -- --file ${artifact.path} --authorization ${authorization}`
      : null;

  return {
    specId,
    checkpoint,
    role,
    gitHead,
    effectiveFunctionalHead: input.effectiveFunctionalHead ?? gitHead,
    workingTreeState,
    mode,
    modeBasis,
    degraded,
    subject,
    existingReview: existing,
    findings,
    resolutions: resolutionLines,
    events: eventLines,
    artifact,
    lane,
    typeDef: input.typeDef ?? null,
    effectiveStatus: input.effectiveStatus ?? null,
    publication,
    allowedActions,
    prohibitedActions,
    validationCommands,
    finalReportSections: [...FINAL_REPORT_SECTIONS],
    authorization,
    publishCommand,
    derivedCommitMessage,
  };
}

// ── Coleta (I/O) — mesmo snapshot do ato de carga ────────────────────────────

export interface CollectedReviewBrief {
  readonly snapshot: HandoffLoadSnapshot;
  readonly brief: ReviewBrief;
}

export interface ReviewBriefOptions extends HandoffOptions {
  readonly authorization?: ReviewAuthorization | null;
}

export function collectReviewBrief(
  repoRoot: string,
  role: string,
  options: ReviewBriefOptions = {}
): CollectedReviewBrief {
  const snapshot = loadHandoffSnapshot(repoRoot, options);
  const facts = snapshot.collected.facts;
  const cursor = facts.cursor;

  const { artifacts } = discover(repoRoot);
  const matches = (cp: string): boolean =>
    cursor !== null && normalizeCheckpoint(cp) === normalizeCheckpoint(cursor.checkpoint);

  const existingReview =
    artifacts.reviews.find((r) => r.role === role && matches(r.checkpoint)) ?? null;
  const roleEvents = artifacts.reviewEvents
    .filter((e) => e.role === role && matches(e.checkpoint))
    .sort((a, b) => a.eventId.localeCompare(b.eventId, undefined, { numeric: true }));
  const resolutions = artifacts.resolutions.filter((r) => matches(r.checkpoint));

  // Catálogo×requisito (CO-4 rodada 8): objetivo/vetores vêm do tipo do
  // catálogo (review_lanes legado já absorvido no merge do registry).
  const governance = loadReviewGovernance(repoRoot);
  const typeDef = resolveReviewType(governance.registry, role);
  const lane: ReviewLanePolicy | null = typeDef
    ? { objective: typeDef.objective, vectors: typeDef.vectors }
    : null;
  const publication: ReviewPublicationPolicy | null = governance.policy?.publication ?? null;

  const freshness = collectFunctionalFreshness(repoRoot, `${facts.spec.path}/reviews`);

  // Status efetivo do tipo no contexto do nó: aplicabilidade, requisito (com
  // overrides situados do nó) e estado/freshness. Labels do PR quando
  // observadas; changed paths não derivados aqui (regras dependentes = unknown).
  let effectiveStatus: EffectiveReviewStatus | null = null;
  if (cursor) {
    const nodeCtx =
      artifacts.topologyByCheckpoint?.[cursor.checkpoint] ??
      artifacts.topologyByCheckpoint?.[normalizeCheckpoint(cursor.checkpoint)];
    const statuses = deriveEffectiveReviewStatuses({
      registry: governance.registry,
      policy: governance.policy,
      ctx: {
        prProfile: nodeCtx?.nodeRole ?? null,
        labels: facts.pullRequest?.labels ?? null,
        changedPaths: null,
      },
      ...(nodeCtx?.overrides ? { nodeOverrides: nodeCtx.overrides } : {}),
      observed: observedReviewStates(artifacts, cursor.checkpoint),
      functionalHead: freshness.effectiveFunctionalHead,
    });
    effectiveStatus = statuses.find((s) => s.typeId === role) ?? null;
  }

  const brief = deriveReviewBrief({
    facts,
    role,
    existingReview,
    roleEvents,
    resolutions,
    lane,
    typeDef,
    effectiveStatus,
    publication,
    effectiveFunctionalHead: freshness.effectiveFunctionalHead,
    workingTreeState: freshness.workingTreeState,
    functionalDirtyFiles: freshness.functionalDirtyFiles,
    authorization: options.authorization ?? null,
  });

  return { snapshot, brief };
}

// ── Renderer (compacto) ──────────────────────────────────────────────────────

function renderList(lines: string[], items: ReadonlyArray<string>, empty = "(nenhum)"): void {
  if (items.length === 0) {
    lines.push(`- ${empty}`);
    return;
  }
  for (const item of items) lines.push(`- ${item}`);
}

export function renderReviewBrief(collected: CollectedReviewBrief): string {
  const { snapshot, brief } = collected;
  const facts = snapshot.collected.facts;
  const lines: string[] = [];
  const pr = facts.pullRequest;

  lines.push(`# Briefing governado de review — ${brief.role} · ${facts.spec.label}`);
  lines.push("");
  lines.push("## 1. Retomada factual");
  lines.push(`- spec: ${facts.spec.label} · checkpoint: ${brief.checkpoint ?? "(sem cursor)"}`);
  lines.push(
    `- branch: ${facts.git.branch ?? "?"} · git HEAD: ${brief.gitHead ?? "?"} · functional HEAD (auditável): ${brief.effectiveFunctionalHead ?? "?"}`
  );
  lines.push(`- working tree: ${brief.workingTreeState}`);
  lines.push(
    pr
      ? `- PR: #${pr.number} (${pr.state}${pr.isDraft ? ", Draft" : ", Ready"}; base ${pr.baseRefName}; head ${pr.headRefOid.slice(0, 7)}) · CI: ${pr.checks.pass} pass · ${pr.checks.fail} fail · ${pr.checks.pending} pending`
      : `- PR: ${facts.activeNode?.githubPr ? `#${facts.activeNode.githubPr} (estado remoto NÃO observado)` : "(não declarado)"}`
  );
  lines.push(
    `- carga/recibo: ${
      snapshot.receiptSkippedReason
        ? `NÃO registrado — ${snapshot.receiptSkippedReason}`
        : `fresh (selo ${snapshot.derived.seal})`
    }`
  );
  lines.push("");
  lines.push("## 2. Papel e autoridade");
  lines.push(
    `- tipo: ${brief.role}${brief.typeDef ? ` · origem: ${brief.typeDef.source} · ${brief.typeDef.title}` : ""}`
  );
  if (brief.lane) {
    lines.push(`- objetivo: ${brief.lane.objective}`);
  } else {
    lines.push("- objetivo: (tipo não declarado no catálogo — review_types)");
  }
  if (brief.effectiveStatus) {
    const s = brief.effectiveStatus;
    lines.push(
      `- política: requirement ${s.requirement} (fonte: ${s.requirementSource}) · aplicabilidade: ${s.applicability} · estado: ${s.state} · ${s.blocking ? "BLOQUEIA Ready/gate" : "não bloqueia Ready/gate"}`
    );
    if (s.matchedRuleIds.length > 0) {
      lines.push(`- regras aplicadas: ${s.matchedRuleIds.join(", ")}`);
    }
    for (const note of s.notes) lines.push(`  - ${note}`);
    if (
      brief.authorization === null &&
      (s.requirement === "optional" || s.requirement === "recommended")
    ) {
      lines.push(
        "- pedido explícito da owner EXECUTA este tipo normalmente (optional/recommended não bloqueiam, mas estão disponíveis)."
      );
    }
  }
  lines.push(
    "- independência: o revisor NÃO corrige a implementação; findings são reportados, não resolvidos."
  );
  lines.push(
    "- autoridade: o artefato versionado é reviewer-owned; disposition fecha só por reviewer/owner."
  );
  lines.push("");
  lines.push(`## 3. Modo inferido: ${brief.mode.toUpperCase()}`);
  lines.push("- base factual:");
  for (const basis of brief.modeBasis) lines.push(`  - ${basis}`);
  if (brief.degraded.length > 0) {
    lines.push("- degradações declaradas:");
    for (const d of brief.degraded) lines.push(`  - ${d}`);
  }
  lines.push("");
  lines.push("## 4. Objeto auditado");
  lines.push(`- base: ${brief.subject.baseRef ?? "(não observável)"}`);
  lines.push(`- head: ${brief.subject.headSha ?? "(não observável)"}`);
  lines.push(`- intervalo: ${brief.subject.range ?? "(não derivável)"}`);
  lines.push(
    `- proveniência do review anterior: ${brief.subject.provenance}${brief.subject.previousRef ? ` (${brief.subject.previousRef})` : ""}`
  );
  lines.push("");
  lines.push("## 5. Estado da lane no checkpoint");
  if (brief.existingReview) {
    lines.push(
      `- review existente: ${brief.existingReview.file} · ${brief.existingReview.decision} · ${brief.existingReview.findingsEmitted} finding(s) · fp ${brief.existingReview.fingerprint ?? "?"} · executor: ${brief.existingReview.executor ?? "?"}`
    );
  } else {
    lines.push("- review existente: (nenhum)");
  }
  lines.push("- findings:");
  renderList(
    lines,
    brief.findings.map((f) => `  ${f}`).map((s) => s.trim()),
    "(nenhum)"
  );
  lines.push("- resolutions da lane:");
  renderList(lines, brief.resolutions, "(nenhuma)");
  lines.push("- eventos da lane:");
  renderList(lines, brief.events, "(nenhum)");
  lines.push("");
  lines.push("## 6. Artefato a produzir");
  if (brief.artifact.kind === "none") {
    lines.push("- nenhum (review atual cobre o HEAD — nova revisão seria duplicada).");
  } else {
    lines.push(`- tipo: ${brief.artifact.kind}`);
    if (brief.artifact.verificationScope) {
      lines.push(
        `- scope: ${brief.artifact.verificationScope}${
          brief.artifact.verificationScope === "review"
            ? " (revalida o review INTEIRO; SEM verifies — campos: review_fingerprint do original, previous_subject_ref, subject_ref)"
            : " (revalida findings específicos pós-resolutions; verifies obrigatório)"
        }`
      );
    }
    lines.push(`- path: ${brief.artifact.path}`);
    lines.push(`- template: ${brief.artifact.template}`);
    if (brief.artifact.nextEventId) lines.push(`- event_id: ${brief.artifact.nextEventId}`);
    if (brief.artifact.verificationScope === "review" && brief.existingReview) {
      lines.push(`- review_fingerprint (original, REAL): ${brief.existingReview.fingerprint}`);
      lines.push(`- previous_subject_ref: ${brief.subject.previousRef ?? "unknown"}`);
    }
    lines.push(
      `- subject_ref OBRIGATÓRIO no artefato: "${brief.subject.refSuggestion ?? "<base>..<head>"}" (entre ASPAS — SHA numérico viraria número YAML; proveniência selada)`
    );
    lines.push(
      "- fingerprints: deixe `fingerprint: x`/`review_fingerprint: x` e rode o seal — reporte o fingerprint REAL do arquivo, nunca um narrado."
    );
  }
  lines.push("");
  lines.push("## 7. Vetores obrigatórios");
  renderList(
    lines,
    brief.lane?.vectors ?? [],
    "(declare review_lanes na review-policy.yml — vetores não derivados)"
  );
  lines.push("");
  lines.push("## 8. Publicação (artefato canônico ≠ GitHub)");
  lines.push("- artefato na spec: obrigatório (canal canônico).");
  lines.push(
    "- GitHub: proibido por padrão; comentário/review remoto só por autorização explícita da owner."
  );
  if (brief.authorization) {
    lines.push("- Autorização capability-scoped: ATIVA");
    lines.push("  - origem: pedido humano explícito do review;");
    lines.push(`  - lane: ${brief.role} · checkpoint: ${brief.checkpoint ?? "?"};`);
    lines.push(
      "  - permitido: investigar, criar o artefato derivado, selar, validar, commit EXCLUSIVO e push normal desse commit;"
    );
    lines.push("  - proibido: qualquer outro diff, mudança funcional, GitHub, Ready, gate, merge.");
    if (brief.mode === "current") {
      lines.push(
        "  - lane CURRENT: a autorização NÃO cria trabalho — nenhum artefato, commit ou push."
      );
    } else if (brief.mode === "blocked") {
      lines.push("  - lane BLOCKED: nenhum artefato, commit ou push até reconciliar.");
    } else if (brief.publishCommand) {
      lines.push(`  - publicação segura: \`${brief.publishCommand}\``);
      lines.push(`  - mensagem de commit derivada: \`${brief.derivedCommitMessage}\``);
      lines.push("  - após o push do artefato: PARAR (fim do escopo autorizado).");
    }
  } else {
    lines.push(
      "- Autorização capability-scoped: AUSENTE — briefing informativo; commit/push do artefato NÃO autorizados. " +
        "Com pedido humano explícito, gere com --authorization explicit-review-request."
    );
  }
  lines.push("");
  lines.push("## 9. Ações permitidas");
  renderList(lines, brief.allowedActions);
  lines.push("");
  lines.push("## 10. Ações proibidas");
  renderList(lines, brief.prohibitedActions);
  lines.push("");
  lines.push("## 11. Validações");
  renderList(
    lines,
    brief.validationCommands.map((c) => `\`${c}\``)
  );
  lines.push("");
  lines.push("## 12. Estrutura do relatório final");
  renderList(lines, brief.finalReportSections);
  lines.push("");
  lines.push(
    `_Briefing derivado do snapshot da carga (selo ${snapshot.derived.seal}; contrato do handoff). O runtime projeta o contrato; o julgamento é do revisor._`
  );
  return `${lines.join("\n")}\n`;
}

// ── Entrada CLI ──────────────────────────────────────────────────────────────

export function runReviewBrief(
  repoRoot: string,
  roleArg: string,
  logger: Logger = defaultLogger,
  remoteOverride?: HandoffOptions["remote"],
  authorizationArg?: string
): number {
  const governance = loadReviewGovernance(repoRoot);
  if (governance.errors.length > 0) {
    logger.error(`❌ review — policy/catálogo inválido:`);
    for (const e of governance.errors) logger.error(`   - ${e}`);
    return 1;
  }
  const typeDef = resolveReviewType(governance.registry, roleArg);
  if (!typeDef) {
    logger.error(
      `❌ tipo de review desconhecido: "${roleArg}". Tipos disponíveis: ${availableTypesLine(governance.registry)}. ` +
        `Tipos customizados são declarados em .governance/review-policy.yml § review_types (ou via \`review type add <slug>\`).`
    );
    return 2;
  }
  if (!typeDef.enabled) {
    logger.error(
      `❌ tipo de review "${typeDef.id}" está DESABILITADO neste repositório (review_types.${typeDef.id}.enabled: false). ` +
        `Para habilitar: defina enabled: true em .governance/review-policy.yml § review_types.${typeDef.id}. Nada foi executado.`
    );
    return 1;
  }
  const role = typeDef.id;
  const authorization = parseAuthorization(authorizationArg);
  if (authorization === "invalid") {
    logger.error(
      `❌ autorização desconhecida: "${authorizationArg}". Única forma válida: explicit-review-request (mapeada de um pedido humano explícito).`
    );
    return 2;
  }
  for (const w of governance.warnings) logger.error(`⚠️  ${w}`);
  try {
    const collected = collectReviewBrief(repoRoot, role, {
      remote: remoteOverride !== undefined ? remoteOverride : ghRemotePrCollector,
      authorization,
    });
    const status = collected.brief.effectiveStatus;
    if (status?.applicability === "no") {
      logger.error(
        `❌ tipo "${role}" NÃO é aplicável neste contexto — ${status.applicabilityReasons.join("; ")}. ` +
          `Aplicabilidade é governada em review-policy.yml § review_applicability.${role}. Nada foi executado.`
      );
      return 1;
    }
    logger.info(renderReviewBrief(collected).trimEnd());
    return 0;
  } catch (error) {
    logger.error(
      `❌ review (briefing) — estado irrecuperável: ${error instanceof Error ? error.message : String(error)}`
    );
    return 1;
  }
}

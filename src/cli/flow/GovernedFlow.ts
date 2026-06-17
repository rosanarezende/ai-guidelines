import type { HandoffSubCheckpoint } from "../handoffFacts.js";
import { SUBCHECKPOINT_READINESS } from "../handoffFacts.js";
import type { DecisionAvailability } from "../decide/model.js";
import type { DecisionSnapshot } from "../decide/snapshot.js";
import { findDecisionType } from "../../infrastructure/yaml/humanDecisionPolicyReader.js";
import {
  ADVANCE_SUBCHECKPOINT_ID,
  deriveAdvanceEligibility,
  type AdvanceEligibilityFacts,
} from "../decide/advanceEligibility.js";
import type { ReadyCheckSnapshot } from "../prReadyCheck.js";

export type GovernedFlowActionId =
  | "close-dispositions"
  | "mark-readiness"
  | "advance-subcheckpoint"
  | "pr-ready"
  | "human-gate";

export interface GovernedFlowAction {
  readonly id: GovernedFlowActionId;
  readonly title: string;
  readonly availability: DecisionAvailability;
  readonly command: string;
  readonly mutatingCommand?: string;
  readonly effect: readonly string[];
}

export interface GovernedFlow {
  readonly actions: readonly GovernedFlowAction[];
  readonly available: readonly GovernedFlowAction[];
  readonly blocked: readonly GovernedFlowAction[];
  readonly forbidden: readonly string[];
  readonly recommended: GovernedFlowAction | null;
}

export interface MarkReadinessFacts {
  readonly policyDeclared: boolean;
  readonly subCheckpoints: readonly HandoffSubCheckpoint[];
  readonly openFindings: number;
  readonly openBlocking: number;
  readonly someFixAwaitingRevalidation: boolean;
  readonly blockingReviews: readonly { readonly typeId: string; readonly state: string }[];
  readonly consolidationErrors: readonly string[];
  readonly workingTreeClean: boolean;
  readonly behind: number;
  readonly prHeadMatches: boolean | null;
  readonly prHeadMismatchMessage?: string;
  readonly ciFail: number;
  readonly ciPending: number;
  readonly gateExists: boolean;
}

export interface HumanGateFacts {
  readonly policyDeclared: boolean;
  readonly gateExists: boolean;
  readonly subCheckpoints: readonly HandoffSubCheckpoint[];
  readonly openFindings: number;
  readonly prObserved: boolean;
  readonly prNumber?: number;
  readonly prDraft: boolean;
  readonly ciFail: number;
  readonly ciPending: number;
  readonly blockingReviews: readonly { readonly typeId: string; readonly state: string }[];
  readonly workingTreeClean: boolean;
  readonly behind: number;
  readonly prReadyOk: boolean | null;
  readonly gateDecidabilityOk: boolean | null;
}

export interface PrReadyFlowFacts {
  readonly prNumber: number;
  readonly prState: string;
  readonly prDraft: boolean;
  readonly readyBodyContractReasons: readonly string[];
  readonly smokeTestsSuspended: boolean;
  readonly checks: ReadonlyArray<{ readonly name: string; readonly bucket: string }>;
  readonly localHeadSha: string | null;
  readonly prHeadRefOid: string;
  readonly workingTreeClean: boolean | null;
  readonly checkpoint: {
    readonly id: string;
    readonly gateDecision: "approved" | "changes_requested" | null;
    readonly openBlockingCount: number;
    readonly reviewStatuses: ReadonlyArray<{
      readonly typeId: string;
      readonly requirement: "disabled" | "optional" | "recommended" | "required";
      readonly applicability: "yes" | "no" | "unknown";
      readonly state: "missing" | "current" | "stale" | "in-progress";
      readonly decision: string | null;
      readonly blocking: boolean;
      readonly source: string;
      readonly errors: ReadonlyArray<string>;
    }>;
  } | null;
}

export interface PrReadyFlowResult {
  readonly failures: readonly string[];
  readonly warnings: readonly string[];
}

const MARK_READINESS_ID = "mark-readiness";
const HUMAN_GATE_ID = "human-gate";

function sameSha(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.startsWith(y) || y.startsWith(x);
}

function activeSubCheckpoint(subs: readonly HandoffSubCheckpoint[]): HandoffSubCheckpoint | null {
  const active = subs.filter((s) => s.state === "in-progress");
  return active.length === 1 ? active[0] : null;
}

function blockingReviews(snapshot: DecisionSnapshot): readonly {
  readonly typeId: string;
  readonly state: string;
}[] {
  return (snapshot.facts.lifecycle?.reviewStatuses ?? [])
    .filter((s) => s.blocking)
    .map((s) => ({ typeId: s.typeId, state: s.state }));
}

export function markReadinessFactsFromDecisionSnapshot(
  snapshot: DecisionSnapshot
): MarkReadinessFacts {
  const pr = snapshot.facts.pullRequest;
  const prHeadMatches =
    pr && snapshot.gitHead ? sameSha(snapshot.gitHead, pr.headRefOid) : pr ? false : null;
  return {
    policyDeclared:
      snapshot.policy !== null &&
      findDecisionType(snapshot.policy, MARK_READINESS_ID) !== undefined,
    subCheckpoints: snapshot.subCheckpoints,
    openFindings: snapshot.openFindings.length,
    openBlocking: snapshot.openFindings.filter((f) => f.blocking).length,
    someFixAwaitingRevalidation: snapshot.openFindings.some(
      (f) => f.resolution?.action === "fixed" && !f.verified
    ),
    blockingReviews: blockingReviews(snapshot),
    consolidationErrors: snapshot.consolidation.errors,
    workingTreeClean: snapshot.workingTreeState === "clean",
    behind: snapshot.facts.git.behind ?? 0,
    prHeadMatches,
    ...(pr && snapshot.gitHead && !prHeadMatches
      ? {
          prHeadMismatchMessage: `O PR head remoto (${pr.headRefOid.slice(0, 7)}) não cobre o git HEAD local ${snapshot.gitHead.slice(0, 7)} — push/CI precisam convergir antes da readiness.`,
        }
      : {}),
    ciFail: pr?.checks.fail ?? 0,
    ciPending: pr?.checks.pending ?? 0,
    gateExists: snapshot.gateExists || snapshot.facts.lifecycle?.gateDecision != null,
  };
}

export function deriveMarkReadinessAvailability(f: MarkReadinessFacts): DecisionAvailability {
  const reasons: string[] = [];
  if (!f.policyDeclared) {
    return {
      status: "not-applicable",
      reasons: ["Tipo não declarado na human-decision-policy.yml."],
    };
  }
  if (f.subCheckpoints.length === 0) {
    reasons.push("Este checkpoint não tem sub-checkpoints materializados.");
  }
  const active = f.subCheckpoints.filter((s) => s.state === "in-progress");
  if (active.length === 0) reasons.push("Nenhum sub-checkpoint está em andamento ([/]).");
  if (active.length > 1) {
    reasons.push("Mais de um sub-checkpoint em andamento ([/]) — readiness seria ambígua.");
  }
  const current = active.length === 1 ? active[0] : null;
  if (current?.readiness === SUBCHECKPOINT_READINESS) {
    reasons.push(`${current.id} já declarou readiness "${SUBCHECKPOINT_READINESS}".`);
  }
  const invalidReadiness = f.subCheckpoints.find(
    (s) => s.state !== "in-progress" && s.readiness === SUBCHECKPOINT_READINESS
  );
  if (invalidReadiness) {
    reasons.push(
      `${invalidReadiness.id} carrega readiness em estado ${invalidReadiness.state}; readiness só é válida em [/] ativo.`
    );
  }
  if (f.openBlocking > 0) reasons.push("Há finding bloqueante aberto.");
  else if (f.openFindings > 0) reasons.push("Há finding aberto.");
  if (f.someFixAwaitingRevalidation) {
    reasons.push("Há correção aguardando revalidação independente.");
  }
  for (const s of f.blockingReviews) {
    reasons.push(`Review obrigatório pendente: ${s.typeId} (${s.state}).`);
  }
  if (f.consolidationErrors.length > 0) {
    reasons.push(`Integridade dos artefatos de review comprometida: ${f.consolidationErrors[0]}`);
  }
  if (!f.workingTreeClean) reasons.push("A working tree não está limpa.");
  if (f.behind > 0) {
    reasons.push("A branch está atrás do remoto — reconcilie antes de declarar readiness.");
  }
  if (f.prHeadMatches === false && f.prHeadMismatchMessage) {
    reasons.push(f.prHeadMismatchMessage);
  }
  if (f.ciFail > 0) reasons.push(`A integração contínua tem ${f.ciFail} falha(s).`);
  if (f.ciPending > 0) {
    reasons.push(`A integração contínua ainda tem ${f.ciPending} verificação(ões) pendente(s).`);
  }
  if (f.gateExists) {
    reasons.push("O gate do checkpoint já foi registrado — readiness interna não se aplica.");
  }
  if (reasons.length > 0) return { status: "blocked", reasons };
  return {
    status: "available",
    reasons: [],
    hint: `${activeSubCheckpoint(f.subCheckpoints)!.id} pronto para declarar readiness`,
  };
}

export function advanceEligibilityFactsFromDecisionSnapshot(
  snapshot: DecisionSnapshot
): AdvanceEligibilityFacts {
  const pr = snapshot.facts.pullRequest;
  return {
    subCheckpoints: snapshot.subCheckpoints,
    policyDeclared:
      snapshot.policy !== null &&
      findDecisionType(snapshot.policy, ADVANCE_SUBCHECKPOINT_ID) !== undefined,
    openFindings: snapshot.openFindings.length,
    openBlocking: snapshot.openFindings.filter((f) => f.blocking).length,
    someFixAwaitingRevalidation: snapshot.openFindings.some(
      (f) => f.resolution?.action === "fixed" && !f.verified
    ),
    blockingReviews: blockingReviews(snapshot),
    consolidationErrors: snapshot.consolidation.errors,
    workingTreeClean: snapshot.workingTreeState === "clean",
    behind: snapshot.facts.git.behind ?? 0,
    ciFail: pr?.checks.fail ?? 0,
    ciPending: pr?.checks.pending ?? 0,
    gateExists: snapshot.gateExists,
  };
}

export function humanGateFactsFromDecisionSnapshot(snapshot: DecisionSnapshot): HumanGateFacts {
  const pr = snapshot.facts.pullRequest;
  return {
    policyDeclared:
      snapshot.policy !== null && findDecisionType(snapshot.policy, HUMAN_GATE_ID) !== undefined,
    gateExists: snapshot.gateExists,
    subCheckpoints: snapshot.subCheckpoints,
    openFindings: snapshot.openFindings.length,
    prObserved: pr !== null,
    ...(pr ? { prNumber: pr.number } : {}),
    prDraft: pr?.isDraft ?? true,
    ciFail: pr?.checks.fail ?? 0,
    ciPending: pr?.checks.pending ?? 0,
    blockingReviews: blockingReviews(snapshot),
    workingTreeClean: snapshot.workingTreeState === "clean",
    behind: snapshot.facts.git.behind ?? 0,
    prReadyOk: snapshot.prReady?.ok ?? null,
    gateDecidabilityOk: snapshot.gateDecidability?.ok ?? null,
  };
}

export function deriveHumanGateAvailability(f: HumanGateFacts): DecisionAvailability {
  if (!f.policyDeclared) {
    return {
      status: "not-applicable",
      reasons: ["Tipo não declarado na human-decision-policy.yml."],
    };
  }
  if (f.gateExists) {
    return {
      status: "not-applicable",
      reasons: ["Já existe um gate registrado para este checkpoint."],
    };
  }
  const reasons: string[] = [];
  for (const sc of f.subCheckpoints) {
    if (sc.state === "pending") reasons.push(`${sc.id} ainda está aberto.`);
  }
  const activeSub = f.subCheckpoints.find((s) => s.state === "in-progress");
  if (activeSub) {
    const pendingAfter = f.subCheckpoints.filter(
      (s) => s.state === "pending" && s.line > activeSub.line
    );
    if (activeSub.readiness !== SUBCHECKPOINT_READINESS) {
      reasons.push(`${activeSub.id} ainda não declarou readiness "${SUBCHECKPOINT_READINESS}".`);
    } else if (pendingAfter.length > 0) {
      reasons.push(
        `${activeSub.id} declarou readiness, mas ${pendingAfter[0].id} ainda precisa ser ativado por advance-subcheckpoint.`
      );
    }
  }
  if (f.openFindings > 0) {
    reasons.push(`A auditoria técnica ainda tem ${f.openFindings} problema(s) aberto(s).`);
  }
  if (!f.prObserved) {
    reasons.push("Estado do PR não observado — não é possível decidir o avanço.");
  } else {
    if (f.prDraft) reasons.push(`PR #${f.prNumber ?? "?"} continua Draft (Ready é precondição).`);
    if (f.ciFail > 0 || f.ciPending > 0) {
      reasons.push(
        `A integração contínua ainda não está verde (${f.ciFail} falha(s), ${f.ciPending} pendente(s)).`
      );
    }
  }
  for (const s of f.blockingReviews) {
    reasons.push(`Review obrigatório pendente: ${s.typeId} (${s.state}).`);
  }
  if (!f.workingTreeClean) reasons.push("A working tree tem mudanças não commitadas.");
  if (f.behind > 0) reasons.push("A branch está atrás do remoto — reconcilie antes de decidir.");
  if (f.prObserved && !f.prDraft) {
    if (f.prReadyOk !== true) reasons.push("pr-ready:check ainda não está verde.");
    if (f.gateDecidabilityOk !== true) {
      reasons.push("gate-decidability:check ainda não está verde.");
    }
  }
  return reasons.length > 0 ? { status: "blocked", reasons } : { status: "available", reasons: [] };
}

export function prReadyFlowFactsFromReadySnapshot(snapshot: ReadyCheckSnapshot): PrReadyFlowFacts {
  return {
    prNumber: snapshot.pr.number,
    prState: snapshot.pr.state,
    prDraft: snapshot.pr.isDraft,
    readyBodyContractReasons: snapshot.readyBodyContractReasons,
    smokeTestsSuspended: snapshot.smokeTestsSuspended === true,
    checks: snapshot.checks,
    localHeadSha: snapshot.localHeadSha,
    prHeadRefOid: snapshot.pr.headRefOid,
    workingTreeClean: snapshot.workingTreeClean,
    checkpoint: snapshot.checkpoint,
  };
}

export function derivePrReadyFlow(f: PrReadyFlowFacts): PrReadyFlowResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  if (f.prState.toLowerCase() !== "open") {
    failures.push(`PR #${f.prNumber} não está OPEN (estado: ${f.prState}).`);
  }
  if (!f.prDraft) {
    warnings.push(
      `PR #${f.prNumber} já está Ready — este check é pré-conversão; precondições avaliadas mesmo assim.`
    );
  }
  for (const reason of f.readyBodyContractReasons) {
    failures.push(`contrato Ready do body: ${reason}`);
  }
  if (f.smokeTestsSuspended) {
    failures.push(
      "smoke tests estão temporariamente suspensos — reative `npm run test:smoke` no workflow/ci antes de Ready/Human Gate."
    );
  }
  if (f.checks.length === 0) {
    failures.push("nenhum check de CI encontrado no HEAD atual — CI verde é precondição de Ready.");
  }
  for (const check of f.checks) {
    if (check.bucket === "fail" || check.bucket === "cancel") {
      failures.push(`CI não está verde no HEAD final: check "${check.name}" = ${check.bucket}.`);
    } else if (check.bucket === "pending") {
      failures.push(`CI ainda não terminou no HEAD final: check "${check.name}" pendente.`);
    }
  }
  if (f.localHeadSha === null) {
    warnings.push(
      "HEAD local indisponível — não foi possível confirmar que o body/CI cobrem o HEAD final."
    );
  } else if (!sameSha(f.prHeadRefOid, f.localHeadSha)) {
    failures.push(
      `HEAD local (${f.localHeadSha.slice(0, 7)}) difere do HEAD remoto do PR (${f.prHeadRefOid.slice(0, 7)}) — push/pull antes de apresentar o PR como final.`
    );
  }
  if (f.workingTreeClean === null) warnings.push("estado da working tree indisponível.");
  else if (!f.workingTreeClean) {
    failures.push(
      "working tree local não está limpa — implementação não está concluída/commitada."
    );
  }
  const checkpoint = f.checkpoint;
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
    for (const s of checkpoint.reviewStatuses) {
      for (const e of s.errors) failures.push(`policy de reviews inválida: ${e}`);
      if (s.blocking) {
        const why =
          s.state === "missing"
            ? "ausente"
            : s.state === "stale"
              ? "stale (não cobre a cabeça funcional atual)"
              : s.decision !== "approved"
                ? `com decisão "${s.decision}" (precisa de approved)`
                : s.state;
        failures.push(
          `review OBRIGATÓRIO "${s.typeId}" (${s.source}) ${why} no checkpoint "${checkpoint.id}".`
        );
      } else if (
        s.requirement === "recommended" &&
        s.applicability !== "no" &&
        !(s.state === "current" && s.decision === "approved")
      ) {
        warnings.push(
          `review recomendado "${s.typeId}" ${s.state === "missing" ? "não realizado" : s.state} — advisory; não bloqueia Ready/Human Gate.`
        );
      }
    }
  }
  return { failures, warnings };
}

function commandFor(id: GovernedFlowActionId, mutating: boolean): string {
  if (id === "pr-ready") return "npm run pr-ready:check -- --pr <n>";
  if (!mutating) return `npm run guidelines -- decide --type ${id} --brief-only`;
  const decision =
    id === "mark-readiness"
      ? "mark-ready"
      : id === "advance-subcheckpoint"
        ? "advance"
        : id === "close-dispositions"
          ? "accept-all"
          : id === "human-gate"
            ? "approve"
            : "<choice>";
  return `npm run guidelines -- decide --type ${id} --decision ${decision} --authorization explicit-human-decision --confirm`;
}

function action(
  id: GovernedFlowActionId,
  title: string,
  availability: DecisionAvailability,
  effect: readonly string[]
): GovernedFlowAction {
  return {
    id,
    title,
    availability,
    command: commandFor(id, false),
    ...(id !== "pr-ready" ? { mutatingCommand: commandFor(id, true) } : {}),
    effect,
  };
}

export function deriveGovernedFlow(snapshot: DecisionSnapshot): GovernedFlow {
  const mark = deriveMarkReadinessAvailability(markReadinessFactsFromDecisionSnapshot(snapshot));
  const advance = deriveAdvanceEligibility(advanceEligibilityFactsFromDecisionSnapshot(snapshot));
  const humanGate = deriveHumanGateAvailability(humanGateFactsFromDecisionSnapshot(snapshot));
  const closeDispositions: DecisionAvailability =
    snapshot.openFindings.length > 0 &&
    snapshot.openFindings.every(
      (f) => f.resolution?.action === "fixed" && f.refValid !== false && f.verified
    )
      ? { status: "available", reasons: [], hint: "findings revalidados podem ser encerrados" }
      : snapshot.openFindings.length > 0
        ? {
            status: "blocked",
            reasons: ["Há finding aberto sem resolução fixed revalidada."],
          }
        : { status: "not-applicable", reasons: ["Não há findings abertos."] };

  const actions = [
    action("close-dispositions", "Fechar findings revalidados", closeDispositions, [
      "altera artefato de review/resolution conforme decisão humana",
    ]),
    action("mark-readiness", "Declarar readiness do sub-checkpoint ativo", mark, [
      "altera somente tasks.md",
      "não avança sub-checkpoint",
    ]),
    action("advance-subcheckpoint", "Iniciar o próximo sub-checkpoint", advance, [
      "altera somente markers de sub-checkpoints em tasks.md",
    ]),
    action("human-gate", "Decidir o avanço do checkpoint (Human Gate)", humanGate, [
      "cria gate artifact após decisão humana",
      "não executa merge nem transição automática",
    ]),
  ];
  const priority: GovernedFlowActionId[] = [
    "close-dispositions",
    "mark-readiness",
    "advance-subcheckpoint",
    "human-gate",
  ];
  const available = actions.filter((a) => a.availability.status === "available");
  const blocked = actions.filter((a) => a.availability.status === "blocked");
  const recommended =
    priority
      .map((id) => actions.find((a) => a.id === id))
      .find((a): a is GovernedFlowAction => a?.availability.status === "available") ?? null;
  const forbidden = [
    ...(advance.status === "available"
      ? []
      : ["Avançar sub-checkpoint enquanto advance-subcheckpoint estiver bloqueado"]),
    ...(humanGate.status === "available" ? [] : ["Executar Human Gate antes dos critérios"]),
    "Converter PR para Ready fora do fluxo governado",
    "Fazer merge",
  ];
  return { actions, available, blocked, forbidden, recommended };
}

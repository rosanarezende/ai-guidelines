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
import type { SubCheckpointDeliveryEvidence } from "./subCheckpointDeliveryEvidence.js";

export type GovernedFlowActionId =
  | "close-dispositions"
  | "finish-subcheckpoint"
  | "mark-readiness"
  | "advance-subcheckpoint"
  | "pr-ready"
  | "human-gate"
  | "open-next-node"
  | "review-insight-candidates";

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
  readonly humanSummary: HumanSummary;
}

export interface HumanObjectSummary {
  readonly label: string;
  readonly objective: string;
  readonly output: string | null;
}

export interface HumanSummary {
  readonly state: readonly string[];
  readonly currentObject: HumanObjectSummary | null;
  readonly nextObject: HumanObjectSummary | null;
  readonly ready: readonly string[];
  readonly missing: readonly string[];
  readonly nextAction: string;
  readonly command: string | null;
  readonly forbidden: readonly string[];
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
  readonly deliveryEvidence: SubCheckpointDeliveryEvidence;
}

export interface FinishSubcheckpointFacts {
  readonly policyDeclared: boolean;
  readonly subCheckpoints: readonly HandoffSubCheckpoint[];
  readonly markReadiness: DecisionAvailability;
  readonly advanceSubcheckpoint: DecisionAvailability;
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

export interface OpenNextNodeFacts {
  readonly policyDeclared: boolean;
  readonly gateApproved: boolean;
  readonly activeNode: {
    readonly id: string;
    readonly sequence: number | null;
    readonly terminal: boolean;
    readonly githubPr: number | null;
  } | null;
  readonly nextNode: {
    readonly id: string;
    readonly sequence: number | null;
    readonly terminal: boolean;
    readonly githubPr: number | null;
  } | null;
  readonly prObserved: boolean;
  readonly prDraft: boolean;
  readonly ciFail: number;
  readonly ciPending: number;
  readonly workingTreeClean: boolean;
  readonly behind: number;
}

export interface PrReadyFlowFacts {
  readonly prNumber: number;
  readonly prState: string;
  readonly prDraft: boolean;
  readonly readyBodyContractReasons: readonly string[];
  readonly smokeTestsSuspended: boolean;
  readonly smokeRequired?: boolean;
  readonly smokeRequirementReason?: string;
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
export const FINISH_SUBCHECKPOINT_ID = "finish-subcheckpoint";
const HUMAN_GATE_ID = "human-gate";
export const OPEN_NEXT_NODE_ID = "open-next-node";

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
    deliveryEvidence: snapshot.subCheckpointDeliveryEvidence,
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
  if (f.deliveryEvidence.status !== "present") {
    reasons.push(f.deliveryEvidence.reason);
  }
  if (reasons.length > 0) return { status: "blocked", reasons };
  return {
    status: "available",
    reasons: [],
    hint: `${activeSubCheckpoint(f.subCheckpoints)!.id} pronto para declarar readiness`,
  };
}

export function deriveFinishSubcheckpointAvailability(
  f: FinishSubcheckpointFacts
): DecisionAvailability {
  if (!f.policyDeclared) {
    return {
      status: "not-applicable",
      reasons: ["Tipo não declarado na human-decision-policy.yml."],
    };
  }
  if (f.subCheckpoints.length === 0) {
    return { status: "not-applicable", reasons: ["Este checkpoint não tem sub-checkpoints."] };
  }
  const active = f.subCheckpoints.filter((s) => s.state === "in-progress");
  if (active.length === 0) {
    return {
      status: "not-applicable",
      reasons: ["Nenhum sub-checkpoint está em andamento ([/])."],
    };
  }
  if (active.length > 1) {
    return {
      status: "blocked",
      reasons: ["Mais de um sub-checkpoint em andamento ([/]) — conclusão seria ambígua."],
    };
  }
  const current = active[0];
  const pendingAfter = f.subCheckpoints.filter(
    (s) => s.state === "pending" && s.line > current.line
  );
  const pendingBefore = f.subCheckpoints.filter(
    (s) => s.state === "pending" && s.line < current.line
  );
  if (pendingAfter.length === 0) {
    return {
      status: "not-applicable",
      reasons: [
        `Não há próximo sub-checkpoint pendente após ${current.id}; use o caminho terminal de fechamento do checkpoint.`,
      ],
    };
  }
  if (pendingBefore.length > 0) {
    return {
      status: "blocked",
      reasons: [
        `Ordem ambígua: há sub-checkpoint pendente antes do ativo (${pendingBefore[0].id}).`,
      ],
    };
  }

  if (current.readiness === SUBCHECKPOINT_READINESS) {
    if (f.advanceSubcheckpoint.status === "available") {
      return {
        status: "available",
        reasons: [],
        hint: `${current.id} já está pronto; ${pendingAfter[0].id} será ativado em uma única decisão`,
      };
    }
    return {
      status: f.advanceSubcheckpoint.status === "not-applicable" ? "blocked" : "blocked",
      reasons:
        f.advanceSubcheckpoint.reasons.length > 0
          ? f.advanceSubcheckpoint.reasons
          : ["advance-subcheckpoint ainda não está disponível para este snapshot."],
    };
  }

  if (f.markReadiness.status === "available") {
    return {
      status: "available",
      reasons: [],
      hint: `${current.id} satisfaz readiness; ${pendingAfter[0].id} será ativado sem commit intermediário`,
    };
  }
  return {
    status: f.markReadiness.status === "not-applicable" ? "blocked" : "blocked",
    reasons:
      f.markReadiness.reasons.length > 0
        ? f.markReadiness.reasons
        : ["Critérios de readiness não puderam ser projetados para o sub-checkpoint ativo."],
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

export function openNextNodeFactsFromDecisionSnapshot(
  snapshot: DecisionSnapshot
): OpenNextNodeFacts {
  const pr = snapshot.facts.pullRequest;
  const active = snapshot.facts.activeNode;
  const next = snapshot.facts.nextPlannedNode;
  return {
    policyDeclared:
      snapshot.policy !== null &&
      findDecisionType(snapshot.policy, OPEN_NEXT_NODE_ID) !== undefined,
    gateApproved: snapshot.facts.lifecycle?.gateDecision === "approved",
    activeNode: active
      ? {
          id: active.id,
          sequence: active.sequence,
          terminal: active.terminal,
          githubPr: active.githubPr,
        }
      : null,
    nextNode: next
      ? {
          id: next.id,
          sequence: next.sequence,
          terminal: next.terminal,
          githubPr: next.githubPr,
        }
      : null,
    prObserved: pr !== null,
    prDraft: pr?.isDraft ?? true,
    ciFail: pr?.checks.fail ?? 0,
    ciPending: pr?.checks.pending ?? 0,
    workingTreeClean: snapshot.workingTreeState === "clean",
    behind: snapshot.facts.git.behind ?? 0,
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

export function deriveOpenNextNodeAvailability(f: OpenNextNodeFacts): DecisionAvailability {
  if (!f.policyDeclared) {
    return {
      status: "not-applicable",
      reasons: ["Tipo não declarado na human-decision-policy.yml."],
    };
  }
  if (!f.gateApproved) {
    return {
      status: "not-applicable",
      reasons: ["O Human Gate do checkpoint ainda não foi aprovado."],
    };
  }
  if (!f.activeNode) {
    return {
      status: "blocked",
      reasons: ["Não há nó ativo inequívoco na topologia."],
    };
  }
  if (f.activeNode.terminal) {
    return {
      status: "not-applicable",
      reasons: ["O nó ativo é terminal; a próxima etapa é integração/merge, não abrir outro nó."],
    };
  }
  if (!f.nextNode) {
    return {
      status: "not-applicable",
      reasons: ["Não há próximo nó planejado na topologia."],
    };
  }

  const reasons: string[] = [];
  if (f.nextNode.githubPr !== null) {
    reasons.push(`O próximo nó ${f.nextNode.id} já declara PR #${f.nextNode.githubPr}.`);
  }
  if (!f.prObserved) {
    reasons.push("Estado do PR atual não observado — não é seguro abrir o próximo nó.");
  } else {
    if (f.prDraft) {
      reasons.push("O PR atual ainda está Draft; o Human Gate aprovado pressupõe PR Ready.");
    }
    if (f.ciFail > 0) reasons.push(`A integração contínua tem ${f.ciFail} falha(s).`);
    if (f.ciPending > 0) {
      reasons.push(`A integração contínua ainda tem ${f.ciPending} verificação(ões) pendente(s).`);
    }
  }
  if (!f.workingTreeClean) reasons.push("A working tree não está limpa.");
  if (f.behind > 0) {
    reasons.push("A branch está atrás do remoto — reconcilie antes de abrir o próximo nó.");
  }
  return reasons.length > 0
    ? { status: "blocked", reasons }
    : {
        status: "available",
        reasons: [],
        hint: `${f.activeNode.id} pode transicionar para ${f.nextNode.id}`,
      };
}

export function prReadyFlowFactsFromReadySnapshot(snapshot: ReadyCheckSnapshot): PrReadyFlowFacts {
  const smokePolicy = snapshot.smokePolicy;
  return {
    prNumber: snapshot.pr.number,
    prState: snapshot.pr.state,
    prDraft: snapshot.pr.isDraft,
    readyBodyContractReasons: snapshot.readyBodyContractReasons,
    smokeTestsSuspended: smokePolicy?.suspended ?? snapshot.smokeTestsSuspended === true,
    smokeRequired: smokePolicy?.required,
    smokeRequirementReason: smokePolicy?.reason,
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
  const smokeRequired = f.smokeRequired ?? true;
  const smokeRequirementReason = f.smokeRequirementReason ?? "contrato legado de Ready";
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
  if (f.smokeTestsSuspended && smokeRequired) {
    failures.push(
      `smoke tests estão temporariamente suspensos, mas são obrigatórios agora (${smokeRequirementReason}) — reative \`npm run test:smoke\` no workflow/ci antes de Ready/Human Gate.`
    );
  } else if (f.smokeTestsSuspended) {
    warnings.push(
      `smoke real temporariamente suspenso neste PR intermediário (${smokeRequirementReason}); ele volta a ser obrigatório no fechamento final da spec ou em mudanças de pacote/consumidor.`
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
  if (smokeRequired) {
    const smokeCheck = f.checks.find((check) => check.name === "smoke");
    if (!smokeCheck) {
      failures.push(
        `check obrigatório "smoke" não encontrado no HEAD final (${smokeRequirementReason}).`
      );
    } else if (smokeCheck.bucket === "skipping") {
      failures.push(
        `check obrigatório "smoke" não executou a suíte real no HEAD final (${smokeRequirementReason}).`
      );
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
  if (id === "review-insight-candidates") return "npm run flow -- insight list";
  if (!mutating) return `npm run flow -- decide --type ${id} --brief-only`;
  const decision =
    id === "finish-subcheckpoint"
      ? "finish"
      : id === "mark-readiness"
        ? "mark-ready"
        : id === "advance-subcheckpoint"
          ? "advance"
          : id === "close-dispositions"
            ? "accept-all"
            : id === "human-gate"
              ? "approve"
              : id === "open-next-node"
                ? "open-node"
                : "<choice>";
  return `npm run flow -- decide --type ${id} --decision ${decision} --authorization explicit-human-decision --confirm`;
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
    ...(id !== "pr-ready" && id !== "review-insight-candidates"
      ? { mutatingCommand: commandFor(id, true) }
      : {}),
    effect,
  };
}

function currentCheckpointLabel(snapshot: DecisionSnapshot): string {
  return snapshot.checkpoint ?? snapshot.facts.cursor?.checkpoint ?? "checkpoint nao identificado";
}

function currentSubCheckpointLabel(snapshot: DecisionSnapshot): string {
  const active = activeSubCheckpoint(snapshot.subCheckpoints);
  if (active) return `${active.id} — ${active.title}`;
  const pending = snapshot.subCheckpoints.filter((s) => s.state === "pending");
  if (pending.length > 0) return `sem ativo; proximo pendente: ${pending[0].id}`;
  return "sem sub-checkpoint ativo";
}

function nextPendingSubCheckpoint(
  subs: readonly HandoffSubCheckpoint[],
  current: HandoffSubCheckpoint | null
): HandoffSubCheckpoint | null {
  if (!current) return null;
  return (
    subs
      .filter((s) => s.state === "pending" && s.line > current.line)
      .sort((a, b) => a.line - b.line)[0] ?? null
  );
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBetween(value: string, start: string, ends: readonly string[]): string | null {
  const startIndex = value.indexOf(start);
  if (startIndex < 0) return null;
  const contentStart = startIndex + start.length;
  const endIndexes = ends
    .map((end) => value.indexOf(end, contentStart))
    .filter((index) => index >= 0);
  const contentEnd = endIndexes.length > 0 ? Math.min(...endIndexes) : value.length;
  const extracted = stripInlineMarkdown(value.slice(contentStart, contentEnd));
  return extracted.length > 0 ? extracted : null;
}

function descriptionFromRawText(sub: HandoffSubCheckpoint): string | null {
  if (!sub.text) return null;
  const marker = `**${sub.id} — ${sub.title}**`;
  const markerIndex = sub.text.indexOf(marker);
  const afterMarker = markerIndex >= 0 ? sub.text.slice(markerIndex + marker.length) : sub.text;
  const afterColon = afterMarker.replace(/^[:\s]+/, "");
  const objective = extractBetween(afterColon, "", ["**Entradas:**", "**Saída:**"]);
  return objective && objective.length > 0 ? objective : null;
}

function outputFromRawText(sub: HandoffSubCheckpoint): string | null {
  if (!sub.text) return null;
  return extractBetween(sub.text, "**Saída:**", ["**Fronteira:**", "**Entradas:**"]);
}

function objectSummary(sub: HandoffSubCheckpoint | null): HumanObjectSummary | null {
  if (!sub) return null;
  return {
    label: `${sub.id} — ${sub.title}`,
    objective: descriptionFromRawText(sub) ?? `Executar ${sub.title}.`,
    output: outputFromRawText(sub),
  };
}

function ciLine(snapshot: DecisionSnapshot): string {
  const pr = snapshot.facts.pullRequest;
  if (!pr) return "PR remoto nao observado.";
  return `PR #${pr.number} ${pr.isDraft ? "Draft" : "Ready"}; CI ${pr.checks.pass} ok, ${pr.checks.fail} falha(s), ${pr.checks.pending} pendente(s).`;
}

function deriveHumanSummary(
  snapshot: DecisionSnapshot,
  flow: Omit<GovernedFlow, "humanSummary">
): HumanSummary {
  const pr = snapshot.facts.pullRequest;
  const current = activeSubCheckpoint(snapshot.subCheckpoints);
  const next = nextPendingSubCheckpoint(snapshot.subCheckpoints, current);
  const ready: string[] = [];
  const missing: string[] = [];
  const ciPending = (pr?.checks.pending ?? 0) > 0;
  const ciFailing = (pr?.checks.fail ?? 0) > 0;

  if (snapshot.openFindings.length === 0) ready.push("Os findings do checkpoint estao fechados.");
  else missing.push(`Ainda ha ${snapshot.openFindings.length} finding(s) aberto(s).`);

  if (snapshot.workingTreeState === "clean") ready.push("A working tree esta limpa.");
  else missing.push("Ha mudancas locais nao finalizadas.");

  if (pr) {
    if (pr.checks.fail === 0 && pr.checks.pending === 0) ready.push("A CI esta verde.");
    else {
      if (pr.checks.fail > 0) missing.push(`A CI tem ${pr.checks.fail} falha(s).`);
      if (pr.checks.pending > 0)
        missing.push(`A CI tem ${pr.checks.pending} check(s) pendente(s).`);
    }
  } else {
    missing.push("O PR remoto nao foi observado.");
  }

  if (flow.recommended?.id === "mark-readiness") {
    missing.push("Falta declarar readiness do sub-checkpoint ativo.");
  } else if (flow.recommended?.id === "finish-subcheckpoint") {
    missing.push("Falta uma decisão única para concluir este ponto e iniciar o próximo.");
  } else if (flow.recommended?.id === "advance-subcheckpoint") {
    missing.push("Falta decidir o avanco para o proximo sub-checkpoint.");
  } else if (flow.recommended?.id === "human-gate") {
    missing.push("Falta decisao humana de Human Gate.");
  } else if (flow.recommended?.id === "open-next-node") {
    missing.push("Falta abrir governadamente o proximo no planejado.");
  } else if (flow.recommended?.id === "close-dispositions") {
    missing.push("Falta fechar findings revalidados.");
  } else if (flow.blocked.length > 0) {
    const blockedReasons = flow.blocked
      .slice(0, 2)
      .flatMap((a) => a.availability.reasons.slice(0, 2))
      .filter((reason) => !(ciPending && reason.includes("integração contínua")));
    missing.push(...blockedReasons);
  }

  return {
    state: [
      `Estamos em ${currentCheckpointLabel(snapshot)}.`,
      `Objeto atual: ${currentSubCheckpointLabel(snapshot)}.`,
      ciLine(snapshot),
    ],
    currentObject: objectSummary(current),
    nextObject: objectSummary(next),
    ready,
    missing: [...new Set(missing)],
    nextAction: flow.recommended
      ? flow.recommended.title
      : snapshot.workingTreeState !== "clean"
        ? "Finalizar as mudancas locais e deixar a working tree limpa."
        : ciPending
          ? "Aguardar a CI terminar."
          : ciFailing
            ? "Corrigir a CI antes de decidir."
            : "Nenhuma decisao mutante esta disponivel agora.",
    command: flow.recommended?.command ?? null,
    forbidden: flow.forbidden.slice(0, 5),
  };
}

export function deriveGovernedFlow(snapshot: DecisionSnapshot): GovernedFlow {
  const mark = deriveMarkReadinessAvailability(markReadinessFactsFromDecisionSnapshot(snapshot));
  const advance = deriveAdvanceEligibility(advanceEligibilityFactsFromDecisionSnapshot(snapshot));
  const finish = deriveFinishSubcheckpointAvailability({
    policyDeclared:
      snapshot.policy !== null &&
      findDecisionType(snapshot.policy, FINISH_SUBCHECKPOINT_ID) !== undefined,
    subCheckpoints: snapshot.subCheckpoints,
    markReadiness: mark,
    advanceSubcheckpoint: advance,
  });
  const humanGate = deriveHumanGateAvailability(humanGateFactsFromDecisionSnapshot(snapshot));
  const openNextNode = deriveOpenNextNodeAvailability(
    openNextNodeFactsFromDecisionSnapshot(snapshot)
  );
  const insightCandidates = snapshot.facts.insights.filter(
    (insight) => insight.graduationCandidate
  );
  const reviewInsightCandidates: DecisionAvailability =
    insightCandidates.length > 0
      ? {
          status: "available",
          reasons: [],
          hint: `${insightCandidates.length} percepção(ões) recorrente(s) precisam de decisão humana.`,
        }
      : { status: "not-applicable", reasons: ["Não há percepções recorrentes pendentes."] };
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
    action("finish-subcheckpoint", "Concluir ponto atual e iniciar o próximo", finish, [
      "altera somente markers de sub-checkpoints em tasks.md",
      "valida readiness sem exigir commit intermediário",
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
    action("open-next-node", "Abrir o próximo nó planejado", openNextNode, [
      "cria branch, PR Draft e reconcilia state/active/tasks",
      "não executa merge",
    ]),
    action(
      "review-insight-candidates",
      "Ver percepções recorrentes que precisam de decisão",
      reviewInsightCandidates,
      [
        "abre a lista de percepções",
        "não promove nem descarta automaticamente",
        "a decisão continua humana",
      ]
    ),
  ];
  const priority: GovernedFlowActionId[] = [
    "close-dispositions",
    "finish-subcheckpoint",
    "mark-readiness",
    "advance-subcheckpoint",
    "human-gate",
    "open-next-node",
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
    ...(openNextNode.status === "available" ? [] : ["Abrir próximo nó fora do fluxo governado"]),
    "Converter PR para Ready fora do fluxo governado",
    "Fazer merge",
  ];
  const flow = { actions, available, blocked, forbidden, recommended };
  return { ...flow, humanSummary: deriveHumanSummary(snapshot, flow) };
}

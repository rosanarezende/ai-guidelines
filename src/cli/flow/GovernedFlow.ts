import type { HandoffStep } from "../handoffFacts.js";
import { STEP_READINESS } from "../handoffFacts.js";
import type { DecisionAvailability } from "../decide/model.js";
import type { DecisionSnapshot } from "../decide/snapshot.js";
import { findDecisionType } from "../../infrastructure/yaml/humanDecisionPolicyReader.js";
import {
  ADVANCE_STEP_ID,
  deriveAdvanceEligibility,
  type AdvanceEligibilityFacts,
} from "../decide/advanceEligibility.js";
import type { ReadyCheckSnapshot } from "../prReadyCheck.js";
import type { StepDeliveryEvidence } from "./stepDeliveryEvidence.js";

export type GovernedFlowActionId =
  | "close-dispositions"
  | "finish-step"
  | "mark-readiness"
  | "advance-step"
  | "pr-ready"
  | "human-gate"
  | "open-next-topology-node"
  | "request-advisory-review"
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

export interface HumanDecisionSummary {
  readonly id: string;
  readonly summary: string | null;
}

export interface HumanObjectSummary {
  readonly label: string;
  readonly objective: string;
  readonly output: string | null;
  readonly decisions?: readonly HumanDecisionSummary[];
}

export interface HumanSummary {
  readonly state: readonly string[];
  readonly currentObject: HumanObjectSummary | null;
  readonly nextObject: HumanObjectSummary | null;
  readonly nextObjects?: readonly HumanObjectSummary[];
  readonly ready: readonly string[];
  readonly missing: readonly string[];
  readonly nextAction: string;
  readonly command: string | null;
  readonly forbidden: readonly string[];
}

export interface MarkReadinessFacts {
  readonly policyDeclared: boolean;
  readonly steps: readonly HandoffStep[];
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
  readonly deliveryEvidence: StepDeliveryEvidence;
}

export interface FinishStepFacts {
  readonly policyDeclared: boolean;
  readonly steps: readonly HandoffStep[];
  readonly markReadiness: DecisionAvailability;
  readonly advanceStep: DecisionAvailability;
}

export interface HumanGateFacts {
  readonly policyDeclared: boolean;
  readonly gateExists: boolean;
  readonly steps: readonly HandoffStep[];
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

export interface OpenNextTopologyNodeFacts {
  readonly policyDeclared: boolean;
  readonly gateApproved: boolean;
  readonly pendingSteps: readonly string[];
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
  readonly versionedPrBodyReasons?: readonly string[];
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
    readonly reviewPlanDecisionReasons?: ReadonlyArray<string>;
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
export const FINISH_STEP_ID = "finish-step";
const HUMAN_GATE_ID = "human-gate";
export const OPEN_NEXT_TOPOLOGY_NODE_ID = "open-next-topology-node";

function sameSha(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.startsWith(y) || y.startsWith(x);
}

function activeStep(subs: readonly HandoffStep[]): HandoffStep | null {
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

function advisoryReviewAvailability(snapshot: DecisionSnapshot): DecisionAvailability {
  if (snapshot.gateExists || snapshot.facts.lifecycle?.gateDecision === "approved") {
    return {
      status: "not-applicable",
      reasons: ["O Human Gate do checkpoint já foi registrado."],
    };
  }
  const candidates = (snapshot.facts.lifecycle?.reviewStatuses ?? []).filter(
    (status) =>
      (status.requirement === "optional" || status.requirement === "recommended") &&
      status.applicability !== "no" &&
      !(status.state === "current" && status.decision === "approved")
  );
  if (candidates.length === 0) {
    return {
      status: "not-applicable",
      reasons: ["Não há revisão opcional/recomendada pendente para sugerir."],
    };
  }
  const summary = candidates
    .map((status) => `${status.typeId} (${status.requirement}, ${status.state})`)
    .join(", ");
  return {
    status: "available",
    reasons: [],
    hint: `${candidates.length} revisão(ões) opcional(is)/recomendada(s) podem reduzir risco antes do Human Gate: ${summary}.`,
  };
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
    steps: snapshot.steps,
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
    deliveryEvidence: snapshot.stepDeliveryEvidence,
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
  if (f.steps.length === 0) {
    reasons.push("Este checkpoint não tem etapas materializadas.");
  }
  const active = f.steps.filter((s) => s.state === "in-progress");
  if (active.length === 0) reasons.push("Nenhuma etapa está em andamento ([/]).");
  if (active.length > 1) {
    reasons.push("Mais de uma etapa em andamento ([/]) — readiness seria ambígua.");
  }
  const current = active.length === 1 ? active[0] : null;
  if (current?.readiness === STEP_READINESS) {
    reasons.push(`${current.id} já declarou readiness "${STEP_READINESS}".`);
  }
  const invalidReadiness = f.steps.find(
    (s) => s.state !== "in-progress" && s.readiness === STEP_READINESS
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
    hint: `${activeStep(f.steps)!.id} pronto para declarar readiness`,
  };
}

export function deriveFinishStepAvailability(f: FinishStepFacts): DecisionAvailability {
  if (!f.policyDeclared) {
    return {
      status: "not-applicable",
      reasons: ["Tipo não declarado na human-decision-policy.yml."],
    };
  }
  if (f.steps.length === 0) {
    return { status: "not-applicable", reasons: ["Este checkpoint não tem etapas."] };
  }
  const active = f.steps.filter((s) => s.state === "in-progress");
  if (active.length === 0) {
    return {
      status: "not-applicable",
      reasons: ["Nenhuma etapa está em andamento ([/])."],
    };
  }
  if (active.length > 1) {
    return {
      status: "blocked",
      reasons: ["Mais de uma etapa em andamento ([/]) — conclusão seria ambígua."],
    };
  }
  const current = active[0];
  const pendingAfter = f.steps.filter((s) => s.state === "pending" && s.line > current.line);
  const pendingBefore = f.steps.filter((s) => s.state === "pending" && s.line < current.line);
  if (pendingAfter.length === 0) {
    return {
      status: "not-applicable",
      reasons: [
        `Não há próxima etapa pendente após ${current.id}; use o caminho terminal de fechamento do checkpoint.`,
      ],
    };
  }
  if (pendingBefore.length > 0) {
    return {
      status: "blocked",
      reasons: [`Ordem ambígua: há etapa pendente antes da ativa (${pendingBefore[0].id}).`],
    };
  }

  if (current.readiness === STEP_READINESS) {
    if (f.advanceStep.status === "available") {
      return {
        status: "available",
        reasons: [],
        hint: `${current.id} já está pronto; ${pendingAfter[0].id} será ativado em uma única decisão`,
      };
    }
    return {
      status: f.advanceStep.status === "not-applicable" ? "blocked" : "blocked",
      reasons:
        f.advanceStep.reasons.length > 0
          ? f.advanceStep.reasons
          : ["Avanço de etapa ainda não está disponível para este snapshot."],
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
        : ["Critérios de readiness não puderam ser projetados para a etapa ativa."],
  };
}

export function advanceEligibilityFactsFromDecisionSnapshot(
  snapshot: DecisionSnapshot
): AdvanceEligibilityFacts {
  const pr = snapshot.facts.pullRequest;
  return {
    steps: snapshot.steps,
    policyDeclared:
      snapshot.policy !== null && findDecisionType(snapshot.policy, ADVANCE_STEP_ID) !== undefined,
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
    steps: snapshot.steps,
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

export function openNextTopologyNodeFactsFromDecisionSnapshot(
  snapshot: DecisionSnapshot
): OpenNextTopologyNodeFacts {
  const pr = snapshot.facts.pullRequest;
  const active = snapshot.facts.activeNode;
  const next = snapshot.facts.nextPlannedNode;
  return {
    policyDeclared:
      snapshot.policy !== null &&
      findDecisionType(snapshot.policy, OPEN_NEXT_TOPOLOGY_NODE_ID) !== undefined,
    gateApproved: snapshot.facts.lifecycle?.gateDecision === "approved",
    pendingSteps: snapshot.steps.filter((item) => item.state !== "done").map((item) => item.id),
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
  for (const sc of f.steps) {
    if (sc.state === "pending") reasons.push(`${sc.id} ainda está aberto.`);
  }
  const activeSub = f.steps.find((s) => s.state === "in-progress");
  if (activeSub) {
    const pendingAfter = f.steps.filter((s) => s.state === "pending" && s.line > activeSub.line);
    if (activeSub.readiness !== STEP_READINESS) {
      reasons.push(`${activeSub.id} ainda não declarou readiness "${STEP_READINESS}".`);
    } else if (pendingAfter.length > 0) {
      reasons.push(
        `${activeSub.id} declarou readiness, mas ${pendingAfter[0].id} ainda precisa ser ativado por advance-step.`
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

export function deriveOpenNextTopologyNodeAvailability(
  f: OpenNextTopologyNodeFacts
): DecisionAvailability {
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
  if (f.pendingSteps.length > 0) {
    const first = f.pendingSteps[0];
    reasons.push(
      `O nó atual ainda tem checkpoint(s) pendente(s) nesta Frente, começando por ${first}; abra o próximo PR governado da continuação antes de abrir o nó da topologia ${f.nextNode.id}.`
    );
  }
  if (f.nextNode.githubPr !== null) {
    reasons.push(
      `O próximo nó da topologia ${f.nextNode.id} já declara PR #${f.nextNode.githubPr}.`
    );
  }
  if (!f.prObserved) {
    reasons.push(
      "Estado do PR atual não observado — não é seguro abrir o próximo nó da topologia."
    );
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
    reasons.push(
      "A branch está atrás do remoto — reconcilie antes de abrir o próximo nó da topologia."
    );
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
    versionedPrBodyReasons: snapshot.versionedPrBodyReasons,
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
  for (const reason of f.versionedPrBodyReasons ?? []) {
    failures.push(`sincronia do PR body: ${reason}`);
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
    for (const reason of checkpoint.reviewPlanDecisionReasons ?? []) {
      failures.push(`plano de revisão do PR: ${reason}`);
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
  if (id === "request-advisory-review") return "npm run flow -- review types";
  if (!mutating) return `npm run flow -- decide --type ${id} --brief-only`;
  const decision =
    id === "finish-step"
      ? "finish"
      : id === "mark-readiness"
        ? "mark-ready"
        : id === "advance-step"
          ? "advance"
          : id === "close-dispositions"
            ? "accept-all"
            : id === "human-gate"
              ? "approve"
              : id === "open-next-topology-node"
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
    ...(id !== "pr-ready" && id !== "review-insight-candidates" && id !== "request-advisory-review"
      ? { mutatingCommand: commandFor(id, true) }
      : {}),
    effect,
  };
}

function currentCheckpointLabel(snapshot: DecisionSnapshot): string {
  return snapshot.checkpoint ?? snapshot.facts.cursor?.checkpoint ?? "checkpoint nao identificado";
}

function nextPendingStep(
  subs: readonly HandoffStep[],
  current: HandoffStep | null
): HandoffStep | null {
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

function decisionRefsFromRawText(value: string | undefined): readonly HumanDecisionSummary[] {
  if (!value) return [];
  return [...new Set([...value.matchAll(/\[?(DEC-\d{4}-G\d+)\]?/g)].map((match) => match[1]))].map(
    (id) => ({ id, summary: decisionSummary(id) })
  );
}

function decisionSummary(id: string): string | null {
  const summaries: Record<string, string> = {
    "DEC-0024-G15": "criou CO-10.7 para tornar a CLI pública autoexplicável.",
    "DEC-0024-G16": "criou CO-10.8 para reorganização interna e BDD visual.",
    "DEC-0024-G17": "reabriu CO-10.7 porque o fechamento anterior foi prematuro.",
  };
  return summaries[id] ?? null;
}

function stripLeadingDecisionClause(value: string | null): string | null {
  if (!value) return value;
  return value.replace(/^\([^)]*DEC-\d{4}-G\d+[^)]*\):\s*/, "").trim();
}

function sentenceCase(value: string): string {
  if (value.length === 0) return value;
  return `${value.charAt(0).toLocaleUpperCase("pt-BR")}${value.slice(1)}`;
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

function descriptionFromRawText(sub: HandoffStep): string | null {
  if (!sub.text) return null;
  const marker = `**${sub.id} — ${sub.title}**`;
  const markerIndex = sub.text.indexOf(marker);
  const afterMarker = markerIndex >= 0 ? sub.text.slice(markerIndex + marker.length) : sub.text;
  const afterColon = afterMarker.replace(/^[:\s]+/, "");
  const objective = extractBetween(afterColon, "", ["**Entradas:**", "**Saída:**"]);
  const cleaned = stripLeadingDecisionClause(objective);
  return cleaned && cleaned.length > 0 ? sentenceCase(cleaned) : null;
}

function outputFromRawText(sub: HandoffStep): string | null {
  if (!sub.text) return null;
  return extractBetween(sub.text, "**Saída:**", ["**Fronteira:**", "**Entradas:**"]);
}

function objectSummary(sub: HandoffStep | null): HumanObjectSummary | null {
  if (!sub) return null;
  return {
    label: `${sub.id} — ${sub.title}`,
    objective: descriptionFromRawText(sub) ?? `Executar ${sub.title}.`,
    output: outputFromRawText(sub),
    decisions: decisionRefsFromRawText(sub.text),
  };
}

function prStateLine(snapshot: DecisionSnapshot): string {
  const pr = snapshot.facts.pullRequest;
  if (!pr) return "PR remoto nao observado.";
  return `PR #${pr.number} ${pr.isDraft ? "Draft" : "Ready"}.`;
}

function deriveHumanSummary(
  snapshot: DecisionSnapshot,
  flow: Omit<GovernedFlow, "humanSummary">
): HumanSummary {
  const pr = snapshot.facts.pullRequest;
  const current = activeStep(snapshot.steps);
  const next = nextPendingStep(snapshot.steps, current);
  const ready: string[] = [];
  const missing: string[] = [];
  const ciPending = (pr?.checks.pending ?? 0) > 0;
  const ciFailing = (pr?.checks.fail ?? 0) > 0;
  const nextObjects = snapshot.steps
    .filter((sub) => current !== null && sub.state === "pending" && sub.line > current.line)
    .sort((a, b) => a.line - b.line)
    .map((sub) => objectSummary(sub))
    .filter((sub): sub is HumanObjectSummary => sub !== null);

  if (snapshot.openFindings.length === 0) ready.push("Os findings do checkpoint estão fechados.");
  else missing.push(`Ainda há ${snapshot.openFindings.length} finding(s) aberto(s).`);

  if (snapshot.workingTreeState === "clean") ready.push("A working tree está limpa.");
  else missing.push("Há mudanças locais não finalizadas.");

  if (pr) {
    if (pr.checks.fail === 0 && pr.checks.pending === 0)
      ready.push(
        `CI ${pr.checks.pass} ok, ${pr.checks.fail} falha(s), ${pr.checks.pending} pendente(s).`
      );
    else {
      if (pr.checks.fail > 0) missing.push(`A CI tem ${pr.checks.fail} falha(s).`);
      if (pr.checks.pending > 0)
        missing.push(`A CI tem ${pr.checks.pending} check(s) pendente(s).`);
    }
  } else {
    missing.push("O PR remoto nao foi observado.");
  }

  if (flow.recommended?.id === "mark-readiness") {
    missing.push("Falta declarar readiness da etapa ativa.");
  } else if (flow.recommended?.id === "finish-step") {
    missing.push(
      current && next
        ? `Falta registrar a decisão governada que encerra ${current.id} e ativa ${next.id}.`
        : "Falta registrar a decisão governada que encerra a etapa atual."
    );
  } else if (flow.recommended?.id === "advance-step") {
    missing.push("Falta decidir o avanço para a próxima etapa.");
  } else if (flow.recommended?.id === "human-gate") {
    missing.push("Falta decisao humana de Human Gate.");
  } else if (flow.recommended?.id === "open-next-topology-node") {
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
    state: [prStateLine(snapshot), `Estamos em ${currentCheckpointLabel(snapshot)}.`],
    currentObject: objectSummary(current),
    nextObject: objectSummary(next),
    nextObjects,
    ready,
    missing: [...new Set(missing)],
    nextAction: humanNextAction(
      flow.recommended?.id ?? null,
      current,
      next,
      snapshot,
      ciPending,
      ciFailing
    ),
    command: flow.recommended?.command ?? null,
    forbidden: flow.forbidden.slice(0, 5),
  };
}

function humanNextAction(
  recommendedId: GovernedFlowActionId | null,
  current: HandoffStep | null,
  next: HandoffStep | null,
  snapshot: DecisionSnapshot,
  ciPending: boolean,
  ciFailing: boolean
): string {
  if (recommendedId === "finish-step") {
    if (current && next) return `Encerrar ${current.id} e iniciar ${next.id}.`;
    if (current) return `Encerrar ${current.id}.`;
  }
  if (recommendedId === "mark-readiness" && current) {
    return `Declarar que ${current.id} está pronto para transição.`;
  }
  if (recommendedId === "advance-step" && next) {
    return `Iniciar ${next.id} — ${next.title}.`;
  }
  if (recommendedId === "human-gate") return "Preparar a decisão humana do checkpoint.";
  if (recommendedId === "open-next-topology-node")
    return "Abrir governadamente o próximo nó da topologia.";
  if (recommendedId === "close-dispositions") return "Fechar findings revalidados.";
  if (snapshot.workingTreeState !== "clean")
    return "Finalizar as mudanças locais e deixar a working tree limpa.";
  if (ciPending) return "Aguardar a CI terminar.";
  if (ciFailing) return "Corrigir a CI antes de decidir.";
  return "Nenhuma decisão mutante está disponível agora.";
}

export function deriveGovernedFlow(snapshot: DecisionSnapshot): GovernedFlow {
  const mark = deriveMarkReadinessAvailability(markReadinessFactsFromDecisionSnapshot(snapshot));
  const advance = deriveAdvanceEligibility(advanceEligibilityFactsFromDecisionSnapshot(snapshot));
  const finish = deriveFinishStepAvailability({
    policyDeclared:
      snapshot.policy !== null && findDecisionType(snapshot.policy, FINISH_STEP_ID) !== undefined,
    steps: snapshot.steps,
    markReadiness: mark,
    advanceStep: advance,
  });
  const humanGate = deriveHumanGateAvailability(humanGateFactsFromDecisionSnapshot(snapshot));
  const openNextTopologyNode = deriveOpenNextTopologyNodeAvailability(
    openNextTopologyNodeFactsFromDecisionSnapshot(snapshot)
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
  const advisoryReview = advisoryReviewAvailability(snapshot);
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
    action("finish-step", "Concluir etapa atual e iniciar a próxima", finish, [
      "altera somente marcadores de etapas em tasks.md",
      "valida readiness sem exigir commit intermediário",
    ]),
    action("mark-readiness", "Declarar readiness da etapa ativa", mark, [
      "altera somente tasks.md",
      "não avança etapa",
    ]),
    action("advance-step", "Iniciar a próxima etapa", advance, [
      "altera somente marcadores de etapas em tasks.md",
    ]),
    action("human-gate", "Decidir o avanço do checkpoint (Human Gate)", humanGate, [
      "cria gate artifact após decisão humana",
      "não executa merge nem transição automática",
    ]),
    action("open-next-topology-node", "Abrir o próximo nó da topologia", openNextTopologyNode, [
      "cria branch, PR Draft e reconcilia state/active/tasks",
      "não executa merge",
    ]),
    action("request-advisory-review", "Pedir revisão antes da decisão humana", advisoryReview, [
      "prepara contexto para uma revisão opcional/recomendada",
      "não publica review sem autorização explícita",
      "não transforma revisão opcional/recomendada em bloqueio de Human Gate",
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
    "finish-step",
    "mark-readiness",
    "advance-step",
    "human-gate",
    "open-next-topology-node",
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
      : ["Avançar etapa enquanto advance-step estiver bloqueado"]),
    ...(humanGate.status === "available" ? [] : ["Executar Human Gate antes dos critérios"]),
    ...(openNextTopologyNode.status === "available"
      ? []
      : ["Abrir próximo nó da topologia fora do fluxo governado"]),
    "Converter PR para Ready fora do fluxo governado",
    "Fazer merge",
  ];
  const flow = { actions, available, blocked, forbidden, recommended };
  return { ...flow, humanSummary: deriveHumanSummary(snapshot, flow) };
}

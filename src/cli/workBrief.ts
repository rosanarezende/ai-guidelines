/**
 * `work` — briefing GOVERNADO e situado de TRABALHO (CO-4 / dogfood operacional
 * do PR #42).
 *
 * Dor absorvida (PIT-0011, 3ª classe): a RETOMADA (`handoff`) e o contrato de
 * REVIEW (`review <tipo>`) já eram descobríveis, mas a EXECUÇÃO de trabalho
 * funcional dependia de um mega-prompt humano reconstruindo escopo, autoridade,
 * validações, parada e formato do relatório — tudo derivável do repo.
 *
 * Sibling do `reviewBrief`: PROJETA o contrato que o implementador deve cumprir
 * (zero LLM no runtime — ADR 0018; não edita arquivos, não commita, não faz
 * push, não executa trabalho):
 *
 *   work-policy.yml (contrato por modo) + snapshot situado do handoff
 *   + autorização capability-scoped
 *   → modo inferido + objeto + permissões + validações + parada + report contract.
 *
 * O modo é inferido por precedência determinística reusando `deriveNextAction`
 * (handoff), refinado pela consolidação de findings×resolutions: o handoff cru
 * retorna `resolve-findings` por `openFindings>0`; aqui distinguimos
 * `resolve_findings` (falta fix válido) de `await_revalidation` (todos fixed com
 * ref válida — nada para o implementador além de aguardar o reviewer).
 */
import * as path from "node:path";
import * as fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  HandoffFacts,
  NextAction,
  SubCheckpointRef,
  SubCheckpointResolution,
  resolveSubCheckpointWork,
} from "./handoffFacts.js";

// Re-export da derivação compartilhada (fonte: handoffFacts) para consumidores
// que historicamente a importavam de `workBrief` (advanceSubcheckpoint, testes).
export { resolveSubCheckpointWork };
export type { SubCheckpointResolution };
import {
  HandoffLoadSnapshot,
  HandoffOptions,
  ghRemotePrCollector,
  loadHandoffSnapshot,
} from "./handoff.js";
import { discover } from "./reviewCheck.js";
import { WorkingTreeState, collectFunctionalFreshness } from "./reviewFreshness.js";
import {
  WorkMode,
  WorkPolicy,
  WorkModePolicy,
  WorkPublicationPolicy,
  parseWorkPolicy,
} from "../infrastructure/yaml/workPolicyReader.js";
import {
  findDecisionType,
  parseHumanDecisionPolicy,
} from "../infrastructure/yaml/humanDecisionPolicyReader.js";
import type { DecisionAvailability } from "./decide/model.js";
import { ADVANCE_SUBCHECKPOINT_ID, deriveAdvanceEligibility } from "./decide/advanceEligibility.js";
import { deriveMarkReadinessAvailability } from "./flow/GovernedFlow.js";
import {
  collectSubCheckpointDeliveryEvidence,
  SubCheckpointDeliveryEvidence,
} from "./flow/subCheckpointDeliveryEvidence.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export const WORK_POLICY_PATH = ".core/governance/work-policy.yml";

/**
 * Autorização capability-scoped: o PEDIDO HUMANO EXPLÍCITO de trabalho
 * ("Corrija os findings atuais." / "Implemente a tarefa atual.") autoriza commit
 * e push APENAS no objeto/checkpoint/branch inferidos e nas ações do modo. NÃO
 * cobre outro finding/checkpoint, próximo sub-checkpoint, review, disposition,
 * Ready, gate, merge, force-push ou `--no-verify`. O runtime não interpreta
 * linguagem natural: o AGENTS.md ensina o mapeamento; execução espontânea =
 * sem autorização (fail-closed).
 */
export type WorkAuthorizationArg = "explicit-work-request";

export function parseWorkAuthorization(
  raw: string | undefined
): WorkAuthorizationArg | null | "invalid" {
  if (raw === undefined) return null;
  return raw === "explicit-work-request" ? "explicit-work-request" : "invalid";
}

export interface WorkAuthorization {
  readonly kind: "none" | "explicit-work-request";
  readonly commitAllowed: boolean;
  readonly pushAllowed: boolean;
}

export interface WorkFinding {
  /** Qualificado `role#id` (ex.: `technical_audit#F1`). */
  readonly qualified: string;
  readonly role: string;
  readonly localId: string;
  readonly severity: string;
  readonly disposition: string;
  readonly location: string;
  readonly hasFixedResolution: boolean;
  /** Ref do commit funcional declarado na resolution (null = ausente). */
  readonly ref: string | null;
  /** Ref existe no histórico e é ancestral do functional HEAD? (null = sem ref para checar). */
  readonly refValid: boolean | null;
}

export interface WorkTaskRef {
  readonly title: string;
  readonly line: number;
}

/** Alias do ref compartilhado (definido em handoffFacts) — forma idêntica. */
export type WorkSubCheckpointRef = SubCheckpointRef;

export interface WorkObject {
  readonly checkpoint: string | null;
  readonly task?: WorkTaskRef;
  readonly findings?: readonly WorkFinding[];
  /** Lane de review pendente (quando o trabalho aponta um review, não implementação). */
  readonly reviewLane?: string;
  /** Sub-checkpoint ATIVO (objeto concreto do implement_checkpoint). */
  readonly subCheckpoint?: WorkSubCheckpointRef;
  /** Transição de sub-checkpoint pendente (concluir um, ativar o próximo). */
  readonly transition?: {
    readonly conclude: WorkSubCheckpointRef | null;
    readonly activate: WorkSubCheckpointRef;
  };
}

export interface WorkValidation {
  readonly command: string;
  readonly level: "obrigatório" | "recomendado";
}

/** Papel de um comando governado projetado na próxima ação (determina a ordem). */
export type WorkCommandRole = "reconcile" | "recommended" | "read-only" | "after";

export interface WorkNextActionCommand {
  readonly role: WorkCommandRole;
  /** Rótulo humano pt-BR (o que o comando faz). */
  readonly label: string;
  readonly command: string;
}

/**
 * Próxima ação ESTRUTURADA: além do resumo humano, projeta os comandos
 * governados disponíveis para EXECUTAR ou apenas INSPECIONAR a ação, derivados do
 * TIPO de decisão pendente (não texto livre), e as ações que continuam proibidas.
 * É a MESMA fonte consumida pelo renderer (§11) e pelo relatório final.
 */
export interface WorkNextAction {
  readonly description: string;
  readonly basis: readonly string[];
  /** Comandos governados (≤ 3), em ordem de precedência (reconcile primeiro quando bloqueado). */
  readonly commands: readonly WorkNextActionCommand[];
  /** Ações que permanecem proibidas mesmo após a decisão pendente. */
  readonly stillForbidden: readonly string[];
  /**
   * Tipo de decisão humana a que esta ação se refere (null quando não há decisão
   * reservada pendente). INVARIANTE: quando há um comando `recommended`
   * (executável), este tipo DEVE estar `available` no `DecisionRegistry` —
   * `work` nunca recomenda como executável uma decisão que `decide` bloqueia.
   */
  readonly decisionType: DecisionType | null;
}

export interface WorkBrief {
  readonly specId: string;
  readonly checkpoint: string | null;
  readonly gitHead: string | null;
  readonly effectiveFunctionalHead: string | null;
  readonly workingTreeState: WorkingTreeState;
  readonly mode: WorkMode;
  readonly purpose: string;
  readonly modeBasis: readonly string[];
  readonly degraded: readonly string[];
  readonly object: WorkObject;
  readonly authorization: WorkAuthorization;
  readonly allowedActions: readonly string[];
  readonly forbiddenActions: readonly string[];
  readonly validations: readonly WorkValidation[];
  readonly publication: WorkPublicationPolicy;
  readonly expectsResolutions: boolean;
  readonly prBodyEditable: boolean;
  readonly stopConditions: readonly string[];
  readonly reportSections: readonly string[];
  readonly nextAction: WorkNextAction;
}

export interface WorkBriefInput {
  readonly facts: HandoffFacts;
  /** Próxima ação do handoff (snapshot.derived) — base da precedência reusada. */
  readonly nextAction: NextAction;
  /** Findings consolidados do checkpoint (todas as lanes), já com ref validada. */
  readonly findings: readonly WorkFinding[];
  readonly policy: WorkPolicy;
  /** Mensagem de erro quando a policy é inválida (⇒ blocked). */
  readonly policyInvalid?: string | null;
  readonly workingTreeState: WorkingTreeState;
  readonly functionalDirtyFiles?: readonly string[];
  readonly effectiveFunctionalHead?: string | null;
  readonly authorization: WorkAuthorizationArg | null;
  /**
   * Elegibilidade de `advance-subcheckpoint` DERIVADA pela MESMA função que
   * `decide` usa (`deriveAdvanceEligibility`) sobre o mesmo snapshot factual. O
   * collector a calcula; testes a injetam. `work` só recomenda a transição como
   * executável quando esta é `available`.
   */
  readonly advanceEligibility: DecisionAvailability;
  readonly markReadinessEligibility?: DecisionAvailability;
}

export interface CollectedWorkBrief {
  readonly snapshot: HandoffLoadSnapshot;
  readonly brief: WorkBrief;
}

export interface WorkBriefOptions extends HandoffOptions {
  readonly authorization?: WorkAuthorizationArg | null;
}

function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

function sameSha(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.startsWith(y) || y.startsWith(x);
}

/** Reviews REQUIRED não satisfeitos (blocking) — apontam review, não implementação. */
function requiredReviewsPending(facts: HandoffFacts): string[] {
  return (facts.lifecycle?.reviewStatuses ?? []).filter((s) => s.blocking).map((s) => s.typeId);
}

/** Validações domínio-derivadas (recomendado) a partir do objeto de trabalho. */
function derivedValidations(specId: string, object: WorkObject): WorkValidation[] {
  const out: WorkValidation[] = [];
  const surfaces = (object.findings ?? []).map((f) => f.location).join(" ");
  if (/constraints/i.test(surfaces)) {
    out.push({ command: "npm run constraints:check", level: "recomendado" });
  }
  if (/\.core|package|dist|pack/i.test(surfaces)) {
    out.push({ command: "npm run test:smoke", level: "recomendado" });
    out.push({ command: "npm pack --dry-run", level: "recomendado" });
  }
  out.push({ command: `npm run handoff:check -- --spec ${specId}`, level: "recomendado" });
  return out;
}

// ── Próxima ação estruturada: comandos derivados do TIPO de decisão pendente ──

/** Tipos de decisão reservados ao humano (espelham `human-decision-policy.yml`). */
type DecisionType =
  | "advance-subcheckpoint"
  | "close-dispositions"
  | "mark-readiness"
  | "human-gate";

const DECIDE_WIZARD_COMMAND = "npm run flow -- decide";
const WORK_RELOAD_COMMAND = "npm run flow -- work --authorization explicit-work-request";

/** Comando read-only DERIVADO do tipo (briefing da decisão, zero escrita). */
function decideBriefCommand(type: DecisionType): string {
  return `npm run flow -- decide --type ${type} --brief-only`;
}

/**
 * Proibições que PERMANECEM mesmo após a decisão pendente, por tipo — curadas em
 * pt-BR a partir do `not_authorized` de cada decisão em `human-decision-policy.yml`.
 * Derivadas do TIPO (lookup determinístico), não texto livre montado por estado.
 */
const DECISION_STILL_FORBIDDEN: Record<DecisionType, readonly string[]> = {
  "mark-readiness": [
    "Avançar sub-checkpoint",
    "Exercer o Human Gate",
    "Converter o PR para Ready",
    "Fazer merge",
  ],
  "advance-subcheckpoint": [
    "Exercer o Human Gate",
    "Converter o PR para Ready",
    "Fazer merge",
    "Abrir o próximo PR",
  ],
  "close-dispositions": [
    "Converter o PR para Ready",
    "Exercer o Human Gate",
    "Criar o gate artifact",
    "Fazer merge",
  ],
  "human-gate": [
    "Fazer merge",
    "Alterar a topologia (state.yml) automaticamente",
    "Abrir o próximo PR automaticamente",
  ],
};

/**
 * Comandos governados de uma decisão (≤ 3): quando exercível, recomendado
 * (interativo) → somente leitura → depois da conclusão; quando bloqueada, SÓ a
 * inspeção read-only (não sugerir o wizard nem o reload — incompatíveis com o
 * estado). Os comandos são DERIVADOS do tipo, nunca hardcoded como texto livre.
 */
function decisionCommands(type: DecisionType, available: boolean): WorkNextActionCommand[] {
  if (!available) {
    return [
      {
        role: "read-only",
        label: "Inspecionar por que a decisão ainda está bloqueada (zero escrita)",
        command: decideBriefCommand(type),
      },
    ];
  }
  return [
    {
      role: "recommended",
      label: "Decidir interativamente (wizard governado)",
      command: DECIDE_WIZARD_COMMAND,
    },
    {
      role: "read-only",
      label: "Inspecionar a decisão sem escrever nada",
      command: decideBriefCommand(type),
    },
    {
      role: "after",
      label: "Após a decisão, recarregar o contrato de trabalho",
      command: WORK_RELOAD_COMMAND,
    },
  ];
}

function decisionNextAction(
  type: DecisionType,
  available: boolean,
  description: string,
  basis: readonly string[]
): WorkNextAction {
  return {
    description,
    basis,
    commands: decisionCommands(type, available),
    stillForbidden: DECISION_STILL_FORBIDDEN[type],
    decisionType: type,
  };
}

/**
 * Próxima ação de uma TRANSIÇÃO de sub-checkpoint, derivada da elegibilidade
 * COMPARTILHADA com `decide` (nunca hardcoded). Available → recomenda o wizard;
 * blocked → só inspeção read-only com os requisitos NOMEADOS, e `work` NÃO o
 * recomenda como executável; not-applicable → descreve o trabalho, sem `decide`.
 */
function advanceNextAction(
  availability: DecisionAvailability,
  conclude: WorkSubCheckpointRef | null,
  activate: WorkSubCheckpointRef
): WorkNextAction {
  const transitionDesc = conclude
    ? `Concluir ${conclude.id} e ativar ${activate.id}.`
    : `Ativar ${activate.id}.`;
  const transitionBasis = [
    ...(conclude
      ? [`concluir: ${conclude.id} — ${conclude.title} (tasks.md linha ${conclude.line})`]
      : []),
    `ativar: ${activate.id} — ${activate.title} (tasks.md linha ${activate.line})`,
  ];
  if (availability.status === "available") {
    return decisionNextAction("advance-subcheckpoint", true, transitionDesc, [
      ...transitionBasis,
      "ao satisfazer os critérios de saída, a transição é decisão GOVERNADA da owner.",
    ]);
  }
  if (availability.status === "blocked") {
    return decisionNextAction(
      "advance-subcheckpoint",
      false,
      `Avanço ${conclude ? `${conclude.id} → ` : ""}${activate.id} ainda BLOQUEADO — \`decide\` não o classifica como disponível.`,
      [
        ...transitionBasis,
        ...availability.reasons.map((r) => `requisito pendente: ${r}`),
        "`work` não recomenda como executável uma transição que `decide` bloqueia.",
      ]
    );
  }
  // not-applicable → não há decisão de transição recomendável; descreve o trabalho.
  return plainNextAction(transitionDesc, [
    ...transitionBasis,
    ...availability.reasons.map((r) => `nota: ${r}`),
  ]);
}

/** Estado BLOQUEADO: o comando de reconciliação vem PRIMEIRO; nunca inventa `decide`. */
function reconcileNextAction(
  description: string,
  basis: readonly string[],
  command: string
): WorkNextAction {
  return {
    description,
    basis,
    commands: [
      {
        role: "reconcile",
        label: "Reconciliar antes de qualquer decisão ou trabalho",
        command,
      },
    ],
    stillForbidden: [
      "Decidir (`decide`) sobre estado divergente",
      "Converter o PR para Ready",
      "Exercer o Human Gate",
      "Fazer merge",
    ],
    decisionType: null,
  };
}

/** Estado SEM decisão pendente: descreve a ação do agente; NÃO inventa `decide`. */
function plainNextAction(description: string, basis: readonly string[]): WorkNextAction {
  return { description, basis, commands: [], stillForbidden: [], decisionType: null };
}

/**
 * Projeta a PRÓXIMA AÇÃO estruturada a partir do modo já inferido + objeto +
 * fatos. O tipo de decisão pendente é DERIVADO do estado; os comandos, do tipo.
 * Estados sem decisão não inventam `decide`; estados bloqueados mostram a
 * reconciliação primeiro.
 */
export function deriveWorkNextAction(
  mode: WorkMode,
  object: WorkObject,
  facts: HandoffFacts,
  rawNext: NextAction,
  ctx: {
    readonly workingTreeState: WorkingTreeState;
    readonly prHeadDiverges: boolean;
    /** Elegibilidade de advance-subcheckpoint (MESMA derivação de `decide`). */
    readonly advanceEligibility: DecisionAvailability;
    /** Elegibilidade de mark-readiness (MESMA derivação de `decide`). */
    readonly markReadinessEligibility: DecisionAvailability;
  }
): WorkNextAction {
  // BLOQUEADO → reconciliação primeiro (gate approved é abertura do próximo nó).
  if (mode === "blocked") {
    if (facts.lifecycle?.gateDecision === "approved") {
      return plainNextAction(
        `Gate do checkpoint ${object.checkpoint ?? "?"} já approved — confirmar o cursor e abrir o próximo nó (transição autorizada por gate).`,
        ["nenhuma decisão reservada pendente neste nó; não inventar `decide`."]
      );
    }
    const command =
      ctx.workingTreeState === "functional-dirty"
        ? "git status"
        : ctx.prHeadDiverges
          ? "git pull --ff-only"
          : "npm run reconcile:check";
    return reconcileNextAction(
      "Reconciliar fontes/projeções/working tree antes de qualquer trabalho ou decisão.",
      [rawNext.description, ...rawNext.basis],
      command
    );
  }

  // TRANSIÇÃO pendente (sub-checkpoint sem ativo, ou ativo concluído) → advance,
  // recomendável SOMENTE quando `decide` classifica como disponível.
  if (mode === "prepare_subcheckpoint_transition" && object.transition) {
    const t = object.transition;
    return advanceNextAction(ctx.advanceEligibility, t.conclude, t.activate);
  }

  // IMPLEMENT com sub-checkpoint ativo → olha à frente para a transição governada
  // (elegibilidade COMPARTILHADA com `decide`, nunca hardcoded como disponível).
  if (mode === "implement_checkpoint" && object.subCheckpoint) {
    const active = object.subCheckpoint;
    if (ctx.markReadinessEligibility.status === "available") {
      return decisionNextAction(
        "mark-readiness",
        true,
        `Declarar readiness de ${active.id} — critérios de saída satisfeitos; o próximo passo é registrar o sinal governado antes de qualquer avanço.`,
        [
          `ativo: ${active.id} — ${active.title} (tasks.md linha ${active.line})`,
          "readiness altera somente tasks.md e não ativa o próximo sub-checkpoint.",
        ]
      );
    }
    const nextPending = facts.subCheckpoints.find((s) => s.state === "pending");
    if (nextPending) {
      return advanceNextAction(ctx.advanceEligibility, active, {
        id: nextPending.id,
        title: nextPending.title,
        line: nextPending.line,
      });
    }
    return plainNextAction(
      `Concluir ${active.id} (último sub-checkpoint do nó) — o avanço passa ao Human Gate, fora deste modo.`,
      [`ativo: ${active.id} — ${active.title} (tasks.md linha ${active.line})`]
    );
  }

  // AWAIT_REVALIDATION → close-dispositions (decisão da owner pós-revalidação).
  if (mode === "await_revalidation") {
    const open = object.findings ?? [];
    const reviewPending = requiredReviewsPending(facts).length > 0;
    return decisionNextAction(
      "close-dispositions",
      !reviewPending,
      "Após a revalidação independente, a owner encerra os problemas revalidados da auditoria técnica (close-dispositions).",
      [
        ...open.map(
          (f) => `${f.qualified}: ${f.disposition} · resolution fixed (ref ${f.ref ?? "?"})`
        ),
        ...(reviewPending
          ? ["review obrigatório pendente — a revalidação independente precede o encerramento."]
          : []),
        "o implementador NÃO fecha disposition; só a owner/reviewer (close-dispositions).",
      ]
    );
  }

  // PREPARE_CLOSE / CURRENT → human-gate (exercível só com precondições satisfeitas).
  if (mode === "prepare_close" || mode === "current") {
    const pr = facts.pullRequest;
    const gateDone = facts.lifecycle?.gateDecision === "approved";
    const ciGreen = pr ? pr.checks.fail === 0 && pr.checks.pending === 0 : false;
    const draft = pr ? pr.isDraft : true;
    const reviewPending = requiredReviewsPending(facts).length > 0;
    const available = pr !== null && !draft && ciGreen && !reviewPending && !gateDone;
    if (available) {
      return decisionNextAction(
        "human-gate",
        true,
        `Decidir o avanço do checkpoint ${object.checkpoint ?? "?"} (Human Gate) — decisão da owner.`,
        ["PR Ready, CI verde e reviews obrigatórios satisfeitos."]
      );
    }
    const reason = gateDone
      ? "gate já decidido"
      : draft
        ? "PR ainda Draft"
        : !ciGreen
          ? "CI não está verde"
          : reviewPending
            ? "review(s) obrigatório(s) pendente(s)"
            : "precondições não satisfeitas";
    return decisionNextAction(
      "human-gate",
      false,
      `Human Gate do checkpoint ${object.checkpoint ?? "?"} ainda BLOQUEADO (${reason}).`,
      ["satisfaça Ready + CI verde + reviews obrigatórios antes de exercer o gate."]
    );
  }

  // RESOLVE_FINDINGS / IMPLEMENT (tarefa de topo) / fallback → trabalho do agente,
  // sem decisão reservada pendente: não inventa `decide`.
  return plainNextAction(rawNext.description, rawNext.basis);
}

/**
 * Inferência DETERMINÍSTICA do modo + projeção do contrato. Puro: nenhuma leitura
 * de fs/Git/GitHub — tudo vem do snapshot e da policy injetados.
 */
export function deriveWorkBrief(input: WorkBriefInput): WorkBrief {
  const { facts, nextAction, findings, policy } = input;
  const specId = /^(\d{4})/.exec(facts.spec.label)?.[1] ?? facts.spec.label;
  const checkpoint = facts.cursor?.checkpoint ?? null;
  const gitHead = facts.git.head;
  const effectiveFunctionalHead = input.effectiveFunctionalHead ?? gitHead;
  const workingTreeState = input.workingTreeState;
  const modeBasis: string[] = [];
  const degraded: string[] = [];
  // Objeto resolvido por sub-checkpoint (preenchido nos casos sem tarefa de topo).
  let subObject: WorkSubCheckpointRef | undefined;
  let transitionObject: WorkObject["transition"] | undefined;

  const openFindings = findings.filter((f) => f.disposition === "open");
  const allOpenResolved =
    openFindings.length > 0 &&
    openFindings.every((f) => f.hasFixedResolution && f.refValid !== false);
  const reqPending = requiredReviewsPending(facts);

  // ── Condições de BLOQUEIO (precedência máxima) ──────────────────────────────
  // SINCRONIZAÇÃO de branch (PR head remoto ↔ git HEAD): é uma relação de COMMITS
  // do branch, não de freshness. O functional HEAD (último commit fora de reviews/)
  // serve para freshness de implementação/review — NUNCA para ahead/behind do PR.
  // Usar o functional HEAD aqui produzia "falso drift" quando o git HEAD == PR head
  // mas havia commits review-only à frente do functional HEAD.
  const prHeadDiffers =
    facts.pullRequest !== null &&
    gitHead !== null &&
    !sameSha(facts.pullRequest.headRefOid, gitHead);
  const prHeadDiverges = prHeadDiffers && (facts.git.behind ?? 0) > 0;

  let mode: WorkMode | null = null;
  if (input.policyInvalid) {
    mode = "blocked";
    modeBasis.push(`work-policy inválida: ${input.policyInvalid}`);
  } else if (!checkpoint) {
    mode = "blocked";
    modeBasis.push("state.yml sem topology/cursor — não há checkpoint ativo para trabalhar.");
  } else if (facts.driftWarnings.length > 0) {
    mode = "blocked";
    modeBasis.push("fontes/projeções divergentes — reconcilie antes de qualquer trabalho:");
    for (const w of facts.driftWarnings) modeBasis.push(`  ${w}`);
  } else if (workingTreeState === "functional-dirty") {
    mode = "blocked";
    modeBasis.push(
      "working tree com MUDANÇAS FUNCIONAIS não commitadas — o objeto de trabalho diverge de " +
        "qualquer commit; commite ou descarte antes de iniciar. Arquivos funcionais sujos:"
    );
    for (const file of input.functionalDirtyFiles ?? []) modeBasis.push(`  ${file}`);
  } else if (prHeadDiverges) {
    mode = "blocked";
    modeBasis.push(
      `PR/HEAD divergentes com remoto À FRENTE (behind ${facts.git.behind}): pull/reconcilie antes de trabalhar.`
    );
  } else if (facts.lifecycle?.gateDecision === "approved") {
    mode = "blocked";
    modeBasis.push(
      `gate do checkpoint ${checkpoint} já está approved — nenhuma nova implementação neste nó; confira o cursor (reconcile:check) ou abra o próximo nó (transição autorizada por gate).`
    );
  }

  // ── Mapa nextAction.kind → modo (refinado por findings×resolutions) ─────────
  if (mode === null) {
    switch (nextAction.kind) {
      case "reconcile-drift":
      case "reconcile-remote-source":
        mode = "blocked";
        modeBasis.push(nextAction.description, ...nextAction.basis.map((b) => `  ${b}`));
        break;
      case "resolve-findings":
        if (allOpenResolved) {
          mode = "await_revalidation";
          modeBasis.push(
            `${openFindings.length} finding(s) open, TODOS com resolution fixed e ref válida — ` +
              "nada a corrigir; a lane aguarda revalidação independente (reviewer/owner)."
          );
        } else {
          mode = "resolve_findings";
          const pendentes = openFindings.filter(
            (f) => !f.hasFixedResolution || f.refValid === false
          );
          modeBasis.push(
            `${openFindings.length} finding(s) open; ${pendentes.length} sem resolution fixed válida — corrigir a causa raiz.`,
            ...pendentes.map(
              (f) =>
                `  ${f.qualified}: ${f.hasFixedResolution ? `resolution fixed mas ref ${f.ref ?? "ausente"} inválida` : "sem resolution fixed"}`
            )
          );
        }
        break;
      case "run-required-review":
        mode = "await_revalidation";
        modeBasis.push(
          `review(s) OBRIGATÓRIO(s) pendente(s): ${reqPending.join(", ") || "(?)"} — aponta REVIEW, não implementação (use \`guidelines review <tipo>\`).`
        );
        break;
      case "prepare-ready":
        mode = "prepare_close";
        modeBasis.push(nextAction.description, ...nextAction.basis.map((b) => `  ${b}`));
        break;
      case "exercise-human-gate":
        mode = "current";
        modeBasis.push(
          "PR Ready com Human Gate pendente — decisão da OWNER; nenhum trabalho de implementação para o agente."
        );
        break;
      case "conclude-node-open-next":
        mode = "blocked";
        modeBasis.push(nextAction.description, ...nextAction.basis.map((b) => `  ${b}`));
        break;
      case "execute-task":
        // Tarefa de topo aberta = objeto concreto → implementa.
        mode = "implement_checkpoint";
        modeBasis.push(nextAction.description, ...nextAction.basis.map((b) => `  ${b}`));
        break;
      case "implement-subcheckpoint":
      case "advance-subcheckpoint-transition":
      case "investigate-checkpoint":
      default: {
        // O handoff já nomeia o sub-checkpoint (kinds acima) ou cai no fallback de
        // investigação. Em todos os casos, RE-DERIVA o objeto pela MESMA função
        // (resolveSubCheckpointWork) — handoff↔work nomeiam o mesmo objeto.
        // FAIL-CLOSED: IMPLEMENT_CHECKPOINT exige um sub-checkpoint ATIVO concreto;
        // sem objeto, nunca autoriza modificar código.
        const sub = resolveSubCheckpointWork(facts);
        if (sub.kind === "transition") {
          mode = "prepare_subcheckpoint_transition";
          transitionObject = sub.transition;
          modeBasis.push(...sub.basis);
        } else if (sub.kind === "implement") {
          mode = "implement_checkpoint";
          subObject = sub.subCheckpoint;
          modeBasis.push(...sub.basis);
        } else {
          mode = "blocked";
          modeBasis.push(
            "nenhum objeto executável materializado (sem tarefa de topo nem sub-checkpoint ativo) — " +
              "materialize uma tarefa/sub-checkpoint em tasks.md antes de implementar. " +
              "IMPLEMENT_CHECKPOINT sem objeto é estado inválido (fail-closed)."
          );
        }
        break;
      }
    }
  }

  // Degradações declaradas (não bloqueiam, mas o briefing nunca inventa fato).
  if (workingTreeState === "review-only") {
    degraded.push(
      "working tree contém APENAS artefatos de review não commitados — código funcional inalterado."
    );
  }
  if (prHeadDiffers && !prHeadDiverges && mode !== "blocked") {
    degraded.push(
      `PR head remoto (${facts.pullRequest!.headRefOid.slice(0, 7)}) atrás do git HEAD local ${gitHead} — push pendente.`
    );
  }
  const prSource = facts.sources.find((s) => s.id === "pull-request");
  if (prSource && prSource.status !== "fresh") {
    degraded.push(
      `fonte remota (PR) ${prSource.status}${prSource.detail ? ` — ${prSource.detail}` : ""}; fatos de PR/CI não observados (nada inventado).`
    );
  }

  const modePolicy: WorkModePolicy | undefined = policy.modes[mode];
  if (!modePolicy) {
    // Contrato incompleto é estado impossível (o reader exige todos os modos).
    throw new Error(`work-policy não define o modo "${mode}" — contrato incompleto.`);
  }

  // ── Objeto de trabalho ──────────────────────────────────────────────────────
  const openTasks = facts.tasks.filter((t) => !t.done);
  const firstOpenTask = openTasks[0];
  const object: WorkObject = {
    checkpoint,
    ...(mode === "implement_checkpoint" && firstOpenTask
      ? {
          task: {
            title: /\*\*(.+?)\*\*/.exec(firstOpenTask.text)?.[1] ?? firstOpenTask.text.slice(0, 80),
            line: firstOpenTask.line,
          },
        }
      : {}),
    ...(mode === "resolve_findings" || mode === "await_revalidation"
      ? { findings: openFindings }
      : {}),
    ...(mode === "await_revalidation" && reqPending.length > 0
      ? { reviewLane: reqPending[0] }
      : {}),
    ...(mode === "implement_checkpoint" && !firstOpenTask && subObject
      ? { subCheckpoint: subObject }
      : {}),
    ...(mode === "prepare_subcheckpoint_transition" && transitionObject
      ? { transition: transitionObject }
      : {}),
  };

  // ── Autorização ─────────────────────────────────────────────────────────────
  const authKind = input.authorization ?? "none";
  const commitAllowed =
    authKind === "explicit-work-request" &&
    modePolicy.publication.commit === "explicit-work-request";
  const pushAllowed =
    authKind === "explicit-work-request" && modePolicy.publication.push === "explicit-work-request";
  const authorization: WorkAuthorization = {
    kind: authKind,
    commitAllowed,
    pushAllowed,
  };

  // ── Validações (obrigatório da policy + recomendado domínio-derivado) ───────
  const validations: WorkValidation[] = [
    ...modePolicy.validations.map((c) => ({ command: c, level: "obrigatório" as const })),
    ...derivedValidations(specId, object).filter(
      (d) => !modePolicy.validations.includes(d.command)
    ),
  ];

  // ── Próxima ação ESTRUTURADA (resumo + comandos derivados do tipo de decisão) ─
  const next = deriveWorkNextAction(mode, object, facts, nextAction, {
    workingTreeState,
    prHeadDiverges,
    advanceEligibility: input.advanceEligibility,
    markReadinessEligibility: input.markReadinessEligibility ?? {
      status: "not-applicable",
      reasons: ["mark-readiness não foi projetado para este snapshot."],
    },
  });

  return {
    specId,
    checkpoint,
    gitHead,
    effectiveFunctionalHead,
    workingTreeState,
    mode,
    purpose: modePolicy.purpose,
    modeBasis,
    degraded,
    object,
    authorization,
    allowedActions: modePolicy.allowedActions,
    forbiddenActions: modePolicy.forbiddenActions,
    validations,
    publication: modePolicy.publication,
    expectsResolutions: modePolicy.expectsResolutions,
    prBodyEditable: modePolicy.prBodyEditable,
    stopConditions: modePolicy.stopConditions,
    reportSections: modePolicy.reportSections,
    nextAction: next,
  };
}

// ── Coleta (I/O) — mesmo snapshot do ato de carga ────────────────────────────

/** Ref existe no histórico E é ancestral do functional HEAD? */
function refIsValid(repoRoot: string, ref: string, head: string | null): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}^{commit}`], { cwd: repoRoot, stdio: "ignore" });
  } catch {
    return false;
  }
  if (!head) return true; // existe; sem head para comparar ancestralidade
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ref, head], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export function loadWorkPolicy(repoRoot: string): {
  policy: WorkPolicy | null;
  error: string | null;
} {
  const policyPath = path.join(repoRoot, WORK_POLICY_PATH);
  if (!fs.existsSync(policyPath)) {
    return { policy: null, error: `fonte governada ausente: ${WORK_POLICY_PATH}` };
  }
  try {
    return { policy: parseWorkPolicy(fs.readFileSync(policyPath, "utf-8")), error: null };
  } catch (e) {
    return { policy: null, error: e instanceof Error ? e.message : String(e) };
  }
}

const HUMAN_DECISION_POLICY_PATH = ".core/governance/human-decision-policy.yml";

/** O tipo `advance-subcheckpoint` está declarado na human-decision-policy? (fail-closed) */
function advanceTypeDeclared(repoRoot: string): boolean {
  const policyPath = path.join(repoRoot, HUMAN_DECISION_POLICY_PATH);
  try {
    const policy = parseHumanDecisionPolicy(fs.readFileSync(policyPath, "utf-8"));
    return findDecisionType(policy, ADVANCE_SUBCHECKPOINT_ID) !== undefined;
  } catch {
    return false;
  }
}

/**
 * Projeta a elegibilidade de `advance-subcheckpoint` do lado do `work`, pela
 * MESMA função `deriveAdvanceEligibility` que `decide` usa, sobre os mesmos
 * `HandoffFacts` da carga. Contagens vêm do lifecycle do handoff; os erros de
 * integridade vêm do mesmo `discover` que alimenta os findings.
 */
function collectAdvanceEligibility(
  facts: HandoffFacts,
  findings: readonly WorkFinding[],
  workingTreeState: WorkingTreeState,
  consolidationErrors: readonly string[],
  policyDeclared: boolean
): DecisionAvailability {
  const lc = facts.lifecycle;
  const pr = facts.pullRequest;
  return deriveAdvanceEligibility({
    subCheckpoints: facts.subCheckpoints,
    policyDeclared,
    openFindings: lc?.openFindings ?? 0,
    openBlocking: lc?.openBlocking ?? 0,
    someFixAwaitingRevalidation: findings.some(
      (f) => f.disposition === "open" && f.hasFixedResolution && f.refValid !== false
    ),
    blockingReviews: (lc?.reviewStatuses ?? [])
      .filter((s) => s.blocking)
      .map((s) => ({ typeId: s.typeId, state: s.state })),
    consolidationErrors,
    workingTreeClean: workingTreeState === "clean",
    behind: facts.git.behind ?? 0,
    ciFail: pr?.checks.fail ?? 0,
    ciPending: pr?.checks.pending ?? 0,
    gateExists: lc?.gateDecision != null,
  });
}

function collectMarkReadinessEligibility(
  facts: HandoffFacts,
  findings: readonly WorkFinding[],
  workingTreeState: WorkingTreeState,
  consolidationErrors: readonly string[],
  policyDeclared: boolean,
  deliveryEvidence: SubCheckpointDeliveryEvidence
): DecisionAvailability {
  const lc = facts.lifecycle;
  const pr = facts.pullRequest;
  const prHeadMatches =
    pr && facts.git.head ? sameSha(facts.git.head, pr.headRefOid) : pr ? false : null;
  return deriveMarkReadinessAvailability({
    subCheckpoints: facts.subCheckpoints,
    policyDeclared,
    openFindings: lc?.openFindings ?? 0,
    openBlocking: lc?.openBlocking ?? 0,
    someFixAwaitingRevalidation: findings.some(
      (f) => f.disposition === "open" && f.hasFixedResolution && f.refValid !== false
    ),
    blockingReviews: (lc?.reviewStatuses ?? [])
      .filter((s) => s.blocking)
      .map((s) => ({ typeId: s.typeId, state: s.state })),
    consolidationErrors,
    workingTreeClean: workingTreeState === "clean",
    behind: facts.git.behind ?? 0,
    prHeadMatches,
    ...(pr && facts.git.head && !prHeadMatches
      ? {
          prHeadMismatchMessage: `O PR head remoto (${pr.headRefOid.slice(0, 7)}) não cobre o git HEAD local ${facts.git.head.slice(0, 7)} — push/CI precisam convergir antes da readiness.`,
        }
      : {}),
    ciFail: pr?.checks.fail ?? 0,
    ciPending: pr?.checks.pending ?? 0,
    gateExists: lc?.gateDecision != null,
    deliveryEvidence,
  });
}

export function collectWorkBrief(
  repoRoot: string,
  options: WorkBriefOptions = {}
): CollectedWorkBrief {
  const snapshot = loadHandoffSnapshot(repoRoot, options);
  const facts = snapshot.collected.facts;
  const cursor = facts.cursor;
  const matches = (cp: string): boolean =>
    cursor !== null && normalizeCheckpoint(cp) === normalizeCheckpoint(cursor.checkpoint);

  const { artifacts, errors: discoverErrors } = discover(repoRoot);
  const reviews = artifacts.reviews.filter((r) => matches(r.checkpoint));
  const resolutionArtifacts = artifacts.resolutions.filter((r) => matches(r.checkpoint));

  const freshness = collectFunctionalFreshness(repoRoot, `${facts.spec.path}/reviews`);
  const head = freshness.effectiveFunctionalHead ?? facts.git.head;

  // role#id → resolution (action + ref) consolidada do checkpoint.
  const resByFinding = new Map<string, { action: string; ref: string | null }>();
  for (const artifact of resolutionArtifacts) {
    for (const res of artifact.resolutions) {
      resByFinding.set(res.finding, { action: res.action, ref: res.ref ?? null });
    }
  }

  const findings: WorkFinding[] = [];
  for (const review of reviews) {
    for (const f of review.findings) {
      const qualified = `${review.role}#${f.id}`;
      const res = resByFinding.get(qualified) ?? null;
      const ref = res?.ref ?? null;
      const refValid = ref ? refIsValid(repoRoot, ref, head) : null;
      findings.push({
        qualified,
        role: review.role,
        localId: f.id,
        severity: f.severity,
        disposition: f.disposition,
        location: f.location,
        hasFixedResolution: res?.action === "fixed",
        ref,
        refValid,
      });
    }
  }

  const { policy, error } = loadWorkPolicy(repoRoot);
  const advanceEligibility = collectAdvanceEligibility(
    facts,
    findings,
    freshness.workingTreeState,
    discoverErrors.map(String),
    advanceTypeDeclared(repoRoot)
  );
  const activeSubCheckpoints = facts.subCheckpoints.filter((s) => s.state === "in-progress");
  const deliveryEvidence =
    activeSubCheckpoints.length === 1
      ? collectSubCheckpointDeliveryEvidence(
          repoRoot,
          `${facts.spec.path}/tasks.md`,
          activeSubCheckpoints[0].id,
          facts.git.head ?? "HEAD"
        )
      : {
          status: "unknown" as const,
          activeId: activeSubCheckpoints[0]?.id ?? "(sem ativo)",
          reason: "Não há sub-checkpoint ativo inequívoco para comprovar entrega.",
        };
  const markReadinessEligibility = collectMarkReadinessEligibility(
    facts,
    findings,
    freshness.workingTreeState,
    discoverErrors.map(String),
    advanceTypeDeclared(repoRoot),
    deliveryEvidence
  );
  const brief = deriveWorkBrief({
    facts,
    nextAction: snapshot.derived.nextAction,
    findings,
    // policy null só com erro — fornecemos um stub vazio compatível só p/ tipos;
    // o modo será blocked e nenhum modePolicy é acessado além do blocked.
    policy: policy ?? ({ version: 1, modes: {} } as unknown as WorkPolicy),
    policyInvalid: error,
    workingTreeState: freshness.workingTreeState,
    functionalDirtyFiles: freshness.functionalDirtyFiles,
    effectiveFunctionalHead: freshness.effectiveFunctionalHead,
    authorization: options.authorization ?? null,
    advanceEligibility,
    markReadinessEligibility,
  });

  return { snapshot, brief };
}

// ── Renderer ─────────────────────────────────────────────────────────────────

function renderList(lines: string[], items: readonly string[], empty = "(nenhum)"): void {
  if (items.length === 0) {
    lines.push(`- ${empty}`);
    return;
  }
  for (const item of items) lines.push(`- ${item}`);
}

export function renderWorkBrief(collected: CollectedWorkBrief): string {
  const { snapshot, brief } = collected;
  const facts = snapshot.collected.facts;
  const pr = facts.pullRequest;
  const lines: string[] = [];

  lines.push(`# Briefing governado de trabalho — ${brief.mode} · ${facts.spec.label}`);
  lines.push("");
  lines.push("## 1. Retomada factual");
  lines.push(`- spec: ${facts.spec.label} · checkpoint: ${brief.checkpoint ?? "(sem cursor)"}`);
  lines.push(
    `- branch: ${facts.git.branch ?? "?"} · git HEAD: ${brief.gitHead ?? "?"} · functional HEAD: ${brief.effectiveFunctionalHead ?? "?"}`
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
  lines.push(`## 2. Modo inferido: ${brief.mode.toUpperCase()}`);
  lines.push(`- propósito: ${brief.purpose}`);
  lines.push("- base factual:");
  for (const basis of brief.modeBasis) lines.push(`  - ${basis}`);
  if (brief.degraded.length > 0) {
    lines.push("- degradações declaradas:");
    for (const d of brief.degraded) lines.push(`  - ${d}`);
  }
  lines.push("");
  lines.push("## 3. Objeto de trabalho");
  lines.push(`- checkpoint: ${brief.object.checkpoint ?? "(sem cursor)"}`);
  if (brief.object.task) {
    lines.push(`- tarefa: ${brief.object.task.title} (tasks.md linha ${brief.object.task.line})`);
  }
  if (brief.object.reviewLane) {
    lines.push(`- lane de review pendente: ${brief.object.reviewLane}`);
  }
  if (brief.object.subCheckpoint) {
    const s = brief.object.subCheckpoint;
    lines.push(`- sub-checkpoint ativo: ${s.id} — ${s.title} (tasks.md linha ${s.line})`);
  }
  if (brief.object.transition) {
    const t = brief.object.transition;
    if (t.conclude) {
      lines.push(
        `- concluir: ${t.conclude.id} — ${t.conclude.title} (tasks.md linha ${t.conclude.line})`
      );
    }
    lines.push(
      `- ativar: ${t.activate.id} — ${t.activate.title} (tasks.md linha ${t.activate.line})`
    );
  }
  if (brief.object.findings && brief.object.findings.length > 0) {
    lines.push("- findings:");
    for (const f of brief.object.findings) {
      lines.push(
        `  - ${f.qualified} · ${f.severity} · ${f.disposition} · ${f.location} — resolution: ${
          f.hasFixedResolution
            ? `fixed (ref ${f.ref ?? "?"}${f.refValid === false ? ", INVÁLIDA" : ""})`
            : "ausente/não-fixed"
        }`
      );
    }
  }
  if (
    !brief.object.task &&
    !brief.object.findings &&
    !brief.object.reviewLane &&
    !brief.object.subCheckpoint &&
    !brief.object.transition
  ) {
    lines.push("- (nenhum objeto materializado para este modo)");
  }
  lines.push("");
  lines.push("## 4. Base factual e fontes");
  lines.push(`- próxima ação derivada (handoff): ${snapshot.derived.nextAction.description}`);
  renderList(
    lines,
    snapshot.derived.nextAction.basis.map((b) => `base: ${b}`),
    "base: (nenhuma)"
  );
  lines.push(`- selo da carga: ${snapshot.derived.seal}`);
  lines.push("");
  lines.push("## 5. Ações permitidas");
  renderList(lines, brief.allowedActions);
  lines.push("");
  lines.push("## 6. Ações proibidas");
  renderList(lines, brief.forbiddenActions);
  lines.push("");
  lines.push("## 7. Validações");
  renderList(
    lines,
    brief.validations.map((v) => `${v.level}: \`${v.command}\``),
    "(nenhuma — modo read-only)"
  );
  lines.push("");
  lines.push("## 8. Publicação e autoridade");
  lines.push(
    `- política do modo: commit ${brief.publication.commit} · push ${brief.publication.push} · mixed_scope ${brief.publication.mixedScope}`
  );
  lines.push(
    `- expects_resolutions: ${brief.expectsResolutions} · pr_body_editable: ${brief.prBodyEditable}`
  );
  if (brief.authorization.kind === "explicit-work-request") {
    lines.push("- Autorização capability-scoped: ATIVA (explicit-work-request)");
    lines.push(
      `  - escopo: checkpoint ${brief.checkpoint ?? "?"} · branch ${facts.git.branch ?? "?"} · objeto inferido do modo;`
    );
    lines.push(
      `  - commit: ${brief.authorization.commitAllowed ? "autorizado" : "NÃO autorizado neste modo"}`
    );
    lines.push(
      `  - push: ${brief.authorization.pushAllowed ? "autorizado (normal; nunca --force/--no-verify)" : "NÃO autorizado neste modo"}`
    );
    lines.push(
      "  - NÃO cobre: outro finding/checkpoint, próximo sub-checkpoint, review, disposition, Ready, gate, merge."
    );
    if (!brief.authorization.commitAllowed) {
      lines.push("  - autorização NÃO cria trabalho: este modo não tem escrita a publicar.");
    }
  } else {
    lines.push("- Autorização capability-scoped: AUSENTE — briefing informativo.");
    lines.push("  - commit: não autorizado · push: não autorizado");
    lines.push(
      "  - Com pedido humano explícito, gere com `--authorization explicit-work-request`."
    );
  }
  lines.push("");
  lines.push("## 9. Critérios de parada");
  renderList(lines, brief.stopConditions);
  lines.push("");
  lines.push("## 10. Estrutura obrigatória do relatório final");
  lines.push(
    "Use EXATAMENTE estes headers (governados em work-policy.yml § " +
      `modes.${brief.mode}.report_sections):`
  );
  for (const section of brief.reportSections) lines.push(`- ${section}`);
  lines.push("");
  lines.push("## 11. Próxima ação");
  lines.push(`- ${brief.nextAction.description}`);
  for (const basis of brief.nextAction.basis) lines.push(`  - ${basis}`);
  if (brief.nextAction.commands.length > 0) {
    lines.push("- comandos governados disponíveis:");
    for (const c of brief.nextAction.commands) lines.push(`  - ${c.label}: \`${c.command}\``);
  }
  if (brief.nextAction.stillForbidden.length > 0) {
    lines.push("- continua proibido:");
    for (const f of brief.nextAction.stillForbidden) lines.push(`  - ${f}`);
  }
  lines.push("");
  lines.push(
    `_Briefing derivado do snapshot da carga (selo ${snapshot.derived.seal}). O runtime projeta o contrato; a execução é do agente sob autoridade do humano._`
  );
  return `${lines.join("\n")}\n`;
}

// ── Entrada CLI ──────────────────────────────────────────────────────────────

export function runWorkBrief(
  repoRoot: string,
  logger: Logger = defaultLogger,
  remoteOverride?: HandoffOptions["remote"],
  authorizationArg?: string
): number {
  const authorization = parseWorkAuthorization(authorizationArg);
  if (authorization === "invalid") {
    logger.error(
      `❌ autorização desconhecida: "${authorizationArg}". Única forma válida: explicit-work-request (mapeada de um pedido humano explícito de trabalho).`
    );
    return 2;
  }
  try {
    const collected = collectWorkBrief(repoRoot, {
      remote: remoteOverride !== undefined ? remoteOverride : ghRemotePrCollector,
      authorization,
    });
    logger.info(renderWorkBrief(collected).trimEnd());
    return 0;
  } catch (error) {
    logger.error(
      `❌ work (briefing) — estado irrecuperável: ${error instanceof Error ? error.message : String(error)}`
    );
    return 1;
  }
}

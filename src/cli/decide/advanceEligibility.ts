/**
 * Derivação ÚNICA da elegibilidade de `advance-subcheckpoint` (SSOT).
 *
 * Esta é a regra COMPARTILHADA de "o sub-checkpoint atual pode ser concluído e o
 * próximo ativado?". Tanto `decide` (`AdvanceSubcheckpointDefinition.detect`)
 * quanto `work` (`deriveWorkBrief` → próxima ação) consomem ESTA função sobre o
 * MESMO snapshot factual (handoff). Antes vivia duplicada em três lugares com
 * regras divergentes — o dogfood expôs a inconsistência: `work` recomendava a
 * transição enquanto `decide` a ocultava do menu como `not-applicable`.
 *
 * Três estados (espelham o `DecisionAvailability` do modelo):
 *   - `not-applicable`: a ESTRUTURA não admite transição (sem sub-checkpoints,
 *     nenhum em andamento, ou tipo não declarado na policy). Some do menu.
 *   - `blocked`: a estrutura admite transição, mas um CRITÉRIO de saída do atual
 *     não está satisfeito — cada requisito é NOMEADO (auditoria, review,
 *     CI, working tree, branch, gate). Aparece no menu como indisponível.
 *   - `available`: estrutura válida + critérios satisfeitos.
 *
 * Determinístico, puro, zero I/O e zero LLM (ADR 0018). Ter sub-checkpoints já
 * concluídos (`[x]`) é o caso NORMAL de toda transição após a primeira — NÃO
 * torna a decisão `not-applicable` (esse era o bug estrutural).
 */
import type { HandoffSubCheckpoint } from "../handoffFacts.js";
import type { DecisionAvailability } from "./model.js";

/** Id canônico da decisão (mora no módulo-folha para ambos os lados reusarem sem ciclo). */
export const ADVANCE_SUBCHECKPOINT_ID = "advance-subcheckpoint";

/**
 * Fatos MÍNIMOS para derivar a elegibilidade — projetáveis identicamente do
 * `DecisionSnapshot` (decide) e dos `HandoffFacts` (work), ambos enraizados na
 * mesma carga do handoff.
 */
export interface AdvanceEligibilityFacts {
  readonly subCheckpoints: readonly HandoffSubCheckpoint[];
  /** O tipo está declarado em `human-decision-policy.yml`? (false ⇒ not-applicable) */
  readonly policyDeclared: boolean;
  readonly closedFindings: number;
  readonly openFindings: number;
  readonly openBlocking: number;
  /** Há finding aberto com correção `fixed` ainda não revalidada por verificação? */
  readonly someFixAwaitingRevalidation: boolean;
  /** Reviews OBRIGATÓRIOS pendentes (só required+não-satisfeito) — nomeados. */
  readonly blockingReviews: readonly { readonly typeId: string; readonly state: string }[];
  /** Erros de integridade dos artefatos de review (discover). */
  readonly consolidationErrors: readonly string[];
  readonly workingTreeClean: boolean;
  readonly behind: number;
  readonly ciFail: number;
  readonly ciPending: number;
  readonly gateExists: boolean;
}

/** Par (atual, próximo) quando a forma é exatamente UMA transição concluir+ativar. */
export interface AdvanceTransitionPair {
  readonly active: HandoffSubCheckpoint;
  readonly next: HandoffSubCheckpoint;
}

/**
 * Par de transição inequívoco: EXATAMENTE um `[/]` (ativo) com um `[ ]` logo
 * adiante (e nenhum pendente antes dele). Independe de quantos já estão `[x]`
 * (concluídos) — toda transição depois da primeira tem `done.length > 0`.
 */
export function advanceTransitionPair(
  subs: readonly HandoffSubCheckpoint[]
): AdvanceTransitionPair | null {
  const inProgress = subs.filter((s) => s.state === "in-progress");
  if (inProgress.length !== 1) return null;
  const active = inProgress[0];
  const pendingAfter = subs.filter((s) => s.state === "pending" && s.line > active.line);
  const pendingBefore = subs.filter((s) => s.state === "pending" && s.line < active.line);
  if (pendingAfter.length === 0 || pendingBefore.length > 0) return null;
  return { active, next: pendingAfter[0] };
}

/**
 * Elegibilidade da transição de sub-checkpoint. Ordem: forma (estrutura) →
 * critérios de saída do atual → guardas operacionais. Cada bloqueio é nomeado.
 */
export function deriveAdvanceEligibility(f: AdvanceEligibilityFacts): DecisionAvailability {
  if (!f.policyDeclared) {
    return {
      status: "not-applicable",
      reasons: ["Tipo não declarado na human-decision-policy.yml."],
    };
  }
  if (f.subCheckpoints.length === 0) {
    return { status: "not-applicable", reasons: ["Este checkpoint não tem sub-checkpoints."] };
  }
  const inProgress = f.subCheckpoints.filter((s) => s.state === "in-progress");

  // ── Forma da ordem (estrutura dos sub-checkpoints) ──────────────────────────
  if (inProgress.length === 0) {
    return {
      status: "not-applicable",
      reasons: ["Nenhum sub-checkpoint está em andamento ([/])."],
    };
  }
  if (inProgress.length > 1) {
    return {
      status: "blocked",
      reasons: ["Mais de um sub-checkpoint em andamento ([/]) — ambiguidade na ordem."],
    };
  }
  const active = inProgress[0];
  const pendingAfter = f.subCheckpoints.filter(
    (s) => s.state === "pending" && s.line > active.line
  );
  const pendingBefore = f.subCheckpoints.filter(
    (s) => s.state === "pending" && s.line < active.line
  );
  if (pendingAfter.length === 0) {
    return {
      status: "blocked",
      reasons: [`Não há próximo sub-checkpoint pendente após ${active.id}.`],
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

  // ── Critérios de saída do atual + guardas operacionais (nomeados) ───────────
  const reasons: string[] = [];
  if (f.openBlocking > 0) {
    reasons.push("Há finding bloqueante aberto na auditoria do sub-checkpoint atual.");
  } else if (f.someFixAwaitingRevalidation) {
    reasons.push("Há correção aguardando revalidação independente.");
  } else if (f.openFindings > 0) {
    reasons.push("Há problema aberto na auditoria do sub-checkpoint atual.");
  } else if (f.closedFindings === 0) {
    reasons.push(`Critérios de saída de ${active.id} não confirmados (sem auditoria fechada).`);
  }
  for (const s of f.blockingReviews) {
    reasons.push(`Review obrigatório pendente: ${s.typeId} (${s.state}).`);
  }
  if (f.consolidationErrors.length > 0) {
    reasons.push(`Integridade dos artefatos de review comprometida: ${f.consolidationErrors[0]}`);
  }
  if (!f.workingTreeClean) {
    reasons.push("A working tree não está limpa.");
  }
  if (f.behind > 0) {
    reasons.push("A branch está atrás do remoto — reconcilie antes de avançar.");
  }
  if (f.ciFail > 0) {
    reasons.push(`A integração contínua tem ${f.ciFail} falha(s).`);
  }
  if (f.ciPending > 0) {
    reasons.push(
      `A integração contínua ainda tem ${f.ciPending} verificação(ões) pendente(s) — aguarde o verde antes de avançar.`
    );
  }
  if (f.gateExists) {
    reasons.push("O gate do checkpoint já foi registrado — a transição interna não se aplica.");
  }
  if (reasons.length > 0) return { status: "blocked", reasons };
  return {
    status: "available",
    reasons: [],
    hint: `${active.id} concluível; ${pendingAfter[0].id} é o próximo`,
  };
}

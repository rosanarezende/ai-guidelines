/**
 * Derivação ÚNICA da elegibilidade de `advance-step` (SSOT).
 *
 * Esta é a regra COMPARTILHADA de "a etapa atual pode ser concluído e o
 * próximo ativado?". Tanto `decide` (`AdvanceStepDefinition.detect`)
 * quanto `work` (`deriveWorkBrief` → próxima ação) consomem ESTA função sobre o
 * MESMO snapshot factual (handoff). Antes vivia duplicada em três lugares com
 * regras divergentes — o dogfood expôs a inconsistência: `work` recomendava a
 * transição enquanto `decide` a ocultava do menu como `not-applicable`.
 *
 * Três estados (espelham o `DecisionAvailability` do modelo):
 *   - `not-applicable`: a ESTRUTURA não admite transição (sem etapas,
 *     nenhum em andamento, ou tipo não declarado na policy). Some do menu.
 *   - `blocked`: a estrutura admite transição, mas um CRITÉRIO de saída do atual
 *     não está satisfeito — cada requisito é NOMEADO (auditoria, review,
 *     CI, working tree, branch, gate). Aparece no menu como indisponível.
 *   - `available`: estrutura válida + critérios satisfeitos.
 *
 * Determinístico, puro, zero I/O e zero LLM (ADR 0018). Ter etapas já
 * concluídos (`[x]`) é o caso NORMAL de toda transição após a primeira — NÃO
 * torna a decisão `not-applicable` (esse era o bug estrutural).
 */
import type { HandoffStep } from "../../app/handoff/handoffFacts.js";
import { deriveFrenteProgression } from "../../app/workflow/frenteProgression.js";
import type { DecisionAvailability } from "./model.js";

/** Id canônico da decisão (mora no módulo-folha para ambos os lados reusarem sem ciclo). */
export const ADVANCE_STEP_ID = "advance-step";

/**
 * Fatos MÍNIMOS para derivar a elegibilidade — projetáveis identicamente do
 * `DecisionSnapshot` (decide) e dos `HandoffFacts` (work), ambos enraizados na
 * mesma carga do handoff.
 */
export interface AdvanceEligibilityFacts {
  readonly steps: readonly HandoffStep[];
  /** O tipo está declarado em `human-decision-policy.yml`? (false ⇒ not-applicable) */
  readonly policyDeclared: boolean;
  // NB: contagens de findings do checkpoint só BLOQUEIAM (quando abertas); a
  // CONCLUSÃO vem do sinal de readiness da etapa ativa, não delas.
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
  readonly active: HandoffStep;
  readonly next: HandoffStep;
}

/**
 * Par de transição inequívoco: EXATAMENTE um `[/]` (ativo) com um `[ ]` logo
 * adiante (e nenhum pendente antes dele). Independe de quantos já estão `[x]`
 * (concluídos) — toda transição depois da primeira tem `done.length > 0`.
 * Regra CANÔNICA em frenteProgression (LENS-F1); este export preserva a API.
 */
export function advanceTransitionPair(subs: readonly HandoffStep[]): AdvanceTransitionPair | null {
  const progression = deriveFrenteProgression({
    steps: subs,
    nextPlannedNode: null,
    gateApproved: false,
  });
  if (!progression.advanceTransition) return null;
  // Estruturalmente compatíveis: FrenteStepFact ⊆ HandoffStep; os objetos vêm de `subs`.
  return progression.advanceTransition as AdvanceTransitionPair;
}

/**
 * Elegibilidade da transição de etapa. Ordem: forma (estrutura) →
 * critérios de saída do atual → guardas operacionais. Cada bloqueio é nomeado.
 */
export function deriveAdvanceEligibility(f: AdvanceEligibilityFacts): DecisionAvailability {
  if (!f.policyDeclared) {
    return {
      status: "not-applicable",
      reasons: ["Tipo não declarado na human-decision-policy.yml."],
    };
  }
  if (f.steps.length === 0) {
    return { status: "not-applicable", reasons: ["Este checkpoint não tem etapas."] };
  }

  // ── Forma da ordem (estrutura das etapas) — derivação CANÔNICA (LENS-F1) ────
  const progression = deriveFrenteProgression({
    steps: f.steps,
    nextPlannedNode: null,
    gateApproved: false,
  });
  if (progression.inProgressSteps.length === 0) {
    return {
      status: "not-applicable",
      reasons: ["Nenhuma etapa está em andamento ([/])."],
    };
  }
  if (progression.inProgressSteps.length > 1) {
    return {
      status: "blocked",
      reasons: ["Mais de uma etapa em andamento ([/]) — ambiguidade na ordem."],
    };
  }
  const active = progression.activeStep as HandoffStep;
  if (progression.pendingAfterActive.length === 0) {
    return {
      status: "not-applicable",
      reasons: [
        `Não há próxima etapa pendente após ${active.id}; a transição interna não se aplica ao terminal do checkpoint.`,
      ],
    };
  }
  if (progression.pendingBeforeActive.length > 0) {
    return {
      status: "blocked",
      reasons: [
        `Ordem ambígua: há etapa pendente antes da ativa (${progression.pendingBeforeActive[0].id}).`,
      ],
    };
  }
  const pendingAfter = progression.pendingAfterActive;

  // ── Critério de SAÍDA do atual: READINESS EXPLÍCITA (NUNCA findings) ─────────
  // Conclusão é DECLARADA pelo sinal de readiness da etapa ATIVA. Jamais
  // inferida de contagens de findings/resolutions: esses números pertencem aos
  // reviews ACUMULADOS do checkpoint (p.ex. o audit do CO-3.1) e não provam que o
  // etapa atual terminou. Reviews/findings podem BLOQUEAR (logo abaixo,
  // quando abertos/required), nunca CONCLUIR. Zero findings é válido.
  const reasons: string[] = [];
  if (active.readiness !== "ready-for-transition") {
    reasons.push(
      `${active.id} ainda não declarou seus critérios de saída satisfeitos ` +
        `(sem readiness "ready-for-transition" em tasks.md).`
    );
  }
  // ── Guardas OPERACIONAIS: findings ABERTOS / reviews required pendentes ──────
  if (f.openBlocking > 0) {
    reasons.push("Há finding bloqueante aberto na auditoria do checkpoint.");
  } else if (f.someFixAwaitingRevalidation) {
    reasons.push("Há correção aguardando revalidação independente.");
  } else if (f.openFindings > 0) {
    reasons.push("Há problema aberto na auditoria do checkpoint.");
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

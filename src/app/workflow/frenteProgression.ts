/**
 * Derivação CANÔNICA da progressão da Frente (Spec 0024 · PR #46).
 *
 * Uma única resposta para "qual é o próximo movimento?" — consumida por
 * handoff (deriveNextAction), humanGate (preview), openNextTopologyNode
 * (elegibilidade) e pr-ready (conclusão semântica). As superfícies apenas
 * RENDERIZAM esta derivação; reimplementar o filtro em cada superfície foi a
 * causa raiz dos bugs de divergência (dualroot antecipado no preview do gate,
 * marcador de ativação não encontrado, Ready "verde" com etapa em implementação).
 *
 * Duas perguntas DISTINTAS que antes se confundiam:
 *   - `unfinishedSteps` (state !== done, INCLUI a etapa ativa): "a Frente
 *     terminou?" — decide se o próximo nó topológico é executável (pós-gate).
 *   - `pendingAfterActive` (state === pending): "o que vem depois da etapa
 *     atual?" — alimenta previews de decisão humana (o gate da etapa ativa
 *     não é bloqueado pelo que vem depois).
 *
 * Tipos estruturais mínimos (sem import de handoff/decide) para evitar ciclo
 * app↔app; `HandoffStep`/`DecisionStep` são compatíveis por forma.
 */

export const FRENTE_STEP_READINESS = "ready-for-transition" as const;

export interface FrenteStepFact {
  readonly id: string;
  readonly title: string;
  readonly state: "pending" | "in-progress" | "done";
  readonly line: number;
  readonly readiness?: string;
}

export interface FrenteNodeFact {
  readonly id: string;
  readonly sequence: number | null;
}

/** Par (atual, próximo) quando a forma admite exatamente UMA transição concluir+ativar. */
export interface FrenteAdvanceTransition {
  readonly active: FrenteStepFact;
  readonly next: FrenteStepFact;
}

export interface FrenteProgression {
  /** A PRIMEIRA etapa `[/]`; a invariante "no máximo uma" é reportada via inProgressSteps. */
  readonly activeStep: FrenteStepFact | null;
  /** Todas as etapas `[/]` (>1 = incoerência de estado; superfícies decidem como reportar). */
  readonly inProgressSteps: readonly FrenteStepFact[];
  /** Todas as etapas `[ ]`, na ordem do arquivo. */
  readonly pendingSteps: readonly FrenteStepFact[];
  /** Etapas `[ ]` ANTES da ativa (linha menor) — ordem ambígua para avanço. */
  readonly pendingBeforeActive: readonly FrenteStepFact[];
  /** Etapas `[ ]` DEPOIS da ativa; sem ativa, todas as pendentes. */
  readonly pendingAfterActive: readonly FrenteStepFact[];
  /** Etapas não concluídas (inclui a ativa) — a Frente só fecha quando vazio. */
  readonly unfinishedSteps: readonly FrenteStepFact[];
  readonly frenteComplete: boolean;
  /** Próximo movimento semântico da Frente (primeira pendente após a ativa). */
  readonly nextSemanticStep: FrenteStepFact | null;
  /**
   * Par de avanço inequívoco (regra canônica do advance-step): EXATAMENTE uma
   * `[/]` ativa, com pendente adiante e NENHUMA pendente antes dela.
   */
  readonly advanceTransition: FrenteAdvanceTransition | null;
  readonly nextTopologyNode: FrenteNodeFact | null;
  /** O nó topológico só é executável com gate aprovado E Frente completa. */
  readonly nextTopologyExecutable: boolean;
  /** Frase canônica compartilhada quando o nó topológico está bloqueado. */
  readonly topologyBlockedSentence: string | null;
  /** true quando a etapa ativa declarou readiness de transição. */
  readonly activeStepReady: boolean;
}

export function deriveFrenteProgression(input: {
  readonly steps: readonly FrenteStepFact[];
  readonly nextPlannedNode: FrenteNodeFact | null;
  readonly gateApproved: boolean;
}): FrenteProgression {
  const inProgressSteps = input.steps.filter((s) => s.state === "in-progress");
  const activeStep = inProgressSteps[0] ?? null;
  const pendingSteps = input.steps.filter((s) => s.state === "pending");
  const pendingBeforeActive = activeStep
    ? pendingSteps.filter((s) => s.line < activeStep.line)
    : [];
  const pendingAfterActive = activeStep
    ? pendingSteps.filter((s) => s.line > activeStep.line)
    : pendingSteps;
  const unfinishedSteps = input.steps.filter((s) => s.state !== "done");
  const frenteComplete = unfinishedSteps.length === 0;
  const nextSemanticStep = pendingAfterActive[0] ?? null;
  const advanceTransition =
    inProgressSteps.length === 1 &&
    activeStep !== null &&
    pendingAfterActive.length > 0 &&
    pendingBeforeActive.length === 0
      ? { active: activeStep, next: pendingAfterActive[0] }
      : null;
  const nextTopologyNode = input.nextPlannedNode;
  const nextTopologyExecutable = input.gateApproved && frenteComplete;

  const topologyBlockedSentence =
    nextTopologyNode && !frenteComplete
      ? `O nó topológico ${nextTopologyNode.id} só abre depois que a Frente fechar (pendente(s): ${pendingSteps
          .map((s) => s.id)
          .join(", ")}).`
      : null;

  return {
    activeStep,
    inProgressSteps,
    pendingSteps,
    pendingBeforeActive,
    pendingAfterActive,
    unfinishedSteps,
    frenteComplete,
    nextSemanticStep,
    advanceTransition,
    nextTopologyNode,
    nextTopologyExecutable,
    topologyBlockedSentence,
    activeStepReady: activeStep?.readiness === FRENTE_STEP_READINESS,
  };
}

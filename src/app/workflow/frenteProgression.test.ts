import {
  deriveFrenteProgression,
  FRENTE_STEP_READINESS,
  FrenteStepFact,
} from "./frenteProgression.js";

function step(
  over: Partial<FrenteStepFact> & Pick<FrenteStepFact, "id" | "state">
): FrenteStepFact {
  return { title: over.id, line: 1, ...over } as FrenteStepFact;
}

const DUALROOT = { id: "dualroot-collapse", sequence: 14 };

describe("frenteProgression · derivação canônica", () => {
  it("Frente com pendências: nó topológico NÃO executável mesmo com gate aprovado", () => {
    const p = deriveFrenteProgression({
      steps: [
        step({ id: "internal-architecture-refactor-ddd-bdd", state: "in-progress" }),
        step({ id: "broad-flow-falsification", state: "pending", line: 2 }),
        step({ id: "continuation-review-human-gate", state: "pending", line: 3 }),
      ],
      nextPlannedNode: DUALROOT,
      gateApproved: true,
    });
    expect(p.frenteComplete).toBe(false);
    expect(p.nextTopologyExecutable).toBe(false);
    expect(p.nextSemanticStep?.id).toBe("broad-flow-falsification");
    expect(p.unfinishedSteps.map((s) => s.id)).toEqual([
      "internal-architecture-refactor-ddd-bdd",
      "broad-flow-falsification",
      "continuation-review-human-gate",
    ]);
    expect(p.topologyBlockedSentence).toContain("dualroot-collapse só abre depois");
    expect(p.topologyBlockedSentence).toContain(
      "broad-flow-falsification, continuation-review-human-gate"
    );
  });

  it("Frente completa + gate aprovado: nó topológico executável, sem frase de bloqueio", () => {
    const p = deriveFrenteProgression({
      steps: [step({ id: "a-um", state: "done" }), step({ id: "b-dois", state: "done", line: 2 })],
      nextPlannedNode: DUALROOT,
      gateApproved: true,
    });
    expect(p.frenteComplete).toBe(true);
    expect(p.nextTopologyExecutable).toBe(true);
    expect(p.topologyBlockedSentence).toBeNull();
    expect(p.nextSemanticStep).toBeNull();
  });

  it("Frente completa SEM gate aprovado: nó topológico ainda não executável", () => {
    const p = deriveFrenteProgression({
      steps: [step({ id: "a-um", state: "done" })],
      nextPlannedNode: DUALROOT,
      gateApproved: false,
    });
    expect(p.nextTopologyExecutable).toBe(false);
  });

  it("as duas perguntas não se confundem: pendingAfterActive exclui a ativa; unfinished inclui", () => {
    const p = deriveFrenteProgression({
      steps: [
        step({ id: "ativa-agora", state: "in-progress" }),
        step({ id: "proxima-etapa", state: "pending", line: 2 }),
      ],
      nextPlannedNode: null,
      gateApproved: false,
    });
    expect(p.pendingAfterActive.map((s) => s.id)).toEqual(["proxima-etapa"]);
    expect(p.unfinishedSteps.map((s) => s.id)).toEqual(["ativa-agora", "proxima-etapa"]);
    expect(p.activeStep?.id).toBe("ativa-agora");
    expect(p.topologyBlockedSentence).toBeNull();
  });

  it("semântica POSICIONAL (LENS-F1): pendente antes × depois da ativa", () => {
    const p = deriveFrenteProgression({
      steps: [
        step({ id: "pulada-atras", state: "pending", line: 1 }),
        step({ id: "ativa-agora", state: "in-progress", line: 2 }),
        step({ id: "proxima", state: "pending", line: 3 }),
      ],
      nextPlannedNode: null,
      gateApproved: false,
    });
    expect(p.pendingBeforeActive.map((s) => s.id)).toEqual(["pulada-atras"]);
    expect(p.pendingAfterActive.map((s) => s.id)).toEqual(["proxima"]);
    expect(p.pendingSteps.map((s) => s.id)).toEqual(["pulada-atras", "proxima"]);
    // Ordem ambígua (pendente antes) ⇒ SEM par de avanço inequívoco.
    expect(p.advanceTransition).toBeNull();
  });

  it("advanceTransition: par inequívoco só com UMA ativa + pendente adiante + nada antes", () => {
    const ok = deriveFrenteProgression({
      steps: [
        step({ id: "feita", state: "done", line: 1 }),
        step({ id: "ativa-agora", state: "in-progress", line: 2 }),
        step({ id: "proxima", state: "pending", line: 3 }),
      ],
      nextPlannedNode: null,
      gateApproved: false,
    });
    expect(ok.advanceTransition).toEqual({
      active: expect.objectContaining({ id: "ativa-agora" }),
      next: expect.objectContaining({ id: "proxima" }),
    });

    const terminal = deriveFrenteProgression({
      steps: [step({ id: "ativa-agora", state: "in-progress", line: 1 })],
      nextPlannedNode: null,
      gateApproved: false,
    });
    expect(terminal.advanceTransition).toBeNull();

    const duasAtivas = deriveFrenteProgression({
      steps: [
        step({ id: "ativa-um", state: "in-progress", line: 1 }),
        step({ id: "ativa-dois", state: "in-progress", line: 2 }),
        step({ id: "proxima", state: "pending", line: 3 }),
      ],
      nextPlannedNode: null,
      gateApproved: false,
    });
    expect(duasAtivas.advanceTransition).toBeNull();
    expect(duasAtivas.inProgressSteps.length).toBe(2);
  });

  it("sem ativa, todas as pendentes contam como 'depois' (retomada do zero)", () => {
    const p = deriveFrenteProgression({
      steps: [
        step({ id: "primeira", state: "pending", line: 1 }),
        step({ id: "segunda", state: "pending", line: 2 }),
      ],
      nextPlannedNode: null,
      gateApproved: false,
    });
    expect(p.pendingAfterActive.map((s) => s.id)).toEqual(["primeira", "segunda"]);
    expect(p.pendingBeforeActive).toEqual([]);
    expect(p.nextSemanticStep?.id).toBe("primeira");
  });

  it("readiness da etapa ativa é derivada, não inferida por CI/tree", () => {
    const semReadiness = deriveFrenteProgression({
      steps: [step({ id: "ativa-agora", state: "in-progress" })],
      nextPlannedNode: null,
      gateApproved: false,
    });
    expect(semReadiness.activeStepReady).toBe(false);

    const comReadiness = deriveFrenteProgression({
      steps: [step({ id: "ativa-agora", state: "in-progress", readiness: FRENTE_STEP_READINESS })],
      nextPlannedNode: null,
      gateApproved: false,
    });
    expect(comReadiness.activeStepReady).toBe(true);
  });
});

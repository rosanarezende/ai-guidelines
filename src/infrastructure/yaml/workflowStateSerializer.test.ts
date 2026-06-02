import {
  WorkflowStateParseError,
  parseWorkflowState,
  serializeWorkflowState,
} from "./workflowStateSerializer.js";

describe("Infra — workflowStateSerializer [BR-WORKFLOW-INFRA]", () => {
  describe("parseWorkflowState", () => {
    it("DADO um state.yml válido ENTÃO retorna o estado parseado", () => {
      const yaml = `stage: implementation
gate:
  status: closed
focus:
  - workflow-runtime
next:
  - run wizard
`;
      const state = parseWorkflowState(yaml);
      expect(state.stage).toBe("implementation");
      expect(state.gate.status).toBe("closed");
      expect(state.focus).toEqual(["workflow-runtime"]);
      expect(state.next).toEqual(["run wizard"]);
    });

    it("DADO YAML com chave extra no topo ENTÃO rejeita por acreção silenciosa", () => {
      const yaml = `stage: discovery
gate:
  status: open
hypotheses:
  - h1
focus: []
next: []
`;
      expect(() => parseWorkflowState(yaml)).toThrow(WorkflowStateParseError);
    });

    it("DADO YAML com stage inválido ENTÃO rejeita com mensagem clara", () => {
      const yaml = `stage: unknown
gate:
  status: open
focus: []
next: []
`;
      expect(() => parseWorkflowState(yaml)).toThrow(/stage must be one of/);
    });

    it("DADO YAML sem campo gate ENTÃO rejeita", () => {
      const yaml = `stage: discovery
focus: []
next: []
`;
      expect(() => parseWorkflowState(yaml)).toThrow(/gate must be a mapping/);
    });

    it("DADO YAML com gate.status inválido ENTÃO rejeita", () => {
      const yaml = `stage: discovery
gate:
  status: approved
focus: []
next: []
`;
      expect(() => parseWorkflowState(yaml)).toThrow(/gate.status must be one of/);
    });

    it("DADO YAML com focus contendo número ENTÃO rejeita", () => {
      const yaml = `stage: discovery
gate:
  status: open
focus:
  - 42
next: []
`;
      expect(() => parseWorkflowState(yaml)).toThrow(/focus must contain only strings/);
    });

    it("DADO YAML omitindo focus e next ENTÃO assume listas vazias", () => {
      const yaml = `stage: discovery
gate:
  status: open
`;
      const state = parseWorkflowState(yaml);
      expect(state.focus).toEqual([]);
      expect(state.next).toEqual([]);
    });
  });

  describe("serializeWorkflowState", () => {
    it("DADO um estado válido ENTÃO produz YAML determinístico round-trippable", () => {
      const original = {
        stage: "decision" as const,
        gate: { status: "awaiting-review" as const },
        focus: ["a", "b"],
        next: ["x"],
      };
      const yaml = serializeWorkflowState(original);
      const reparsed = parseWorkflowState(yaml);
      expect(reparsed).toEqual(original);
    });

    it("DADO duas serializações do mesmo estado ENTÃO produz output idêntico", () => {
      const state = {
        stage: "implementation" as const,
        gate: { status: "closed" as const },
        focus: ["workflow-runtime"],
        next: ["next-step"],
      };
      expect(serializeWorkflowState(state)).toBe(serializeWorkflowState(state));
    });
  });

  describe("topology — invariantes de sequence [Checkpoint 2.3a / O6]", () => {
    const withNodes = (active: string): string => `stage: implementation
gate:
  status: closed
focus: []
next: []
topology:
  cursor:
    pr: pr-1
    checkpoint: cp-1
  prs:
    concluded: []
    active:
${active}
    planned:
      - id: integration-final
        github_pr: null
        role: integration
        terminal: true
        sequence: null
        checkpoints:
          - review-and-merge
`;

    it("DADO topologia válida (execution contígua + 1 terminal) ENTÃO parseia", () => {
      const yaml = withNodes(`      - id: pr-1
        github_pr: 33
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - cp-1`);
      const state = parseWorkflowState(yaml);
      expect(state.topology?.cursor.pr).toBe("pr-1");
      expect(state.topology?.prs.active[0].sequence).toBe(1);
    });

    it("DADO nó execution com sequence null ENTÃO rejeita", () => {
      const yaml = withNodes(`      - id: pr-1
        github_pr: 33
        role: execution
        terminal: false
        sequence: null
        checkpoints:
          - cp-1`);
      expect(() => parseWorkflowState(yaml)).toThrow(/must have a non-null sequence/);
    });

    it("DADO nó NÃO-execution com sequence não-null ENTÃO rejeita", () => {
      // node governance com sequence preenchida — só execution ocupa posição de stack
      const yaml = `stage: implementation
gate:
  status: closed
focus: []
next: []
topology:
  cursor:
    pr: gov
    checkpoint: cp-1
  prs:
    concluded:
      - id: gov
        github_pr: 32
        role: governance
        terminal: false
        sequence: 2
        checkpoints:
          - cp-1
    active: []
    planned:
      - id: term
        github_pr: null
        role: integration
        terminal: true
        sequence: null
        checkpoints:
          - cp-term
`;
      expect(() => parseWorkflowState(yaml)).toThrow(/only execution nodes occupy stack positions/);
    });

    it("DADO sequence de execution duplicada ENTÃO rejeita (colisão)", () => {
      const yaml = withNodes(`      - id: pr-1
        github_pr: 33
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - cp-1
      - id: pr-2
        github_pr: 34
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - cp-2`);
      expect(() => parseWorkflowState(yaml)).toThrow(/duplicate execution sequence/);
    });

    it("DADO buraco na sequência de execution (1,3) ENTÃO rejeita (não-contígua)", () => {
      const yaml = withNodes(`      - id: pr-1
        github_pr: 33
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - cp-1
      - id: pr-2
        github_pr: 34
        role: execution
        terminal: false
        sequence: 3
        checkpoints:
          - cp-2`);
      expect(() => parseWorkflowState(yaml)).toThrow(/must be contiguous/);
    });

    // === Lifecycle-coerência [Checkpoint 2.3b] — guard local que sustenta O5 ===

    it("REGRESSÃO do nó-fantasma: nó em active com github_pr null ENTÃO rejeita", () => {
      // Exatamente o defeito do 2.3 (checkpoint-2.3 era active + github_pr null).
      const yaml = withNodes(`      - id: pr-1
        github_pr: null
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - cp-1`);
      expect(() => parseWorkflowState(yaml)).toThrow(/github_pr: null/);
    });

    it("DADO nó em planned com github_pr não-nulo ENTÃO rejeita", () => {
      const yaml = `stage: implementation
gate:
  status: closed
focus: []
next: []
topology:
  cursor:
    pr: pr-1
    checkpoint: cp-1
  prs:
    concluded: []
    active:
      - id: pr-1
        github_pr: 33
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - cp-1
    planned:
      - id: term
        github_pr: 99
        role: integration
        terminal: true
        sequence: null
        checkpoints:
          - cp-term
`;
      expect(() => parseWorkflowState(yaml)).toThrow(/planned mas tem github_pr/);
    });

    it("DADO github_pr duplicado entre nós ENTÃO rejeita (1 PR ↔ no máximo 1 nó)", () => {
      const yaml = `stage: implementation
gate:
  status: closed
focus: []
next: []
topology:
  cursor:
    pr: pr-1
    checkpoint: cp-1
  prs:
    concluded:
      - id: gov
        github_pr: 33
        role: governance
        terminal: false
        sequence: null
        checkpoints:
          - cp-gov
    active:
      - id: pr-1
        github_pr: 33
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - cp-1
    planned:
      - id: term
        github_pr: null
        role: integration
        terminal: true
        sequence: null
        checkpoints:
          - cp-term
`;
      expect(() => parseWorkflowState(yaml)).toThrow(/duplicate github_pr/);
    });
  });
});

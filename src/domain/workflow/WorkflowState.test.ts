import {
  GATE_STATUSES,
  WORKFLOW_STAGES,
  WorkflowState,
  defaultWorkflowState,
  isExecutionAuthorized,
  isGateStatus,
  isWorkflowStage,
} from "./WorkflowState.js";

describe("Domínio — WorkflowState [BR-WORKFLOW-DOMAIN]", () => {
  describe("isWorkflowStage", () => {
    it("DADO um valor pertencente ao enum ENTÃO retorna true", () => {
      for (const stage of WORKFLOW_STAGES) {
        expect(isWorkflowStage(stage)).toBe(true);
      }
    });

    it("DADO um valor fora do enum ENTÃO retorna false", () => {
      expect(isWorkflowStage("unknown")).toBe(false);
      expect(isWorkflowStage(42)).toBe(false);
      expect(isWorkflowStage(undefined)).toBe(false);
    });
  });

  describe("isGateStatus", () => {
    it("DADO um valor pertencente ao enum ENTÃO retorna true", () => {
      for (const status of GATE_STATUSES) {
        expect(isGateStatus(status)).toBe(true);
      }
    });

    it("DADO um valor fora do enum ENTÃO retorna false", () => {
      expect(isGateStatus("approved")).toBe(false);
      expect(isGateStatus(null)).toBe(false);
    });
  });

  describe("defaultWorkflowState", () => {
    it("DADO uma spec sem state.yml ENTÃO retorna stage=discovery + gate=open + listas vazias", () => {
      const state = defaultWorkflowState();
      expect(state.stage).toBe("discovery");
      expect(state.gate.status).toBe("open");
      expect(state.focus).toEqual([]);
      expect(state.next).toEqual([]);
    });
  });

  describe("isExecutionAuthorized", () => {
    it("DADO gate status closed E tasks.md presente QUANDO isExecutionAuthorized ENTÃO retorna true", () => {
      const state: WorkflowState = {
        stage: "implementation",
        gate: { status: "closed" },
        focus: [],
        next: [],
      };
      expect(isExecutionAuthorized(state, true)).toBe(true);
    });

    it("DADO gate status closed E tasks.md ausente QUANDO isExecutionAuthorized ENTÃO retorna false", () => {
      const state: WorkflowState = {
        stage: "implementation",
        gate: { status: "closed" },
        focus: [],
        next: [],
      };
      expect(isExecutionAuthorized(state, false)).toBe(false);
    });

    it("DADO gate status open E tasks.md presente QUANDO isExecutionAuthorized ENTÃO retorna false", () => {
      const state: WorkflowState = {
        stage: "planning",
        gate: { status: "open" },
        focus: [],
        next: [],
      };
      expect(isExecutionAuthorized(state, true)).toBe(false);
    });

    it("DADO gate status awaiting-review E tasks.md ausente QUANDO isExecutionAuthorized ENTÃO retorna false", () => {
      const state: WorkflowState = {
        stage: "planning",
        gate: { status: "awaiting-review" },
        focus: [],
        next: [],
      };
      expect(isExecutionAuthorized(state, false)).toBe(false);
    });
  });
});

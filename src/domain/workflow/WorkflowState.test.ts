import {
  GATE_STATUSES,
  WORKFLOW_STAGES,
  WorkflowState,
  defaultWorkflowState,
  isExecutionAuthorized,
  isGateStatus,
  isWorkflowStage,
  topologyNodeOwnsPr,
  topologyPrForCheckpoint,
  topologyReviewContextForCheckpoint,
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

  describe("PRs de continuação situados por checkpoint", () => {
    const node = {
      id: "architecture",
      github_pr: 46,
      role: "execution" as const,
      terminal: false,
      sequence: 13,
      checkpoints: ["checkpoint-architecture", "checkpoint-falsification"],
      review_plan: {
        technical_audit: {
          system_recommendation: "recommended" as const,
          owner_decision: "required" as const,
          actor: "owner",
          reason: "Refactor estrutural.",
        },
      },
      continuation_prs: [
        {
          github_pr: 47,
          checkpoint: "checkpoint-falsification",
          head: "feat/spec-0024-broad-flow-falsification",
          review_plan: {
            technical_audit: {
              system_recommendation: "recommended" as const,
              owner_decision: "pending" as const,
            },
          },
        },
      ],
    };

    it("reconhece o PR âncora e o PR de continuação como pertencentes ao mesmo nó", () => {
      expect(topologyNodeOwnsPr(node, 46)).toBe(true);
      expect(topologyNodeOwnsPr(node, 47)).toBe(true);
      expect(topologyNodeOwnsPr(node, 48)).toBe(false);
    });

    it("projeta o PR situado no checkpoint sem alterar a posição topológica", () => {
      expect(topologyPrForCheckpoint(node, "checkpoint-architecture")).toBe(46);
      expect(topologyPrForCheckpoint(node, "checkpoint-falsification")).toBe(47);
      expect(node.sequence).toBe(13);
    });

    it("isola o plano de reviews da continuação do plano histórico do PR âncora", () => {
      expect(
        topologyReviewContextForCheckpoint(node, "checkpoint-architecture").review_plan
          ?.technical_audit.owner_decision
      ).toBe("required");
      expect(
        topologyReviewContextForCheckpoint(node, "checkpoint-falsification").review_plan
          ?.technical_audit.owner_decision
      ).toBe("pending");
    });
  });
});

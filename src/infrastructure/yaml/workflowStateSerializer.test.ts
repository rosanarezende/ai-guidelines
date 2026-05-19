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
});

import { WorkflowState } from "../../domain/workflow/WorkflowState.js";
import { deriveOrigin } from "./deriveOrigin.js";

describe("deriveOrigin", () => {
  it("usa o specId autoritativo (recebido, não re-derivado) e o cursor da topologia", () => {
    const state = {
      topology: {
        cursor: { pr: "ruleset-producibility", checkpoint: "checkpoint-2.4d" },
        prs: { concluded: [], active: [], planned: [] },
      },
    } as unknown as WorkflowState;
    expect(deriveOrigin("0024", state)).toEqual({ spec: "0024", cursor: "checkpoint-2.4d" });
  });

  it("cursor é null quando não há topologia", () => {
    const state = {} as unknown as WorkflowState;
    expect(deriveOrigin("0024", state)).toEqual({ spec: "0024", cursor: null });
  });
});

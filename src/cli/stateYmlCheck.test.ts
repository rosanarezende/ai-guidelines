import { runStateYmlCheck } from "./stateYmlCheck.js";

const VALID_YAML = `stage: discovery
gate:
  status: open
focus:
  - "Item de foco 1"
next:
  - "Próxima ação"
topology:
  cursor:
    pr: pr-1
    checkpoint: checkpoint-1
  prs:
    active:
      - id: pr-1
        github_pr: null
        role: execution
        terminal: true
        sequence: 1
        checkpoints:
          - checkpoint-1
`;

describe("CLI — state-yml:check [BR-STATE-YML-SCHEMA]", () => {
  describe("runStateYmlCheck — validação contra schema canônico", () => {
    it("DADO state.yml válido com 4 chaves canônicas ENTÃO retorna ok com count correto", () => {
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => VALID_YAML,
      });
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") expect(result.count).toBe(1);
    });

    it("DADO state.yml com múltiplos terminais ENTÃO falha", () => {
      const invalid = `stage: discovery
gate:
  status: open
focus: []
next: []
topology:
  cursor:
    pr: pr-1
    checkpoint: cp-1
  prs:
    concluded:
      - id: pr-1
        github_pr: null
        role: execution
        terminal: true
        sequence: null
        checkpoints:
          - cp-1
    active:
      - id: pr-2
        github_pr: null
        role: execution
        terminal: true
        sequence: null
        checkpoints:
          - cp-2
`;
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => invalid,
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures[0].message).toMatch(/cannot have multiple terminal nodes/);
      }
    });

    it("DADO state.yml sem terminal ENTÃO falha", () => {
      const invalid = `stage: discovery
gate:
  status: open
focus: []
next: []
topology:
  cursor:
    pr: pr-1
    checkpoint: cp-1
  prs:
    active:
      - id: pr-1
        github_pr: null
        role: execution
        terminal: false
        sequence: null
        checkpoints:
          - cp-1
`;
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => invalid,
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures[0].message).toMatch(/must have at least one terminal node/);
      }
    });

    it("DADO state.yml com IDs duplicados ENTÃO falha", () => {
      const invalid = `stage: discovery
gate:
  status: open
focus: []
next: []
topology:
  cursor:
    pr: pr-1
    checkpoint: cp-1
  prs:
    concluded:
      - id: pr-1
        github_pr: null
        role: execution
        terminal: false
        sequence: null
        checkpoints:
          - cp-1
    active:
      - id: pr-1
        github_pr: null
        role: execution
        terminal: true
        sequence: null
        checkpoints:
          - cp-2
`;
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => invalid,
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures[0].message).toMatch(/duplicate PR id/);
      }
    });

    it("DADO cursor apontando para PR inexistente ENTÃO falha", () => {
      const invalid = `stage: discovery
gate:
  status: open
focus: []
next: []
topology:
  cursor:
    pr: ghost-pr
    checkpoint: cp-1
  prs:
    active:
      - id: pr-1
        github_pr: null
        role: execution
        terminal: true
        sequence: null
        checkpoints:
          - cp-1
`;
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => invalid,
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures[0].message).toMatch(/cursor.pr "ghost-pr" does not exist in prs/);
      }
    });

    it("DADO cursor apontando para checkpoint inexistente ENTÃO falha", () => {
      const invalid = `stage: discovery
gate:
  status: open
focus: []
next: []
topology:
  cursor:
    pr: pr-1
    checkpoint: ghost-cp
  prs:
    active:
      - id: pr-1
        github_pr: null
        role: execution
        terminal: true
        sequence: null
        checkpoints:
          - cp-1
`;
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => invalid,
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures[0].message).toMatch(
          /cursor.checkpoint "ghost-cp" does not exist in any checkpoints list/
        );
      }
    });
  });
});

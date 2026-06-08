import { runStateYmlCheck, selectOperationalStateYmlFiles } from "./stateYmlCheck.js";

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
        github_pr: 1
        role: execution
        terminal: true
        sequence: 1
        checkpoints:
          - checkpoint-1
`;

describe("CLI — state-yml:check [BR-STATE-YML-SCHEMA]", () => {
  describe("selectOperationalStateYmlFiles — escopo operacional padrão", () => {
    const repoRoot = "/repo";
    const activeState = "/repo/.governance/specs/0024-active/state.yml";
    const completedState = "/repo/.governance/specs/0023-completed/state.yml";
    const touchedState = "/repo/.specify/specs/0018-legacy/state.yml";
    const allFiles = [activeState, completedState, touchedState];

    const activeSpecsText = `version: 1
active_specs:
  - id: "0023"
    slug: completed
    branch: feat/spec-0023-done
    stage: done
    status: completed
    spec_path: .governance/specs/0023-completed
    source_state_path: .governance/specs/0023-completed/state.yml
    updated_at: 2026-06-06T00:21:57-03:00
  - id: "0024"
    slug: active
    branch: feat/spec-0024-active
    stage: implementation
    status: active
    spec_path: .governance/specs/0024-active
    source_state_path: .governance/specs/0024-active/state.yml
    updated_at: 2026-06-07T14:32:02-03:00
`;

    it("DADO specs active e completed ENTÃO seleciona só a não concluída", () => {
      const result = selectOperationalStateYmlFiles({
        repoRoot,
        allFiles,
        activeSpecsText,
        changedRelPaths: [],
      });

      expect(result).toEqual([activeState]);
    });

    it("DADO state.yml legado tocado no diff ENTÃO inclui no escopo mesmo sem active-specs", () => {
      const result = selectOperationalStateYmlFiles({
        repoRoot,
        allFiles,
        activeSpecsText,
        changedRelPaths: [".specify/specs/0018-legacy/state.yml"],
      });

      expect(result).toEqual([activeState, touchedState]);
    });

    it("DADO spec completed tocada no diff ENTÃO valida no ciclo local", () => {
      const result = selectOperationalStateYmlFiles({
        repoRoot,
        allFiles,
        activeSpecsText,
        changedRelPaths: [".governance/specs/0023-completed/state.yml"],
      });

      expect(result).toEqual([completedState, activeState]);
    });
  });

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

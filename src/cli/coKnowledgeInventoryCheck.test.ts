import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { main } from "./coKnowledgeInventoryCheck.js";

function tempRepo(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "co-knowledge-inventory-"));
}

const SPEC_DIR = ".governance/specs/0024-context-architecture";

function writeInventory(repo: string, text: string): void {
  const dir = path.join(repo, SPEC_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "knowledge-backfill.yml"), text);
}

function writeState(repo: string, text: string): void {
  const dir = path.join(repo, SPEC_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "state.yml"), text);
}

// state.yml mínimo válido (parseWorkflowState) com o checkpoint do deadline planned.
const MINIMAL_STATE = `stage: implementation
gate:
  status: closed
focus: []
next: []
topology:
  cursor:
    pr: n1
    checkpoint: checkpoint-gg-0002
  prs:
    concluded: []
    active: []
    planned:
      - id: n1
        github_pr: null
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - checkpoint-gg-0002
      - id: term
        github_pr: null
        role: integration
        terminal: true
        sequence: null
        checkpoints:
          - review-and-merge
`;

const validInventory = `version: 1
entries:
  - id: KB-0001
    kind: insight
    ref: insight:PIT-0001
    status: done
    priority: P0
    source: x
    rationale: y
  - id: KB-0002
    kind: insight
    ref: insight:PIT-0008
    status: done
    priority: P0
    source: x
    rationale: y
  - id: KB-0003
    kind: decision
    ref: decision:DEC-0024-G07
    status: done
    priority: P0
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
  - id: KB-0004
    kind: decision
    ref: decision:DEC-0024-G08
    status: done
    priority: P0
    source: x
    rationale: y
  - id: KB-0005
    kind: rule
    ref: rule:CORE-07
    status: done
    priority: P1
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
  - id: KB-0006
    kind: rule
    ref: rule:CORE-10
    status: done
    priority: P1
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
  - id: KB-0007
    kind: guardrail
    ref: guardrail:GG-0001
    status: done
    priority: P1
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
  - id: KB-0008
    kind: guardrail
    ref: guardrail:GG-0002
    status: planned
    priority: P1
    source: x
    rationale: y
    deadline: checkpoint-gg-0002
  - id: KB-0009
    kind: doctrine
    ref: doctrine:ADR-0018
    status: done
    priority: P0
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
  - id: KB-0010
    kind: doctrine
    ref: doctrine:ADR-0026
    status: done
    priority: P0
    source: x
    rationale: y
  - id: KB-0011
    kind: falsification
    ref: falsification:FAL-0001
    status: done
    priority: P0
    source: x
    rationale: y
  - id: KB-0012
    kind: falsification
    ref: falsification:FAL-0002
    status: done
    priority: P0
    source: x
    rationale: y
  - id: KB-0013
    kind: rule
    ref: rule:CORE-02
    status: done
    priority: P0
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
  - id: KB-0014
    kind: rule
    ref: rule:CORE-08
    status: done
    priority: P0
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
  - id: KB-0015
    kind: rule
    ref: rule:CORE-09
    status: done
    priority: P0
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
  - id: KB-0016
    kind: rule
    ref: rule:CORE-14
    status: done
    priority: P0
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
  - id: KB-0017
    kind: doctrine
    ref: doctrine:ADR-0021
    status: done
    priority: P0
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
  - id: KB-0018
    kind: doctrine
    ref: doctrine:ADR-0022
    status: done
    priority: P0
    source: x
    rationale: y
    scope: runtime_bootstrap_p0
`;

describe("co-knowledge:inventory [BR-CO-KNOWLEDGE-INVENTORY-CHECK]", () => {
  it("DADO inventário ausente ENTÃO retorna 1", () => {
    expect(main(tempRepo(), { info: jest.fn(), error: jest.fn() })).toBe(1);
  });

  it("DADO inventário válido SEM state.yml ENTÃO degrada (não valida deadline↔topologia) e retorna 0", () => {
    const repo = tempRepo();
    writeInventory(repo, validInventory);
    expect(main(repo, { info: jest.fn(), error: jest.fn() })).toBe(0);
  });

  it("DADO inventário válido + state com o checkpoint do deadline ENTÃO retorna 0", () => {
    const repo = tempRepo();
    writeInventory(repo, validInventory);
    writeState(repo, MINIMAL_STATE);
    expect(main(repo, { info: jest.fn(), error: jest.fn() })).toBe(0);
  });

  it("DADO deadline de planned fora da topologia (com state) ENTÃO retorna 1 + KB_DEADLINE_NOT_IN_TOPOLOGY", () => {
    const repo = tempRepo();
    writeInventory(repo, validInventory.replace("checkpoint-gg-0002", "checkpoint-fantasma"));
    writeState(repo, MINIMAL_STATE);
    const errors: string[] = [];
    const code = main(repo, { info: jest.fn(), error: (m) => errors.push(m) });
    expect(code).toBe(1);
    expect(errors.join("\n")).toContain("KB_DEADLINE_NOT_IN_TOPOLOGY");
  });

  it("DADO inventário sem cobertura mínima ENTÃO retorna 1", () => {
    const repo = tempRepo();
    writeInventory(repo, validInventory.replace(/kind: doctrine/g, "kind: insight"));
    expect(main(repo, { info: jest.fn(), error: jest.fn() })).toBe(1);
  });
});

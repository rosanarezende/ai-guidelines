import * as fs from "node:fs";
import * as path from "node:path";
import {
  collectGraphViolations,
  deriveGovernanceGraphSnapshot,
  FORBIDDEN_NODE_TYPES,
  GRAPH_EDGE_TYPES,
  GRAPH_NODE_TYPES,
  type GovernanceGraphInput,
} from "./governanceGraphSnapshot.js";

const STATE_YML = `
stage: implementation
gate:
  status: closed
focus: []
next:
  - "canonical-next: alpha-node"
topology:
  cursor:
    pr: alpha-node
    checkpoint: checkpoint-alpha-node
  prs:
    concluded:
      - id: base-governance
        github_pr: 32
        role: governance
        terminal: false
        sequence: null
        checkpoints:
          - checkpoint-zero
    active:
      - id: alpha-node
        github_pr: 46
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - checkpoint-alpha-node
    planned:
      - id: omega-node
        github_pr: null
        role: execution
        terminal: false
        sequence: 2
        checkpoints:
          - checkpoint-omega-node
`;

const TASKS_MD = [
  "- [/] **Checkpoint alpha-node** — etapa viva:",
  "  - [/] **alpha-step — primeira etapa**: em execução.",
  "  - [ ] **omega-step — segunda etapa**: pendente.",
].join("\n");

const DECISION_BRIEF = [
  "### [DEC-0099-A01] Primeira decisão",
  "",
  "Apoiada em research/2026-01-01-alpha-research.md.",
  "",
  "**Status:** Resolved",
].join("\n");

function makeInput(over: Partial<GovernanceGraphInput> = {}): GovernanceGraphInput {
  const files = [
    { path: "gw/state.yml", content: STATE_YML },
    { path: "gw/tasks.md", content: TASKS_MD },
    { path: "gw/decision-brief.md", content: DECISION_BRIEF },
    { path: "gw/reviews/review.yml", content: "review-a" },
    { path: "gw/gates/gate.yml", content: "gate-a" },
    { path: "gw/research/2026-01-01-alpha-research.md", content: "research-a" },
  ];
  return {
    governedWork: {
      id: "0099-fixture",
      legacySpecId: "0099",
      legacySpecSlug: "fixture",
      sourcePath: "gw",
      statePath: "gw/state.yml",
      tasksPath: "gw/tasks.md",
      decisionBriefPath: "gw/decision-brief.md",
    },
    state: {
      stage: "implementation",
      gate: { status: "closed" },
      focus: [],
      next: [],
      topology: {
        cursor: { pr: "alpha-node", checkpoint: "checkpoint-alpha-node" },
        prs: {
          concluded: [
            {
              id: "base-governance",
              github_pr: 32,
              role: "governance",
              terminal: false,
              sequence: null,
              checkpoints: ["checkpoint-zero"],
            },
          ],
          active: [
            {
              id: "alpha-node",
              github_pr: 46,
              role: "execution",
              terminal: false,
              sequence: 1,
              checkpoints: ["checkpoint-alpha-node"],
            },
          ],
          planned: [
            {
              id: "omega-node",
              github_pr: null,
              role: "execution",
              terminal: false,
              sequence: 2,
              checkpoints: ["checkpoint-omega-node"],
            },
          ],
        },
      },
    } as GovernanceGraphInput["state"],
    tasksMd: TASKS_MD,
    decisionBriefMd: DECISION_BRIEF,
    reviews: [
      {
        checkpoint: "alpha-node",
        role: "technical_audit",
        decision: "changes_requested",
        path: "gw/reviews/review.yml",
        findings: [{ id: "F1", severity: "high", disposition: "open" }],
      },
    ],
    resolutions: [],
    events: [],
    gates: [{ checkpoint: "checkpoint-zero", decision: "approved", path: "gw/gates/gate.yml" }],
    insights: [],
    adrs: [],
    guardrails: [],
    research: [{ path: "gw/research/2026-01-01-alpha-research.md", artifactKind: "research" }],
    continuations: [],
    projections: [],
    files,
    ...over,
  };
}

describe("governanceGraphSnapshot · contrato §8", () => {
  it("determinismo: mesma entrada ⇒ mesmo fingerprint; ordem dos inputs não importa", () => {
    const a = deriveGovernanceGraphSnapshot(makeInput());
    const b = deriveGovernanceGraphSnapshot(makeInput());
    expect(a.snapshot_fingerprint).toBe(b.snapshot_fingerprint);

    const shuffled = makeInput();
    const c = deriveGovernanceGraphSnapshot({
      ...shuffled,
      files: [...shuffled.files].reverse(),
      reviews: [...shuffled.reviews].reverse(),
    });
    expect(c.snapshot_fingerprint).toBe(a.snapshot_fingerprint);
  });

  it("fingerprint muda quando uma fonte relevante muda", () => {
    const base = deriveGovernanceGraphSnapshot(makeInput());
    const changedTasks = TASKS_MD.replace("pendente", "pendente MUDOU");
    const changed = deriveGovernanceGraphSnapshot(
      makeInput({
        tasksMd: changedTasks,
        files: makeInput().files.map((f) =>
          f.path === "gw/tasks.md" ? { ...f, content: changedTasks } : f
        ),
      })
    );
    expect(changed.snapshot_fingerprint).not.toBe(base.snapshot_fingerprint);
  });

  it("conformidade: node.types ⊆ §8.1, edge.types ⊆ §8.2, arestas íntegras, source_refs completos", () => {
    const snapshot = deriveGovernanceGraphSnapshot(makeInput());
    expect(collectGraphViolations(snapshot)).toEqual([]);
    const nodeTypes = new Set<string>(GRAPH_NODE_TYPES);
    const edgeTypes = new Set<string>(GRAPH_EDGE_TYPES);
    for (const node of snapshot.nodes) {
      expect(nodeTypes.has(node.type)).toBe(true);
      expect(node.source_ref.path.length).toBeGreaterThan(0);
      expect(node.source_ref.hash).toMatch(/^[0-9a-f]{12}$/);
    }
    for (const edge of snapshot.edges) expect(edgeTypes.has(edge.type)).toBe(true);
  });

  it("§8.0: `spec` e `frente` são PROIBIDOS como node.type (conformance falha)", () => {
    const snapshot = deriveGovernanceGraphSnapshot(makeInput());
    for (const forbidden of FORBIDDEN_NODE_TYPES) {
      const doctored = {
        nodes: [
          ...snapshot.nodes,
          {
            id: `${forbidden}:x/y`,
            type: forbidden,
            source_ref: { path: "gw/state.yml", hash: "aaaaaaaaaaaa" },
          },
        ],
        edges: snapshot.edges,
      };
      const violations = collectGraphViolations(doctored);
      expect(violations.join(" ")).toContain(`node.type PROIBIDO (§8.0): "${forbidden}"`);
    }
  });

  it("governed-work carrega legado como ATRIBUTO (nunca tipo) + derivados da frenteProgression", () => {
    const snapshot = deriveGovernanceGraphSnapshot(makeInput());
    const gw = snapshot.nodes.find((n) => n.type === "governed-work");
    expect(gw).toBeDefined();
    expect(gw?.attributes.legacy_spec_id).toBe("0099");
    expect(gw?.attributes.legacy_spec_slug).toBe("fixture");
    expect(gw?.attributes.source_path).toBe("gw");
    const derived = gw?.attributes.derived as Record<string, unknown>;
    expect(derived.frente_complete).toBe(false);
    expect(derived.next_semantic_step).toBe("omega-step");
    expect(snapshot.nodes.some((n) => n.type === ("spec" as never))).toBe(false);
  });

  it("cadeia contains + stacked-on + verifies/belongs-to/closed-by derivadas das fontes", () => {
    const snapshot = deriveGovernanceGraphSnapshot(makeInput());
    const edgeSet = new Set(snapshot.edges.map((e) => `${e.from}|${e.type}|${e.to}`));
    expect(
      edgeSet.has(
        "governed-work:0099-fixture/0099-fixture|contains|topology-node:0099-fixture/alpha-node"
      )
    ).toBe(true);
    expect(
      edgeSet.has(
        "topology-node:0099-fixture/alpha-node|stacked-on|topology-node:0099-fixture/base-governance"
      )
    ).toBe(true);
    expect(
      edgeSet.has(
        "review:0099-fixture/alpha-node-technical_audit|verifies|checkpoint:0099-fixture/checkpoint-alpha-node"
      )
    ).toBe(true);
    expect(
      edgeSet.has(
        "finding:0099-fixture/alpha-node-technical_audit-F1|belongs-to|review:0099-fixture/alpha-node-technical_audit"
      )
    ).toBe(true);
    expect(
      edgeSet.has("checkpoint:0099-fixture/checkpoint-zero|closed-by|gate:0099-fixture/zero")
    ).toBe(true);
    expect(
      edgeSet.has(
        "decision:0099-fixture/DEC-0099-A01|supported-by|research-artifact:0099-fixture/2026-01-01-alpha-research"
      )
    ).toBe(true);
  });

  it("offline: o módulo de derivação não usa rede/processos (só crypto determinístico)", () => {
    const source = fs.readFileSync(path.join(__dirname, "governanceGraphSnapshot.ts"), "utf-8");
    for (const banned of ["execFileSync", "child_process", "fetch(", "node:https", "node:http"]) {
      expect(source.includes(banned)).toBe(false);
    }
  });
});

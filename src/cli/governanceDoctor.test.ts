import { diagnoseGovernanceDrift, renderGovernanceDoctorReport } from "./governanceDoctor.js";

const repoRoot = "/repo";
const activeIndexPath = `${repoRoot}/.governance/runtime/specs/active.yml`;
const statePath = `${repoRoot}/.governance/specs/0024-context-architecture/state.yml`;
const tasksPath = `${repoRoot}/.governance/specs/0024-context-architecture/tasks.md`;

function activeIndex(branch = "feat/spec-0024-context-architecture"): string {
  return `
version: 1
active_specs:
  - id: "0024"
    slug: context-architecture
    branch: ${branch}
    stage: implementation
    status: active
    spec_path: .governance/specs/0024-context-architecture
    source_state_path: .governance/specs/0024-context-architecture/state.yml
    updated_at: 2026-06-20T00:00:00Z
`;
}

function stateWithTopology(nextLine = "canonical-next: co-flow-continuation"): string {
  return `stage: implementation
gate:
  status: closed
focus: []
next:
  - "${nextLine}"
topology:
  cursor:
    pr: co-flow-continuation
    checkpoint: checkpoint-co-flow-continuation
  prs:
    concluded:
      - id: co-flow-convergence
        github_pr: 43
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - checkpoint-co-flow-convergence
    active:
      - id: co-flow-continuation
        github_pr: 44
        role: execution
        terminal: false
        sequence: 2
        checkpoints:
          - checkpoint-co-flow-continuation
    planned:
      - id: integration-final
        github_pr: null
        role: integration
        terminal: true
        sequence: null
        checkpoints:
          - review-and-merge
`;
}

function stateWithCursorOutsideCanonical(): string {
  return stateWithTopology()
    .replace("pr: co-flow-continuation", "pr: integration-final")
    .replace("checkpoint: checkpoint-co-flow-continuation", "checkpoint: review-and-merge");
}

function tasksWithIncoherentSubcheckpoint(): string {
  return [
    "## Execução",
    "",
    "- [/] **Checkpoint co-flow-continuation** (nó `co-flow-continuation`)",
    "    - [x] **CO-10.8.1 — Governance Doctor**: EM EXECUÇÃO.",
    "    - [ ] **CO-10.8.2 — reorganização interna**: pendente.",
    "",
  ].join("\n");
}

function depsFor(
  files: ReadonlyMap<string, string>,
  branch = "feat/spec-0024-context-architecture"
) {
  return {
    loadIndex: () => ({
      indexAvailable: files.has(activeIndexPath),
      entries: files.has(activeIndexPath)
        ? [
            {
              specPathExists: files.has(statePath),
              entry: {
                id: "0024",
                slug: "context-architecture",
                branch,
                stage: "implementation" as const,
                status: "active" as const,
                specPath: ".governance/specs/0024-context-architecture",
                sourceStatePath: ".governance/specs/0024-context-architecture/state.yml",
                updatedAt: "2026-06-20T00:00:00Z",
              },
            },
          ]
        : [],
      warnings: [],
    }),
    fileExists: (filePath: string) => files.has(normalize(filePath)),
    readFile: (filePath: string) => {
      const value = files.get(normalize(filePath));
      if (value === undefined) throw new Error(`missing fixture: ${filePath}`);
      return value;
    },
    discoverStateFiles: () => (files.has(statePath) ? [statePath] : []),
  };
}

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

describe("GovernanceDoctor — diagnóstico humano de drift", () => {
  it("DADO repositório sem índice nem state.yml ENTÃO reporta not-governed sem issue", () => {
    const report = diagnoseGovernanceDrift(repoRoot, depsFor(new Map()));

    expect(report.status).toBe("not-governed");
    expect(report.issues).toHaveLength(0);
    expect(renderGovernanceDoctorReport(report).join("\n")).toContain(
      "ainda não publicou specs governadas"
    );
  });

  it("DADO active.yml fiel a state.yml/topology ENTÃO reporta ok", () => {
    const files = new Map([
      [activeIndexPath, activeIndex()],
      [statePath, stateWithTopology()],
    ]);

    const report = diagnoseGovernanceDrift(repoRoot, depsFor(files));

    expect(report.status).toBe("ok");
    expect(report.issues).toHaveLength(0);
  });

  it("DADO branch do índice stale ENTÃO explica o drift de projeção e reparo seguro", () => {
    const files = new Map([
      [activeIndexPath, activeIndex("feat/spec-0024-antiga")],
      [statePath, stateWithTopology()],
    ]);

    const report = diagnoseGovernanceDrift(repoRoot, {
      ...depsFor(files, "feat/spec-0024-antiga"),
      currentBranch: () => "feat/spec-0024-context-architecture",
    });

    expect(report.status).toBe("attention");
    expect(report.issues.map((issue) => issue.title)).toContain(
      "O índice público aponta para a branch errada"
    );
    expect(report.issues.find((issue) => issue.id.endsWith(":branch"))?.repairAuthority).toBe(
      "confirm"
    );
    expect(renderGovernanceDoctorReport(report).join("\n")).toContain("Reparo seguro:");
  });

  it("DADO next narrado stale ENTÃO explica divergência topológica", () => {
    const files = new Map([
      [activeIndexPath, activeIndex()],
      [statePath, stateWithTopology("canonical-next: co-capture")],
    ]);

    const report = diagnoseGovernanceDrift(repoRoot, depsFor(files));

    expect(report.status).toBe("attention");
    expect(report.issues.map((issue) => issue.title)).toContain(
      "O próximo narrado diverge da topologia"
    );
    expect(report.issues[0].repairAuthority).toBe("human-decision");
    expect(report.issues[0].whyItMatters).toContain("topologia");
  });

  it("DADO cursor incoerente ENTÃO classifica como decisão humana", () => {
    const files = new Map([
      [activeIndexPath, activeIndex()],
      [statePath, stateWithCursorOutsideCanonical()],
    ]);

    const report = diagnoseGovernanceDrift(repoRoot, depsFor(files));

    expect(report.status).toBe("attention");
    const topologyIssue = report.issues.find((issue) => issue.id.includes("cursor"));
    expect(topologyIssue).toMatchObject({ repairAuthority: "human-decision" });
  });

  it("DADO tasks.md incoerente com o checkpoint ativo ENTÃO classifica como decisão humana", () => {
    const files = new Map([
      [activeIndexPath, activeIndex()],
      [statePath, stateWithTopology()],
      [tasksPath, tasksWithIncoherentSubcheckpoint()],
    ]);

    const report = diagnoseGovernanceDrift(repoRoot, depsFor(files));

    expect(report.status).toBe("attention");
    expect(report.issues.some((issue) => issue.id.includes("active-consistency"))).toBe(true);
    expect(report.issues.find((issue) => issue.id.includes("active-consistency"))).toMatchObject({
      repairAuthority: "human-decision",
    });
  });
});

import {
  parseActiveSpecs,
  stringifySpecsHistory,
} from "../../infrastructure/yaml/activeSpecsSerializer.js";
import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";
import { affectedFiles, applyRepairPlan } from "./RepairPlan.js";
import { buildBranchProjectionRepairPlan } from "./branchProjectionRepair.js";

/**
 * Tests BDD pt-BR — reparo do Drift #1 (branch ≠ active.yml).
 *
 * Contratos POSITIVOS (sem testes de "não contém"):
 *   - dado um drift de branch conhecido, o plano CONTÉM a ação de republicar a
 *     projeção;
 *   - o preview lista exatamente o arquivo que muda (índice ativo);
 *   - a execução altera SOMENTE a branch, preservando status/autoria/stage.
 */
class WritableFakeFs implements WorkflowFileSystem {
  files: Map<string, string>;
  directories: Set<string>;
  directoryContents: Map<string, ReadonlyArray<string>>;
  branch: string | null;

  constructor(opts: {
    files: Map<string, string>;
    directories: Set<string>;
    directoryContents: Map<string, ReadonlyArray<string>>;
    branch: string | null;
  }) {
    this.files = new Map(opts.files);
    this.directories = new Set(opts.directories);
    this.directoryContents = new Map(opts.directoryContents);
    this.branch = opts.branch;
  }

  fileExists(relPath: string): boolean {
    return this.files.has(relPath);
  }
  directoryExists(relPath: string): boolean {
    return this.directories.has(relPath);
  }
  readTextFile(relPath: string): string {
    const content = this.files.get(relPath);
    if (content === undefined) throw new Error(`missing ${relPath}`);
    return content;
  }
  writeTextFile(relPath: string, contents: string): void {
    this.files.set(relPath, contents);
  }
  listDirectory(relPath: string): ReadonlyArray<string> {
    return this.directoryContents.get(relPath) ?? [];
  }
  currentBranch(): string | null {
    return this.branch;
  }
  resolveAbsolute(relPath: string): string {
    return `/repo/${relPath}`;
  }
}

const SPEC_DIR = ".governance/specs/0023-workflow-runtime";
const STATE_PATH = `${SPEC_DIR}/state.yml`;
const INDEX_PATH = ".governance/runtime/specs/active.yml";
const HISTORY_PATH = ".governance/runtime/specs/history.yml";
const CURRENT_BRANCH = "feat/spec-0023-workflow-runtime";
const PROJECTED_OLD = "feat/spec-0023-old-branch";
const ISSUE_ID = "active-consistency:0023:branch";
const FIXED_NOW = () => new Date("2026-06-21T10:00:00Z");

const VALID_STATE_YAML = `stage: implementation
gate:
  status: closed
focus:
  - workflow-runtime
next:
  - executar PR3
`;

function indexYaml(opts: { branch: string; withUpdatedBy?: boolean }): string {
  const updatedBy = opts.withUpdatedBy === false ? "" : `    updated_by: "@rosanarezende"\n`;
  return `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "${opts.branch}"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    source_state_path: ".governance/specs/0023-workflow-runtime/state.yml"
    updated_at: "2026-05-20T00:00:00Z"
${updatedBy}`;
}

function makeFs(opts: { branch?: string; withUpdatedBy?: boolean } = {}): WritableFakeFs {
  const files = new Map<string, string>();
  files.set(STATE_PATH, VALID_STATE_YAML);
  files.set(
    INDEX_PATH,
    indexYaml({ branch: opts.branch ?? PROJECTED_OLD, withUpdatedBy: opts.withUpdatedBy })
  );
  // history.yml já existe e está vazio — seed com a saída do próprio serializer
  // garante before === after, então o reparo não toca o histórico.
  files.set(HISTORY_PATH, stringifySpecsHistory({ version: 1, specsHistory: [] }));
  return new WritableFakeFs({
    files,
    directories: new Set([SPEC_DIR, ".governance/specs"]),
    directoryContents: new Map([[".governance/specs", ["0023-workflow-runtime"]]]),
    branch: CURRENT_BRANCH,
  });
}

describe("Repair — Drift #1 (branch ≠ active.yml) [CO-10.8.1]", () => {
  it("DADO a projeção apontando para outra branch QUANDO monta o plano ENTÃO o plano contém a ação de republicar a projeção", () => {
    const result = buildBranchProjectionRepairPlan(ISSUE_ID, { fs: makeFs(), now: FIXED_NOW });

    expect(result.kind).toBe("plan");
    if (result.kind !== "plan") return;
    expect(result.plan.pattern).toBe("branch-stale");
    expect(result.plan.authority).toBe("confirm");
    expect(result.plan.issueId).toBe(ISSUE_ID);
    expect(result.plan.actions.map((action) => action.id)).toContain("republish-active-projection");
  });

  it("DADO o plano QUANDO calcula o preview ENTÃO o único arquivo afetado é o índice ativo", () => {
    const result = buildBranchProjectionRepairPlan(ISSUE_ID, { fs: makeFs(), now: FIXED_NOW });
    if (result.kind !== "plan") throw new Error("esperava um plano");

    expect(affectedFiles(result.plan)).toEqual([INDEX_PATH]);
  });

  it("DADO o plano aplicado QUANDO inspeciona o índice ENTÃO só a branch muda; status, autoria, stage e spec_path são preservados", () => {
    const fs = makeFs();
    const result = buildBranchProjectionRepairPlan(ISSUE_ID, { fs, now: FIXED_NOW });
    if (result.kind !== "plan") throw new Error("esperava um plano");

    const applied = applyRepairPlan(result.plan, fs);
    expect(applied.written).toEqual([INDEX_PATH]);

    const after = parseActiveSpecs(fs.readTextFile(INDEX_PATH)).activeSpecs[0];
    expect(after.branch).toBe(CURRENT_BRANCH); // o que estava errado, corrigido
    expect(after.status).toBe("active"); // preservado
    expect(after.updatedBy).toBe("@rosanarezende"); // preservado
    expect(after.stage).toBe("implementation"); // projetado do state.yml
    expect(after.specPath).toBe(SPEC_DIR); // preservado
  });

  it("DADO a entry sem autoria E sem --updated-by QUANDO monta o plano ENTÃO pede que se informe quem autoriza", () => {
    const result = buildBranchProjectionRepairPlan(ISSUE_ID, {
      fs: makeFs({ withUpdatedBy: false }),
      now: FIXED_NOW,
    });
    expect(result.kind).toBe("needs-updated-by");
  });

  it("DADO --updated-by informado E entry sem autoria QUANDO monta o plano ENTÃO produz o plano usando o autor informado", () => {
    const result = buildBranchProjectionRepairPlan(ISSUE_ID, {
      fs: makeFs({ withUpdatedBy: false }),
      now: FIXED_NOW,
      updatedBy: "@rosanarezende",
    });
    expect(result.kind).toBe("plan");
  });

  it("DADO a projeção já coerente com a branch atual QUANDO monta o plano ENTÃO o reparo é não-aplicável", () => {
    const result = buildBranchProjectionRepairPlan(ISSUE_ID, {
      fs: makeFs({ branch: CURRENT_BRANCH }),
      now: FIXED_NOW,
    });
    expect(result.kind).toBe("not-applicable");
  });
});

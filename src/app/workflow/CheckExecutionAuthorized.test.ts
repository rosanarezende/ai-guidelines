import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowState } from "../../domain/workflow/WorkflowState.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import { CheckExecutionAuthorized } from "./CheckExecutionAuthorized.js";

class WritableFakeFs implements WorkflowFileSystem {
  files: Set<string>;

  constructor(files: ReadonlyArray<string> = []) {
    this.files = new Set(files);
  }

  fileExists(relPath: string): boolean {
    return this.files.has(relPath);
  }
  directoryExists(): boolean {
    return false;
  }
  readTextFile(): string {
    throw new Error("Not implemented in check auth test");
  }
  writeTextFile(): void {
    throw new Error("writeTextFile not used in check auth test");
  }
  listDirectory(): ReadonlyArray<string> {
    return [];
  }
  currentBranch(): string | null {
    return null;
  }
  resolveAbsolute(relPath: string): string {
    return `/repo/${relPath}`;
  }
}

describe("App — CheckExecutionAuthorized [BR-WORKFLOW-CHECK-EXECUTION-AUTHORIZED]", () => {
  const specLocation: SpecLocation = {
    slug: "0023-workflow-runtime",
    absolutePath: "/repo/.governance/specs/0023-workflow-runtime",
    source: "governance",
  };

  const legacyLocation: SpecLocation = {
    slug: "0023-legacy",
    absolutePath: "/repo/.specify/specs/0023-legacy",
    source: "specify-legacy",
  };

  it("DADO spec em .governance E tasks.md presente E gate fechado QUANDO verificar autorização ENTÃO retorna authorized=true e sem violações", () => {
    const fs = new WritableFakeFs([".governance/specs/0023-workflow-runtime/tasks.md"]);
    const state: WorkflowState = {
      stage: "implementation",
      gate: { status: "closed" },
      focus: [],
      next: [],
    };
    const useCase = new CheckExecutionAuthorized(fs);

    const result = useCase.run(specLocation, state);

    expect(result.authorized).toBe(true);
    expect(result.missingTasksFile).toBe(false);
    expect(result.gateNotClosed).toBe(false);
    expect(result.actualGateStatus).toBe("closed");
    expect(result.checkedTasksPath).toBe(".governance/specs/0023-workflow-runtime/tasks.md");
  });

  it("DADO spec em .specify-legacy E tasks.md presente E gate fechado QUANDO verificar autorização ENTÃO retorna authorized=true no caminho legado", () => {
    const fs = new WritableFakeFs([".specify/specs/0023-legacy/tasks.md"]);
    const state: WorkflowState = {
      stage: "implementation",
      gate: { status: "closed" },
      focus: [],
      next: [],
    };
    const useCase = new CheckExecutionAuthorized(fs);

    const result = useCase.run(legacyLocation, state);

    expect(result.authorized).toBe(true);
    expect(result.missingTasksFile).toBe(false);
    expect(result.gateNotClosed).toBe(false);
    expect(result.checkedTasksPath).toBe(".specify/specs/0023-legacy/tasks.md");
  });

  it("DADO tasks.md ausente E gate fechado QUANDO verificar autorização ENTÃO retorna authorized=false E missingTasksFile=true E gateNotClosed=false", () => {
    const fs = new WritableFakeFs([]);
    const state: WorkflowState = {
      stage: "implementation",
      gate: { status: "closed" },
      focus: [],
      next: [],
    };
    const useCase = new CheckExecutionAuthorized(fs);

    const result = useCase.run(specLocation, state);

    expect(result.authorized).toBe(false);
    expect(result.missingTasksFile).toBe(true);
    expect(result.gateNotClosed).toBe(false);
    expect(result.actualGateStatus).toBe("closed");
  });

  it("DADO tasks.md presente E gate NÃO fechado QUANDO verificar autorização ENTÃO retorna authorized=false E missingTasksFile=false E gateNotClosed=true", () => {
    const fs = new WritableFakeFs([".governance/specs/0023-workflow-runtime/tasks.md"]);
    const state: WorkflowState = {
      stage: "implementation",
      gate: { status: "open" },
      focus: [],
      next: [],
    };
    const useCase = new CheckExecutionAuthorized(fs);

    const result = useCase.run(specLocation, state);

    expect(result.authorized).toBe(false);
    expect(result.missingTasksFile).toBe(false);
    expect(result.gateNotClosed).toBe(true);
    expect(result.actualGateStatus).toBe("open");
  });

  it("DADO tasks.md ausente E gate NÃO fechado QUANDO verificar autorização ENTÃO retorna authorized=false E missingTasksFile=true E gateNotClosed=true E status atual", () => {
    const fs = new WritableFakeFs([]);
    const state: WorkflowState = {
      stage: "planning",
      gate: { status: "awaiting-review" },
      focus: [],
      next: [],
    };
    const useCase = new CheckExecutionAuthorized(fs);

    const result = useCase.run(specLocation, state);

    expect(result.authorized).toBe(false);
    expect(result.missingTasksFile).toBe(true);
    expect(result.gateNotClosed).toBe(true);
    expect(result.actualGateStatus).toBe("awaiting-review");
  });
});

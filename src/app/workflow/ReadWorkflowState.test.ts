import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowState } from "../../domain/workflow/WorkflowState.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import { ReadWorkflowState } from "./ReadWorkflowState.js";

const fakeParser = (text: string): WorkflowState => {
  const stageMatch = /stage:\s*(\S+)/.exec(text);
  const gateMatch = /status:\s*(\S+)/.exec(text);
  return {
    stage: (stageMatch?.[1] ?? "discovery") as WorkflowState["stage"],
    gate: { status: (gateMatch?.[1] ?? "open") as WorkflowState["gate"]["status"] },
    focus: [],
    next: [],
  };
};

class FakeFileSystem implements WorkflowFileSystem {
  constructor(private readonly files: Map<string, string>) {}
  fileExists(relPath: string): boolean {
    return this.files.has(relPath);
  }
  readTextFile(relPath: string): string {
    const f = this.files.get(relPath);
    if (f === undefined) throw new Error(`missing ${relPath}`);
    return f;
  }
  directoryExists(): boolean {
    return false;
  }
  writeTextFile(): void {
    throw new Error("not used");
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

const governanceLocation: SpecLocation = {
  slug: "0023-workflow-runtime",
  absolutePath: "/repo/.governance/specs/0023-workflow-runtime",
  source: "governance",
};

const legacyLocation: SpecLocation = {
  slug: "0015-foo",
  absolutePath: "/repo/.specify/specs/0015-foo",
  source: "specify-legacy",
};

describe("App — ReadWorkflowState [BR-WORKFLOW-READ]", () => {
  it("DADO state.yml presente em .governance/ ENTÃO retorna o estado parseado", () => {
    const yaml = `stage: implementation
gate:
  status: closed
focus: []
next: []
`;
    const fs = new FakeFileSystem(
      new Map([[".governance/specs/0023-workflow-runtime/state.yml", yaml]])
    );
    const result = new ReadWorkflowState(fs, fakeParser).run(governanceLocation);
    expect(result.defaulted).toBe(false);
    expect(result.state.stage).toBe("implementation");
    expect(result.state.gate.status).toBe("closed");
  });

  it("DADO state.yml ausente ENTÃO retorna default e marca defaulted=true", () => {
    const fs = new FakeFileSystem(new Map());
    const result = new ReadWorkflowState(fs, fakeParser).run(governanceLocation);
    expect(result.defaulted).toBe(true);
    expect(result.state.stage).toBe("discovery");
    expect(result.state.gate.status).toBe("open");
  });

  it("DADO spec legacy em .specify/ ENTÃO lê do path correto", () => {
    const yaml = `stage: decision
gate:
  status: awaiting-review
focus: []
next: []
`;
    const fs = new FakeFileSystem(new Map([[".specify/specs/0015-foo/state.yml", yaml]]));
    const result = new ReadWorkflowState(fs, fakeParser).run(legacyLocation);
    expect(result.state.stage).toBe("decision");
  });
});

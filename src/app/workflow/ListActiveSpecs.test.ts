import { ActiveSpecsRoot } from "../../domain/workflow/ActiveSpecEntry.js";
import {
  ActiveSpecsParseError,
  parseActiveSpecs,
} from "../../infrastructure/yaml/activeSpecsSerializer.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import { ListActiveSpecs } from "./ListActiveSpecs.js";

/**
 * Tests BDD pt-BR — `ListActiveSpecs` é o ponto onde schema validation
 * (delegada ao parser, coberta em `activeSpecsSerializer.test.ts`) encontra
 * drift guard de ambiente (presença de `spec_path` no disco).
 *
 * Cenários cobrem ambas as fronteiras + propagação de erro do parser.
 */
class FakeFileSystem implements WorkflowFileSystem {
  constructor(
    private readonly files: ReadonlyMap<string, string>,
    private readonly directories: ReadonlySet<string>
  ) {}
  fileExists(relPath: string): boolean {
    return this.files.has(relPath);
  }
  directoryExists(relPath: string): boolean {
    return this.directories.has(relPath);
  }
  readTextFile(relPath: string): string {
    const content = this.files.get(relPath);
    if (content === undefined) {
      throw new Error(`FakeFileSystem: missing file ${relPath}`);
    }
    return content;
  }
  writeTextFile(): void {
    throw new Error("not used in ListActiveSpecs tests");
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

const INDEX_PATH = ".governance/runtime/active-specs.yml";

const VALID_INDEX_YAML = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;

describe("App — ListActiveSpecs [BR-WORKFLOW-RUNTIME-INDEX]", () => {
  it("DADO active-specs.yml ausente QUANDO list ENTÃO retorna indexAvailable=false + warning informativo", () => {
    const fs = new FakeFileSystem(new Map(), new Set());
    const result = new ListActiveSpecs(fs, parseActiveSpecs).run();

    expect(result.indexAvailable).toBe(false);
    expect(result.entries).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/not found/);
    expect(result.warnings[0]).toMatch(/publish-state/);
  });

  it("DADO índice presente com 1 entry E spec_path existente QUANDO list ENTÃO retorna entry com specPathExists=true e zero warnings", () => {
    const fs = new FakeFileSystem(
      new Map([[INDEX_PATH, VALID_INDEX_YAML]]),
      new Set([".governance/specs/0023-workflow-runtime"])
    );
    const result = new ListActiveSpecs(fs, parseActiveSpecs).run();

    expect(result.indexAvailable).toBe(true);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].entry.slug).toBe("workflow-runtime");
    expect(result.entries[0].specPathExists).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("DADO índice presente com entry cujo spec_path NÃO existe localmente QUANDO list ENTÃO retorna entry com specPathExists=false + warning mencionando branch e renome", () => {
    const fs = new FakeFileSystem(new Map([[INDEX_PATH, VALID_INDEX_YAML]]), new Set());
    const result = new ListActiveSpecs(fs, parseActiveSpecs).run();

    expect(result.indexAvailable).toBe(true);
    expect(result.entries[0].specPathExists).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/workflow-runtime/);
    expect(result.warnings[0]).toMatch(/feat\/spec-0023-runtime-active-state/);
    expect(result.warnings[0]).toMatch(/checked out|renamed/);
  });

  it("DADO índice presente mas YAML inválido (parser rejeita) QUANDO list ENTÃO propaga ActiveSpecsParseError sem silenciar", () => {
    const invalidYaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "implementation_in_progress"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;
    const fs = new FakeFileSystem(new Map([[INDEX_PATH, invalidYaml]]), new Set());

    expect(() => new ListActiveSpecs(fs, parseActiveSpecs).run()).toThrow(ActiveSpecsParseError);
    expect(() => new ListActiveSpecs(fs, parseActiveSpecs).run()).toThrow(/status must be one of/);
  });

  it("DADO índice com active_specs vazio QUANDO list ENTÃO retorna indexAvailable=true + entries vazio + zero warnings", () => {
    const emptyYaml = `version: 1
active_specs: []
`;
    const fs = new FakeFileSystem(new Map([[INDEX_PATH, emptyYaml]]), new Set());
    const result = new ListActiveSpecs(fs, parseActiveSpecs).run();

    expect(result.indexAvailable).toBe(true);
    expect(result.entries).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("DADO índice com múltiplas entries (uma com path E outra sem) QUANDO list ENTÃO mistura cada uma com seu specPathExists e warning só pela ausente", () => {
    const multiYaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
  - id: "0099"
    slug: "ghost-spec"
    branch: "feat/spec-0099-ghost"
    stage: "discovery"
    status: "paused"
    spec_path: ".governance/specs/0099-ghost-spec"
    updated_at: "2026-05-01T00:00:00Z"
`;
    const fs = new FakeFileSystem(
      new Map([[INDEX_PATH, multiYaml]]),
      new Set([".governance/specs/0023-workflow-runtime"])
    );
    const result = new ListActiveSpecs(fs, parseActiveSpecs).run();

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].entry.slug).toBe("workflow-runtime");
    expect(result.entries[0].specPathExists).toBe(true);
    expect(result.entries[1].entry.slug).toBe("ghost-spec");
    expect(result.entries[1].specPathExists).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/ghost-spec/);
  });

  it("DADO parser injetado fake QUANDO list ENTÃO usa o parser fornecido (boundary lock — app não importa infra)", () => {
    const fakeParser = jest.fn(
      (_: string): ActiveSpecsRoot => ({
        version: 1,
        activeSpecs: [
          {
            id: "0099",
            slug: "fake",
            branch: "feat/spec-0099-fake",
            stage: "discovery",
            status: "active",
            specPath: ".governance/specs/0099-fake",
            updatedAt: "2026-05-21T00:00:00Z",
          },
        ],
      })
    );
    const fs = new FakeFileSystem(new Map([[INDEX_PATH, "anything"]]), new Set());

    const result = new ListActiveSpecs(fs, fakeParser).run();

    expect(fakeParser).toHaveBeenCalledWith("anything");
    expect(result.entries[0].entry.slug).toBe("fake");
  });
});

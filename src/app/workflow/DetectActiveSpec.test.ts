import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import { DetectActiveSpec, deriveSlugFromBranch } from "./DetectActiveSpec.js";

class FakeFileSystem implements WorkflowFileSystem {
  constructor(
    private readonly branch: string | null,
    private readonly directories: ReadonlySet<string>
  ) {}

  currentBranch(): string | null {
    return this.branch;
  }
  directoryExists(relPath: string): boolean {
    return this.directories.has(relPath);
  }
  fileExists(): boolean {
    return false;
  }
  readTextFile(): string {
    throw new Error("not used in DetectActiveSpec tests");
  }
  writeTextFile(): void {
    throw new Error("not used");
  }
  listDirectory(): ReadonlyArray<string> {
    return [];
  }
  resolveAbsolute(relPath: string): string {
    return `/repo/${relPath}`;
  }
}

describe("App — DetectActiveSpec [BR-WORKFLOW-DETECT]", () => {
  describe("deriveSlugFromBranch", () => {
    it("DADO branch feat/spec-0023-workflow-runtime ENTÃO retorna slug 0023-workflow-runtime", () => {
      expect(deriveSlugFromBranch("feat/spec-0023-workflow-runtime")).toBe("0023-workflow-runtime");
    });

    it("DADO branch fix/spec-0015-foo ENTÃO retorna slug 0015-foo", () => {
      expect(deriveSlugFromBranch("fix/spec-0015-foo")).toBe("0015-foo");
    });

    it("DADO branch fora do padrão ENTÃO retorna null", () => {
      expect(deriveSlugFromBranch("main")).toBeNull();
      expect(deriveSlugFromBranch("feature/random")).toBeNull();
    });

    it("DADO branch null ENTÃO retorna null", () => {
      expect(deriveSlugFromBranch(null)).toBeNull();
    });
  });

  describe("DetectActiveSpec.run", () => {
    it("DADO branch válido E pasta presente em .governance/specs/ ENTÃO retorna source=governance", () => {
      const fs = new FakeFileSystem(
        "feat/spec-0023-workflow-runtime",
        new Set([".governance/specs/0023-workflow-runtime"])
      );
      const result = new DetectActiveSpec(fs).run();
      expect(result.location).not.toBeNull();
      expect(result.location?.source).toBe("governance");
      expect(result.location?.slug).toBe("0023-workflow-runtime");
    });

    it("DADO branch válido E pasta apenas em .specify/specs/ ENTÃO retorna source=specify-legacy", () => {
      const fs = new FakeFileSystem(
        "feat/spec-0015-auditoria-destrutiva",
        new Set([".specify/specs/0015-auditoria-destrutiva"])
      );
      const result = new DetectActiveSpec(fs).run();
      expect(result.location?.source).toBe("specify-legacy");
    });

    it("DADO pasta presente em ambos os roots ENTÃO prefere .governance/ (preferência declarada)", () => {
      const fs = new FakeFileSystem(
        "feat/spec-0023-workflow-runtime",
        new Set([".governance/specs/0023-workflow-runtime", ".specify/specs/0023-workflow-runtime"])
      );
      const result = new DetectActiveSpec(fs).run();
      expect(result.location?.source).toBe("governance");
    });

    it("DADO branch fora do padrão ENTÃO retorna location null com reason descritivo", () => {
      const fs = new FakeFileSystem("main", new Set());
      const result = new DetectActiveSpec(fs).run();
      expect(result.location).toBeNull();
      expect(result.reason).toMatch(/branch "main" não segue o padrão/);
    });

    it("DADO branch válido mas pasta inexistente ENTÃO retorna location null com reason", () => {
      const fs = new FakeFileSystem("feat/spec-9999-foo", new Set());
      const result = new DetectActiveSpec(fs).run();
      expect(result.location).toBeNull();
      expect(result.reason).toMatch(/não foi encontrado/);
    });

    it("DADO HEAD detached (branch null) ENTÃO retorna null com reason específico", () => {
      const fs = new FakeFileSystem(null, new Set());
      const result = new DetectActiveSpec(fs).run();
      expect(result.location).toBeNull();
      expect(result.reason).toMatch(/HEAD detached|não-repo/);
    });
  });
});

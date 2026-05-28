import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import { DetectActiveSpec, parseSpecBranch } from "./DetectActiveSpec.js";

class FakeFileSystem implements WorkflowFileSystem {
  constructor(
    private readonly branch: string | null,
    private readonly directories: ReadonlySet<string>,
    private readonly contents: ReadonlyMap<string, ReadonlyArray<string>> = new Map()
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
  listDirectory(relPath: string): ReadonlyArray<string> {
    return this.contents.get(relPath) ?? [];
  }
  resolveAbsolute(relPath: string): string {
    return `/repo/${relPath}`;
  }
}

function makeFs(opts: {
  branch?: string | null;
  governanceDirs?: ReadonlyArray<string>;
  specifyDirs?: ReadonlyArray<string>;
}): FakeFileSystem {
  const directories = new Set<string>();
  const contents = new Map<string, ReadonlyArray<string>>();
  if (opts.governanceDirs !== undefined) {
    directories.add(".governance/specs");
    contents.set(".governance/specs", opts.governanceDirs);
    for (const d of opts.governanceDirs) directories.add(`.governance/specs/${d}`);
  }
  if (opts.specifyDirs !== undefined) {
    directories.add(".specify/specs");
    contents.set(".specify/specs", opts.specifyDirs);
    for (const d of opts.specifyDirs) directories.add(`.specify/specs/${d}`);
  }
  return new FakeFileSystem(opts.branch ?? null, directories, contents);
}

describe("App — DetectActiveSpec [BR-WORKFLOW-DETECT]", () => {
  describe("parseSpecBranch", () => {
    it("DADO branch feat/spec-0023-workflow-runtime ENTÃO extrai specId=0023 E branchScope=workflow-runtime", () => {
      expect(parseSpecBranch("feat/spec-0023-workflow-runtime")).toEqual({
        specId: "0023",
        branchScope: "workflow-runtime",
      });
    });

    it("DADO branch feat/spec-0023-dx-thinking (escopo de PR ≠ slug da spec) ENTÃO extrai specId=0023 E branchScope=dx-thinking", () => {
      expect(parseSpecBranch("feat/spec-0023-dx-thinking")).toEqual({
        specId: "0023",
        branchScope: "dx-thinking",
      });
    });

    it("DADO branch fix/spec-0015-foo ENTÃO extrai specId=0015 E branchScope=foo", () => {
      expect(parseSpecBranch("fix/spec-0015-foo")).toEqual({
        specId: "0015",
        branchScope: "foo",
      });
    });

    it("DADO branch fora do padrão ENTÃO retorna null", () => {
      expect(parseSpecBranch("main")).toBeNull();
      expect(parseSpecBranch("feature/random")).toBeNull();
    });

    it("DADO branch null ENTÃO retorna null", () => {
      expect(parseSpecBranch(null)).toBeNull();
    });
  });

  describe("DetectActiveSpec.run", () => {
    it("DADO branch canônico (sufixo = slug) E diretório casa por id ENTÃO retorna source=governance", () => {
      const fs = makeFs({
        branch: "feat/spec-0023-workflow-runtime",
        governanceDirs: ["0023-workflow-runtime"],
      });
      const result = new DetectActiveSpec(fs).run();
      expect(result.location).not.toBeNull();
      expect(result.location?.source).toBe("governance");
      expect(result.location?.slug).toBe("0023-workflow-runtime");
      expect(result.branchScope).toBe("workflow-runtime");
    });

    it("DADO branch escopo-de-PR (sufixo ≠ slug da spec) ENTÃO resolve via id canônico per [DEC-0023-I01]", () => {
      // Bug fix 2026-05-23: branch feat/spec-0023-dx-thinking deve resolver
      // para o diretório 0023-workflow-runtime via id NNNN, não via slug
      // literal do branch. Branch é coordenação operacional; id é identity.
      const fs = makeFs({
        branch: "feat/spec-0023-dx-thinking",
        governanceDirs: ["0023-workflow-runtime"],
      });
      const result = new DetectActiveSpec(fs).run();
      expect(result.location).not.toBeNull();
      expect(result.location?.slug).toBe("0023-workflow-runtime");
      expect(result.location?.source).toBe("governance");
      expect(result.branchScope).toBe("dx-thinking");
    });

    it("DADO branch escopo-de-PR ENTÃO branchScope exposto separado do slug resolvido (transparência)", () => {
      const fs = makeFs({
        branch: "feat/spec-0023-enforcement-runtime",
        governanceDirs: ["0023-workflow-runtime"],
      });
      const result = new DetectActiveSpec(fs).run();
      expect(result.location?.slug).toBe("0023-workflow-runtime");
      expect(result.branchScope).toBe("enforcement-runtime");
    });

    it("DADO spec apenas em .specify/specs/ ENTÃO resolve via id no fallback de root (legacy)", () => {
      const fs = makeFs({
        branch: "feat/spec-0015-auditoria-destrutiva",
        specifyDirs: ["0015-auditoria-destrutiva"],
      });
      const result = new DetectActiveSpec(fs).run();
      expect(result.location?.source).toBe("specify-legacy");
      expect(result.location?.slug).toBe("0015-auditoria-destrutiva");
    });

    it("DADO mesmo id em .governance/ E .specify/ ENTÃO prefere .governance/ (preferência declarada per [DEC-0023-A02])", () => {
      const fs = makeFs({
        branch: "feat/spec-0023-workflow-runtime",
        governanceDirs: ["0023-workflow-runtime"],
        specifyDirs: ["0023-workflow-runtime"],
      });
      const result = new DetectActiveSpec(fs).run();
      expect(result.location?.source).toBe("governance");
    });

    it("DADO branch fora do padrão ENTÃO retorna location null com reason descritivo", () => {
      const fs = makeFs({ branch: "main" });
      const result = new DetectActiveSpec(fs).run();
      expect(result.location).toBeNull();
      expect(result.reason).toMatch(/branch "main" não segue o padrão/);
    });

    it("DADO id sem correspondência em nenhum root ENTÃO erro narrativo orientativo", () => {
      const fs = makeFs({
        branch: "feat/spec-9999-foo",
        governanceDirs: ["0023-workflow-runtime"],
      });
      const result = new DetectActiveSpec(fs).run();
      expect(result.location).toBeNull();
      expect(result.reason).toMatch(/nenhum diretório com id "9999"/);
      expect(result.branchScope).toBe("foo");
    });

    it("DADO ≥2 diretórios com mesmo id em .governance/ ENTÃO erro narrativo expondo identity collision (per [DEC-0023-I01] não-objetivo)", () => {
      // Cenário inválido por construção (id deveria ser único). Se aparecer,
      // é dívida estrutural a corrigir — erro narrativo expõe o bug em vez
      // de mascarar com "escolha mais provável".
      const fs = makeFs({
        branch: "feat/spec-0023-foo",
        governanceDirs: ["0023-workflow-runtime", "0023-other-spec"],
      });
      const result = new DetectActiveSpec(fs).run();
      expect(result.location).toBeNull();
      expect(result.reason).toMatch(/múltiplos diretórios com id "0023"/);
      expect(result.reason).toMatch(/Identity collision/);
    });

    it("DADO HEAD detached (branch null) ENTÃO retorna null com reason específico", () => {
      const fs = makeFs({ branch: null });
      const result = new DetectActiveSpec(fs).run();
      expect(result.location).toBeNull();
      expect(result.reason).toMatch(/HEAD detached|não-repo/);
    });
  });
});

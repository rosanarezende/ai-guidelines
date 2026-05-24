import { GitOps } from "../ports/GitOps.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import { ReleasePrep, ReleasePrepError } from "./ReleasePrep.js";

class FakeGit implements GitOps {
  branch: string | null = "main";
  clean = true;
  localTags: string[] = [];
  remoteTags = new Map<string, string[]>();
  addCalls: string[][] = [];
  commitCalls: string[] = [];
  tagCalls: string[] = [];
  pushCalls: { remote: string; refs: string[] }[] = [];

  currentBranch(): string | null {
    return this.branch;
  }
  isWorkingTreeClean(): boolean {
    return this.clean;
  }
  add(paths: ReadonlyArray<string>): void {
    this.addCalls.push([...paths]);
  }
  commit(message: string): void {
    this.commitCalls.push(message);
  }
  tag(name: string): void {
    this.tagCalls.push(name);
  }
  push(remote: string, refs: ReadonlyArray<string>): void {
    this.pushCalls.push({ remote, refs: [...refs] });
  }
  listTags(): ReadonlyArray<string> {
    return [...this.localTags];
  }
  listRemoteTags(remote: string): ReadonlyArray<string> {
    return [...(this.remoteTags.get(remote) ?? [])];
  }
}

class FakeFs implements WorkflowFileSystem {
  files: Map<string, string>;
  constructor(files: Map<string, string> = new Map()) {
    this.files = files;
  }
  fileExists(p: string): boolean {
    return this.files.has(p);
  }
  directoryExists(): boolean {
    return false;
  }
  readTextFile(p: string): string {
    const c = this.files.get(p);
    if (c === undefined) throw new Error(`missing ${p}`);
    return c;
  }
  writeTextFile(p: string, contents: string): void {
    this.files.set(p, contents);
  }
  listDirectory(): ReadonlyArray<string> {
    return [];
  }
  currentBranch(): string | null {
    return null;
  }
  resolveAbsolute(p: string): string {
    return `/repo/${p}`;
  }
}

const SAMPLE_PKG = `{
  "name": "ai-guidelines",
  "version": "1.0.1",
  "description": "Test"
}
`;

const SAMPLE_CHANGELOG = `# Changelog

## [Unreleased] — \`1.1.0-preview.0\` (workflow runtime preview)

### Added

- Feature X
- Feature Y

## [1.0.1] — 2026-05-08

### Fixed

- Bug Z
`;

function makeFs(opts: { pkg?: string; changelog?: string } = {}): FakeFs {
  const files = new Map<string, string>();
  if (opts.pkg !== undefined) files.set("package.json", opts.pkg);
  else files.set("package.json", SAMPLE_PKG);
  if (opts.changelog !== undefined) files.set("CHANGELOG.md", opts.changelog);
  else files.set("CHANGELOG.md", SAMPLE_CHANGELOG);
  return new FakeFs(files);
}

describe("App — ReleasePrep [BR-WORKFLOW-RELEASE-PREP]", () => {
  describe("plan", () => {
    it("DADO package.json 1.0.1 + CHANGELOG [Unreleased] 1.1.0-preview.0 + working tree clean ENTÃO devolve plan com 8 steps + dist-tag 'next' (pre-release)", () => {
      const fs = makeFs();
      const git = new FakeGit();
      const plan = new ReleasePrep(fs, git).plan({ today: "2026-05-24" });

      expect(plan.currentVersion).toBe("1.0.1");
      expect(plan.targetVersion).toBe("1.1.0-preview.0");
      expect(plan.isPrerelease).toBe(true);
      expect(plan.distTag).toBe("next");
      expect(plan.tag).toBe("v1.1.0-preview.0");
      expect(plan.remote).toBe("origin");
      expect(plan.branch).toBe("main");
      expect(plan.date).toBe("2026-05-24");
      expect(plan.steps).toHaveLength(8);
      expect(plan.steps[0].description).toMatch(/Edit package\.json.*1\.0\.1.*1\.1\.0-preview\.0/);
      expect(plan.steps[7].description).toMatch(/release\.yml dispara.*publish.*'next'/);
    });

    it("DADO target version stable (sem '-') ENTÃO dist-tag 'latest' + isPrerelease=false", () => {
      const fs = makeFs({
        pkg: SAMPLE_PKG,
        changelog: SAMPLE_CHANGELOG.replace("1.1.0-preview.0", "1.1.0"),
      });
      const plan = new ReleasePrep(fs, new FakeGit()).plan({ today: "2026-05-24" });
      expect(plan.targetVersion).toBe("1.1.0");
      expect(plan.isPrerelease).toBe(false);
      expect(plan.distTag).toBe("latest");
    });

    it("DADO versionOverride fornecido ENTÃO usa override em vez de CHANGELOG", () => {
      const fs = makeFs();
      const plan = new ReleasePrep(fs, new FakeGit()).plan({
        versionOverride: "2.0.0",
        today: "2026-05-24",
      });
      expect(plan.targetVersion).toBe("2.0.0");
      expect(plan.tag).toBe("v2.0.0");
    });

    it("DADO working tree não-clean ENTÃO ReleasePrepError orientando commit/stash", () => {
      const fs = makeFs();
      const git = new FakeGit();
      git.clean = false;
      expect(() => new ReleasePrep(fs, git).plan()).toThrow(ReleasePrepError);
      expect(() => new ReleasePrep(fs, git).plan()).toThrow(/Working tree não está clean/);
    });

    it("DADO skipWorkingTreeCheck=true ENTÃO permite working tree sujo (emergência)", () => {
      const fs = makeFs();
      const git = new FakeGit();
      git.clean = false;
      const plan = new ReleasePrep(fs, git).plan({
        skipWorkingTreeCheck: true,
        today: "2026-05-24",
      });
      expect(plan.targetVersion).toBe("1.1.0-preview.0");
    });

    it("DADO HEAD detached (branch null) ENTÃO ReleasePrepError", () => {
      const fs = makeFs();
      const git = new FakeGit();
      git.branch = null;
      expect(() => new ReleasePrep(fs, git).plan()).toThrow(/Sem branch git ativa/);
    });

    it("DADO package.json sem campo version ENTÃO ReleasePrepError", () => {
      const fs = makeFs({ pkg: `{"name":"test"}`, changelog: SAMPLE_CHANGELOG });
      expect(() => new ReleasePrep(fs, new FakeGit()).plan()).toThrow(/não tem campo "version"/);
    });

    it("DADO CHANGELOG sem header [Unreleased] ENTÃO ReleasePrepError orientando --version", () => {
      const fs = makeFs({ pkg: SAMPLE_PKG, changelog: `# Changelog\n\n## [1.0.0] — 2026-01-01\n` });
      expect(() => new ReleasePrep(fs, new FakeGit()).plan()).toThrow(
        /CHANGELOG\.md não tem header.*--version/
      );
    });

    it("DADO target version igual à current ENTÃO ReleasePrepError", () => {
      const fs = makeFs({
        pkg: SAMPLE_PKG,
        changelog: SAMPLE_CHANGELOG.replace("1.1.0-preview.0", "1.0.1"),
      });
      expect(() => new ReleasePrep(fs, new FakeGit()).plan()).toThrow(
        /Versão alvo \(1\.0\.1\) é igual à atual/
      );
    });

    it("DADO tag local já existente ENTÃO ReleasePrepError", () => {
      const fs = makeFs();
      const git = new FakeGit();
      git.localTags = ["v1.1.0-preview.0"];
      expect(() => new ReleasePrep(fs, git).plan()).toThrow(
        /Tag local v1\.1\.0-preview\.0 já existe/
      );
    });

    it("DADO tag remota já existente ENTÃO ReleasePrepError", () => {
      const fs = makeFs();
      const git = new FakeGit();
      git.remoteTags.set("origin", ["v1.1.0-preview.0"]);
      expect(() => new ReleasePrep(fs, git).plan()).toThrow(
        /Tag remota v1\.1\.0-preview\.0 já existe em origin/
      );
    });
  });

  describe("execute", () => {
    it("DADO plan válido ENTÃO bumpa package.json + promove CHANGELOG + add/commit/tag/push (branch depois tag)", () => {
      const fs = makeFs();
      const git = new FakeGit();
      const useCase = new ReleasePrep(fs, git);
      const plan = useCase.plan({ today: "2026-05-24" });

      useCase.execute(plan);

      // package.json bumped
      const pkg = JSON.parse(fs.files.get("package.json")!);
      expect(pkg.version).toBe("1.1.0-preview.0");

      // CHANGELOG promovido
      const cl = fs.files.get("CHANGELOG.md")!;
      expect(cl).toContain("## [1.1.0-preview.0] — 2026-05-24");
      expect(cl).not.toContain("## [Unreleased]");

      // git add ambos arquivos
      expect(git.addCalls).toEqual([["package.json", "CHANGELOG.md"]]);

      // commit
      expect(git.commitCalls).toEqual(["chore(release): 1.1.0-preview.0"]);

      // tag
      expect(git.tagCalls).toEqual(["v1.1.0-preview.0"]);

      // push: branch primeiro, depois tag
      expect(git.pushCalls).toEqual([
        { remote: "origin", refs: ["main"] },
        { remote: "origin", refs: ["v1.1.0-preview.0"] },
      ]);
    });

    it("DADO package.json sem regex de version válido ENTÃO ReleasePrepError narrativo", () => {
      const fs = makeFs({ pkg: `{"name":"test","version":"1.0.1"}`, changelog: SAMPLE_CHANGELOG });
      const useCase = new ReleasePrep(fs, new FakeGit());
      const plan = useCase.plan({ today: "2026-05-24" });
      // Forge a plan with bogus current version that won't match in execute
      const corruptedFs = makeFs({ pkg: `{name:invalid}`, changelog: SAMPLE_CHANGELOG });
      const useCase2 = new ReleasePrep(corruptedFs, new FakeGit());
      expect(() => useCase2.execute(plan)).toThrow(/Não foi possível bumpar/);
    });
  });
});

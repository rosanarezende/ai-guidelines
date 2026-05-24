import { GitOps } from "../app/ports/GitOps.js";
import { ConfirmOptions, InputOptions, Prompts, SelectOptions } from "../app/ports/Prompts.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { Logger } from "./workflow.js";
import { runReleasePrep } from "./release-prep.js";

class CollectingLogger implements Logger {
  readonly lines: string[] = [];
  info(msg: string): void {
    this.lines.push(msg);
  }
  error(msg: string): void {
    this.lines.push(`ERR: ${msg}`);
  }
}

class FakePrompts implements Prompts {
  private idx = 0;
  constructor(private readonly answers: ReadonlyArray<string | boolean>) {}
  async select<T = string>(_o: SelectOptions<T>): Promise<T> {
    throw new Error("select not used in release-prep");
  }
  async input(_o: InputOptions): Promise<string> {
    throw new Error("input not used in release-prep");
  }
  async confirm(_o: ConfirmOptions): Promise<boolean> {
    const a = this.answers[this.idx++];
    if (typeof a !== "boolean") {
      throw new Error(`FakePrompts: confirm esperava boolean, recebeu ${typeof a}`);
    }
    return a;
  }
}

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
  commit(m: string): void {
    this.commitCalls.push(m);
  }
  tag(n: string): void {
    this.tagCalls.push(n);
  }
  push(remote: string, refs: ReadonlyArray<string>): void {
    this.pushCalls.push({ remote, refs: [...refs] });
  }
  listTags(): ReadonlyArray<string> {
    return [...this.localTags];
  }
  listRemoteTags(r: string): ReadonlyArray<string> {
    return [...(this.remoteTags.get(r) ?? [])];
  }
}

class FakeFs implements WorkflowFileSystem {
  files: Map<string, string>;
  constructor(files: Map<string, string>) {
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
  writeTextFile(p: string, c: string): void {
    this.files.set(p, c);
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

const PKG = `{"name":"ai-guidelines","version":"1.0.1"}`;
const CHANGELOG = `# Changelog

## [Unreleased] — \`1.1.0-preview.0\` (workflow runtime preview)

### Added
- Feature X
`;

function makeFs(): FakeFs {
  return new FakeFs(
    new Map([
      ["package.json", PKG],
      ["CHANGELOG.md", CHANGELOG],
    ])
  );
}

describe("CLI — release-prep [BR-CLI-RELEASE-PREP]", () => {
  it("DADO plan válido + confirmação ENTÃO mostra plan, executa bump/commit/tag/push, retorna 0", async () => {
    const logger = new CollectingLogger();
    const prompts = new FakePrompts([true]);
    const git = new FakeGit();
    const fs = makeFs();
    const code = await runReleasePrep(
      { repoRoot: "/repo", logger, prompts, fs, git, today: "2026-05-24" },
      {}
    );

    expect(code).toBe(0);
    // Plan mostrado
    expect(logger.lines.join("\n")).toMatch(/Release prep plan/);
    expect(logger.lines.join("\n")).toMatch(/Versão alvo:\s+1\.1\.0-preview\.0/);
    expect(logger.lines.join("\n")).toMatch(/dist-tag npm:\s+next/);
    // Execução
    expect(git.commitCalls).toEqual(["chore(release): 1.1.0-preview.0"]);
    expect(git.tagCalls).toEqual(["v1.1.0-preview.0"]);
    expect(git.pushCalls).toEqual([
      { remote: "origin", refs: ["main"] },
      { remote: "origin", refs: ["v1.1.0-preview.0"] },
    ]);
    expect(logger.lines.join("\n")).toMatch(/Release 1\.1\.0-preview\.0 preparada/);
  });

  it("DADO --dry-run ENTÃO mostra plan e retorna 0 SEM nenhum side-effect", async () => {
    const logger = new CollectingLogger();
    const prompts = new FakePrompts([]); // nada será consumido — sem confirm
    const git = new FakeGit();
    const fs = makeFs();
    const code = await runReleasePrep(
      { repoRoot: "/repo", logger, prompts, fs, git, today: "2026-05-24" },
      { dryRun: true }
    );

    expect(code).toBe(0);
    expect(logger.lines.join("\n")).toMatch(/--dry-run.*nenhum side-effect/);
    expect(git.commitCalls).toEqual([]);
    expect(git.tagCalls).toEqual([]);
    expect(git.pushCalls).toEqual([]);
  });

  it("DADO confirmação negativa ENTÃO retorna 0 e loga cancelamento SEM side-effect", async () => {
    const logger = new CollectingLogger();
    const prompts = new FakePrompts([false]);
    const git = new FakeGit();
    const fs = makeFs();
    const code = await runReleasePrep(
      { repoRoot: "/repo", logger, prompts, fs, git, today: "2026-05-24" },
      {}
    );

    expect(code).toBe(0);
    expect(logger.lines.join("\n")).toMatch(/Release cancelada/);
    expect(git.commitCalls).toEqual([]);
    expect(git.pushCalls).toEqual([]);
  });

  it("DADO working tree não-clean ENTÃO logger.error + retorna 1 sem prompt", async () => {
    const logger = new CollectingLogger();
    const prompts = new FakePrompts([]);
    const git = new FakeGit();
    git.clean = false;
    const fs = makeFs();
    const code = await runReleasePrep(
      { repoRoot: "/repo", logger, prompts, fs, git, today: "2026-05-24" },
      {}
    );

    expect(code).toBe(1);
    expect(logger.lines.join("\n")).toMatch(/ERR:.*Working tree não está clean/);
    expect(git.commitCalls).toEqual([]);
  });

  it("DADO --version override + confirmação ENTÃO usa override (não CHANGELOG)", async () => {
    const logger = new CollectingLogger();
    const prompts = new FakePrompts([true]);
    const git = new FakeGit();
    const fs = makeFs();
    const code = await runReleasePrep(
      { repoRoot: "/repo", logger, prompts, fs, git, today: "2026-05-24" },
      { version: "2.0.0" }
    );

    expect(code).toBe(0);
    expect(git.tagCalls).toEqual(["v2.0.0"]);
    expect(git.commitCalls).toEqual(["chore(release): 2.0.0"]);
    expect(logger.lines.join("\n")).toMatch(/dist-tag npm:\s+latest/); // sem '-' → stable
  });

  it("DADO --remote upstream + confirmação ENTÃO pusha para upstream em vez de origin", async () => {
    const logger = new CollectingLogger();
    const prompts = new FakePrompts([true]);
    const git = new FakeGit();
    const fs = makeFs();
    const code = await runReleasePrep(
      { repoRoot: "/repo", logger, prompts, fs, git, today: "2026-05-24" },
      { remote: "upstream" }
    );

    expect(code).toBe(0);
    expect(git.pushCalls).toEqual([
      { remote: "upstream", refs: ["main"] },
      { remote: "upstream", refs: ["v1.1.0-preview.0"] },
    ]);
  });

  it("DADO --skip-working-tree-check + working tree sujo ENTÃO permite execução", async () => {
    const logger = new CollectingLogger();
    const prompts = new FakePrompts([true]);
    const git = new FakeGit();
    git.clean = false;
    const fs = makeFs();
    const code = await runReleasePrep(
      { repoRoot: "/repo", logger, prompts, fs, git, today: "2026-05-24" },
      { skipWorkingTreeCheck: true }
    );

    expect(code).toBe(0);
    expect(git.commitCalls).toHaveLength(1);
  });
});

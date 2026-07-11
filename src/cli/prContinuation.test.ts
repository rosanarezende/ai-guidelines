import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import YAML from "yaml";

import {
  PrContinuationGateway,
  mainCheck,
  mainCreatePr,
  mainPrepare,
  resolveContinuationDirectory,
  runContinuationCheck,
  runContinuationCreatePr,
  runContinuationPrepare,
} from "./prContinuation.js";

class FakeContinuationGateway implements PrContinuationGateway {
  readonly calls: {
    readonly title: string;
    readonly bodyFile: string;
    readonly base: string;
    readonly head: string;
    readonly repo?: string;
  }[] = [];

  createDraftPullRequest(input: {
    readonly repo?: string;
    readonly title: string;
    readonly bodyFile: string;
    readonly base: string;
    readonly head: string;
  }): void {
    this.calls.push(input);
  }
}

const silentLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

function withRepo<T>(fn: (repoRoot: string) => T): T {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "pr-continuation-"));
  try {
    mkdirSync(path.join(repoRoot, ".governance", "specs", "0024-context-architecture"), {
      recursive: true,
    });
    mkdirSync(path.join(repoRoot, ".git"), { recursive: true });
    return fn(repoRoot);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

function writeProtocol(repoRoot: string): void {
  const file = path.join(
    repoRoot,
    ".governance",
    "specs",
    "0024-context-architecture",
    "research",
    "2026-07-07-pr-continuation-protocol.md"
  );
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, "# Protocolo\n", "utf8");
}

function writePrBody(repoRoot: string): void {
  const file = path.join(
    repoRoot,
    ".governance",
    "specs",
    "0024-context-architecture",
    "pull-requests",
    "pr-45",
    "body.md"
  );
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, "# PR 45\n", "utf8");
}

function seedPrContainer(repoRoot: string): void {
  writeProtocol(repoRoot);
  writePrBody(repoRoot);
}

describe("CLI — continuation:* [BR-PR-CONTINUATION]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("check valida a casa versionada do PR e o protocolo interino", () =>
    withRepo((repoRoot) => {
      seedPrContainer(repoRoot);

      const exit = runContinuationCheck({
        repoRoot,
        specId: "0024",
        prNumber: 45,
        logger: silentLogger,
      });

      expect(exit).toBe(0);
      expect(silentLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("PR #45 tem casa versionada")
      );
    }));

  it("check falha fechado quando falta body versionado", () =>
    withRepo((repoRoot) => {
      writeProtocol(repoRoot);

      const exit = runContinuationCheck({
        repoRoot,
        specId: "0024",
        prNumber: 45,
        logger: silentLogger,
      });

      expect(exit).toBe(1);
      expect(silentLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("body versionado nao existe")
      );
    }));

  it("prepare cria pacote versionado sem criar PR remoto", () =>
    withRepo((repoRoot) => {
      seedPrContainer(repoRoot);

      const exit = runContinuationPrepare({
        repoRoot,
        specId: "0024",
        prNumber: 45,
        slug: "internal-architecture-refactor-ddd-bdd",
        title: "Internal architecture refactor",
        target: "internal-architecture-refactor-ddd-bdd",
        date: "2026-07-11",
        base: "feat/spec-0024-artifact-taxonomy-and-model-review-contract",
        head: "feat/spec-0024-internal-architecture-refactor-ddd-bdd",
        logger: silentLogger,
      });

      const packageDir = path.join(
        resolveContinuationDirectory({ repoRoot, specId: "0024", prNumber: 45 }),
        "2026-07-11-internal-architecture-refactor-ddd-bdd"
      );
      const manifest = YAML.parse(readFileSync(path.join(packageDir, "manifest.yml"), "utf8"));

      expect(exit).toBe(0);
      expect(existsSync(path.join(packageDir, "body.md"))).toBe(true);
      expect(existsSync(path.join(packageDir, "briefing.md"))).toBe(true);
      expect(existsSync(path.join(packageDir, "commands.md"))).toBe(true);
      expect(manifest.guardrails).toMatchObject({
        creates_pr_without_confirm: false,
        marks_ready: false,
        records_human_gate: false,
        merges: false,
        advances_topology: false,
      });
      expect(readFileSync(path.join(packageDir, "body.md"), "utf8")).toContain(
        "Continuacao governada de #45"
      );
    }));

  it("prepare normaliza titulo com carets de escape do npm no Windows", () =>
    withRepo((repoRoot) => {
      seedPrContainer(repoRoot);

      const exit = mainPrepare(
        [
          "--spec=0024",
          "--pr=45",
          "--slug=next-pr",
          "^--title=^Next^ PR^",
          "--date=2026-07-11",
          "--base=base-branch",
          "--head=head-branch",
        ],
        { repoRoot, logger: silentLogger }
      );
      const packageDir = path.join(
        resolveContinuationDirectory({ repoRoot, specId: "0024", prNumber: 45 }),
        "2026-07-11-next-pr"
      );
      const manifest = YAML.parse(readFileSync(path.join(packageDir, "manifest.yml"), "utf8"));

      expect(exit).toBe(0);
      expect(manifest.continuation.title).toBe("Next PR");
      expect(readFileSync(path.join(packageDir, "commands.md"), "utf8")).toContain(
        "npm run continuation:create-pr -- --package .governance/specs/0024-context-architecture/pull-requests/pr-45/continuations/2026-07-11-next-pr"
      );
    }));

  it("prepare exige overwrite para regravar pacote existente", () =>
    withRepo((repoRoot) => {
      seedPrContainer(repoRoot);
      const options = {
        repoRoot,
        specId: "0024",
        prNumber: 45,
        slug: "next-pr",
        title: "Next PR",
        date: "2026-07-11",
        base: "base",
        head: "head",
        logger: silentLogger,
      };

      expect(runContinuationPrepare(options)).toBe(0);
      expect(runContinuationPrepare(options)).toBe(1);
      expect(silentLogger.error).toHaveBeenCalledWith(expect.stringContaining("pacote ja existe"));
      expect(runContinuationPrepare({ ...options, overwrite: true })).toBe(0);
    }));

  it("create-pr sem confirmacao so imprime o comando", () =>
    withRepo((repoRoot) => {
      seedPrContainer(repoRoot);
      runContinuationPrepare({
        repoRoot,
        specId: "0024",
        prNumber: 45,
        slug: "next-pr",
        title: "Next PR",
        date: "2026-07-11",
        base: "base-branch",
        head: "head-branch",
        logger: silentLogger,
      });
      const packageDir = path.join(
        resolveContinuationDirectory({ repoRoot, specId: "0024", prNumber: 45 }),
        "2026-07-11-next-pr"
      );
      const gateway = new FakeContinuationGateway();

      const exit = runContinuationCreatePr({
        repoRoot,
        packageDir,
        gateway,
        logger: silentLogger,
      });

      expect(exit).toBe(0);
      expect(gateway.calls).toEqual([]);
      expect(silentLogger.info).toHaveBeenCalledWith(expect.stringContaining("dry-run"));
    }));

  it("create-pr com confirmacao cria somente Draft PR", () =>
    withRepo((repoRoot) => {
      seedPrContainer(repoRoot);
      runContinuationPrepare({
        repoRoot,
        specId: "0024",
        prNumber: 45,
        slug: "next-pr",
        title: "Next PR",
        date: "2026-07-11",
        base: "base-branch",
        head: "head-branch",
        logger: silentLogger,
      });
      const packageDir = path.join(
        resolveContinuationDirectory({ repoRoot, specId: "0024", prNumber: 45 }),
        "2026-07-11-next-pr"
      );
      const gateway = new FakeContinuationGateway();

      const exit = runContinuationCreatePr({
        repoRoot,
        packageDir,
        gateway,
        logger: silentLogger,
        repo: "owner/repo",
        confirm: true,
      });

      expect(exit).toBe(0);
      expect(gateway.calls).toEqual([
        {
          repo: "owner/repo",
          title: "Next PR",
          bodyFile: path.join(packageDir, "body.md"),
          base: "base-branch",
          head: "head-branch",
        },
      ]);
      expect(silentLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Ready/Human Gate/merge/topologia continuam proibidos")
      );
    }));

  it("expoe comandos CLI para check, prepare e create-pr", () =>
    withRepo((repoRoot) => {
      seedPrContainer(repoRoot);
      const gateway = new FakeContinuationGateway();

      expect(mainCheck(["--spec", "0024", "--pr", "45"], { repoRoot, logger: silentLogger })).toBe(
        0
      );
      expect(
        mainPrepare(
          [
            "--spec",
            "0024",
            "--pr",
            "45",
            "--slug",
            "next-pr",
            "--title",
            "Next PR",
            "--date",
            "2026-07-11",
            "--base",
            "base-branch",
            "--head",
            "head-branch",
          ],
          { repoRoot, logger: silentLogger }
        )
      ).toBe(0);
      const packageDir = path.join(
        resolveContinuationDirectory({ repoRoot, specId: "0024", prNumber: 45 }),
        "2026-07-11-next-pr"
      );
      expect(
        mainCreatePr(["--package", packageDir, "--confirm"], {
          repoRoot,
          logger: silentLogger,
          gateway,
        })
      ).toBe(0);
      expect(gateway.calls).toHaveLength(1);
    }));
});

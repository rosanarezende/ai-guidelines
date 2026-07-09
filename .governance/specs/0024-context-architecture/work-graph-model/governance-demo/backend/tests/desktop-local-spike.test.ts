import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ensureDesktopGovernanceHost,
  inspectDesktopLocalWorkspace,
  persistDesktopLocalSnapshot,
} from "../src/application/desktop-local/desktop-local-spike.ts";

const gitAvailable = hasGit();

test(
  "DESKTOP-01: desktop local spike discovers local git repos and their revisions",
  {
    skip: !gitAvailable,
  },
  () => {
    const workspace = createTempWorkspace();
    try {
      initRepo(join(workspace, "mundo-da-mel-api"));
      initRepo(join(workspace, "mundo-da-mel-site"));

      const snapshot = inspectDesktopLocalWorkspace({ workspaceRoot: workspace });

      assert.equal(snapshot.workspaceRoot, workspace);
      assert.equal(snapshot.governanceHost.exists, false);
      assert.deepEqual(
        snapshot.repos.map((repo) => repo.relativePath),
        ["mundo-da-mel-api", "mundo-da-mel-site"]
      );
      assert.equal(
        snapshot.repos.every((repo) => repo.head && repo.head.length === 40),
        true
      );
      assert.equal(
        snapshot.repos.every((repo) => repo.dirty === false),
        true
      );
      assert.match(snapshot.sourceRevision, /^[a-f0-9]{12}$/);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  }
);

test(
  "DESKTOP-02: desktop local spike exposes dirty repo state instead of hiding drift",
  {
    skip: !gitAvailable,
  },
  () => {
    const workspace = createTempWorkspace();
    try {
      const repo = join(workspace, "guilda-governance");
      initRepo(repo);
      writeFileSync(join(repo, "README.md"), "# changed\n", "utf8");

      const snapshot = inspectDesktopLocalWorkspace({ workspaceRoot: workspace });
      const repoSnapshot = snapshot.repos.find((item) => item.relativePath === "guilda-governance");

      assert.ok(repoSnapshot);
      assert.equal(repoSnapshot.dirty, true);
      assert.deepEqual(repoSnapshot.porcelain, [" M README.md"]);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  }
);

test(
  "DESKTOP-03: desktop local spike creates a file-first governance host and local sqlite index",
  {
    skip: !gitAvailable,
  },
  () => {
    const workspace = createTempWorkspace();
    try {
      initRepo(join(workspace, "ai-guidelines"));
      const host = ensureDesktopGovernanceHost(workspace);
      const snapshot = inspectDesktopLocalWorkspace({ workspaceRoot: workspace });
      const persisted = persistDesktopLocalSnapshot({
        databasePath: join(workspace, ".guilda-desktop.sqlite"),
        snapshot,
        recordedAt: "2026-07-08T00:00:00.000Z",
      });

      assert.equal(host.exists, true);
      assert.equal(existsSync(join(workspace, ".governance-host", "host.yml")), true);
      assert.equal(existsSync(join(workspace, ".governance-host", "events", "events.jsonl")), true);
      assert.equal(snapshot.governanceHost.exists, true);
      assert.equal(persisted.workspaceRoot, workspace);
      assert.equal(persisted.sourceRevision, snapshot.sourceRevision);
      assert.equal(persisted.recordedAt, "2026-07-08T00:00:00.000Z");
      assert.equal(persisted.snapshot.governanceHost.exists, true);
      assert.equal(persisted.snapshot.repos[0]?.relativePath, "ai-guidelines");
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  }
);

function hasGit(): boolean {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function createTempWorkspace(): string {
  return mkdtempSync(join(tmpdir(), "guilda-desktop-local-"));
}

function initRepo(path: string): void {
  execFileSync("git", ["init", path], { stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "spike@example.test"], {
    cwd: path,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.name", "Guilda Desktop Spike"], {
    cwd: path,
    stdio: "ignore",
  });
  writeFileSync(join(path, "README.md"), "# repo\n", "utf8");
  execFileSync("git", ["add", "README.md"], { cwd: path, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "init"], { cwd: path, stdio: "ignore" });
}

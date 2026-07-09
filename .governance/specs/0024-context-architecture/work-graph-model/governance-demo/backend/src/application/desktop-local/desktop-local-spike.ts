import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import Database from "better-sqlite3";

const DEFAULT_HOST_DIR = ".governance-host";
const SKIP_DIRS = new Set([".git", ".next", ".local-state", "coverage", "dist", "node_modules"]);

export type DesktopLocalRepoSnapshot = {
  path: string;
  relativePath: string;
  head: string | null;
  dirty: boolean;
  porcelain: string[];
};

export type DesktopGovernanceHostSnapshot = {
  path: string;
  manifestPath: string;
  exists: boolean;
  sourceRevision: string | null;
};

export type DesktopLocalWorkspaceSnapshot = {
  workspaceRoot: string;
  governanceHost: DesktopGovernanceHostSnapshot;
  repos: DesktopLocalRepoSnapshot[];
  sourceRevision: string;
};

export type DesktopLocalInspectOptions = {
  workspaceRoot: string;
  governanceHostDir?: string;
  maxDepth?: number;
};

export type DesktopLocalPersistOptions = {
  databasePath: string;
  snapshot: DesktopLocalWorkspaceSnapshot;
  recordedAt: string;
};

export type PersistedDesktopLocalSnapshot = {
  id: string;
  workspaceRoot: string;
  sourceRevision: string;
  recordedAt: string;
  snapshot: DesktopLocalWorkspaceSnapshot;
};

export function inspectDesktopLocalWorkspace(
  options: DesktopLocalInspectOptions
): DesktopLocalWorkspaceSnapshot {
  const workspaceRoot = resolve(options.workspaceRoot);
  const governanceHost = readDesktopGovernanceHost(workspaceRoot, options.governanceHostDir);
  const repos = discoverDesktopGitRepos(workspaceRoot, options.maxDepth ?? 4).map((repoPath) =>
    readRepoSnapshot(workspaceRoot, repoPath)
  );
  const sourceRevision = stableRevision({ workspaceRoot, governanceHost, repos });

  return { workspaceRoot, governanceHost, repos, sourceRevision };
}

export function ensureDesktopGovernanceHost(
  workspaceRootInput: string,
  governanceHostDir = DEFAULT_HOST_DIR
): DesktopGovernanceHostSnapshot {
  const workspaceRoot = resolve(workspaceRootInput);
  const hostPath = join(workspaceRoot, governanceHostDir);
  const eventsPath = join(hostPath, "events");
  const manifestPath = join(hostPath, "host.yml");

  mkdirSync(eventsPath, { recursive: true });
  if (!existsSync(manifestPath)) {
    writeFileSync(
      manifestPath,
      [
        "schema: guilda.governance-host/v1",
        "mode: desktop-local-first",
        "authority: git-backed-user-controlled",
        "sourceRevision: bootstrap-local",
        "",
      ].join("\n"),
      "utf8"
    );
  }
  const eventLogPath = join(eventsPath, "events.jsonl");
  if (!existsSync(eventLogPath)) writeFileSync(eventLogPath, "", "utf8");

  return readDesktopGovernanceHost(workspaceRoot, governanceHostDir);
}

export function persistDesktopLocalSnapshot(
  options: DesktopLocalPersistOptions
): PersistedDesktopLocalSnapshot {
  const id = createHash("sha256")
    .update(`${options.snapshot.workspaceRoot}:${options.snapshot.sourceRevision}`)
    .digest("hex")
    .slice(0, 16);
  const sqlite = new Database(options.databasePath);
  try {
    sqlite.exec(`
      create table if not exists desktop_workspace_snapshots (
        id text primary key,
        workspace_root text not null,
        source_revision text not null,
        recorded_at text not null,
        snapshot_json text not null
      );
    `);
    sqlite
      .prepare(
        `
        insert into desktop_workspace_snapshots
          (id, workspace_root, source_revision, recorded_at, snapshot_json)
        values (?, ?, ?, ?, ?)
        on conflict(id) do update set
          source_revision = excluded.source_revision,
          recorded_at = excluded.recorded_at,
          snapshot_json = excluded.snapshot_json
      `
      )
      .run(
        id,
        options.snapshot.workspaceRoot,
        options.snapshot.sourceRevision,
        options.recordedAt,
        JSON.stringify(options.snapshot)
      );
  } finally {
    sqlite.close();
  }

  return readPersistedDesktopLocalSnapshot(options.databasePath, id);
}

export function readPersistedDesktopLocalSnapshot(
  databasePath: string,
  id: string
): PersistedDesktopLocalSnapshot {
  const sqlite = new Database(databasePath, { readonly: true });
  try {
    const row = sqlite
      .prepare(
        `
        select id, workspace_root, source_revision, recorded_at, snapshot_json
        from desktop_workspace_snapshots
        where id = ?
      `
      )
      .get(id) as
      | {
          id: string;
          workspace_root: string;
          source_revision: string;
          recorded_at: string;
          snapshot_json: string;
        }
      | undefined;

    if (!row) throw new Error(`desktop-local snapshot not found: ${id}`);
    return {
      id: row.id,
      workspaceRoot: row.workspace_root,
      sourceRevision: row.source_revision,
      recordedAt: row.recorded_at,
      snapshot: JSON.parse(row.snapshot_json) as DesktopLocalWorkspaceSnapshot,
    };
  } finally {
    sqlite.close();
  }
}

function readDesktopGovernanceHost(
  workspaceRoot: string,
  governanceHostDir = DEFAULT_HOST_DIR
): DesktopGovernanceHostSnapshot {
  const hostPath = join(workspaceRoot, governanceHostDir);
  const manifestPath = join(hostPath, "host.yml");
  const exists = existsSync(manifestPath);
  const sourceRevision = exists
    ? stableRevision({ manifest: readFileSync(manifestPath, "utf8") })
    : null;

  return { path: hostPath, manifestPath, exists, sourceRevision };
}

function discoverDesktopGitRepos(root: string, maxDepth: number): string[] {
  const repos: string[] = [];
  walk(root, 0);
  return repos.sort();

  function walk(dir: string, depth: number): void {
    if (depth > maxDepth) return;
    if (existsSync(join(dir, ".git"))) {
      repos.push(dir);
      return;
    }

    for (const entry of readdirSync(dir)) {
      if (SKIP_DIRS.has(entry)) continue;
      const child = join(dir, entry);
      if (statSync(child).isDirectory()) walk(child, depth + 1);
    }
  }
}

function readRepoSnapshot(workspaceRoot: string, repoPath: string): DesktopLocalRepoSnapshot {
  const porcelain = git(["status", "--porcelain"], repoPath)
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);
  const head = git(["rev-parse", "HEAD"], repoPath).trim() || null;

  return {
    path: repoPath,
    relativePath: relative(workspaceRoot, repoPath) || basename(repoPath),
    head,
    dirty: porcelain.length > 0,
    porcelain,
  };
}

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function stableRevision(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

import { execFileSync } from "node:child_process";

export type SubCheckpointDeliveryEvidence =
  | {
      readonly status: "present";
      readonly activeId: string;
      readonly activationCommit: string;
      readonly commitsAfterActivation: number;
    }
  | {
      readonly status: "missing";
      readonly activeId: string;
      readonly activationCommit: string | null;
      readonly reason: string;
    }
  | {
      readonly status: "unknown";
      readonly activeId: string;
      readonly reason: string;
    };

function markerFor(id: string, state: "[/]" | "[ ]" | "[x]"): string {
  return `${state} **${id}`;
}

function git(repoRoot: string, args: readonly string[]): string {
  return execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function showFile(repoRoot: string, ref: string, file: string): string | null {
  try {
    return git(repoRoot, ["show", `${ref}:${file}`]);
  } catch {
    return null;
  }
}

function firstParent(repoRoot: string, commit: string): string | null {
  try {
    const parents = git(repoRoot, ["show", "-s", "--format=%P", commit])
      .split(/\s+/)
      .filter(Boolean);
    return parents[0] ?? null;
  } catch {
    return null;
  }
}

export function findSubCheckpointActivationCommit(
  repoRoot: string,
  tasksPath: string,
  activeId: string,
  head = "HEAD"
): string | null {
  let commits: string[];
  try {
    commits = git(repoRoot, ["log", "--format=%H", head, "--", tasksPath])
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return null;
  }

  for (const commit of commits) {
    const current = showFile(repoRoot, commit, tasksPath);
    if (!current?.includes(markerFor(activeId, "[/]"))) continue;

    const parent = firstParent(repoRoot, commit);
    const previous = parent ? showFile(repoRoot, parent, tasksPath) : null;
    if (!previous?.includes(markerFor(activeId, "[/]"))) return commit;
  }
  return null;
}

export function collectSubCheckpointDeliveryEvidence(
  repoRoot: string,
  tasksPath: string,
  activeId: string,
  head = "HEAD"
): SubCheckpointDeliveryEvidence {
  const activationCommit = findSubCheckpointActivationCommit(repoRoot, tasksPath, activeId, head);
  if (!activationCommit) {
    return {
      status: "unknown",
      activeId,
      reason: `Não foi possível localizar o commit que ativou ${activeId}.`,
    };
  }

  try {
    const after = git(repoRoot, ["rev-list", "--count", `${activationCommit}..${head}`]);
    const count = Number(after);
    if (Number.isFinite(count) && count > 0) {
      return { status: "present", activeId, activationCommit, commitsAfterActivation: count };
    }
    return {
      status: "missing",
      activeId,
      activationCommit,
      reason: `${activeId} acabou de ser ativado e ainda não há commit de entrega depois da ativação.`,
    };
  } catch {
    return {
      status: "unknown",
      activeId,
      reason: `Não foi possível contar commits depois da ativação de ${activeId}.`,
    };
  }
}

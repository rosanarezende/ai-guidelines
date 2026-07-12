import { execFileSync } from "node:child_process";

export type StepDeliveryEvidence =
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

/**
 * O título da etapa em tasks.md pode vir com o prefixo `Checkpoint ` quando a
 * etapa É o checkpoint semântico do nó (formato exigido pelo active-specs:check)
 * — mesmo contrato do parser canônico (`parseSteps`) e do markReadiness.
 */
function markerVariantsFor(id: string, state: "[/]" | "[ ]" | "[x]"): readonly string[] {
  return [`${state} **${id}`, `${state} **Checkpoint ${id}`];
}

function hasStepMarker(content: string | null, id: string, state: "[/]" | "[ ]" | "[x]"): boolean {
  if (!content) return false;
  return markerVariantsFor(id, state).some((marker) => content.includes(marker));
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

export function findStepActivationCommit(
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
    if (!hasStepMarker(current, activeId, "[/]")) continue;

    const parent = firstParent(repoRoot, commit);
    const previous = parent ? showFile(repoRoot, parent, tasksPath) : null;
    if (!hasStepMarker(previous, activeId, "[/]")) return commit;
  }
  return null;
}

export function collectStepDeliveryEvidence(
  repoRoot: string,
  tasksPath: string,
  activeId: string,
  head = "HEAD"
): StepDeliveryEvidence {
  const activationCommit = findStepActivationCommit(repoRoot, tasksPath, activeId, head);
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

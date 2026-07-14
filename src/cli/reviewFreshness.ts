/**
 * Freshness FUNCIONAL dos reviews (CO-4, rodada 7 — extraído na rodada 8 para
 * consumo compartilhado por briefing e handoff sem ciclo de import):
 *
 * A cabeça auditável é o último commit que altera algo fora do envelope
 * CANÔNICO de publicação: reviews/eventos e suas projeções determinísticas
 * declaradas. A working tree é classificada pelos mesmos paths. `git log`
 * ignora o que não foi commitado — por isso a classificação da tree existe:
 * funcional-sujo bloqueia em vez de fingir current.
 */
import { execFileSync } from "node:child_process";
import {
  isReviewPublicationEnvelopePath,
  reviewPublicationProjectionPaths,
} from "../app/reviews/reviewPublicationPolicy.js";
import type { NodeReviewPlanEntry } from "../domain/workflow/WorkflowState.js";

/**
 * Estado da working tree relativo ao objeto AUDITÁVEL:
 *   clean            → nada não-commitado;
 *   review-only      → só o envelope canônico de publicação de review;
 *   functional-dirty → mudanças funcionais não commitadas ⇒ review bloqueado;
 *   unknown          → git indisponível.
 */
export type WorkingTreeState = "clean" | "review-only" | "functional-dirty" | "unknown";

function gitOrNull(repoRoot: string, args: readonly string[]): string | null {
  try {
    return execFileSync("git", [...args], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function gitLines(repoRoot: string, args: readonly string[]): string[] | null {
  const output = gitOrNull(repoRoot, args);
  return output === null ? null : output.split(/\r?\n/).filter(Boolean);
}

/** `git status --porcelain` SEM trim (o status XY usa o espaço inicial). */
function gitPorcelain(repoRoot: string): string | null {
  try {
    // -uall: lista ARQUIVOS untracked individualmente (sem colapsar diretórios)
    // — a classificação review-only/functional depende do path completo.
    return execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

/** Paths de `git status --porcelain` (formato `XY <path>`; lida com rename "a -> b"). */
function porcelainPaths(porcelain: string): string[] {
  return porcelain
    .split(/\r?\n/)
    .filter((line) => line.length > 3)
    .map((line) => {
      const raw = line.slice(3);
      const arrow = raw.indexOf(" -> ");
      return (arrow >= 0 ? raw.slice(arrow + 4) : raw).replace(/^"|"$/g, "");
    });
}

export interface FunctionalFreshness {
  readonly effectiveFunctionalHead: string | null;
  readonly workingTreeState: WorkingTreeState;
  readonly functionalDirtyFiles: string[];
}

export interface RevalidationScopeState {
  readonly current: boolean;
  readonly reason: string;
}

export function isRevalidationDecisionCommit(
  subject: string,
  changedFiles: readonly string[],
  specPath: string
): boolean {
  const normalizedSpecPath = specPath.replace(/\\/g, "/").replace(/\/+$/, "");
  const allowed = new Set([
    `${normalizedSpecPath}/state.yml`,
    `${normalizedSpecPath}/assets/governed-work-map-data.json`,
    `${normalizedSpecPath}/assets/governed-work-map.html`,
    `${normalizedSpecPath}/assets/governance-graph-snapshot.json`,
  ]);
  return (
    /^docs\(spec-\d+\): registra decisão sobre revalidação de reviews$/.test(subject) &&
    changedFiles.length > 0 &&
    changedFiles.every((file) => allowed.has(file.replace(/\\/g, "/")))
  );
}

/**
 * Uma dispensa nova vale somente para o delta analisado. O commit atômico que
 * registra a própria decisão pode avançar o HEAD, mas qualquer outro commit
 * funcional posterior invalida a dispensa e reabre a decisão humana.
 */
export function collectRevalidationScopeStates(
  repoRoot: string,
  reviewPlan: Readonly<Record<string, NodeReviewPlanEntry>> | undefined,
  functionalHead: string | null,
  specPath: string
): Readonly<Record<string, RevalidationScopeState>> {
  const result: Record<string, RevalidationScopeState> = {};
  for (const [role, entry] of Object.entries(reviewPlan ?? {})) {
    const analyzedHead = entry.revalidation?.analyzed_head;
    if (!analyzedHead) continue; // compatibilidade com decisões anteriores à decisão situada por delta
    if (!functionalHead) {
      result[role] = { current: false, reason: "functional HEAD indisponível" };
      continue;
    }
    if (analyzedHead === functionalHead) {
      result[role] = { current: true, reason: `delta permanece em ${analyzedHead}` };
      continue;
    }
    const commits = gitLines(repoRoot, [
      "rev-list",
      "--reverse",
      `${analyzedHead}..${functionalHead}`,
    ]);
    if (!commits || commits.length === 0) {
      result[role] = {
        current: false,
        reason: `não foi possível provar o intervalo ${analyzedHead}..${functionalHead}`,
      };
      continue;
    }
    const onlyDecisionCommits = commits.every((commit) => {
      const subject = gitOrNull(repoRoot, ["show", "-s", "--format=%s", commit]);
      const changedFiles = gitLines(repoRoot, [
        "diff-tree",
        "--no-commit-id",
        "--name-only",
        "-r",
        commit,
      ]);
      return Boolean(
        subject && changedFiles && isRevalidationDecisionCommit(subject, changedFiles, specPath)
      );
    });
    result[role] = onlyDecisionCommits
      ? {
          current: true,
          reason: `apenas o envelope da decisão avançou após ${analyzedHead}`,
        }
      : {
          current: false,
          reason: `há mudança funcional posterior ao delta analisado em ${analyzedHead}`,
        };
  }
  return result;
}

export function isReviewPublicationPath(filePath: string, reviewsDirRel: string): boolean {
  const normalizedReviewsDir = reviewsDirRel.replace(/\\/g, "/").replace(/\/+$/, "") + "/";
  return filePath.replace(/\\/g, "/").startsWith(normalizedReviewsDir);
}

export function isReviewPublicationOnlyDelta(
  changedFiles: readonly string[],
  reviewsDirRel: string
): boolean {
  return (
    changedFiles.length > 0 &&
    changedFiles.every((filePath) => isReviewPublicationEnvelopePath(filePath, reviewsDirRel))
  );
}

export function collectFunctionalFreshness(
  repoRoot: string,
  reviewsDirRel: string
): FunctionalFreshness {
  const normalizedReviewsDir = reviewsDirRel.replace(/\\/g, "/").replace(/\/+$/, "");
  const excludedPublicationPaths = [
    `${normalizedReviewsDir}/`,
    ...reviewPublicationProjectionPaths(reviewsDirRel),
  ];
  const effectiveFunctionalHead = gitOrNull(repoRoot, [
    "log",
    "-n",
    "1",
    "--format=%h",
    "--",
    ".",
    ...excludedPublicationPaths.map((filePath) => `:(exclude)${filePath}`),
  ]);

  const porcelain = gitPorcelain(repoRoot);
  if (porcelain === null) {
    return {
      effectiveFunctionalHead: effectiveFunctionalHead || null,
      workingTreeState: "unknown",
      functionalDirtyFiles: [],
    };
  }
  if (porcelain.trim() === "") {
    return {
      effectiveFunctionalHead: effectiveFunctionalHead || null,
      workingTreeState: "clean",
      functionalDirtyFiles: [],
    };
  }
  const paths = porcelainPaths(porcelain);
  const functionalDirtyFiles = paths.filter(
    (p) => !isReviewPublicationEnvelopePath(p, reviewsDirRel)
  );
  return {
    effectiveFunctionalHead: effectiveFunctionalHead || null,
    workingTreeState: isReviewPublicationOnlyDelta(paths, reviewsDirRel)
      ? "review-only"
      : "functional-dirty",
    functionalDirtyFiles,
  };
}

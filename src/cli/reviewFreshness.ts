/**
 * Freshness FUNCIONAL dos reviews (CO-4, rodada 7 — extraído na rodada 8 para
 * consumo compartilhado por briefing e handoff sem ciclo de import):
 *
 * A cabeça auditável é o último commit que altera algo fora do diretório
 * CANÔNICO de reviews da spec, e a working tree é classificada pelos mesmos
 * paths. `git log` ignora o que não foi commitado — por isso a classificação
 * da tree existe: funcional-sujo bloqueia em vez de fingir current.
 */
import { execFileSync } from "node:child_process";

/**
 * Estado da working tree relativo ao objeto AUDITÁVEL:
 *   clean            → nada não-commitado;
 *   review-only      → só artefatos de review (paths canônicos da spec);
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

export function collectFunctionalFreshness(
  repoRoot: string,
  reviewsDirRel: string
): FunctionalFreshness {
  const normalizedReviewsDir = reviewsDirRel.replace(/\\/g, "/").replace(/\/+$/, "") + "/";
  const isReviewPath = (p: string): boolean =>
    p.replace(/\\/g, "/").startsWith(normalizedReviewsDir);

  const effectiveFunctionalHead = gitOrNull(repoRoot, [
    "log",
    "-n",
    "1",
    "--format=%h",
    "--",
    ".",
    `:(exclude)${normalizedReviewsDir}`,
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
  const functionalDirtyFiles = paths.filter((p) => !isReviewPath(p));
  return {
    effectiveFunctionalHead: effectiveFunctionalHead || null,
    workingTreeState: functionalDirtyFiles.length === 0 ? "review-only" : "functional-dirty",
    functionalDirtyFiles,
  };
}

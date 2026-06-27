// Banco de um REPO: projeta SÓ os arquivos do repo (nada cross-repo).
import type { ExplorationEntry, RepoProjection, WorkProjection } from "./types.ts";
import { readYaml, readFrontmatter, fileExists } from "./io.ts";

export function deriveRepo(repo: string): RepoProjection {
  const registry = `${repo}/registry/exploration.yml`;
  const entries = fileExists(registry)
    ? (readYaml<{ entries?: ExplorationEntry[] }>(registry).entries ?? [])
    : [];

  return { repo, explorations: entries.map((entry) => projectExploration(repo, entry)) };
}

function projectExploration(repo: string, entry: ExplorationEntry): WorkProjection {
  return {
    ref: `${repo}/${entry.id}`,
    kind: "exploration",
    status: entry.status,
    fate: entry.fate,
    answers: entry.answers,
    verdict: deriveVerdict(repo, entry),
  };
}

/** O verdict é DERIVADO do answer (conteúdo, co-locado no workspace) — só quando fechou. */
function deriveVerdict(repo: string, entry: ExplorationEntry): string | undefined {
  const closedBy = entry["closed-by"];
  if (entry.status !== "done" || !closedBy) return undefined;
  return readFrontmatter<{ verdict?: string }>(`${repo}/${closedBy}`).verdict;
}

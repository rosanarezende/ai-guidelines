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
  const answer = readAnswer(repo, entry);
  return {
    ref: `${repo}/${entry.id}`,
    kind: "exploration",
    status: entry.status,
    fate: entry.fate,
    answers: entry.answers,
    verdict: answer.verdict,
    promotedOutput: answer.promoted,
  };
}

/** O answer é CONTEÚDO (co-locado no workspace): verdict + a POC promovida, se houver. Só quando fechou. */
function readAnswer(
  repo: string,
  entry: ExplorationEntry
): { verdict?: string; promoted?: string } {
  const closedBy = entry["closed-by"];
  if (entry.status !== "done" || !closedBy) return {};
  return readFrontmatter<{ verdict?: string; promoted?: string }>(`${repo}/${closedBy}`);
}

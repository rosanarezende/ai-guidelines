// Banco de um REPO: projeta SÓ os arquivos do repo (nada cross-repo) — TODOS os kinds de work.
import type { RegistryEntry, RepoProjection, WorkProjection, WorkKind } from "./types.ts";
import { readYaml, readFrontmatter, fileExists } from "./io.ts";

const WORK_KINDS: WorkKind[] = ["delivery", "experiment", "incident", "fix", "patch"];

export function deriveRepo(repo: string): RepoProjection {
  const works: WorkProjection[] = [];
  for (const kind of WORK_KINDS) {
    const registry = `${repo}/.governance/registry/${kind}.yml`;
    if (!fileExists(registry)) continue;
    const entries = readYaml<{ entries?: RegistryEntry[] }>(registry).entries ?? [];
    for (const entry of entries) works.push(projectWork(repo, kind, entry));
  }
  // FERRAMENTA `exploration` (Lente 4): coleção PRÓPRIA, fora dos works
  const explorations: WorkProjection[] = [];
  const expReg = `${repo}/.governance/registry/exploration.yml`;
  if (fileExists(expReg)) {
    const entries = readYaml<{ entries?: RegistryEntry[] }>(expReg).entries ?? [];
    for (const entry of entries) explorations.push(projectWork(repo, "exploration", entry));
  }
  return { repo, works, explorations };
}

function projectWork(repo: string, kind: WorkKind, entry: RegistryEntry): WorkProjection {
  const proj: WorkProjection = {
    ref: `${repo}/${kind}/${entry.id}`, // o caminho-ref: <repo>/<tipo>/<slug>_<num>
    kind,
    status: entry.status,
    assignee: entry.assignee,
    updatedAt: entry["updated-at"],
    intent: entry.intent,
    weight: entry.weight,
    coordinatesWith: entry["coordinates-with"],
    blockedBy: entry["blocked-by"],
    answers: entry.answers,
    fate: entry.fate,
  };
  if (kind === "exploration") {
    const answer = readAnswer(repo, entry);
    proj.verdict = answer.verdict;
    proj.promotedOutput = answer.promoted;
  }
  return proj;
}

/** O answer é CONTEÚDO (co-locado no workspace): verdict + a POC promovida, se houver. Só quando fechou. */
function readAnswer(repo: string, entry: RegistryEntry): { verdict?: string; promoted?: string } {
  const closedBy = entry["closed-by"];
  if (entry.status !== "done" || !closedBy) return {};
  return readFrontmatter<{ verdict?: string; promoted?: string }>(
    `${repo}/.governance/${closedBy}`
  );
}

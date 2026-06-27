// Banco de GOVERNANÇA: NÃO lê arquivos dos repos — CONSOME as projeções dos bancos de repo
// (comunicação banco→banco) e resolve as questions/contratos da intent pela aresta `answers`.
import type {
  Intent,
  RepoProjection,
  WorkProjection,
  GovernanceProjection,
  QuestionResolution,
  ContractStatus,
} from "./types.ts";

export function deriveGovernance(
  intent: Intent,
  repoProjections: RepoProjection[]
): GovernanceProjection {
  const publishedWorks: WorkProjection[] = repoProjections.flatMap((p) => p.explorations);

  const questions = (intent["open-questions"] ?? []).map((q): QuestionResolution => {
    const edge = `${intent.id}#${q.id}`;
    const answer = publishedWorks.find((w) => answersEdge(w, edge));
    const resolved = answer?.status === "done";
    return {
      id: q.id,
      resolved,
      answeredBy: answer?.ref,
      verdict: resolved ? answer?.verdict : undefined,
    };
  });

  const resolvedIds = new Set(questions.filter((q) => q.resolved).map((q) => q.id));
  const contracts = (intent.contracts ?? []).map(
    (c): ContractStatus => ({
      name: c.name,
      awaits: c.awaits,
      known: c.awaits === undefined || resolvedIds.has(c.awaits), // sem awaits = known no t0
    })
  );

  return { intent: intent.id, title: intent.title, questions, contracts };
}

/** A aresta cross-grafo é qualificada ("<repo>/intent#qN"); casa pelo sufixo. */
function answersEdge(work: WorkProjection, edge: string): boolean {
  if (!work.answers) return false;
  return work.answers === edge || work.answers.endsWith(`/${edge}`);
}

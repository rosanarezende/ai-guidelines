// Banco de GOVERNANÇA: NÃO lê arquivos dos repos — CONSOME as projeções dos bancos de repo
// (comunicação banco→banco) e resolve as questions/contratos da intent pela aresta `answers`.
import type {
  Intent,
  Deliberation,
  RepoProjection,
  WorkProjection,
  GovernanceProjection,
  QuestionResolution,
  ContractStatus,
  BreaksInto,
  Decision,
} from "./types.ts";

/** GATE compartilhado: dadas as questions (cada uma com seu verdict/evidência) + as decisões, deriva o estado.
 *  Vale p/ a INTENT (verdict da exploration) e p/ o WORK (research inline) — MESMO gate (prova intent ≈ work). */
export function deriveGate(
  questions: { id: string; answered: boolean; answeredBy?: string; verdict?: string }[],
  decisions: Decision[]
): QuestionResolution[] {
  // decisões SUPERSEDED saem de vigor (append-only; nada se reescreve)
  const dead = new Set<string>();
  for (const d of decisions)
    if (d.status === "accepted" && d.supersedes) for (const id of d.supersedes) dead.add(id);

  return questions.map((q): QuestionResolution => {
    const live = decisions.find((d) => !dead.has(d.id) && d.decides.includes(q.id)); // decisão EM VIGOR que fecha q
    const reopened = decisions.some((d) => dead.has(d.id) && d.decides.includes(q.id)); // teve decisão superseded → reabriu
    // o gate: a decisão é o nó (accepted|rejected); senão `pending` (respondida, sem decisão) ou `none` (sem resposta)
    const decision = live?.status ?? (q.answered ? "pending" : "none");
    const resolved = q.answered && decision === "accepted"; // só resolve com ACEITE humano
    return {
      id: q.id,
      answered: q.answered,
      decision,
      resolved,
      reopened,
      answeredBy: q.answeredBy,
      verdict: q.verdict,
    };
  });
}

export function deriveGovernance(
  intent: Intent,
  deliberation: Deliberation,
  repoProjections: RepoProjection[]
): GovernanceProjection {
  const publishedWorks: WorkProjection[] = repoProjections.flatMap((p) => p.works);
  const publishedExplorations: WorkProjection[] = repoProjections.flatMap((p) => p.explorations);

  // a question da INTENT é respondida por uma EXPLORATION (ferramenta) via a aresta `answers`
  const gateInput = (intent["open-questions"] ?? []).map((q) => {
    const edge = `${intent.id}#${q.id}`;
    const answer = publishedExplorations.find((w) => answersEdge(w, edge));
    return {
      id: q.id,
      answered: answer?.status === "done", // a exploration respondeu (evidência existe)
      answeredBy: answer?.ref,
      verdict: answer?.status === "done" ? answer.verdict : undefined,
    };
  });
  const questions = deriveGate(gateInput, deliberation.decisions);

  const resolvedIds = new Set(questions.filter((q) => q.resolved).map((q) => q.id));
  const contracts = (intent.contracts ?? []).map(
    (c): ContractStatus => ({
      name: c.name,
      awaits: c.awaits,
      known: c.awaits === undefined || resolvedIds.has(c.awaits), // sem awaits = known no t0
    })
  );

  // o PLANO (breaks-into) = os works (TRABALHO) da intent por status; explorations não entram (coleção própria → aparecem nas questions acima)
  const mine = publishedWorks.filter((w) => w.intent === intent.id);
  const breaksInto: BreaksInto = {
    done: mine.filter((w) => w.status === "done").map((w) => w.ref),
    active: mine.filter((w) => w.status === "active").map((w) => w.ref),
    draft: mine.filter((w) => w.status === "draft").map((w) => w.ref),
  };

  return {
    intent: intent.id,
    title: intent.title,
    owner: intent.owner,
    questions,
    contracts,
    breaksInto,
  };
}

/** A aresta cross-grafo é qualificada ("<repo>/intent#qN"); casa pelo sufixo. */
function answersEdge(work: WorkProjection, edge: string): boolean {
  if (!work.answers) return false;
  return work.answers === edge || work.answers.endsWith(`/${edge}`);
}

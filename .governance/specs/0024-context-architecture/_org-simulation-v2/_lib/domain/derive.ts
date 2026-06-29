// derive.ts — derivações PURAS: o "banco" derivado a partir do que o Repository leu. Não conhece persistência.
// O GATE (respondida ≠ resolvida) e o STATE (stage/cursor) saem daqui; a view só renderiza o resultado.
import type { Work, Exploration, Question, Research, Decision, Intent, Manifest } from "./model.ts";

// ───────────────────────── projeções (read-models derivados) ─────────────────────────

export type GateDecision = "accepted" | "rejected" | "pending" | "none";

export interface QuestionGate {
  id: string;
  mode?: string;
  answered: boolean; // tem ≥1 research
  decided: GateDecision; // o gate humano
  resolved: boolean; // answered && decisão aceita em vigor
  reopened: boolean; // teve uma decisão SUPERSEDED → reabriu
  researches: string[]; // os res-NNN que investigam (DERIVADO de investigates, A+)
}

export interface DeliberationView {
  work: string;
  stage: "deciding" | "executing"; // DERIVADO: há question não-resolvida → deciding
  cursor: string; // "onde estamos" — DERIVADO
  questions: QuestionGate[];
}

export interface ContractStatus {
  name: string;
  awaits?: string;
  known: boolean;
}

/** O que o repo PUBLICA pro host (a camada EXTERNA) — só o necessário pra governança agregar. */
export interface RepoContext {
  repo: string;
  works: {
    ref: string;
    status: WorkStatus;
    intent?: string | null;
    coordinatesWith?: string[];
    blockedBy?: string[];
  }[];
  answers: { exploration: string; question: string; verdict?: string }[];
}

export interface GovernanceView {
  intent: string;
  title: string;
  owner?: string;
  questions: {
    id: string;
    answered: boolean;
    decided: GateDecision;
    resolved: boolean;
    answeredBy?: string;
    verdict?: string;
  }[];
  contracts: ContractStatus[];
  breaksInto: { done: string[]; active: string[]; draft: string[] };
}

type WorkStatus = Work["status"];

// ───────────────────────── o GATE compartilhado (intent ≈ work) ─────────────────────────

/** decisões SUPERSEDED saem de vigor (append-only; nada se reescreve). */
function deadDecisions(decisions: Decision[]): Set<string> {
  const dead = new Set<string>();
  for (const d of decisions)
    if (d.status === "accepted" && d.supersedes) for (const id of d.supersedes) dead.add(id);
  return dead;
}
const decidesQuestion = (d: Decision, qid: string): boolean =>
  d.resolves.some((r) => r.question === qid);

// ───────────────────────── derivações públicas ─────────────────────────

/** o q/r/d de um WORK → gate (por question) + state (stage/cursor). */
export function deriveDeliberation(
  workRef: string,
  questions: Question[],
  researches: Research[],
  decisions: Decision[]
): DeliberationView {
  const dead = deadDecisions(decisions);
  const researchesOf = (qid: string): string[] =>
    researches.filter((r) => r.investigates.includes(qid)).map((r) => r.id);

  const gate = questions.map((q): QuestionGate => {
    const rs = researchesOf(q.id);
    const answered = rs.length > 0;
    const live = decisions.find((d) => !dead.has(d.id) && decidesQuestion(d, q.id));
    const reopened = decisions.some((d) => dead.has(d.id) && decidesQuestion(d, q.id));
    const decided: GateDecision = live?.status ?? (answered ? "pending" : "none");
    return {
      id: q.id,
      mode: q.mode,
      answered,
      decided,
      resolved: answered && decided === "accepted",
      reopened,
      researches: rs,
    };
  });

  const open = gate.filter((g) => !g.resolved);
  return {
    work: workRef,
    stage: open.length > 0 ? "deciding" : "executing",
    cursor:
      open.length > 0
        ? `gate pendente em: ${open.map((g) => g.id).join(", ")}`
        : "todas resolvidas → executar",
    questions: gate,
  };
}

/** o que o repo PUBLICA pro host (a camada externa) — arestas dos works + as respostas das explorations. */
export function deriveContext(
  repo: string,
  works: Work[],
  explorations: Exploration[]
): RepoContext {
  return {
    repo,
    works: works.map((w) => ({
      ref: `${repo}/${w.kind}/${w.id}`,
      status: w.status,
      intent: w.intent,
      coordinatesWith: w.coordinatesWith,
      blockedBy: w.blockedBy,
    })),
    answers: explorations
      .filter((e) => e.status === "done")
      .map((e) => ({
        exploration: `${repo}/exploration/${e.id}`,
        question: e.answers,
        verdict: e.verdict,
      })),
  };
}

/** o HOST: a intent agregada — gate das open-questions (respondidas pelas explorations), contratos, breakdown. */
export function deriveGovernance(
  intent: Intent,
  intentDecisions: Decision[],
  contexts: RepoContext[]
): GovernanceView {
  const dead = deadDecisions(intentDecisions);
  const allAnswers = contexts.flatMap((c) => c.answers);

  const questions = intent.openQuestions.map((q) => {
    const edge = `${intent.id}#${q.id}`;
    const ans = allAnswers.find((a) => a.question === edge || a.question.endsWith(`/${edge}`));
    const answered = Boolean(ans);
    const live = intentDecisions.find((d) => !dead.has(d.id) && decidesQuestion(d, q.id));
    const decided: GateDecision = live?.status ?? (answered ? "pending" : "none");
    return {
      id: q.id,
      answered,
      decided,
      resolved: answered && decided === "accepted",
      answeredBy: ans?.exploration,
      verdict: ans?.verdict,
    };
  });

  const resolvedIds = new Set(questions.filter((q) => q.resolved).map((q) => q.id));
  const contracts = intent.contracts.map(
    (c): ContractStatus => ({
      name: c.name,
      awaits: c.awaits,
      known: c.awaits === undefined || resolvedIds.has(c.awaits),
    })
  );

  const mine = contexts.flatMap((c) => c.works).filter((w) => w.intent === intent.id);
  const refsByStatus = (s: WorkStatus): string[] =>
    mine.filter((w) => w.status === s).map((w) => w.ref);

  return {
    intent: intent.id,
    title: intent.title,
    owner: intent.owner,
    questions,
    contracts,
    breaksInto: {
      done: refsByStatus("done"),
      active: refsByStatus("active"),
      draft: refsByStatus("draft"),
    },
  };
}

// ───────────────────────── o GRAFO DE CONHECIMENTO (cross-repo, derivado dos manifestos) ─────────────────────────

/** Uma aresta cross-repo DERIVADA: `from` CONSOME um contrato que `to` PROVÊ (anota-se 1 lado; o reverso é o grafo). */
export interface CrossRepoEdge {
  from: string; // o repo que CONSOME
  to: string; // o repo que PROVÊ
  contract: string; // "<to>/<name>"
  kind: "coordinates-with";
}

/** Um nó do grafo de conhecimento (um repo, com o owner de cada provides já resolvido — override ?? repo). */
export interface ManifestNode {
  repo: string;
  role?: string;
  owner: string;
  domain?: string;
  capabilities: string[];
  provides: { name: string; kind: string; status?: string; owner: string }[];
  architecture?: { stack?: string[]; patterns?: string[]; boundaries?: string[] };
}

export interface ManifestGraph {
  nodes: ManifestNode[];
  edges: CrossRepoEdge[];
  warnings: string[]; // check anti-typo: um `consumes` sem provider correspondente
}

/** cruza provides × consumes dos manifestos → as arestas coordinates-with (o grafo HORIZONTAL) + warnings anti-typo. */
export function deriveManifestGraph(manifests: Manifest[]): ManifestGraph {
  const providerOf = new Map<string, string>(); // "<repo>/<name>" → o repo que provê
  for (const m of manifests)
    for (const p of m.provides) providerOf.set(`${m.repo}/${p.name}`, m.repo);

  const edges: CrossRepoEdge[] = [];
  const warnings: string[] = [];
  for (const m of manifests) {
    for (const c of m.consumes) {
      const to = providerOf.get(c.contract);
      if (to) edges.push({ from: m.repo, to, contract: c.contract, kind: "coordinates-with" });
      else
        warnings.push(
          `${m.repo} consome "${c.contract}", mas nenhum repo PROVÊ esse contrato (typo no manifesto, ou o provedor não declarou?).`
        );
    }
  }

  const nodes: ManifestNode[] = manifests.map((m) => ({
    repo: m.repo,
    role: m.role,
    owner: m.owner,
    domain: m.domain,
    capabilities: m.capabilities ?? [],
    provides: m.provides.map((p) => ({
      name: p.name,
      kind: p.kind,
      status: p.status,
      owner: p.owner ?? m.owner, // resolve o override (modelo CODEOWNERS)
    })),
    architecture: m.architecture,
  }));

  return { nodes, edges, warnings };
}

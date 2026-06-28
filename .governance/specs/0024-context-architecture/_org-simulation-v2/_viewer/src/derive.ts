// Derivação (client-side, ao vivo): q/r/d (o GATE + append-only/supersedes) · contrato known · plano.
import type {
  AppContract,
  AppDecision,
  AppIntent,
  AppWork,
  DeliberationHost,
  Weight,
} from "./types";

const WEIGHT_NUM: Record<Weight, number> = { S: 1, M: 2, L: 3, XL: 5 };

// ── DELIBERAÇÃO (q/r/d) ──

/** ids de decisões SUPERSEDED por alguma decisão aceita (saem de vigor; nada se reescreve). */
export function supersededIds(decisions: AppDecision[]): Set<string> {
  const dead = new Set<string>();
  for (const d of decisions) {
    if (d.status === "accepted" && d.supersedes) for (const id of d.supersedes) dead.add(id);
  }
  return dead;
}

export interface QuestionView {
  answered: boolean; // tem verdict (uma exploração respondeu)
  decision: "accepted" | "rejected" | "pending" | "none"; // o gate
  resolved: boolean; // decisão aceita EM VIGOR (gate fechado)
  reopened: boolean; // tinha decisão aceita, foi superseded, sem nova em vigor
  inEffect?: AppDecision; // a decisão em vigor (aceita/rejeitada, não-superseded) que a decide
}

/** O GATE por question: respondida (verdict) ≠ resolvida (decisão aceita EM VIGOR). */
export function questionView(host: DeliberationHost, qid: string): QuestionView {
  const q = host.questions.find((x) => x.id === qid);
  const answered = Boolean(q?.verdict);
  const dead = supersededIds(host.decisions);
  const inEffect = host.decisions.find((d) => !dead.has(d.id) && d.decides.includes(qid));
  const hadAccepted = host.decisions.some(
    (d) => d.status === "accepted" && d.decides.includes(qid)
  );
  return {
    answered,
    decision: inEffect ? inEffect.status : answered ? "pending" : "none",
    resolved: inEffect?.status === "accepted",
    reopened: !inEffect && hadAccepted,
    inEffect,
  };
}

// ── CONTRATOS + PLANO ──

/** Um contrato é `known` se não espera nada, ou se a question que ele espera RESOLVEU (gate aceito, em vigor). */
export function contractKnown(intent: AppIntent, c: AppContract): boolean {
  if (!c.awaits) return true;
  return questionView(intent, c.awaits).resolved;
}

/** Por que um work está bloqueado: `blocked-by` não-done + contratos `coordinates-with` pending. */
export function blockedReasons(intent: AppIntent, work: AppWork, works: AppWork[]): string[] {
  const reasons: string[] = [];
  for (const dep of work.blockedBy) {
    const w = works.find((x) => x.id === dep);
    if (!w || w.status !== "done") reasons.push(w ? w.title : dep);
  }
  for (const name of work.coordinatesWith) {
    const c = (intent.contracts ?? []).find((x) => x.name === name);
    if (!c || !contractKnown(intent, c)) reasons.push(`contrato "${name}"`);
  }
  return reasons;
}

export type WorkPhase = "done" | "active" | "ready" | "blocked";

/** Fase DERIVADA: done/active (status próprio) · ready (destravado) · blocked (espera deps/contratos). */
export function workPhase(intent: AppIntent, work: AppWork, works: AppWork[]): WorkPhase {
  if (work.status === "done") return "done";
  // `active` exige um assignee (born draft; ready = destravado mas SEM dono, esperando alguém pegar)
  if (work.status === "active" && work.assignee) return "active";
  return blockedReasons(intent, work, works).length > 0 ? "blocked" : "ready";
}

/** Caminho crítico = a cadeia de `blocked-by` mais PESADA (ponderada pelo weight). */
export function criticalPath(works: AppWork[]): { refs: string[]; weight: number } {
  const byId = new Map(works.map((w) => [w.id, w] as const));
  const memo = new Map<string, { refs: string[]; weight: number }>();
  function pathTo(w: AppWork): { refs: string[]; weight: number } {
    const cached = memo.get(w.id);
    if (cached) return cached;
    let best: { refs: string[]; weight: number } = { refs: [], weight: 0 };
    for (const dep of w.blockedBy) {
      const dw = byId.get(dep);
      if (dw) {
        const p = pathTo(dw);
        if (p.weight > best.weight) best = p;
      }
    }
    const result = { refs: [...best.refs, w.id], weight: best.weight + WEIGHT_NUM[w.weight] };
    memo.set(w.id, result);
    return result;
  }
  let cp: { refs: string[]; weight: number } = { refs: [], weight: 0 };
  for (const w of works) {
    const p = pathTo(w);
    if (p.weight > cp.weight) cp = p;
  }
  return cp;
}

// Derivação do PLANO (client-side, ao vivo): contrato known · work bloqueado · caminho crítico ponderado.
import type { AppContract, AppIntent, AppWork, Weight } from "./types";

const WEIGHT_NUM: Record<Weight, number> = { S: 1, M: 2, L: 3, XL: 5 };

/** Um contrato é `known` se não espera nada, ou se a question que ele espera RESOLVEU (respondida + decisão aceita). */
export function contractKnown(intent: AppIntent, c: AppContract): boolean {
  if (!c.awaits) return true;
  const q = intent.questions.find((x) => x.id === c.awaits);
  const dec = intent.decisions.find((d) => d.decides === c.awaits);
  return Boolean(q?.verdict) && dec?.status === "accepted";
}

/** Por que um work está bloqueado (lista de razões): `blocked-by` não-done + contratos `coordinates-with` pending. */
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

/** Fase DERIVADA: done/active (status próprio) · ready (destravado, pode começar) · blocked (espera deps/contratos). */
export function workPhase(intent: AppIntent, work: AppWork, works: AppWork[]): WorkPhase {
  if (work.status === "done") return "done";
  if (work.status === "active") return "active";
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

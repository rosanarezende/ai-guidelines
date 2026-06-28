// Store: Iniciativas + Propostas + Works + Explorations via json-server (REST) — o "banco" da app (Lente 5: backend plugável).
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AppIntent, AppProposal, AppWork, AppExploration } from "./types";

const INTENTS = "/api/intents";
const PROPOSALS = "/api/proposals";
const WORKS = "/api/works";
const EXPLORATIONS = "/api/explorations";
const HEADERS = { "Content-Type": "application/json" };

interface Store {
  intents: AppIntent[];
  proposals: AppProposal[];
  works: AppWork[];
  explorations: AppExploration[];
  error: string | null;
  reload: () => void;
  addIntent: (intent: AppIntent) => Promise<void>;
  updateIntent: (id: string, fn: (i: AppIntent) => AppIntent) => Promise<void>;
  addProposal: (proposal: AppProposal) => Promise<void>;
  updateProposal: (id: string, fn: (p: AppProposal) => AppProposal) => Promise<void>;
  addWork: (work: AppWork) => Promise<void>;
  updateWork: (id: string, fn: (w: AppWork) => AppWork) => Promise<void>;
  addExploration: (exp: AppExploration) => Promise<void>;
  updateExploration: (id: string, fn: (e: AppExploration) => AppExploration) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

const required = <T,>(url: string): Promise<T> =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))));
const optional = <T,>(url: string): Promise<T[]> =>
  fetch(url).then((r) => (r.ok ? (r.json() as Promise<T[]>) : [])); // coleção ausente (db.json antigo) → []

// o `verdict` da question é DERIVADO da exploration que a responde (a exploration é a FONTE; a question deriva).
function withVerdicts(intents: AppIntent[], explorations: AppExploration[]): AppIntent[] {
  return intents.map((i) => ({
    ...i,
    questions: i.questions.map((q) => {
      const exp = explorations.find((e) => e.answers === `${i.id}#${q.id}` && e.status === "done");
      return exp?.verdict ? { ...q, verdict: exp.verdict } : q;
    }),
  }));
}

export function IntentsProvider({ children }: { children: ReactNode }) {
  const [intents, setIntents] = useState<AppIntent[]>([]);
  const [proposals, setProposals] = useState<AppProposal[]>([]);
  const [works, setWorks] = useState<AppWork[]>([]);
  const [explorations, setExplorations] = useState<AppExploration[]>([]);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    setError(null);
    // intents + explorations juntos: a question deriva o verdict da exploration que a responde
    Promise.all([required<AppIntent[]>(INTENTS), optional<AppExploration>(EXPLORATIONS)])
      .then(([ints, exps]) => {
        setIntents(withVerdicts(ints, exps));
        setExplorations(exps);
      })
      .catch((e: unknown) => setError(String(e)));
    optional<AppProposal>(PROPOSALS)
      .then(setProposals)
      .catch(() => setProposals([]));
    optional<AppWork>(WORKS)
      .then(setWorks)
      .catch(() => setWorks([]));
  }
  useEffect(reload, []);

  async function post(url: string, body: unknown) {
    await fetch(url, { method: "POST", headers: HEADERS, body: JSON.stringify(body) });
    reload();
  }
  async function put(url: string, body: unknown) {
    await fetch(url, { method: "PUT", headers: HEADERS, body: JSON.stringify(body) });
    reload();
  }

  const store: Store = {
    intents,
    proposals,
    works,
    explorations,
    error,
    reload,
    addIntent: (intent) => post(INTENTS, intent),
    updateIntent: async (id, fn) => {
      const cur = intents.find((i) => i.id === id);
      if (cur) await put(`${INTENTS}/${id}`, fn(cur));
    },
    addProposal: (proposal) => post(PROPOSALS, proposal),
    updateProposal: async (id, fn) => {
      const cur = proposals.find((p) => p.id === id);
      if (cur) await put(`${PROPOSALS}/${id}`, fn(cur));
    },
    addWork: (work) => post(WORKS, work),
    updateWork: async (id, fn) => {
      const cur = works.find((w) => w.id === id);
      if (cur) await put(`${WORKS}/${id}`, fn(cur));
    },
    addExploration: (exp) => post(EXPLORATIONS, exp),
    updateExploration: async (id, fn) => {
      const cur = explorations.find((e) => e.id === id);
      if (cur) await put(`${EXPLORATIONS}/${id}`, fn(cur));
    },
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useIntents(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIntents fora do IntentsProvider");
  return ctx;
}

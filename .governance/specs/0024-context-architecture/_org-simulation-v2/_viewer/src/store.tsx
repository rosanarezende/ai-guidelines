// Store: Iniciativas + Propostas + Works via json-server (REST) — o "banco" da app (Lente 5: backend plugável).
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AppIntent, AppProposal, AppWork } from "./types";

const INTENTS = "/api/intents";
const PROPOSALS = "/api/proposals";
const WORKS = "/api/works";
const HEADERS = { "Content-Type": "application/json" };

interface Store {
  intents: AppIntent[];
  proposals: AppProposal[];
  works: AppWork[];
  error: string | null;
  reload: () => void;
  addIntent: (intent: AppIntent) => Promise<void>;
  updateIntent: (id: string, fn: (i: AppIntent) => AppIntent) => Promise<void>;
  addProposal: (proposal: AppProposal) => Promise<void>;
  updateProposal: (id: string, fn: (p: AppProposal) => AppProposal) => Promise<void>;
  addWork: (work: AppWork) => Promise<void>;
  updateWork: (id: string, fn: (w: AppWork) => AppWork) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

const required = <T,>(url: string): Promise<T> =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))));
const optional = <T,>(url: string): Promise<T[]> =>
  fetch(url).then((r) => (r.ok ? (r.json() as Promise<T[]>) : [])); // coleção ausente (db.json antigo) → []

export function IntentsProvider({ children }: { children: ReactNode }) {
  const [intents, setIntents] = useState<AppIntent[]>([]);
  const [proposals, setProposals] = useState<AppProposal[]>([]);
  const [works, setWorks] = useState<AppWork[]>([]);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    setError(null);
    required<AppIntent[]>(INTENTS)
      .then(setIntents)
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
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useIntents(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIntents fora do IntentsProvider");
  return ctx;
}

// Store das Iniciativas + Propostas via json-server (REST) — o "banco" da app (Lente 5: backend plugável).
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AppIntent, AppProposal } from "./types";

const INTENTS = "/api/intents";
const PROPOSALS = "/api/proposals";
const HEADERS = { "Content-Type": "application/json" };

interface Store {
  intents: AppIntent[];
  proposals: AppProposal[];
  error: string | null;
  reload: () => void;
  addIntent: (intent: AppIntent) => Promise<void>;
  updateIntent: (id: string, fn: (i: AppIntent) => AppIntent) => Promise<void>;
  addProposal: (proposal: AppProposal) => Promise<void>;
  updateProposal: (id: string, fn: (p: AppProposal) => AppProposal) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

function getJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))));
}

export function IntentsProvider({ children }: { children: ReactNode }) {
  const [intents, setIntents] = useState<AppIntent[]>([]);
  const [proposals, setProposals] = useState<AppProposal[]>([]);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    setError(null);
    getJson<AppIntent[]>(INTENTS)
      .then(setIntents)
      .catch((e: unknown) => setError(String(e)));
    // proposals é opcional: um db.json antigo pode não ter a coleção (404 → lista vazia)
    fetch(PROPOSALS)
      .then((r) => (r.ok ? (r.json() as Promise<AppProposal[]>) : []))
      .then(setProposals)
      .catch(() => setProposals([]));
  }
  useEffect(reload, []);

  async function addIntent(intent: AppIntent) {
    await fetch(INTENTS, { method: "POST", headers: HEADERS, body: JSON.stringify(intent) });
    reload();
  }
  async function updateIntent(id: string, fn: (i: AppIntent) => AppIntent) {
    const current = intents.find((i) => i.id === id);
    if (!current) return;
    await fetch(`${INTENTS}/${id}`, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify(fn(current)),
    });
    reload();
  }
  async function addProposal(proposal: AppProposal) {
    await fetch(PROPOSALS, { method: "POST", headers: HEADERS, body: JSON.stringify(proposal) });
    reload();
  }
  async function updateProposal(id: string, fn: (p: AppProposal) => AppProposal) {
    const current = proposals.find((p) => p.id === id);
    if (!current) return;
    await fetch(`${PROPOSALS}/${id}`, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify(fn(current)),
    });
    reload();
  }

  const store: Store = {
    intents,
    proposals,
    error,
    reload,
    addIntent,
    updateIntent,
    addProposal,
    updateProposal,
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useIntents(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIntents fora do IntentsProvider");
  return ctx;
}

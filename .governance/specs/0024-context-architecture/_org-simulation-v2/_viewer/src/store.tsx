// Store das Iniciativas (intents) via json-server (REST) — o "banco" da app (Lente 5: backend plugável).
// Hoje json-server (db.json); amanhã um backend escreveria os arquivos do grafo. A app só conhece este contrato.
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AppIntent } from "./types";

const API = "/api/intents"; // proxiado p/ o json-server (ver vite.config.ts)
const JSON_HEADERS = { "Content-Type": "application/json" };

interface Store {
  intents: AppIntent[];
  error: string | null;
  reload: () => void;
  addIntent: (intent: AppIntent) => Promise<void>;
  updateIntent: (id: string, fn: (i: AppIntent) => AppIntent) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function IntentsProvider({ children }: { children: ReactNode }) {
  const [intents, setIntents] = useState<AppIntent[]>([]);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    fetch(API)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: AppIntent[]) => {
        setIntents(data);
        setError(null);
      })
      .catch((e: unknown) => setError(String(e)));
  }
  useEffect(reload, []);

  async function addIntent(intent: AppIntent) {
    await fetch(API, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(intent) });
    reload();
  }

  async function updateIntent(id: string, fn: (i: AppIntent) => AppIntent) {
    const current = intents.find((i) => i.id === id);
    if (!current) return;
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(fn(current)),
    });
    reload();
  }

  return (
    <Ctx.Provider value={{ intents, error, reload, addIntent, updateIntent }}>
      {children}
    </Ctx.Provider>
  );
}

export function useIntents(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIntents fora do IntentsProvider");
  return ctx;
}

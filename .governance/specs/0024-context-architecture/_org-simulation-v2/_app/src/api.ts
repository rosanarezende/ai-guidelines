// api.ts — acesso ao backend (/api → server.ts). O MODELO é o da _lib (FONTE ÚNICA); aqui só os helpers de fetch.
import type { Intent, Proposal, Manifest } from "../../_lib/domain/model.ts";
import type { ManifestGraph } from "../../_lib/domain/derive.ts";
import type { RoutingSuggestion, TagGraph } from "../../_lib/domain/routing.ts";

export type { Intent, Proposal, Manifest };

/** o grafo da ORG, derivado no backend (advisory): conhecimento + roteamento + repo×tag. */
export interface OrgGraph {
  knowledge: ManifestGraph;
  routing: { intent: string; suggestions: RoutingSuggestion[] }[];
  tagGraph: TagGraph;
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) {
    const detail = await r.json().catch(() => ({}));
    throw new Error((detail as { error?: string }).error ?? `HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}

const post = (data: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
const put = (data: unknown): RequestInit => ({ ...post(data), method: "PUT" });
const enc = encodeURIComponent;

export const api = {
  intents: () => json<Intent[]>("/api/intents"),
  intent: (id: string) => json<Intent>(`/api/intents/${enc(id)}`),
  createIntent: (i: Intent) => json<Intent>("/api/intents", post(i)),
  updateIntent: (id: string, i: Intent) => json<Intent>(`/api/intents/${enc(id)}`, put(i)),

  proposals: () => json<Proposal[]>("/api/proposals"),
  proposal: (id: string) => json<Proposal>(`/api/proposals/${enc(id)}`),
  createProposal: (p: Proposal) => json<Proposal>("/api/proposals", post(p)),
  updateProposal: (id: string, p: Proposal) => json<Proposal>(`/api/proposals/${enc(id)}`, put(p)),

  repos: () => json<string[]>("/api/repos"),
  graph: () => json<OrgGraph>("/api/graph"),
};

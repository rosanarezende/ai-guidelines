// api.ts — acesso ao backend (/api → server.ts). O MODELO é o da _lib (FONTE ÚNICA); aqui só os helpers de fetch.
import type {
  Intent,
  Register,
  Triage,
  Gate,
  Proposal,
  Manifest,
} from "../../_lib/domain/model.ts";
import type { ManifestGraph } from "../../_lib/domain/derive.ts";
import type { RoutingSuggestion, TagGraph, Match } from "../../_lib/domain/routing.ts";

export type { Intent, Register, Triage, Gate, Proposal, Manifest };

/** o resultado de uma SIMULAÇÃO do matcher (triagem): por need, os repos ranqueados + o backend + a latência. */
export interface MatchResult {
  label: string;
  ms: number;
  results: { key: string; ranked: Match[] }[];
}

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

  // candidata (pré-ativação)
  registers: () => json<Register[]>("/api/registers"),
  register: (id: string) => json<Register>(`/api/registers/${enc(id)}`),
  createRegister: (r: Register) => json<Register>("/api/registers", post(r)),
  updateRegister: (id: string, r: Register) => json<Register>(`/api/registers/${enc(id)}`, put(r)),
  triage: (id: string) => json<Triage>(`/api/registers/${enc(id)}/triage`),
  saveTriage: (id: string, t: Triage) => json<Triage>(`/api/registers/${enc(id)}/triage`, put(t)),
  gate: (id: string) => json<Gate | null>(`/api/registers/${enc(id)}/gate`),
  registerRouting: (id: string) => json<RoutingSuggestion[]>(`/api/registers/${enc(id)}/routing`),
  match: (body: {
    needs: { key: string; text: string }[];
    kind?: string;
    model?: string;
    endpoint?: string;
  }) => json<MatchResult>("/api/match", post(body)),
  promote: (id: string, g: Gate) => json<Intent>(`/api/registers/${enc(id)}/promote`, post(g)),
  discard: (id: string, g: Gate) =>
    json<{ ok: boolean }>(`/api/registers/${enc(id)}/discard`, post(g)),

  repos: () => json<string[]>("/api/repos"),
  graph: () => json<OrgGraph>("/api/graph"),
};

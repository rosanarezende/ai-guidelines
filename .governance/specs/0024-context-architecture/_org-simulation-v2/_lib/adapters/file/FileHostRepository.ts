// FileHostRepository — adapter da porta `HostRepository` sobre `acme-governance/` (a governança da org):
// intents + deliberação no nível da intent + a ferramenta `proposal` (intake). Backend local versionado (fs).
// Reconcilia o LEGADO: a deliberation.yml da intent usa `decides` + `supported-by` single; o domínio usa
// `resolves` + array → o `toDecision` mapeia os dois (read), e o write passa a gravar a forma do domínio.
import type { HostRepository } from "../../ports.ts";
import type { Intent, Decision, Proposal } from "../../domain/model.ts";
import { exists, readYaml, writeYaml, listNames, listRepoDirs } from "./io.ts";

const GOV = "acme-governance";
const PROPOSALS = `${GOV}/proposals.yml`;
const intentDir = (id: string): string => `${GOV}/intents/${id}`;

// ───────────────────────── shapes do ARQUIVO ─────────────────────────

interface IntentFile {
  id: string;
  title: string;
  owner?: string;
  status?: Intent["status"];
  "created-at"?: string;
  "updated-at"?: string;
  "open-questions"?: { id: string; question: string }[];
  contracts?: { name: string; awaits?: string }[];
}
interface DeliberationFile {
  decisions?: DecisionEntry[];
}
interface DecisionEntry {
  id: string;
  decides?: string[]; // LEGADO
  resolves?: { question: string; into: string }[]; // DOMÍNIO
  "supported-by"?: string | string[]; // legado single OU array
  supersedes?: string[];
  "results-in"?: string[];
  status: Decision["status"];
  rationale?: string; // legado
  body?: string; // domínio
  "decided-at"?: string;
}
interface ProposalFile {
  entries?: ProposalEntry[];
}
interface ProposalEntry {
  id: string;
  what: string;
  "raised-by"?: string;
  owner: string;
  status: Proposal["status"];
  tags?: string[];
  impact: Proposal["impact"];
  confidence: Proposal["confidence"];
  effort: Proposal["effort"];
  evidence?: string[];
  "promote-to"?: Proposal["promoteTo"];
  "opens-intent"?: string;
  "discard-reason"?: string;
  "created-at"?: string;
  "updated-at"?: string;
}

// ───────────────────────── mappers ─────────────────────────

const toIntent = (f: IntentFile): Intent => ({
  id: f.id,
  title: f.title,
  owner: f.owner,
  status: f.status,
  openQuestions: f["open-questions"] ?? [],
  contracts: f.contracts ?? [],
  createdAt: f["created-at"],
  updatedAt: f["updated-at"],
});

const toDecision = (d: DecisionEntry): Decision => ({
  id: d.id,
  resolves: d.resolves ?? (d.decides ?? []).map((q, i) => ({ question: q, into: `§D${i + 1}` })),
  supportedBy: Array.isArray(d["supported-by"])
    ? d["supported-by"]
    : d["supported-by"]
      ? [d["supported-by"]]
      : [],
  supersedes: d.supersedes,
  resultsIn: d["results-in"],
  status: d.status,
  body: d.body ?? d.rationale,
  decidedAt: d["decided-at"] ?? "",
});

const fromDecision = (d: Decision): DecisionEntry => ({
  id: d.id,
  resolves: d.resolves,
  "supported-by": d.supportedBy,
  supersedes: d.supersedes,
  "results-in": d.resultsIn,
  status: d.status,
  body: d.body,
  "decided-at": d.decidedAt,
});

const toProposal = (e: ProposalEntry): Proposal => ({
  id: e.id,
  what: e.what,
  raisedFrom: e["raised-by"],
  owner: e.owner,
  status: e.status,
  tags: e.tags ?? [],
  impact: e.impact,
  confidence: e.confidence,
  effort: e.effort,
  evidence: e.evidence,
  promoteTo: e["promote-to"],
  opensIntent: e["opens-intent"],
  discardReason: e["discard-reason"],
  createdAt: e["created-at"] ?? "",
  updatedAt: e["updated-at"],
});

const fromProposal = (p: Proposal): ProposalEntry => ({
  id: p.id,
  what: p.what,
  "raised-by": p.raisedFrom,
  owner: p.owner,
  status: p.status,
  tags: p.tags,
  impact: p.impact,
  confidence: p.confidence,
  effort: p.effort,
  evidence: p.evidence,
  "promote-to": p.promoteTo,
  "opens-intent": p.opensIntent,
  "discard-reason": p.discardReason,
  "created-at": p.createdAt,
  "updated-at": p.updatedAt,
});

// ───────────────────────── o adapter ─────────────────────────

export class FileHostRepository implements HostRepository {
  async listRepos(): Promise<string[]> {
    return listRepoDirs();
  }

  // ── intents ──

  async listIntents(): Promise<Intent[]> {
    return listNames(`${GOV}/intents`)
      .filter((id) => exists(`${intentDir(id)}/intent.yml`))
      .map((id) => toIntent(readYaml<IntentFile>(`${intentDir(id)}/intent.yml`)));
  }

  async getIntent(id: string): Promise<Intent | null> {
    const rel = `${intentDir(id)}/intent.yml`;
    return exists(rel) ? toIntent(readYaml<IntentFile>(rel)) : null;
  }

  async saveIntent(intent: Intent): Promise<void> {
    const rel = `${intentDir(intent.id)}/intent.yml`;
    // preserva o CONTEÚDO do form (objective/references/details) e sobrepõe os campos do domínio
    const cur = exists(rel) ? readYaml<Record<string, unknown>>(rel) : { node: "intent" };
    writeYaml(rel, {
      ...cur,
      id: intent.id,
      title: intent.title,
      owner: intent.owner,
      status: intent.status,
      "created-at": intent.createdAt,
      "updated-at": intent.updatedAt,
      "open-questions": intent.openQuestions,
      contracts: intent.contracts,
    });
  }

  // ── deliberação no nível da intent ──

  async listDecisions(intentId: string): Promise<Decision[]> {
    const rel = `${intentDir(intentId)}/deliberation.yml`;
    const decisions = exists(rel) ? (readYaml<DeliberationFile>(rel).decisions ?? []) : [];
    return decisions.map(toDecision);
  }

  async addDecision(intentId: string, d: Decision): Promise<void> {
    const rel = `${intentDir(intentId)}/deliberation.yml`;
    const decisions = exists(rel) ? (readYaml<DeliberationFile>(rel).decisions ?? []) : [];
    decisions.push(fromDecision(d)); // APPEND-ONLY
    writeYaml(rel, { decisions });
  }

  // ── proposal (intake — vive na governança) ──

  async listProposals(): Promise<Proposal[]> {
    const entries = exists(PROPOSALS) ? (readYaml<ProposalFile>(PROPOSALS).entries ?? []) : [];
    return entries.map(toProposal);
  }

  async saveProposal(p: Proposal): Promise<void> {
    const cur = exists(PROPOSALS) ? (readYaml<ProposalFile>(PROPOSALS).entries ?? []) : [];
    const entries = cur.filter((e) => e.id !== p.id);
    entries.push(fromProposal(p));
    writeYaml(PROPOSALS, { entries });
  }
}

// FileHostRepository — adapter da porta `HostRepository` sobre `acme-governance/` (a governança da org):
// intents + deliberação no nível da intent + a ferramenta `proposal` (intake). Backend local versionado (fs).
// Reconcilia o LEGADO: a deliberation.yml da intent usa `decides` + `supported-by` single; o domínio usa
// `resolves` + array → o `toDecision` mapeia os dois (read), e o write passa a gravar a forma do domínio.
import type { HostRepository } from "../../ports.ts";
import type {
  Intent,
  Register,
  RegisterStatus,
  Triage,
  Disposition,
  Gate,
  ExplorePoint,
  Proposal,
  Manifest,
  ContractKind,
} from "../../domain/model.ts";
import { exists, readYaml, writeYaml, listNames, listRepoDirs, moveDir } from "./io.ts";

const GOV = "acme-governance";
const PROPOSALS = `${GOV}/proposals.yml`;
const intentDir = (id: string): string => `${GOV}/intents/${id}`;
const candidatesDir = `${GOV}/registers/candidates`;
const archivedDir = `${GOV}/registers/archived`;
const regDir = (id: string): string => `${candidatesDir}/${id}`;
const today = (): string => new Date().toISOString().slice(0, 10);

// ───────────────────────── shapes do ARQUIVO ─────────────────────────

interface IntentFile {
  id: string;
  title: string;
  description?: string;
  status?: Intent["status"];
  "registered-by"?: string;
  owner?: string;
  stakeholders?: { role: string; who: string }[];
  problem?: { business?: string; customer?: string };
  "business-connection"?: { driver?: string; metric?: string };
  details?: string;
  references?: { type?: string; label: string; url?: string; note?: string }[];
  "created-at"?: string;
  "updated-at"?: string;
  explores?: { id: string; title?: string; subject?: string; details?: string }[]; // subject = back-compat
  contracts?: { name: string; awaits?: string }[];
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

interface ManifestFile {
  repo: string;
  role?: string;
  owner: string;
  domain?: string;
  provides?: {
    name: string;
    kind: ContractKind;
    description?: string;
    status?: "stable" | "beta" | "experimental";
    owner?: string;
  }[];
  consumes?: { contract: string; awaits?: string }[];
  capabilities?: { text: string; tags?: string[] }[];
  architecture?: { stack?: string[]; patterns?: string[]; boundaries?: string[] };
}

interface RegisterFile {
  id: string;
  title: string;
  description?: string;
  status?: RegisterStatus;
  "registered-by"?: string;
  owner?: string;
  stakeholders?: { role: string; who: string }[];
  problem?: { business?: string; customer?: string };
  "business-connection"?: { driver?: string; metric?: string };
  details?: string;
  references?: { type?: string; label: string; url?: string; note?: string }[];
  "open-questions"?: { id: string; question: string }[];
  "created-at"?: string;
  "updated-at"?: string;
}
interface TriageItemFile {
  id: string;
  title: string;
  "from-doubt"?: string;
  disposition?: Disposition;
  "explore-point"?: { id: string; title: string; details?: string };
  answer?: string;
  assignee?: string;
  "blocked-since"?: string;
}
interface TriageFile {
  items?: TriageItemFile[];
  contracts?: { name: string; awaits?: string }[];
  viability?: string;
  "updated-at"?: string;
}
interface GateFile {
  outcome: Gate["outcome"];
  "decided-by"?: string;
  "decided-at"?: string;
  rationale?: string;
  viability?: string;
}

// ───────────────────────── mappers ─────────────────────────

const toIntent = (f: IntentFile): Intent => ({
  id: f.id,
  title: f.title,
  description: f.description,
  status: f.status,
  registeredBy: f["registered-by"],
  owner: f.owner,
  stakeholders: f.stakeholders,
  problem: f.problem,
  businessConnection: f["business-connection"],
  details: f.details,
  references: f.references,
  explores: (f.explores ?? []).map((e) => ({
    id: e.id,
    title: e.title ?? e.subject ?? "", // back-compat: arquivos antigos usavam `subject`
    details: e.details,
  })),
  contracts: f.contracts ?? [],
  createdAt: f["created-at"],
  updatedAt: f["updated-at"],
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

const toManifest = (f: ManifestFile): Manifest => ({
  repo: f.repo,
  role: f.role,
  owner: f.owner,
  domain: f.domain,
  provides: f.provides ?? [],
  consumes: f.consumes ?? [],
  capabilities: f.capabilities,
  architecture: f.architecture,
});

const toRegister = (f: RegisterFile): Register => ({
  id: f.id,
  title: f.title,
  description: f.description,
  status: f.status ?? "registrada",
  registeredBy: f["registered-by"],
  owner: f.owner,
  stakeholders: f.stakeholders,
  problem: f.problem,
  businessConnection: f["business-connection"],
  details: f.details,
  references: f.references,
  openQuestions: f["open-questions"],
  createdAt: f["created-at"],
  updatedAt: f["updated-at"],
});
const fromRegister = (r: Register): RegisterFile => ({
  id: r.id,
  title: r.title,
  description: r.description,
  status: r.status,
  "registered-by": r.registeredBy,
  owner: r.owner,
  stakeholders: r.stakeholders,
  problem: r.problem,
  "business-connection": r.businessConnection,
  details: r.details,
  references: r.references,
  "open-questions": r.openQuestions,
  "created-at": r.createdAt,
  "updated-at": r.updatedAt,
});

const toTriage = (f: TriageFile): Triage => ({
  items: f.items?.map((it) => ({
    id: it.id,
    title: it.title,
    fromDoubt: it["from-doubt"],
    disposition: it.disposition,
    explorePoint: it["explore-point"],
    answer: it.answer,
    assignee: it.assignee,
    blockedSince: it["blocked-since"],
  })),
  contracts: f.contracts,
  viability: f.viability,
  updatedAt: f["updated-at"],
});
const fromTriage = (t: Triage): TriageFile => ({
  items: t.items?.map((it) => ({
    id: it.id,
    title: it.title,
    "from-doubt": it.fromDoubt,
    disposition: it.disposition,
    "explore-point": it.explorePoint,
    answer: it.answer,
    assignee: it.assignee,
    "blocked-since": it.blockedSince,
  })),
  contracts: t.contracts,
  viability: t.viability,
  "updated-at": t.updatedAt,
});

const toGate = (f: GateFile): Gate => ({
  outcome: f.outcome,
  decidedBy: f["decided-by"],
  decidedAt: f["decided-at"],
  rationale: f.rationale,
  viability: f.viability,
});
const fromGate = (g: Gate): GateFile => ({
  outcome: g.outcome,
  "decided-by": g.decidedBy,
  "decided-at": g.decidedAt,
  rationale: g.rationale,
  viability: g.viability,
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
    // preserva o que o domínio não modela (objective/target-repos/sealed/closed-at) e sobrepõe os campos do domínio
    const cur = exists(rel)
      ? readYaml<Record<string, unknown>>(rel)
      : { node: "intent", sealed: false };
    writeYaml(rel, {
      ...cur,
      id: intent.id,
      title: intent.title,
      description: intent.description,
      status: intent.status,
      "registered-by": intent.registeredBy,
      owner: intent.owner,
      stakeholders: intent.stakeholders,
      problem: intent.problem,
      "business-connection": intent.businessConnection,
      details: intent.details,
      references: intent.references,
      "created-at": intent.createdAt,
      "updated-at": intent.updatedAt,
      explores: intent.explores,
      contracts: intent.contracts,
    });
  }

  // (a intent NÃO delibera — sem deliberation.yml; o gate da intent deriva do breakdown.)

  // ── candidata à intent (registers/candidates/<id>/) — pré-ativação ──

  async listRegisters(): Promise<Register[]> {
    return listNames(candidatesDir)
      .filter((id) => exists(`${regDir(id)}/register.yml`))
      .map((id) => toRegister(readYaml<RegisterFile>(`${regDir(id)}/register.yml`)));
  }
  async getRegister(id: string): Promise<Register | null> {
    const rel = `${regDir(id)}/register.yml`;
    return exists(rel) ? toRegister(readYaml<RegisterFile>(rel)) : null;
  }
  async saveRegister(reg: Register): Promise<void> {
    writeYaml(`${regDir(reg.id)}/register.yml`, { node: "register", ...fromRegister(reg) });
  }
  async getTriage(id: string): Promise<Triage | null> {
    const rel = `${regDir(id)}/triage.yml`;
    return exists(rel) ? toTriage(readYaml<TriageFile>(rel)) : null;
  }
  async saveTriage(id: string, triage: Triage): Promise<void> {
    writeYaml(`${regDir(id)}/triage.yml`, { node: "triage", ...fromTriage(triage) });
  }
  async getGate(id: string): Promise<Gate | null> {
    const rel = `${regDir(id)}/gate.yml`;
    return exists(rel) ? toGate(readYaml<GateFile>(rel)) : null;
  }

  /** PROMOVER: consolida register+triage → intents/<id>/intent.yml e MOVE a candidata p/ archived/ (ciclo fechado). */
  async promote(id: string, gate: Gate): Promise<Intent> {
    const reg = await this.getRegister(id);
    if (!reg) throw new Error(`register "${id}" não encontrado`);
    const triage = await this.getTriage(id);
    writeYaml(`${regDir(id)}/gate.yml`, {
      node: "gate",
      ...fromGate({ ...gate, outcome: "promoted" }),
    });
    const explores: ExplorePoint[] = (triage?.items ?? [])
      .filter((it) => it.disposition === "exploration" && it.explorePoint)
      .map((it) => it.explorePoint as ExplorePoint);
    const intent: Intent = {
      id: reg.id,
      title: reg.title,
      description: reg.description,
      status: "active",
      registeredBy: reg.registeredBy,
      owner: reg.owner,
      stakeholders: reg.stakeholders,
      problem: reg.problem,
      businessConnection: reg.businessConnection,
      details: reg.details,
      references: reg.references,
      explores,
      contracts: triage?.contracts ?? [],
      createdAt: reg.createdAt,
      updatedAt: today(),
    };
    await this.saveIntent(intent);
    moveDir(regDir(id), `${archivedDir}/${id}`);
    return intent;
  }

  /** DESCARTAR: grava o gate (discarded) e MOVE a candidata p/ archived/. Nada nasce em intents/. */
  async discard(id: string, gate: Gate): Promise<void> {
    if (!exists(`${regDir(id)}/register.yml`)) throw new Error(`register "${id}" não encontrado`);
    writeYaml(`${regDir(id)}/gate.yml`, {
      node: "gate",
      ...fromGate({ ...gate, outcome: "discarded" }),
    });
    moveDir(regDir(id), `${archivedDir}/${id}`);
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

  // ── manifesto (auto-discovery: varre as .governance/manifest.yml dos repos) ──

  async listManifests(): Promise<Manifest[]> {
    return (await this.listRepos())
      .filter((repo) => exists(`${repo}/.governance/manifest.yml`))
      .map((repo) => toManifest(readYaml<ManifestFile>(`${repo}/.governance/manifest.yml`)));
  }
}

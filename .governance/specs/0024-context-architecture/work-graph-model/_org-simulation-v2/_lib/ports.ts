// ports.ts — as PORTAS (contratos read/write). ASYNC de propósito (Neo4j-ready). Implementadas pelos adapters.
// Separadas por papel: `Repository` = o banco INTERNO de um repo · `HostRepository` = a governança (reflete o externo).
import type {
  Work,
  Exploration,
  Proposal,
  Question,
  Research,
  Decision,
  Intent,
  Register,
  Triage,
  Gate,
  Manifest,
} from "./domain/model.ts";
// Decision: usado pela deliberação de WORK (Repository); a intent não delibera (HostRepository).

/** O banco INTERNO de um repo de trabalho (read E write). O backend é plugável (File/Neo4j). */
export interface Repository {
  readonly repo: string;

  // trabalho (os 5 tipos)
  listWorks(): Promise<Work[]>;
  getWork(id: string): Promise<Work | null>;
  saveWork(work: Work): Promise<void>; // breakdown cria draft · atribuir+iniciar = update

  // ferramenta exploration
  listExplorations(): Promise<Exploration[]>;
  saveExploration(exp: Exploration): Promise<void>;

  // deliberação de um work (q/r/d) — o WRITE da deliberação
  listQuestions(workId: string): Promise<Question[]>;
  saveQuestion(workId: string, q: Question): Promise<void>; // evolui enquanto aberta
  listResearches(workId: string): Promise<Research[]>;
  addResearch(workId: string, r: Research): Promise<void>; // acumulam (1:N)
  listDecisions(workId: string): Promise<Decision[]>;
  addDecision(workId: string, d: Decision): Promise<void>; // APPEND-ONLY (o gate)
}

/** O banco da GOVERNANÇA (host): intents + a ferramenta `proposal` (intake) + os repos sob governança. */
export interface HostRepository {
  listRepos(): Promise<string[]>;

  // intents ATIVADAS (o objetivo durável) — vivem em intents/ (só populada na ativação)
  listIntents(): Promise<Intent[]>;
  getIntent(id: string): Promise<Intent | null>;
  saveIntent(intent: Intent): Promise<void>;

  // CANDIDATA à intent (pré-ativação) — registers/candidates/<id>/ (register.yml · triage.yml · gate.yml)
  listRegisters(): Promise<Register[]>;
  getRegister(id: string): Promise<Register | null>;
  saveRegister(reg: Register): Promise<void>; // negócio cadastra/edita o enquadramento
  getTriage(id: string): Promise<Triage | null>;
  saveTriage(id: string, triage: Triage): Promise<void>; // eng dispõe + valida contratos
  getGate(id: string): Promise<Gate | null>;
  promote(id: string, gate: Gate): Promise<Intent>; // consolida register+triage → intents/<id>/intent.yml + arquiva
  discard(id: string, gate: Gate): Promise<void>; // arquiva a candidata (gate discarded); nada nasce em intents/

  // (a intent NÃO delibera: q/r/d é etapa de work/exploration. A candidata tem um GATE de ativação, não deliberação.)

  // proposal (intake — captura humana; vive na governança, não percorre o fluxo)
  listProposals(): Promise<Proposal[]>;
  saveProposal(p: Proposal): Promise<void>;

  // manifesto (a camada de CONHECIMENTO — auto-discovery: o host varre as .governance/manifest.yml)
  listManifests(): Promise<Manifest[]>;
}

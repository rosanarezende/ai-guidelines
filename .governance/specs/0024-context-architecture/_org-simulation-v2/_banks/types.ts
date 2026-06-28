// Tipos do domínio + das projeções (Lente 5: grafos que se comunicam → bancos derivados).
// Convenção: o que mora nas REGISTRIES (o grafo) × o que cada BANCO publica (a projeção derivada).

export type WorkStatus = "draft" | "active" | "done";
export type Fate = "throwaway" | "promoted" | "parked";

// ───────────────────────── o grafo (o que está nos arquivos) ─────────────────────────

export type WorkKind = "delivery" | "experiment" | "incident" | "fix" | "patch" | "exploration";

/** Uma entrada num `registry/<kind>.yml` de um repo (genérica — campos por-kind são opcionais). */
export interface RegistryEntry {
  id: string;
  title: string;
  status: WorkStatus;
  assignee?: string | null; // quem ASSUMIU; `active` exige assignee + início (born draft)
  /** back-ref à intent dona (deliveries usam; explorations geralmente se ligam via `answers`). */
  intent?: string;
  workspace?: string;
  // delivery/experiment/…:
  weight?: string;
  "coordinates-with"?: string[]; // contratos comuns
  "blocked-by"?: string[]; // outros works
  // exploration:
  answers?: string; // aresta CROSS-GRAFO: "<repo>/intents/<intent>#<qN>"
  fate?: Fate;
  "closed-by"?: string; // ref ao answer (CONTEÚDO), relativa a .governance/
  "created-at"?: string;
  "updated-at"?: string; // última mutação (só nós mutáveis)
}

export interface Contract {
  name: string;
  /** se presente, o contrato só fica `known` quando esta question resolve. */
  awaits?: string;
}

export interface OpenQuestion {
  id: string;
  question: string;
}

export interface Intent {
  id: string;
  title: string;
  owner?: string; // quem TOCA a iniciativa (a dona)
  "updated-at"?: string;
  "open-questions"?: OpenQuestion[];
  contracts?: Contract[];
}

// ───────────────────────── a projeção (o que cada banco PUBLICA) ─────────────────────────

/** O que o banco de um REPO publica por trabalho (qualquer kind). */
export interface WorkProjection {
  ref: string; // "<repo>/<kind>/<id>"
  kind: WorkKind;
  status: WorkStatus;
  assignee?: string | null; // quem ASSUMIU (born draft; active exige assignee)
  updatedAt?: string; // última mutação (frescor)
  /** a intent a que o trabalho pertence (via `intent` ou via `answers`) — p/ o breaks-into. */
  intent?: string;
  // delivery/experiment/…:
  weight?: string;
  coordinatesWith?: string[];
  blockedBy?: string[];
  // exploration:
  fate?: Fate;
  answers?: string; // a aresta cross-grafo que ele responde (a governança casa por aqui)
  verdict?: string; // DERIVADO do answer (via closed-by) quando `done`
  promotedOutput?: string; // se `fate: promoted`, a POC durável (a absorver via derives-from)
}

export interface RepoProjection {
  repo: string;
  works: WorkProjection[];
}

// ── a DELIBERAÇÃO (o gate humano): a exploration RESPONDE; a question só RESOLVE quando um humano ACEITA ──

export type DecisionStatus = "accepted" | "rejected" | "pending";

/** Nó de decisão no mapa de deliberação da intent (append-only; reabrir = novo nó + `supersedes`). */
export interface Decision {
  id: string;
  decides: string[]; // [qN] — uma decisão pode fechar VÁRIAS questions
  status: "accepted" | "rejected"; // só decisões CONCLUÍDAS são nós; "pending" não é nó (é DERIVADO)
  "supported-by"?: string; // "<repo>/<tipo>/<exploration>" — a evidência (aresta Lente 3)
  rationale?: string;
  "results-in"?: string[]; // o trabalho que a decisão CRIA (aresta results-in)
  supersedes?: string[]; // ids de decisões anteriores (reabertura, append-only)
}

export interface Deliberation {
  decisions: Decision[];
}

/** O que o banco de GOVERNANÇA publica por question. */
export interface QuestionResolution {
  id: string;
  answered: boolean; // a exploration fechou → o verdict (evidência) existe
  decision: DecisionStatus | "none"; // o gate humano
  resolved: boolean; // answered && decision === "accepted"
  answeredBy?: string; // "<repo>/<id>"
  verdict?: string;
}

export interface ContractStatus {
  name: string;
  known: boolean;
  awaits?: string;
}

/** Vista DERIVADA do plano: os works da intent agrupados por status (substitui o `breaks-into` do arquivo). */
export interface BreaksInto {
  done: string[];
  active: string[];
  draft: string[];
}

export interface GovernanceProjection {
  intent: string;
  title: string;
  owner?: string;
  questions: QuestionResolution[];
  contracts: ContractStatus[];
  breaksInto: BreaksInto;
}

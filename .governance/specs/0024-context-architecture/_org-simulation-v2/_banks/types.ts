// Tipos do domínio + das projeções (Lente 5: grafos que se comunicam → bancos derivados).
// Convenção: o que mora nas REGISTRIES (o grafo) × o que cada BANCO publica (a projeção derivada).

export type WorkStatus = "draft" | "active" | "done";
export type Fate = "throwaway" | "promoted" | "parked";

// ───────────────────────── o grafo (o que está nos arquivos) ─────────────────────────

/** Uma entrada no `registry/exploration.yml` de um repo. */
export interface ExplorationEntry {
  id: string;
  title: string;
  status: WorkStatus;
  /** aresta CROSS-GRAFO: "<repo>/<intent>#<qN>" que esta exploration responde. */
  answers?: string;
  workspace?: string;
  fate?: Fate;
  /** referência ao exploration-answer (CONTEÚDO), relativa ao repo — o verdict mora lá, não aqui. */
  "closed-by"?: string;
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
  "open-questions"?: OpenQuestion[];
  contracts?: Contract[];
}

// ───────────────────────── a projeção (o que cada banco PUBLICA) ─────────────────────────

/** O que o banco de um REPO publica por trabalho. */
export interface WorkProjection {
  ref: string; // "<repo>/<id>"
  kind: "exploration";
  status: WorkStatus;
  fate?: Fate;
  /** a aresta cross-grafo que ele responde (a governança casa por aqui). */
  answers?: string;
  /** DERIVADO do answer (via closed-by) quando `done`; é conteúdo, não fica no registry. */
  verdict?: string;
  /** se `fate: promoted`, o caminho da POC durável (derivado do answer) — a absorver via `derives-from`. */
  promotedOutput?: string;
}

export interface RepoProjection {
  repo: string;
  explorations: WorkProjection[];
}

// ── a DELIBERAÇÃO (o gate humano): a exploration RESPONDE; a question só RESOLVE quando um humano ACEITA ──

export type DecisionStatus = "accepted" | "rejected" | "pending";

/** Nó de decisão no mapa de deliberação da intent (append-only; reabrir = novo nó + `supersedes`). */
export interface Decision {
  id: string;
  decides: string; // qN
  status: DecisionStatus;
  "supported-by"?: string; // "<repo>/<exploration>" — a evidência (aresta Lente 3)
  rationale?: string;
  spawns?: string[]; // o trabalho que a decisão dispara
  supersedes?: string; // id de uma decisão anterior (reabertura)
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

export interface GovernanceProjection {
  intent: string;
  title: string;
  questions: QuestionResolution[];
  contracts: ContractStatus[];
}

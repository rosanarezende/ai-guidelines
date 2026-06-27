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
}

export interface RepoProjection {
  repo: string;
  explorations: WorkProjection[];
}

/** O que o banco de GOVERNANÇA publica. */
export interface QuestionResolution {
  id: string;
  resolved: boolean;
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

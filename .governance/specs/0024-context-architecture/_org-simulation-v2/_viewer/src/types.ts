// Espelha as projeções publicadas pelo banco (_banks/types.ts) — o formato do snapshot.
export type WorkStatus = "draft" | "active" | "done";
export type Fate = "throwaway" | "promoted" | "parked";
export type DecisionStatus = "accepted" | "rejected" | "pending";

export interface WorkProjection {
  ref: string;
  kind: string;
  status: WorkStatus;
  fate?: Fate;
  answers?: string;
  verdict?: string;
  promotedOutput?: string;
}

export interface RepoProjection {
  repo: string;
  explorations: WorkProjection[];
}

export interface QuestionResolution {
  id: string;
  answered: boolean;
  decision: DecisionStatus | "none";
  resolved: boolean;
  answeredBy?: string;
  verdict?: string;
}

export interface ContractStatus {
  name: string;
  known: boolean;
  awaits?: string;
}

export interface BreaksInto {
  done: string[];
  active: string[];
  draft: string[];
}

export interface GovernanceProjection {
  intent: string;
  title: string;
  questions: QuestionResolution[];
  contracts: ContractStatus[];
  breaksInto: BreaksInto;
}

export interface Snapshot {
  repos: RepoProjection[];
  governance: GovernanceProjection;
}

// ── modelo de AUTORIA (o que a app salva — Lente 5: "app/form de intents") ──
// É o INPUT (o que a pessoa preenche). O DERIVADO (resolvido, contratos, plano) o banco computaria depois.

export interface AppReference {
  label: string;
  url?: string;
}

export interface AppQuestion {
  id: string;
  question: string;
  /** o resultado de uma exploração (o verdict). Por enquanto é só até aqui que chegamos. */
  verdict?: string;
}

export interface AppDecision {
  id: string;
  decides: string; // id da question
  status: "accepted" | "rejected";
  rationale?: string;
  at: string; // data ISO
}

export interface AppIntent {
  id: string;
  title: string; // o nome humano do objetivo
  objective: string;
  details?: string;
  references: AppReference[];
  questions: AppQuestion[];
  decisions: AppDecision[];
  createdAt: string;
}

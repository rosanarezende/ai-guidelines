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

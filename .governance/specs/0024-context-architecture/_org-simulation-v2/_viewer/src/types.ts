// ── modelo de AUTORIA (o que a app salva — Lente 5: "app/form de intents") ──
export type DecisionStatus = "accepted" | "rejected" | "pending";

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
  title: string; // o nome humano da iniciativa
  objective: string;
  details?: string;
  references: AppReference[];
  questions: AppQuestion[];
  decisions: AppDecision[];
  createdAt: string;
}

// ── o BOARD DERIVADO pelo banco (lê db.json → snapshot.json) ──
export interface BoardQuestion {
  id: string;
  question: string;
  verdict?: string;
  answered: boolean; // tem verdict (uma exploração respondeu)
  decision: DecisionStatus | "none"; // o gate humano
  resolved: boolean; // answered && decisão accepted
}

export interface BoardIntent {
  id: string;
  title: string;
  objective: string;
  questions: BoardQuestion[];
  resolved: number;
  total: number;
}

export interface Snapshot {
  intents: BoardIntent[];
}

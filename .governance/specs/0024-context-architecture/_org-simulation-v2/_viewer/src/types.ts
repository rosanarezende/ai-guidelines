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
  decides: string[]; // ids das questions que resolve — uma decisão pode fechar VÁRIAS
  status: "accepted" | "rejected";
  supersedes?: string[]; // ids de decisões anteriores que esta substitui (reabertura, append-only)
  rationale?: string;
  at: string; // data ISO
}

// qualquer nó que hospeda q/r/d (deliberação): a intent E o work (intent ≈ work como host).
export interface DeliberationHost {
  questions: AppQuestion[];
  decisions: AppDecision[];
}

export interface AppContract {
  name: string;
  awaits?: string; // a question que precisa resolver p/ o contrato ficar known
}

export interface AppIntent {
  id: string;
  title: string; // o nome humano da iniciativa
  objective: string;
  details?: string;
  references: AppReference[];
  questions: AppQuestion[];
  decisions: AppDecision[];
  contracts?: AppContract[]; // os contratos que a feature coordena (known/pending = DERIVADO)
  createdAt: string;
  updatedAt?: string;
}

export type Level = "low" | "medium" | "high";
export type PromoteTo = "delivery" | "experiment" | "exploration" | "patch" | "fix";

// proposal = intake (FERRAMENTA): capturada por um HUMANO, a qualquer momento do trabalho.
export interface AppProposal {
  id: string;
  what: string;
  raisedFrom?: string; // proveniência: onde foi notada (ex.: "login_1#q2")
  owner: string; // quem TRIA (time/pessoa)
  status: "open" | "promoted" | "dismissed"; // disposição obrigatória
  tags: string[];
  impact: Level;
  confidence: Level;
  effort: Level;
  promoteTo?: PromoteTo; // na disposição: o tipo que vira
  opensIntent?: string; // se promovida p/ experiment/objetivo
  discardReason?: string; // se descartada
  createdAt: string;
  updatedAt?: string;
}

export type Weight = "S" | "M" | "L" | "XL";
export type WorkKind = "delivery" | "fix" | "patch" | "experiment" | "incident";

// um TRABALHO criado no breakdown da intent (a quebra em tarefas).
export interface AppWork {
  id: string;
  intent: string;
  kind: WorkKind;
  title: string;
  weight: Weight; // peso/tamanho — p/ medir + o caminho crítico ponderado
  repo?: string;
  blockedBy: string[]; // ids de outros works (blocked-by)
  coordinatesWith: string[]; // nomes de contratos (coordinates-with)
  status: "draft" | "active" | "done"; // progresso PRÓPRIO; "bloqueado" é DERIVADO
  assignee?: string | null; // quem ASSUMIU; `active` exige assignee + início (born draft)
  questions?: AppQuestion[]; // q/r/d do PRÓPRIO work (Lente 2: todo work delibera durante a execução)
  decisions?: AppDecision[];
  createdAt: string;
  updatedAt?: string;
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

// model.ts — o MODELO do domínio (entidades + arestas da Lente 3). PURO: não conhece persistência (file/Neo4j).
// As arestas seguem a Lente 3 do tracker (anota-se 1 lado; o reverso é DERIVADO no banco). Ref cross-repo = o CAMINHO.

export type WorkKind = "delivery" | "experiment" | "incident" | "fix" | "patch";
export type WorkStatus = "draft" | "active" | "done"; // bloqueado/pausado = DERIVADO, não guardado
export type Weight = "S" | "M" | "L" | "XL";
export type Level = "low" | "medium" | "high";

/** Ref cross-repo = "<repo>/<tipo>/<slug>_<num>" (o tipo só no caminho, nunca embutido no id). */
export type Ref = string;

// ───────────────────────── TRABALHO (os 5 tipos) ─────────────────────────

/** Um TRABALHO. Arestas ancoradas no registry (Lente 3); o reverso (blocks/results-in/raises) o banco deriva. */
export interface Work {
  id: string;
  kind: WorkKind;
  title: string;
  status: WorkStatus;
  assignee?: string | null; // `active` EXIGE assignee + início
  weight?: Weight;
  intent?: string | null; // back-ref à intent dona (null = reativo/standalone)
  // arestas (Lente 3, agrupadas):
  blockedBy?: Ref[]; // espera TRABALHOS concluírem (⟷ blocks)
  dependsOn?: Ref[]; // plataforma/versão/build
  coordinatesWith?: string[]; // CONTRATO(s) comum(ns) — nome declarado na intent
  derivesFrom?: Ref[]; // de onde veio: POC/proposal promovido/trabalho anterior (⟷ results-in)
  closedBy?: string; // ref ao artefato de fecho (experiment→outcome · incident→postmortem)
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
}

// ───────────────────────── FERRAMENTAS (Lente 4) ─────────────────────────

/** EXPLORATION (ferramenta): investiga e RESPONDE uma question (ancora a aresta `answers`). */
export interface Exploration {
  id: string;
  answers: string; // "<repo>/intents/<intent>#<qN>" — a aresta que ela ancora (a intent deriva answered-by)
  status: WorkStatus;
  assignee?: string | null;
  fate?: "throwaway" | "promoted" | "parked";
  derivesFrom?: Ref[];
  closedBy?: string; // → exploration-answer
  verdict?: string; // a resposta (conteúdo; o banco deriva p/ a question)
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
}

/** PROPOSAL (ferramenta de intake): captura HUMANA, a qualquer momento; não percorre o fluxo. Vive na governança. */
export interface Proposal {
  id: string;
  what: string;
  raisedFrom?: string; // proveniência (onde foi notada) — o lado `raises` da aresta
  owner: string; // quem TRIA
  status: "open" | "promoted" | "dismissed"; // disposição obrigatória (anti-buraco-negro)
  tags: string[];
  impact: Level;
  confidence: Level;
  effort: Level; // ICE
  evidence?: string[]; // refs ao que embasa (ex.: o exploration-answer)
  promoteTo?: WorkKind | "experiment" | "exploration"; // o tipo que vira ao promover
  opensIntent?: string; // se promovida p/ experiment/objetivo
  discardReason?: string;
  createdAt: string;
  updatedAt?: string;
}

// ───────────────────────── DELIBERAÇÃO (q/r/d — o coração) ─────────────────────────

export type QuestionMode = "escolha" | "aceitação";

/** Question — conteúdo (a pergunta + opções + estado-iteração). `status`/`resolved` são DERIVADOS, não guardados. */
export interface Question {
  id: string;
  mode: QuestionMode;
  raisedBy?: string;
  body: string;
}

/** Research — investiga 1+ questions (`investigates` = a aresta; 1:N e N:M). */
export interface Research {
  id: string;
  investigates: string[];
  method?: "benchmark" | "análise" | "scan de código" | "dogfood";
  body: string;
}

/** Decision (nó append-only) — uma decisão, N questions; cada question → um §Dx (supersedível). */
export interface Decision {
  id: string;
  resolves: { question: string; into: string }[]; // a aresta `decides` (lista)
  supportedBy: string[]; // a aresta `supported-by` (research/exploration = evidência)
  supersedes?: string[]; // a aresta `supersedes` (reabertura)
  resultsIn?: Ref[]; // a aresta `results-in` (cria trabalho)
  status: "accepted" | "rejected"; // só decisões CONCLUÍDAS são nós; "pending" = DERIVADO
  body?: string; // rationale/conteúdo (denso → decision.md)
  decidedAt: string;
}

// ───────────────────────── INTENT (a camada acima dos trabalhos) ─────────────────────────

export interface OpenQuestion {
  id: string;
  question: string; // só INPUT; answered-by/status/verdict = DERIVADOS (no banco)
}
export interface Contract {
  name: string;
  awaits?: string; // a question que precisa resolver p/ o contrato ficar known (known/pending = DERIVADO)
}

/** A INTENT — o objetivo durável; breaks-into N trabalhos; retroalimenta via answers. Vive na governança. */
export interface Intent {
  id: string;
  title: string;
  owner?: string; // quem TOCA (a dona)
  status?: "active" | "paused" | "done" | "dropped";
  openQuestions: OpenQuestion[];
  contracts: Contract[];
  createdAt?: string;
  updatedAt?: string;
}

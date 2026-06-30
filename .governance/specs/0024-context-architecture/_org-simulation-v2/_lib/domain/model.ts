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
  explores?: string; // o SUBJECT — o que esta exploration investiga (a "question" renomeada; universal, mora na ferramenta)
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

export interface ExplorePoint {
  id: string; // chave estável (~16-bit random)
  title: string; // o que investigar (curto) — abre uma exploration. (era `subject`; back-compat na leitura.)
  details?: string; // o detalhe: o que a exploration precisa responder. Alimenta o matcher (need mais rico).
}
export interface Contract {
  name: string;
  awaits?: string; // o explore-point que precisa resolver p/ o contrato ficar known (known/pending = DERIVADO)
}

/** Uma referência/link da intent (anexo "leve" — na prática quase tudo é link). */
export interface IntentReference {
  type?: string; // modeling | spec | design | benchmark | dashboard | alignment | other
  label: string;
  url?: string;
  note?: string; // a nuance que sobrevive ao link
}
/** Uma pessoa/cargo relacionado à iniciativa (o "alinhamento com stakeholders"). */
export interface Stakeholder {
  role: string; // o papel/cargo
  who: string; // a pessoa/time
}

/**
 * A INTENT — o objetivo durável; breaks-into N trabalhos; retroalimenta via answers. Vive na governança.
 * Carrega o ENQUADRAMENTO (problema/negócio/refs/pessoas) — a riqueza pesada (hipótese/métricas) é do work
 * `experiment`, não daqui (intent ≠ work). Shape deliberado em research/2026-06-30-intent-authoring-shape-deliberation.md.
 */
export interface Intent {
  id: string;
  title: string;
  status?: "draft" | "active" | "paused" | "done" | "dropped"; // nasce draft → "ativar" → active
  // ── pessoas ──
  registeredBy?: string; // quem CADASTROU (autoria/registro)
  owner?: string; // a DONA accountable (responde pela iniciativa)
  stakeholders?: Stakeholder[]; // cargos/pessoas relacionadas
  // ── enquadramento ──
  problem?: { business?: string; customer?: string };
  businessConnection?: { driver?: string; metric?: string };
  details?: string;
  references?: IntentReference[]; // links/anexos
  // ── investigação / coordenação ──
  explores: ExplorePoint[]; // os pontos que a intent dispara como explorations (a ferramenta)
  contracts: Contract[]; // os contratos VALIDADOS na triagem (não digitados no registro)
  createdAt?: string;
  updatedAt?: string;
}

// ───────────────── CANDIDATA À INTENT (pré-ativação) — registers/ (D7/D8/D9 da deliberação 2026-06-30) ─────────────────
// Fluxo: registrada (negócio) → triagem (eng) → investigação → ativada (vira `Intent`, movida p/ intents/).
// Físico: acme-governance/registers/candidates/<id>/{register.yml · triage.yml · gate.yml}; archived/ guarda a jornada.

export type RegisterStatus = "registrada" | "triagem" | "investigacao";

/** REGISTER — a face de NEGÓCIO da candidata (register.yml): enquadramento + dúvidas em linguagem de negócio. */
export interface Register {
  id: string;
  title: string;
  status: RegisterStatus;
  registeredBy?: string; // quem CADASTROU
  owner?: string; // o accountable (pessoa OU papel/time)
  stakeholders?: Stakeholder[];
  problem?: { business?: string; customer?: string };
  businessConnection?: { driver?: string; metric?: string };
  details?: string;
  references?: IntentReference[];
  openQuestions?: { id: string; question: string }[]; // dúvidas do NEGÓCIO (a eng dispõe na triagem)
  createdAt?: string;
  updatedAt?: string;
}

/** a disposição de uma dúvida na triagem: vira exploration · respondida direto · falta-info (volta pro negócio). */
export type Disposition = "exploration" | "answered" | "needs-info";
export interface TriageItem {
  question: string; // ref ao openQuestions[].id da register
  disposition?: Disposition;
  explorePoint?: ExplorePoint; // se exploration: o explore-point refinado pela eng
  answer?: string; // se answered: a resposta direta do eng
  assignee?: string; // se needs-info: quem (de negócio) precisa responder
  blockedSince?: string; // timestamp — o read-model deriva o TEMPO bloqueado (D8)
}

/** TRIAGE — a face de ENGENHARIA da candidata (triage.yml): dispositions + contratos validados + viabilidade. */
export interface Triage {
  items?: TriageItem[];
  contracts?: Contract[]; // contratos/conexões VALIDADOS (pós-matcher): aceitos/corrigidos/adicionados
  viability?: string; // notas de viabilidade (avaliadas ao longo da investigação)
  updatedAt?: string;
}

/** GATE — a DECISÃO de ativação (gate.yml). É DECISÃO, não deliberação (a intent não delibera). */
export interface Gate {
  outcome: "promoted" | "discarded";
  decidedBy?: string;
  decidedAt?: string;
  rationale?: string;
  viability?: string;
}

// ───────────────────────── MANIFESTO (a camada de CONHECIMENTO — Lente 5, face externa) ─────────────────────────

export type ContractKind = "component" | "api" | "event" | "service";

/** Um contrato OFERTADO pelo repo (a face pública; outro repo o consome → o host deriva a aresta). */
export interface ProvidedContract {
  name: string;
  kind: ContractKind;
  description?: string;
  status?: "stable" | "beta" | "experimental";
  owner?: string; // override do owner do repo (modelo CODEOWNERS) — herda o do repo se ausente
}

/** Um contrato CONSUMIDO de outro repo (ref qualificada "<repo>/<contrato>"). */
export interface ConsumedContract {
  contract: Ref; // "<repo>/<name>"
  awaits?: string;
}

/** Uma CAPABILITY (o que o repo SABE): `text` livre (semântico → léxico/IA) + `tags` controladas (match exato + viram nós do grafo repo×tag). */
export interface Capability {
  text: string;
  tags?: string[];
}

/**
 * O MANIFESTO do repo — auto-declaração de CONHECIMENTO (role/owner/domain/provides/consumes/capabilities/
 * architecture). Camada EXTERNA: o host DESCOBRE os repos por ele e DERIVA as arestas cross-repo
 * (provides×consumes; anota-se 1 lado). owner = 1 responsável-chave (accountable) + override por provides.
 * (shape deliberado em research/2026-06-29-manifest-shape-deliberation.md.)
 */
export interface Manifest {
  repo: string;
  role?: string;
  owner: string;
  domain?: string;
  provides: ProvidedContract[];
  consumes: ConsumedContract[];
  capabilities?: Capability[];
  architecture?: { stack?: string[]; patterns?: string[]; boundaries?: string[] };
}

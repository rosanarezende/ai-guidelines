// model.ts — o MODELO do domínio (entidades + arestas da Lente 3). PURO: não conhece persistência (file/Neo4j).
// As arestas seguem a Lente 3 do tracker (anota-se 1 lado; o reverso é DERIVADO no banco). Ref cross-repo = o CAMINHO.

// ═══════════ TAXONOMIA v2 (Lentes 3-4): famílias + membros + dimensões + presets ═══════════
// Migração P0 (features.md): esta fatia introduz o VOCABULÁRIO (aditivo); os consumidores
// migram no commit de ripple. `Work.kind` estreita p/ CapabilityMember lá; aqui WorkKind ainda
// = os 5 kinds legados p/ manter tudo compilando.

/** Os MEMBROS do grafo, agrupados por FAMÍLIA (natureza da saída — Lente 3). */
export type CapabilityMember = "delivery" | "maintenance";
export type LearningMember = "exploration" | "experiment";
export type ResponseMember = "incident";
export type IntakeMember = "proposal" | "register";
export type DeliberationMember = "question" | "research" | "decision";
export type GraphMember =
  | CapabilityMember
  | LearningMember
  | ResponseMember
  | IntakeMember
  | DeliberationMember;

export type GraphFamily = "capacidade" | "aprendizado" | "resposta" | "intake" | "deliberacao";

/** family DERIVADA do membro (não digitada; anota-se 1 lado só). */
export const FAMILY_BY_MEMBER: Record<GraphMember, GraphFamily> = {
  delivery: "capacidade",
  maintenance: "capacidade",
  exploration: "aprendizado",
  experiment: "aprendizado",
  incident: "resposta",
  proposal: "intake",
  register: "intake",
  question: "deliberacao",
  research: "deliberacao",
  decision: "deliberacao",
};
export const familyOf = (m: GraphMember): GraphFamily => FAMILY_BY_MEMBER[m];

/** As DIMENSÕES ortogonais (Lente 4). Opcionais no modelo; exigidas por família via enforcement (depois).
 *  `planned-in` NÃO mora aqui: é `Work.intent` (evita 2ª SSOT — derivado). */
export type SourceDim = "planned" | "reactive";
export type VisibilityDim = "user-visible" | "internal" | "operator-visible" | "security-visible";
export type MaintenanceMode = "corrective" | "adaptive" | "perfective" | "preventive"; // ISO 14764 — só maintenance
export type ChangeClass = "standard" | "normal" | "emergency"; // ITIL
export type ServiceClass = "expedite" | "fixed-date" | "standard" | "intangible"; // Kanban
export interface Dimensions {
  source?: SourceDim;
  visibility?: VisibilityDim;
  maintenanceMode?: MaintenanceMode;
  changeClass?: ChangeClass;
  serviceClass?: ServiceClass;
}

/** PRESETS (UX, não ontologia): expandem p/ membro + dimensões. Lookup PURO — não se armazena o preset (evita drift). */
export interface Preset {
  member: GraphMember;
  dimensions: Dimensions;
}
export const PRESETS: Record<string, Preset> = {
  fix: {
    member: "maintenance",
    dimensions: { maintenanceMode: "corrective", visibility: "user-visible" },
  },
  "security-patch": {
    member: "maintenance",
    dimensions: { maintenanceMode: "corrective", visibility: "security-visible" },
  },
  "dep-bump": {
    member: "maintenance",
    dimensions: { maintenanceMode: "adaptive", visibility: "internal" },
  },
};

/** Membros que um `proposal` pode virar ao promover (INTAKE → capacidade/aprendizado).
 *  `incident` REMOVIDO: é reativo, não sai de promoção planejada. */
export type PromotableMember = "delivery" | "maintenance" | "experiment" | "exploration";

// ── LEGACY (back-compat da migração): os 5 kinds antigos + normalizador p/ {membro, dimensões}. ──
export type LegacyWorkKind = "delivery" | "experiment" | "incident" | "fix" | "patch";
/** Normaliza um kind legado (dados/refs antigos) p/ o par membro+dimensões da v2. fix/patch → maintenance. */
export function normalizeLegacyKind(kind: string): { member: GraphMember; dimensions: Dimensions } {
  switch (kind) {
    case "fix":
      return {
        member: "maintenance",
        dimensions: { maintenanceMode: "corrective", visibility: "user-visible" },
      };
    case "patch":
      return {
        member: "maintenance",
        dimensions: { maintenanceMode: "corrective", visibility: "internal" },
      };
    case "experiment":
      return { member: "experiment", dimensions: {} };
    case "incident":
      return { member: "incident", dimensions: { source: "reactive" } };
    case "delivery":
      return { member: "delivery", dimensions: {} };
    default:
      return { member: kind as GraphMember, dimensions: {} };
  }
}

/** `WorkKind` = os membros da família CAPACIDADE que são "work" no breakdown (delivery cria · maintenance preserva).
 *  exploration/experiment=APRENDIZADO · incident=RESPOSTA · proposal/register=INTAKE (tipos próprios, fora de Work).
 *  O legado (fix/patch/experiment/incident em dados/refs antigos) entra pelo `normalizeLegacyKind` na borda de leitura. */
export type WorkKind = CapabilityMember;
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
  dimensions?: Dimensions; // Lente 4 (ortogonais; opcionais nesta fatia — enforcement depois). `planned-in` = `intent` (não duplicar).
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
  promoteTo?: PromotableMember; // o membro que vira ao promover (INTAKE → capacidade/aprendizado; `incident` saiu — é reativo)
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
  description?: string; // a DESCRIÇÃO da iniciativa (consolidada do register)
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
  description?: string; // a DESCRIÇÃO da iniciativa — junto do título, o parâmetro mais importante
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
  id: string; // chave própria do item de triagem
  title: string; // o que investigar/decidir — de uma dúvida de NEGÓCIO OU levantado pela ENG na triagem
  fromDoubt?: string; // origem: o openQuestion id da register (ausente = levantado na triagem, pela eng)
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

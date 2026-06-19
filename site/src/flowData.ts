import { AI_GUIDELINES_FLOW_COPY } from "./generated/flow-copy.generated";
import { AI_GUIDELINES_FLOW_SCENARIOS } from "./generated/flow-scenarios.generated";

export type RouteId =
  | "home"
  | "flow"
  | "start"
  | "daily"
  | "team"
  | "peerReview"
  | "reference"
  | "notFound";

export type TerminalKind = "real" | "guided";

export interface FlowScenario {
  readonly id: string;
  readonly title: string;
  readonly kind: TerminalKind;
  readonly command: string;
  readonly note: string;
  readonly exitCode: number | null;
  readonly lines: readonly string[];
}

/** Transcripts gerados (reais) e exemplos guiados — fonte única para os terminais. */
export const scenarios: readonly FlowScenario[] =
  AI_GUIDELINES_FLOW_SCENARIOS as readonly FlowScenario[];

export function scenarioById(id: string): FlowScenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}

export interface RouteLink {
  readonly id: RouteId;
  readonly path: string;
  readonly label: string;
  readonly shortLabel: string;
}

export interface TerminalLine {
  readonly text: string;
  readonly tone?: "normal" | "active" | "muted" | "warn" | "success";
}

export interface FlowStep {
  readonly title: string;
  readonly text: string;
  readonly command?: string;
  readonly lines: readonly TerminalLine[];
}

export interface Journey {
  readonly id: RouteId;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly command: string;
  readonly whenToUse: readonly string[];
  readonly steps: readonly FlowStep[];
  /** Cenário gerado (real/guiado) associado — surface do terminal verídico. */
  readonly scenarioId?: string;
}

export interface ReferenceGroup {
  readonly title: string;
  readonly text: string;
  readonly items: readonly {
    readonly label: string;
    readonly hint: string;
  }[];
}

const copy = AI_GUIDELINES_FLOW_COPY;

/**
 * Superfície de comandos REAL projetada do registry da CLI (flow-copy.generated,
 * gerado por `npm run site:flow:sync`). Toda invocação exibida no site é
 * DERIVADA daqui: um nome de comando inexistente quebra o build do site —
 * fecha o achado B1 (nenhum comando inventado, nenhuma 2ª fonte de verdade).
 */
const COMMAND_NAMES: ReadonlySet<string> = new Set(copy.commands.map((command) => command.name));

function assertCommand(name: string): string {
  if (!COMMAND_NAMES.has(name)) {
    throw new Error(
      `flowData: comando "${name}" não existe no registry projetado da CLI (flow-copy.generated).`
    );
  }
  return name;
}

/** `npm run flow -- <cmd> [args]` — superfície humana local, derivada e validada. */
export function flowCommand(name: string, ...args: readonly string[]): string {
  return ["npm run flow --", assertCommand(name), ...args].join(" ");
}

/** `npx ai-guidelines <cmd> [args]` — superfície do consumidor, derivada e validada. */
export function binCommand(name: string, ...args: readonly string[]): string {
  return ["npx ai-guidelines", assertCommand(name), ...args].join(" ");
}

/** Invocação nua do guia situado (wizard) — entrada sem subcomando. */
export const FLOW_WIZARD = "npm run flow";

const commandByName = new Map(copy.commands.map((command) => [command.name, command] as const));

/**
 * Item de referência DERIVADO: label e hint vêm do descriptor real do comando
 * (a `description` do registry é a única fonte). Nome inexistente quebra o build.
 * A escolha de QUAIS comandos listar é editorial; a existência e os textos não.
 */
function commandReference(name: string): { readonly label: string; readonly hint: string } {
  const command = commandByName.get(assertCommand(name));
  if (!command) {
    throw new Error(`flowData: comando "${name}" ausente no registry projetado (referência).`);
  }
  return { label: command.name, hint: command.description };
}

/** Subconjunto curado da superfície humana exibido na referência (FK validada). */
const HUMAN_COMMAND_SURFACE: readonly string[] = [
  "init",
  "adopt",
  "update",
  "work",
  "decide",
  "specs",
  "peer-review",
];

export const routes: readonly RouteLink[] = [
  { id: "home", path: "/", label: "Produto", shortLabel: "Produto" },
  { id: "flow", path: "/flow", label: "Como funciona", shortLabel: "Flow" },
  { id: "start", path: "/flow/start", label: "Começar", shortLabel: "Começar" },
  { id: "daily", path: "/flow/daily", label: "Uso diário", shortLabel: "Uso" },
  { id: "team", path: "/flow/team", label: "Em time", shortLabel: "Time" },
  { id: "peerReview", path: "/flow/review", label: "Review entre pares", shortLabel: "Review" },
  { id: "reference", path: "/flow/reference", label: "Referência", shortLabel: "Ref." },
];

export const startJourneys: readonly Journey[] = [
  {
    id: "start",
    eyebrow: "Projeto novo",
    title: "Inicializar um projeto governado",
    summary:
      "Use quando a pasta ainda está limpa e você quer nascer com baseline, práticas, IA e validações já organizadas.",
    command: flowCommand("init"),
    scenarioId: "new-project",
    whenToUse: [
      "pasta vazia ou projeto ainda sem histórico para preservar",
      "você quer escolher providers, práticas e colaboração antes de escrever arquivos",
      "o preview precisa mostrar exatamente o que será criado",
    ],
    steps: [
      {
        title: "Detectar começo limpo",
        text: "O guia entende que o caminho natural é iniciar. Adopt e update não aparecem como ação principal.",
        command: flowCommand("init"),
        lines: [
          { text: "Pasta vazia detectada", tone: "normal" },
          { text: "Inicializar um projeto governado", tone: "active" },
          { text: "Adotar repo existente não se aplica aqui", tone: "muted" },
          { text: "Atualizar repo governado não se aplica aqui", tone: "muted" },
        ],
      },
      {
        title: "Escolher identidade e colaboração",
        text: "Nome, target, package manager e modo de colaboração entram como escolhas explícitas.",
        lines: [
          { text: "Nome do projeto: meu-app", tone: "active" },
          { text: "Package manager: npm", tone: "active" },
          { text: "Colaboração: solo, contributor ou time", tone: "active" },
          { text: "Mudanças de colaboração recebem aviso de autoridade", tone: "warn" },
        ],
      },
      {
        title: "Selecionar IA e práticas",
        text: "Providers e práticas aparecem por intenção, com ajuda curta em vez de flags soltas.",
        lines: [
          { text: copy.provisioning.providerQuestion, tone: "normal" },
          { text: copy.provisioning.providerGroups.primary, tone: "success" },
          { text: "Claude, Gemini, OpenAI/Codex, GitHub Copilot", tone: "active" },
          { text: copy.provisioning.featureGroups.infrastructure, tone: "success" },
          { text: "Prettier, Husky, CI, Quality Gates, TDD e BDD", tone: "active" },
        ],
      },
      {
        title: "Revisar preview e aplicar",
        text: "Nada é escrito antes da confirmação. Dry-run permite revisar o plano sem tocar no disco.",
        lines: [
          { text: "Plano de inicialização", tone: "normal" },
          { text: "Arquivos governados: AGENTS.md, templates e config", tone: "success" },
          { text: "Práticas: CI, Prettier, Husky e Quality Gates", tone: "success" },
          { text: "Aplicar somente após confirmação humana", tone: "warn" },
        ],
      },
    ],
  },
  {
    id: "start",
    eyebrow: "Repo existente",
    title: "Adotar sem apagar o que já existe",
    summary:
      "Use quando o projeto já tem código, configs ou histórico. O caminho conservador preserva conteúdo e mostra conflitos antes de aplicar.",
    command: flowCommand("adopt"),
    scenarioId: "existing-repo",
    whenToUse: [
      "repo com package.json, código ou práticas existentes",
      "você quer integrar ai-guidelines sem recomeçar o projeto",
      "conflitos precisam virar decisão visível, não sobrescrita silenciosa",
    ],
    steps: [
      {
        title: "Ler o estado atual",
        text: "O guia olha arquivos existentes, package manager, providers e práticas já presentes.",
        lines: [
          { text: "Repo existente detectado", tone: "normal" },
          { text: "Adotar preservando conteúdo local", tone: "active" },
          { text: "Init não é sugerido como caminho principal", tone: "muted" },
        ],
      },
      {
        title: "Encontrar conflitos",
        text: "Arquivos já existentes, formatter rival ou hooks próprios aparecem como pontos de decisão.",
        lines: [
          { text: "Conflito: package.json já existe", tone: "warn" },
          { text: "Conflito: formatter rival detectado", tone: "warn" },
          { text: "Use force ou force-prettier só com decisão explícita", tone: "normal" },
        ],
      },
      {
        title: "Selecionar práticas possíveis",
        text: "A pessoa pode escolher IA, qualidade, TDD/BDD e colaboração sem perder o baseline do repo.",
        lines: [
          { text: "Assistentes principais do repositório", tone: "success" },
          { text: "Infraestrutura: CI, Prettier, Husky", tone: "success" },
          { text: "Idioma das práticas: Português ou English", tone: "active" },
        ],
      },
      {
        title: "Aplicar com merge conservador",
        text: "Managed blocks entram onde é seguro. O que não puder ser decidido automaticamente fica bloqueado com motivo.",
        lines: [
          { text: "Preservar conteúdo existente", tone: "success" },
          { text: "Adicionar blocos gerenciados", tone: "success" },
          { text: "Dry-run não escreve nada", tone: "muted" },
        ],
      },
    ],
  },
];

export const dailyJourney: Journey = {
  id: "daily",
  scenarioId: "daily-work",
  eyebrow: "Repo em uso",
  title: "Operar o dia a dia sem lembrar a sequência de comandos",
  summary:
    "Depois que o repo já usa ai-guidelines, o caminho normal é continuar trabalho, validar o diff, atualizar práticas e preparar decisões humanas.",
  command: FLOW_WIZARD,
  whenToUse: [
    "você voltou para uma sessão e precisa entender o estado",
    "há uma spec ativa, um PR Draft ou decisões pendentes",
    "você precisa validar, revisar, atualizar providers/práticas ou preparar Ready/Gate",
  ],
  steps: [
    {
      title: "Entender o estado",
      text: "O guia lê branch, PR, CI, findings, tasks.md e próxima ação sem depender da memória do agente.",
      command: FLOW_WIZARD,
      lines: [
        { text: "Estado atual: spec, PR, CI e working tree", tone: "normal" },
        { text: "Próxima ação recomendada", tone: "active" },
        { text: "Alternativas disponíveis", tone: "success" },
        { text: "Bloqueios explicados em linguagem humana", tone: "warn" },
      ],
    },
    {
      title: "Validar mudanças",
      text: "Durante Draft, o caminho rápido valida só o diff. Antes de Ready/Human Gate, a validação completa continua disponível.",
      command: flowCommand("validate", "changed"),
      lines: [
        { text: copy.wizard.validation.changed, tone: "active" },
        { text: copy.wizard.validation.changedFix, tone: "warn" },
        { text: "Validação completa: npm run validate", tone: "normal" },
      ],
    },
    {
      title: "Atualizar o repo governado",
      text: "Update reaplica runtime, templates, providers, features e práticas sem voltar para init/adopt.",
      command: flowCommand("update"),
      lines: [
        { text: "Base: runtime, templates e config", tone: "success" },
        { text: "IA: providers por seleção agrupada", tone: "success" },
        { text: "Qualidade: CI, Prettier, Husky e Quality Gates", tone: "success" },
        { text: "Limpeza: prune remove órfãos quando autorizado", tone: "warn" },
      ],
    },
    {
      title: "Preparar decisões",
      text: "Ready, Human Gate e merge não são atalhos. O sistema mostra briefing, preview e bloqueios antes de qualquer decisão.",
      command: flowCommand("decide", "--brief-only"),
      lines: [
        { text: "Decisões disponíveis", tone: "success" },
        { text: "Decisões bloqueadas com motivo factual", tone: "warn" },
        { text: "Ações proibidas não ficam executáveis", tone: "muted" },
      ],
    },
  ],
};

export const teamJourney: Journey = {
  id: "team",
  scenarioId: "multi-spec",
  eyebrow: "Time e múltiplas specs",
  title: "Escolher a frente certa antes de trabalhar",
  summary:
    "Quando existem várias specs ou pessoas trabalhando em paralelo, o fluxo precisa evitar branch errada, PR errado e criação de spec sem autorização.",
  command: flowCommand("specs"),
  whenToUse: [
    "há mais de uma spec aberta",
    "você precisa continuar uma spec específica",
    "a demanda talvez exija criar uma spec nova",
  ],
  steps: [
    {
      title: "Ver specs abertas",
      text: "A lista pública mostra id, branch, PR, status e possíveis divergências antes de escolher.",
      command: flowCommand("specs"),
      lines: [
        { text: "Specs abertas no índice governado", tone: "normal" },
        { text: "0024 context-architecture", tone: "active" },
        { text: "Branch esperada e PR associado", tone: "success" },
        { text: "Drift aparece como bloqueio, não como suposição", tone: "warn" },
      ],
    },
    {
      title: "Continuar uma spec específica",
      text: "A pessoa informa número, slug ou branch. O sistema confere se o checkout local combina.",
      command: flowCommand("continue", "0024"),
      lines: [
        { text: "Spec escolhida: 0024", tone: "active" },
        { text: "Branch atual combina com a spec", tone: "success" },
        { text: "Se não combinar, orientar checkout antes de continuar", tone: "warn" },
      ],
    },
    {
      title: "Iniciar spec nova",
      text: "O guia explica autoridade e precondições, mas não cria branch, PR ou topologia sozinho.",
      lines: [
        { text: "Confirmar se a demanda não pertence a spec aberta", tone: "normal" },
        { text: "Definir objetivo, owner, impacto e tipo de mudança", tone: "active" },
        { text: "Pedir autorização para materializar branch e PR Draft", tone: "warn" },
      ],
    },
    {
      title: "Preservar autoridade humana",
      text: "Contributor propõe, maintainer materializa quando autorizado, owner decide topologia, Ready, Gate e merge.",
      lines: [
        { text: "Contributor: propõe e prepara contexto", tone: "normal" },
        { text: "Maintainer: autoriza materialização operacional", tone: "normal" },
        { text: "Owner: decide Ready, Human Gate, topologia e merge", tone: "active" },
      ],
    },
  ],
};

export const peerReviewJourney: Journey = {
  id: "peerReview",
  scenarioId: "peer-review",
  eyebrow: "Review entre pares",
  title: "Revisar PR de outra pessoa sem perder sua branch",
  summary:
    "O fluxo separa revisão de colega do seu trabalho atual: primeiro mostra o PR, depois prepara worktree separado ou checkout guiado.",
  command: flowCommand("peer-review", "43", "--brief-only"),
  whenToUse: [
    "você está em uma spec própria e precisa revisar outro PR",
    "não quer misturar arquivos locais com a branch do colega",
    "precisa entender o PR antes de trocar de contexto",
  ],
  steps: [
    {
      title: "Escolher o PR",
      text: "O briefing mostra título, estado, branch, base, link e working tree antes de qualquer ação.",
      command: flowCommand("peer-review", "43", "--brief-only"),
      lines: [
        { text: "Review entre pares — PR #43", tone: "normal" },
        { text: "Branch do PR e base do PR", tone: "active" },
        { text: "Working tree limpa ou suja", tone: "success" },
        { text: "Nenhuma alteração feita no brief-only", tone: "muted" },
      ],
    },
    {
      title: "Escolher como abrir",
      text: "Worktree separado é recomendado para preservar sua branch. Checkout guiado troca esta pasta e exige tree limpa.",
      lines: [
        { text: "Worktree separado em .temp/peer-review/pr-43", tone: "active" },
        { text: "Checkout guiado nesta pasta", tone: "normal" },
        { text: "Checkout bloqueia se houver mudança local", tone: "warn" },
      ],
    },
    {
      title: "Preparar ambiente",
      text: "A preparação busca a branch do PR e cria o espaço de revisão, sem Ready, Gate, merge ou transição.",
      command: flowCommand("peer-review", "43", "--mode", "worktree", "--confirm"),
      lines: [
        { text: "Fetch pull/43/head", tone: "normal" },
        { text: "Criar worktree isolado", tone: "success" },
        { text: "Próximo passo: cd .temp/peer-review/pr-43 && npm run flow", tone: "active" },
      ],
    },
    {
      title: "Revisar e voltar",
      text: "Depois da revisão, a pessoa volta à branch original sem misturar lifecycle da spec própria com o PR revisado.",
      lines: [
        { text: "Rodar validações ou review governado no worktree", tone: "normal" },
        { text: "Não executar Human Gate do PR alheio por acidente", tone: "warn" },
        { text: "Voltar à branch original quando terminar", tone: "success" },
      ],
    },
  ],
};

export const referenceGroups: readonly ReferenceGroup[] = [
  {
    title: "Assistentes de IA",
    text: "Providers aparecem como canais de contexto, não como comandos separados.",
    items: Object.values(copy.providers).map((provider) => ({
      label: provider.label,
      hint: provider.htmlHint || provider.hint,
    })),
  },
  {
    title: "Práticas e qualidade",
    text: "Práticas podem entrar no init/adopt e também ser atualizadas depois com update.",
    items: Object.values(copy.features).map((feature) => ({
      label: feature.label,
      hint: feature.htmlLabel || feature.hint,
    })),
  },
  {
    title: "Comandos humanos principais",
    text: "A superfície humana local é npm run flow; o binário público continua ai-guidelines. Cada descrição vem do registry real da CLI.",
    items: [
      // `flow` é a invocação nua do wizard (não é um comando do registry): item editorial explícito.
      { label: "flow", hint: "abre o guia situado do repo (wizard, sem subcomando)" },
      ...HUMAN_COMMAND_SURFACE.map(commandReference),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Conteúdo de produto. Prosa editorial — mas todo FATO operacional (comando,
// provider, feature, decisão) vem da camada derivada/validada acima.
// ─────────────────────────────────────────────────────────────────────────

export interface ProductPoint {
  readonly title: string;
  readonly text: string;
}

export const productProblems: readonly ProductPoint[] = [
  {
    title: "O contexto se perde",
    text: "Cada nova sessão começa reconstruindo o que já era sabido: estado, decisões e próximos passos somem entre uma conversa e outra.",
  },
  {
    title: "Decisões ficam espalhadas",
    text: "O porquê de cada escolha mora em threads, mensagens e memória — não em um lugar versionado que o time e a IA conseguem ler.",
  },
  {
    title: "PRs viram blocos enormes",
    text: "Sem fatias e gates claros, a revisão acumula e o risco cresce. Ninguém sabe ao certo o que falta para concluir.",
  },
  {
    title: "A IA não tem memória confiável",
    text: "Assistentes inferem o fluxo a cada vez. Sem fonte de verdade, repetem suposições e divergem do estado real do repo.",
  },
  {
    title: "O fluxo depende de memória humana",
    text: "Lembrar a sequência certa — validar, revisar, marcar pronto, decidir — vira trabalho manual frágil e fácil de pular.",
  },
];

export const productSolutions: readonly ProductPoint[] = [
  {
    title: "Estado governado no repositório",
    text: "Specs, decisões, reviews, gates e próximos passos vivem em arquivos versionados — a mesma base factual para humanos e IAs.",
  },
  {
    title: "Próxima ação derivada",
    text: "O guia lê o estado real e mostra o próximo passo único, com alternativas e bloqueios explicados em linguagem humana.",
  },
  {
    title: "Decisões humanas explícitas",
    text: "Ready, Human Gate e merge são decisões situadas, com evidência e bloqueios — nunca atalhos automáticos.",
  },
  {
    title: "Uma fonte, três projeções",
    text: "CLI, wizard e este site projetam o mesmo fluxo. O que você lê aqui é derivado do runtime real, não reescrito à mão.",
  },
];

export interface AudiencePath {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly text: string;
  readonly route: RouteId;
  readonly command: string;
}

export const audiencePaths: readonly AudiencePath[] = [
  {
    id: "new",
    label: "Projeto novo",
    title: "Começar do zero, já governado",
    text: "Pasta limpa: nasça com baseline, providers, práticas e validações organizados.",
    route: "start",
    command: binCommand("init"),
  },
  {
    id: "adopt",
    label: "Repo existente",
    title: "Adotar sem apagar o que existe",
    text: "Já tem código: o caminho conservador preserva conteúdo e mostra conflitos antes de aplicar.",
    route: "start",
    command: binCommand("adopt", "--dry-run"),
  },
  {
    id: "daily",
    label: "Repo já governado",
    title: "Trabalhar no dia a dia",
    text: "Abra o guia situado: estado, próxima ação, validação e decisões — sem decorar comandos.",
    route: "daily",
    command: FLOW_WIZARD,
  },
];

export const safetyRails: readonly ProductPoint[] = [
  {
    title: "Ready não é merge",
    text: "Marcar pronto sinaliza que a fatia satisfez seus critérios — não integra nada sozinho.",
  },
  {
    title: "Human Gate exige um humano",
    text: "O avanço do checkpoint é decisão da owner; o gate é registrado depois da decisão, nunca antes.",
  },
  {
    title: "Merge só no momento certo",
    text: "A integração acontece no nó terminal do fluxo — não em um PR isolado fora de hora.",
  },
  {
    title: "Ação bloqueada mostra o motivo",
    text: "O que não pode ser feito agora aparece como bloqueio explicado, não como botão que falha em silêncio.",
  },
];

/** Decisões reservadas ao humano — DERIVADAS do registry de decisões (A2). */
export const humanDecisions: readonly { readonly id: string; readonly title: string }[] =
  copy.decisions;

export interface GlossaryEntry {
  readonly term: string;
  readonly definition: string;
}

/** Termos de comando derivam a definição do registry; conceitos são editoriais. */
const glossaryFromCommand = (name: string): GlossaryEntry => ({
  term: name,
  definition: commandReference(name).hint,
});

export const glossary: readonly GlossaryEntry[] = [
  glossaryFromCommand("init"),
  glossaryFromCommand("adopt"),
  glossaryFromCommand("update"),
  glossaryFromCommand("work"),
  glossaryFromCommand("decide"),
  glossaryFromCommand("specs"),
  glossaryFromCommand("peer-review"),
  {
    term: "handoff",
    definition: commandByName.get("handoff")?.description ?? "retomada situada de contexto.",
  },
  {
    term: "Ready",
    definition:
      "estado em que a fatia declara que satisfez seus critérios de saída. Não faz merge.",
  },
  {
    term: "Human Gate",
    definition: "decisão humana que autoriza concluir o checkpoint. Registrada depois da decisão.",
  },
  {
    term: "merge",
    definition: "integração final do trabalho, no momento e nó corretos do fluxo governado.",
  },
  {
    term: "worktree",
    definition: "cópia isolada do repo para revisar o PR de outra pessoa sem perder sua branch.",
  },
  {
    term: "managed block",
    definition:
      "trecho gerenciado pelo framework dentro de um arquivo; o resto do conteúdo fica intocado.",
  },
  {
    term: "drift",
    definition:
      "divergência entre o estado projetado e os fatos reais; vira bloqueio, não suposição.",
  },
  {
    term: "spec",
    definition:
      "unidade de trabalho governado com estado, plano, tarefas, reviews e gates próprios.",
  },
];

export function routeFromPath(pathname: string): RouteId {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/") return "home";
  if (normalized === "/flow") return "flow";
  // Paths canônicos EN + aliases PT antigos (links existentes continuam válidos).
  if (normalized === "/flow/start" || normalized === "/flow/comecar") return "start";
  if (normalized === "/flow/daily" || normalized === "/flow/uso-diario") return "daily";
  if (normalized === "/flow/team" || normalized === "/flow/time") return "team";
  if (normalized === "/flow/review" || normalized === "/flow/review-entre-pares")
    return "peerReview";
  if (normalized === "/flow/reference" || normalized === "/flow/referencia") return "reference";
  // Rota desconhecida vira 404 explícito (não soft-404 silencioso que caía em "flow").
  return "notFound";
}

export function routePath(id: RouteId): string {
  return routes.find((route) => route.id === id)?.path ?? "/";
}

/** Título por rota (SEO/a11y) — projeta o label da rota no <title> do documento. */
export function routeTitle(id: RouteId): string {
  if (id === "home") return "ai-guidelines — governança de engenharia para times com IA";
  if (id === "notFound") return "ai-guidelines — página não encontrada";
  const route = routes.find((item) => item.id === id);
  return route ? `ai-guidelines — ${route.label}` : "ai-guidelines";
}

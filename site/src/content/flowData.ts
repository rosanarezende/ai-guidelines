import { AI_GUIDELINES_FLOW_COPY } from "@generated/flow-copy.generated";
import { AI_GUIDELINES_FLOW_SCENARIOS } from "@generated/flow-scenarios.generated";

export type RouteId =
  | "home"
  | "flow"
  | "start"
  | "daily"
  | "team"
  | "peerReview"
  | "reference"
  | "contribute"
  | "notFound";

export type TerminalKind = "real" | "guided";
export type TerminalSurface = "public" | "contributor";

export interface FlowScenario {
  readonly id: string;
  readonly title: string;
  readonly kind: TerminalKind;
  readonly surface: TerminalSurface;
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
  readonly directCommand?: string;
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

interface ProviderCopy {
  readonly label: string;
  readonly hint: string;
  readonly htmlHint?: string;
}

interface FeatureCopy {
  readonly label: string;
  readonly hint: string;
  readonly htmlLabel?: string;
}

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

/**
 * SUPERFÍCIE PÚBLICA (consumidor do framework). `npx ai-guidelines <cmd>` é o
 * comando que o usuário roda. O nome é validado contra o registry real — comando
 * inexistente quebra o build (B1). A superfície de contribuidor (alias local
 * deste repo) fica isolada na seção CONTRIBUTOR no fim do arquivo.
 */
export function binCommand(name: string, ...args: readonly string[]): string {
  return ["npx ai-guidelines", assertCommand(name), ...args].join(" ");
}

/** Invocação nua do binário público — abre o guia situado, sem subcomando. */
export const BIN_WIZARD = "npx ai-guidelines";

/** Item de referência público: nome VALIDADO contra o registry + hint curado (consumidor). */
function publicCommand(
  name: string,
  hint: string
): { readonly label: string; readonly hint: string } {
  return { label: assertCommand(name), hint };
}

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
      "Abra o guia interativo. Ele detecta que a pasta está limpa e oferece inicializar como caminho principal.",
    command: BIN_WIZARD,
    directCommand: binCommand("init", "--dry-run"),
    scenarioId: "new-project",
    whenToUse: [
      "pasta vazia ou projeto ainda sem histórico para preservar",
      "você quer escolher providers, práticas e colaboração antes de escrever arquivos",
      "o preview precisa mostrar exatamente o que será criado",
    ],
    steps: [
      {
        title: "Detectar começo limpo",
        text: "A pessoa roda apenas o guia. A CLI entende que o caminho natural é iniciar; adopt e update não aparecem como ação principal.",
        command: BIN_WIZARD,
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
      "Abra o guia interativo. Ele detecta arquivos existentes, oferece adoção conservadora e mostra conflitos antes de aplicar.",
    command: BIN_WIZARD,
    directCommand: binCommand("adopt", "--dry-run"),
    scenarioId: "existing-repo",
    whenToUse: [
      "repo com package.json, código ou práticas existentes",
      "você quer integrar ai-guidelines sem recomeçar o projeto",
      "conflitos precisam virar decisão visível, não sobrescrita silenciosa",
    ],
    steps: [
      {
        title: "Ler o estado atual",
        text: "A pessoa roda o mesmo guia. Ele olha arquivos existentes, package manager, providers e práticas já presentes.",
        command: BIN_WIZARD,
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
    "Depois que o repo já usa ai-guidelines, abra o guia interativo. Ele mostra estado, próxima ação, validação, atualizações e decisões humanas.",
  command: BIN_WIZARD,
  directCommand: binCommand("update", "--dry-run"),
  whenToUse: [
    "você voltou para uma sessão e precisa entender o estado",
    "há uma spec ativa, um PR Draft ou decisões pendentes",
    "você precisa validar, revisar, atualizar providers/práticas ou preparar Ready/Gate",
  ],
  steps: [
    {
      title: "Entender o estado",
      text: "O guia lê branch, PR, CI, findings, tasks.md e próxima ação sem depender da memória do agente.",
      command: BIN_WIZARD,
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
      command: BIN_WIZARD,
      lines: [
        { text: copy.wizard.validation.changed, tone: "active" },
        { text: copy.wizard.validation.changedFix, tone: "warn" },
        { text: "Validação completa: npm run validate", tone: "normal" },
      ],
    },
    {
      title: "Atualizar o repo governado",
      text: "Update reaplica runtime, templates, providers, features e práticas sem voltar para init/adopt.",
      command: BIN_WIZARD,
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
      command: BIN_WIZARD,
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
    "Quando existem várias specs ou pessoas trabalhando em paralelo, o guia ajuda a escolher a frente certa antes de executar qualquer coisa.",
  command: BIN_WIZARD,
  directCommand: binCommand("specs"),
  whenToUse: [
    "há mais de uma spec aberta",
    "você precisa continuar uma spec específica",
    "a demanda talvez exija criar uma spec nova",
  ],
  steps: [
    {
      title: "Ver specs abertas",
      text: "A lista pública mostra id, branch, PR, status e possíveis divergências antes de escolher.",
      command: BIN_WIZARD,
      lines: [
        { text: "Specs abertas no índice governado", tone: "normal" },
        { text: "minha-spec — área do projeto", tone: "active" },
        { text: "Branch esperada e PR associado", tone: "success" },
        { text: "Drift aparece como bloqueio, não como suposição", tone: "warn" },
      ],
    },
    {
      title: "Continuar uma spec específica",
      text: "A pessoa informa número, slug ou branch. O sistema confere se o checkout local combina.",
      command: BIN_WIZARD,
      lines: [
        { text: "Spec escolhida", tone: "active" },
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
    "O guia separa revisão de colega do seu trabalho atual: primeiro mostra o PR, depois prepara worktree separado ou checkout guiado.",
  command: BIN_WIZARD,
  directCommand: binCommand("peer-review", "<pr>", "--brief-only"),
  whenToUse: [
    "você está em uma spec própria e precisa revisar outro PR",
    "não quer misturar arquivos locais com a branch do colega",
    "precisa entender o PR antes de trocar de contexto",
  ],
  steps: [
    {
      title: "Escolher o PR",
      text: "O briefing mostra título, estado, branch, base, link e working tree antes de qualquer ação.",
      command: BIN_WIZARD,
      lines: [
        { text: "Review entre pares — PR de um colega", tone: "normal" },
        { text: "Branch do PR e base do PR", tone: "active" },
        { text: "Working tree limpa ou suja", tone: "success" },
        { text: "Nenhuma alteração feita no brief-only", tone: "muted" },
      ],
    },
    {
      title: "Escolher como abrir",
      text: "Worktree separado é recomendado para preservar sua branch. Checkout guiado troca esta pasta e exige tree limpa.",
      lines: [
        { text: "Worktree separado em .temp/peer-review/pr-<n>", tone: "active" },
        { text: "Checkout guiado nesta pasta", tone: "normal" },
        { text: "Checkout bloqueia se houver mudança local", tone: "warn" },
      ],
    },
    {
      title: "Preparar ambiente",
      text: "A preparação busca a branch do PR e cria o espaço de revisão, sem Ready, Gate, merge ou transição.",
      command: BIN_WIZARD,
      lines: [
        { text: "Fetch pull/<pr>/head", tone: "normal" },
        { text: "Criar worktree isolado", tone: "success" },
        { text: "Próximo passo: cd .temp/peer-review/pr-<n> && npx ai-guidelines", tone: "active" },
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
    items: Object.values(copy.providers as Record<string, ProviderCopy>).map((provider) => ({
      label: provider.label,
      hint: provider.htmlHint || provider.hint,
    })),
  },
  {
    title: "Práticas e qualidade",
    text: "Práticas podem entrar no init/adopt e também ser atualizadas depois com update.",
    items: Object.values(copy.features as Record<string, FeatureCopy>).map((feature) => ({
      label: feature.label,
      hint: feature.htmlLabel || feature.hint,
    })),
  },
  {
    title: "Atalhos diretos públicos",
    text: "O caminho principal é `npx ai-guidelines`, que abre o guia interativo. Estes atalhos existem para automação ou para quem já sabe exatamente o que quer. Cada nome é validado contra o registry real da CLI.",
    items: [
      publicCommand("init", "inicia um projeto novo, já governado"),
      publicCommand("adopt", "adota o framework em um repo existente, preservando o que há"),
      publicCommand("update", "reaplica runtime, templates, assistentes e práticas"),
      publicCommand("work", "mostra estado, próxima ação e validações da sessão"),
      publicCommand("specs", "lista as specs abertas do seu projeto"),
      publicCommand("peer-review", "prepara a revisão do PR de um colega sem perder sua branch"),
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
  readonly directCommand?: string;
}

export const audiencePaths: readonly AudiencePath[] = [
  {
    id: "new",
    label: "Projeto novo",
    title: "Começar do zero, já governado",
    text: "Pasta limpa: nasça com baseline, providers, práticas e validações organizados.",
    route: "start",
    command: BIN_WIZARD,
    directCommand: binCommand("init", "--dry-run"),
  },
  {
    id: "adopt",
    label: "Repo existente",
    title: "Adotar sem apagar o que existe",
    text: "Já tem código: o caminho conservador preserva conteúdo e mostra conflitos antes de aplicar.",
    route: "start",
    command: BIN_WIZARD,
    directCommand: binCommand("adopt", "--dry-run"),
  },
  {
    id: "daily",
    label: "Repo já governado",
    title: "Trabalhar no dia a dia",
    text: "Abra o guia situado: estado, próxima ação, validação e decisões — sem decorar comandos.",
    route: "daily",
    command: BIN_WIZARD,
  },
];

export interface WizardDemoStep {
  readonly title: string;
  readonly prompt: string;
  readonly selected: string;
  readonly help: string;
  readonly derivedFrom?: string;
}

export interface WizardDemo {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly command: string;
  readonly steps: readonly WizardDemoStep[];
}

export const publicWizardDemo: WizardDemo = {
  eyebrow: "Caminho principal",
  title: "O usuário não precisa decorar comandos.",
  lead: "Rode o guia interativo e escolha o que quer fazer. Os comandos diretos existem para automação e para quem já sabe exatamente o caminho.",
  command: BIN_WIZARD,
  steps: [
    {
      title: "Abrir o guia",
      prompt: "O que você quer fazer?",
      selected: "Escolher o melhor caminho para este repositório",
      help: "O guia olha o estado local antes de sugerir init, adopt, update ou trabalho diário.",
    },
    {
      title: "Escolher intenção",
      prompt: "Este repositório parece estar em qual momento?",
      selected: "Projeto novo, repo existente ou repo já governado",
      help: "A escolha principal vem do estado detectado; a pessoa pode revisar antes de aplicar.",
    },
    {
      title: "Selecionar práticas",
      prompt: copy.provisioning.featureInstallQuestion,
      selected: `${copy.provisioning.featureGroups.infrastructure}: Prettier, Husky, CI e Quality Gates`,
      help: "Providers e features vêm dos catálogos reais da CLI, não de uma lista escrita só para o site.",
      derivedFrom: "features",
    },
    {
      title: "Revisar preview",
      prompt: "Aplicar estas mudanças?",
      selected: "Confirmar apenas depois de ver arquivos, blocos gerenciados e validações",
      help: "Dry-run e preview deixam claro o que será criado ou atualizado antes de tocar no disco.",
    },
  ],
};

export const safetyRails: readonly ProductPoint[] = [
  {
    title: "Ready não é merge",
    text: "Marcar pronto sinaliza que a fatia satisfez seus critérios — não integra nada sozinho.",
  },
  {
    title: "Human Gate exige um humano",
    text: "Aprovar o avanço é decisão da owner; o registro acontece depois da decisão, nunca antes.",
  },
  {
    title: "Merge só no momento certo",
    text: "A integração acontece no momento certo do fluxo — não em um PR isolado fora de hora.",
  },
  {
    title: "Ação bloqueada mostra o motivo",
    text: "O que não pode ser feito agora aparece como bloqueio explicado, não como botão que falha em silêncio.",
  },
];

/**
 * O que o humano decide — descrito em linguagem de produto. Os nomes técnicos
 * das decisões governadas (registry) são validados pelo guard de capacidades
 * (siteCapabilities.test); aqui o foco é o que a pessoa entende.
 */
export const publicHumanDecisions: readonly { readonly id: string; readonly title: string }[] = [
  { id: "ready", title: "Marcar o trabalho como pronto (Ready)" },
  { id: "human-gate", title: "Aprovar o avanço (Human Gate)" },
  { id: "merge", title: "Fazer o merge no momento certo" },
  { id: "review", title: "Aceitar ou pedir mudanças num review" },
];

export interface GlossaryEntry {
  readonly term: string;
  readonly definition: string;
}

/** Glossário consumer-first: definições em linguagem de produto, sem jargão interno. */
export const glossary: readonly GlossaryEntry[] = [
  { term: "init", definition: "começa um projeto novo já governado, em uma pasta limpa." },
  { term: "adopt", definition: "adota o framework em um repo existente, preservando o conteúdo." },
  { term: "update", definition: "reaplica runtime, templates, assistentes e práticas no repo." },
  { term: "work", definition: "mostra o estado da sessão, a próxima ação e as validações." },
  { term: "specs", definition: "lista as specs (frentes de trabalho) abertas do seu projeto." },
  {
    term: "peer-review",
    definition: "prepara a revisão do PR de um colega sem misturar com a sua branch.",
  },
  {
    term: "spec",
    definition: "uma frente de trabalho governada, com estado, plano, tarefas e decisões próprias.",
  },
  {
    term: "Ready",
    definition: "quando o trabalho declara que satisfez seus critérios. Não faz merge sozinho.",
  },
  {
    term: "Human Gate",
    definition: "a decisão humana que autoriza concluir uma etapa. Registrada após a decisão.",
  },
  {
    term: "merge",
    definition: "a integração final do trabalho, feita no momento certo do fluxo.",
  },
  {
    term: "worktree",
    definition: "uma cópia isolada do repo para revisar outro PR sem perder a sua branch.",
  },
  {
    term: "managed block",
    definition: "um trecho que o framework mantém dentro de um arquivo; o resto fica intocado.",
  },
];

/**
 * Rota SECUNDÁRIA de contribuidor — fora da nav principal para não competir com
 * os fluxos de usuário (fica no rodapé / link discreto).
 */
export const contributeRoute: RouteLink = {
  id: "contribute",
  path: "/contribute",
  label: "Contribuindo",
  shortLabel: "Contribuindo",
};

const allRoutes: readonly RouteLink[] = [...routes, contributeRoute];

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
  if (normalized === "/contribute") return "contribute";
  // Rota desconhecida vira 404 explícito (não soft-404 silencioso que caía em "flow").
  return "notFound";
}

export function routePath(id: RouteId): string {
  return allRoutes.find((route) => route.id === id)?.path ?? "/";
}

/** Título por rota (SEO/a11y) — projeta o label da rota no <title> do documento. */
export function routeTitle(id: RouteId): string {
  if (id === "home") return "ai-guidelines — governança de engenharia para times com IA";
  if (id === "notFound") return "ai-guidelines — página não encontrada";
  const route = allRoutes.find((item) => item.id === id);
  return route ? `ai-guidelines — ${route.label}` : "ai-guidelines";
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTRIBUTOR SURFACE — para quem trabalha no PRÓPRIO repositório ai-guidelines.
// Aqui (e só aqui) aparece `npm run flow`, o alias LOCAL deste repo. Nada disto
// é o caminho do usuário comum do framework.
// ═══════════════════════════════════════════════════════════════════════════

/** `npm run flow -- <cmd>` — alias LOCAL deste repo (contribuidor). Nome validado. */
export function flowCommand(name: string, ...args: readonly string[]): string {
  return ["npm run flow --", assertCommand(name), ...args].join(" ");
}

export interface ContributorBlock {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly note: string;
  readonly points: readonly ProductPoint[];
  readonly commands: readonly { readonly label: string; readonly hint: string }[];
  readonly scenarioId: string;
}

export const contributorBlock: ContributorBlock = {
  eyebrow: "Para contribuidores deste repositório",
  title: "Contribuindo com o próprio ai-guidelines",
  lead: "Esta área é para quem desenvolve o framework neste repositório — não é o caminho de quem apenas usa o ai-guidelines no próprio projeto.",
  note: "Neste repo, `npm run flow` é o alias local do guia situado. Usuários do framework usam `npx ai-guidelines`.",
  points: [
    {
      title: "Guia situado local",
      text: "`npm run flow` abre o mesmo guia, mas a partir do código-fonte deste repositório.",
    },
    {
      title: "Governança de desenvolvimento",
      text: "O ciclo do próprio framework usa specs, sub-checkpoints, reviews e Human Gate versionados.",
    },
    {
      title: "Checks internos",
      text: "`npm run validate` roda o gate completo (build, testes, projeções do site, contratos).",
    },
  ],
  commands: [
    { label: flowCommand("work"), hint: "briefing de trabalho do próprio framework" },
    {
      label: flowCommand("decide", "--brief-only"),
      hint: "decisões governadas (briefing, sem aplicar)",
    },
    { label: "npm run validate", hint: "gate completo de validação do repositório" },
  ],
  scenarioId: "contributor-flow",
};

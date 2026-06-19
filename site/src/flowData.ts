import { AI_GUIDELINES_FLOW_COPY } from "./generated/flow-copy.generated";

export type RouteId = "home" | "flow" | "start" | "daily" | "team" | "peerReview" | "reference";

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

export const routes: readonly RouteLink[] = [
  { id: "home", path: "/", label: "Produto", shortLabel: "Produto" },
  { id: "flow", path: "/flow/", label: "Visão geral", shortLabel: "Flow" },
  { id: "start", path: "/flow/comecar", label: "Começar uma vez", shortLabel: "Começar" },
  { id: "daily", path: "/flow/uso-diario", label: "Uso diário", shortLabel: "Uso" },
  { id: "team", path: "/flow/time", label: "Time e specs", shortLabel: "Time" },
  {
    id: "peerReview",
    path: "/flow/review-entre-pares",
    label: "Review entre pares",
    shortLabel: "Review",
  },
  { id: "reference", path: "/flow/referencia", label: "Referência", shortLabel: "Ref." },
];

export const startJourneys: readonly Journey[] = [
  {
    id: "start",
    eyebrow: "Projeto novo",
    title: "Inicializar um projeto governado",
    summary:
      "Use quando a pasta ainda está limpa e você quer nascer com baseline, práticas, IA e validações já organizadas.",
    command: "npm run flow -- init",
    whenToUse: [
      "pasta vazia ou projeto ainda sem histórico para preservar",
      "você quer escolher providers, práticas e colaboração antes de escrever arquivos",
      "o preview precisa mostrar exatamente o que será criado",
    ],
    steps: [
      {
        title: "Detectar começo limpo",
        text: "O guia entende que o caminho natural é iniciar. Adopt e update não aparecem como ação principal.",
        command: "npm run flow -- init",
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
    command: "npm run flow -- adopt",
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
  eyebrow: "Repo em uso",
  title: "Operar o dia a dia sem lembrar a sequência de comandos",
  summary:
    "Depois que o repo já usa ai-guidelines, o caminho normal é continuar trabalho, validar o diff, atualizar práticas e preparar decisões humanas.",
  command: "npm run flow",
  whenToUse: [
    "você voltou para uma sessão e precisa entender o estado",
    "há uma spec ativa, um PR Draft ou decisões pendentes",
    "você precisa validar, revisar, atualizar providers/práticas ou preparar Ready/Gate",
  ],
  steps: [
    {
      title: "Entender o estado",
      text: "O guia lê branch, PR, CI, findings, tasks.md e próxima ação sem depender da memória do agente.",
      command: "npm run flow",
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
      command: "npm run flow -- validate changed",
      lines: [
        { text: copy.wizard.validation.changed, tone: "active" },
        { text: copy.wizard.validation.changedFix, tone: "warn" },
        { text: "Validação completa: npm run validate", tone: "normal" },
      ],
    },
    {
      title: "Atualizar o repo governado",
      text: "Update reaplica runtime, templates, providers, features e práticas sem voltar para init/adopt.",
      command: "npm run flow -- update",
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
      command: "npm run flow -- decide --brief-only",
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
  eyebrow: "Time e múltiplas specs",
  title: "Escolher a frente certa antes de trabalhar",
  summary:
    "Quando existem várias specs ou pessoas trabalhando em paralelo, o fluxo precisa evitar branch errada, PR errado e criação de spec sem autorização.",
  command: "npm run flow -- specs",
  whenToUse: [
    "há mais de uma spec aberta",
    "você precisa continuar uma spec específica",
    "a demanda talvez exija criar uma spec nova",
  ],
  steps: [
    {
      title: "Ver specs abertas",
      text: "A lista pública mostra id, branch, PR, status e possíveis divergências antes de escolher.",
      command: "npm run flow -- specs",
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
      command: "npm run flow -- continue 0024",
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
  eyebrow: "Review entre pares",
  title: "Revisar PR de outra pessoa sem perder sua branch",
  summary:
    "O fluxo separa revisão de colega do seu trabalho atual: primeiro mostra o PR, depois prepara worktree separado ou checkout guiado.",
  command: "npm run flow -- peer-review 43 --brief-only",
  whenToUse: [
    "você está em uma spec própria e precisa revisar outro PR",
    "não quer misturar arquivos locais com a branch do colega",
    "precisa entender o PR antes de trocar de contexto",
  ],
  steps: [
    {
      title: "Escolher o PR",
      text: "O briefing mostra título, estado, branch, base, link e working tree antes de qualquer ação.",
      command: "npm run flow -- peer-review 43 --brief-only",
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
      command: "npm run flow -- peer-review 43 --mode worktree --confirm",
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
    text: "A superfície humana local é npm run flow; o binário público continua ai-guidelines.",
    items: [
      { label: "flow", hint: "abre o guia situado do repo" },
      { label: "init", hint: "inicializa projeto novo" },
      { label: "adopt", hint: "adota repo existente preservando conteúdo" },
      { label: "update", hint: "atualiza runtime, templates, providers e práticas" },
      { label: "work", hint: "gera orientação de trabalho para a sessão" },
      { label: "decide", hint: "prepara decisão humana com briefing e preview" },
      { label: "specs", hint: "lista specs abertas para trabalho em time" },
      { label: "peer-review", hint: "prepara review de PR de outra pessoa" },
    ],
  },
];

export function routeFromPath(pathname: string): RouteId {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/") return "home";
  if (normalized === "/flow") return "flow";
  if (normalized === "/flow/comecar") return "start";
  if (normalized === "/flow/uso-diario") return "daily";
  if (normalized === "/flow/time") return "team";
  if (normalized === "/flow/review-entre-pares") return "peerReview";
  if (normalized === "/flow/referencia") return "reference";
  return "flow";
}

export function routePath(id: RouteId): string {
  return routes.find((route) => route.id === id)?.path ?? "/flow/";
}

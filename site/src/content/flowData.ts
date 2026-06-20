import { AI_GUIDELINES_FLOW_COPY } from "@generated/flow-copy.generated";
import { AI_GUIDELINES_FLOW_SCENARIOS } from "@generated/flow-scenarios.generated";

export type RouteId = "home" | "cli" | "reference" | "contribute" | "notFound";

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

/** Transcripts gerados (reais) e exemplos guiados — projeção do runtime real. */
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

export const routes: readonly RouteLink[] = [
  { id: "home", path: "/", label: "O projeto", shortLabel: "Início" },
  { id: "cli", path: "/cli", label: "Simulador", shortLabel: "Simulador" },
  { id: "reference", path: "/atalhos", label: "Atalhos avançados", shortLabel: "Atalhos" },
];

/**
 * Atalhos diretos públicos — superfície SECUNDÁRIA. O caminho principal é
 * `npx ai-guidelines` (o guia). Cada label é derivada via binCommand, então o
 * nome é validado contra o registry real (comando inexistente quebra o build).
 */
export const referenceGroups: readonly ReferenceGroup[] = [
  {
    title: "Assistentes de IA",
    text: "Providers aparecem como canais de contexto, atualizados via `update --providers`. Nunca como comando separado.",
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
    title: "Atalhos diretos (avançado)",
    text: "O caminho principal é `npx ai-guidelines`, que abre o guia interativo. Estes atalhos existem para automação ou para quem já sabe exatamente o que quer. Cada nome é validado contra o registry real da CLI.",
    items: [
      { label: binCommand("init", "--dry-run"), hint: "inicia um projeto novo, já governado" },
      {
        label: binCommand("adopt", "--dry-run"),
        hint: "adota o framework em um repo existente, preservando o que há",
      },
      {
        label: binCommand("update", "--dry-run"),
        hint: "reaplica runtime, templates, assistentes e práticas",
      },
      { label: binCommand("work"), hint: "mostra estado, próxima ação e validações da sessão" },
      { label: binCommand("specs"), hint: "lista as specs abertas do seu projeto" },
      {
        label: binCommand("peer-review", "<pr>", "--brief-only"),
        hint: "prepara a revisão do PR de um colega sem perder sua branch",
      },
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
 * (siteCapabilities.test); aqui o foco é o que a pessoa entende. Reservadas a um
 * humano: nunca são atalhos automáticos.
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
  if (normalized === "/cli") return "cli";
  if (
    normalized === "/atalhos" ||
    normalized === "/flow/reference" ||
    normalized === "/flow/referencia"
  ) {
    return "reference";
  }
  if (normalized === "/contribute") return "contribute";
  // O conteúdo interativo dos links antigos (/flow, /flow/*, aliases PT) agora
  // vive no simulador /cli — sem soft-404 perdido.
  if (normalized === "/flow" || normalized.startsWith("/flow/")) return "cli";
  // Rota desconhecida vira 404 explícito.
  return "notFound";
}

export function routePath(id: RouteId): string {
  return allRoutes.find((route) => route.id === id)?.path ?? "/";
}

/** Título por rota (SEO/a11y) — projeta o label da rota no <title> do documento. */
export function routeTitle(id: RouteId): string {
  if (id === "home") return "ai-guidelines — governança para desenvolvimento com IA";
  if (id === "cli") return "ai-guidelines — simulador interativo da CLI";
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

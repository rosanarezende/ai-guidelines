// model.ts — vocabulario de adocao da camada humana do app.
// Tudo aqui e PROJECAO derivada do snapshot ou copy de produto; nenhuma funcao grava estado.
import type { GovernanceSnapshot } from "@/lib/types";

export type ConfidenceState =
  | "valid"
  | "pending"
  | "no-evidence"
  | "self-attested"
  | "break-glass"
  | "stale";

export const CONFIDENCE_STATES: Record<
  ConfidenceState,
  { label: string; bg: string; fg: string; dot: string }
> = {
  valid: { label: "Válido", bg: "#e7f2ea", fg: "#1a5632", dot: "#2e7d32" },
  pending: { label: "Pendente", bg: "#fdf3e3", fg: "#7a4a00", dot: "#b97800" },
  "no-evidence": { label: "Sem evidência", bg: "#eef0ef", fg: "#4a544d", dot: "#8a938d" },
  "self-attested": { label: "Auto-declarado", bg: "#e9eef8", fg: "#274d8f", dot: "#1f4b99" },
  "break-glass": { label: "Exceção registrada", bg: "#fbeaee", fg: "#8c1236", dot: "#9f1239" },
  stale: { label: "Desatualizado", bg: "#f5f0e3", fg: "#6b5a26", dot: "#a08a3c" },
};

export const TRUST_LEGEND: Array<{ state: ConfidenceState; label: string }> = [
  { state: "valid", label: "Válido" },
  { state: "pending", label: "Pendente" },
  { state: "no-evidence", label: "Sem evidência" },
  { state: "self-attested", label: "Auto-declarado" },
  { state: "break-glass", label: "Exceção (break-glass)" },
  { state: "stale", label: "Desatualizado (stale)" },
];

export type ProfileId = "full" | "compact" | "trio" | "solo";

export type ProfileOption = {
  id: ProfileId;
  label: string;
  shortLabel: string;
  mapsTo: "full" | "compact" | "solo";
  bestWhen: string;
  tradeoff: string;
  description: string;
  appWill: string[];
  appWillNot: string[];
  visibleRisks: string[];
  ceremony: string[];
  enforcement: {
    verb: string;
    text: string;
    severity: "error" | "warning" | "info";
  };
};

export const PROFILE_OPTIONS: ProfileOption[] = [
  {
    id: "full",
    label: "Responsabilidades separadas",
    shortLabel: "Full",
    mapsTo: "full",
    bestWhen:
      "Para organizações com lideranças, aprovação, segurança, dados e times técnicos em papéis separáveis.",
    tradeoff: "Mais integridade: aprovações separadas; conflitos de papel sensível bloqueiam.",
    description:
      "Use quando a organização consegue separar quem define objetivos, quem executa, quem aprova riscos e quem atesta resultados. O app aplica mais bloqueios para proteger decisões sensíveis e reduzir placar inflado por autoaprovação.",
    appWill: [
      "exigir par independente em mutações de régua, autoridade, segurança e contabilidade",
      "mostrar filas separadas para aprovação, evidência, contrato e auditoria",
      "bloquear conflitos de papel sensível até outra autoridade aprovar ou registrar break-glass",
    ],
    appWillNot: [
      "deixar uma pessoa aprovar sozinha o próprio resultado como se fosse independente",
      "esconder acúmulo de papel em dashboards executivos",
    ],
    visibleRisks: [
      "mais fricção operacional",
      "bloqueios quando papéis ou fontes de evidência ainda não estão configurados",
    ],
    ceremony: ["SoD forte", "Aprovações separadas", "Conflitos bloqueiam"],
    enforcement: {
      verb: "Bloqueia",
      text: "quem define uma meta não pode ser o único a confirmá-la, e mutações de régua/autoridade exigem par. Exceção só via break-glass — fica registrado, com prazo de revisão.",
      severity: "error",
    },
  },
  {
    id: "compact",
    label: "Time enxuto",
    shortLabel: "Compact",
    mapsTo: "compact",
    bestWhen: "Para times pequenos ou médios em que algumas pessoas acumulam responsabilidades.",
    tradeoff: "Detecta risco e revisa em cadência; bloqueia menos que o full.",
    description:
      "Use quando existe mais de uma pessoa, mas ainda não há separação completa de responsabilidades. O app evita burocracia pesada, marca acúmulos de papel e cria revisão em cadência para o que não dá para separar hoje.",
    appWill: [
      "avisar quando a mesma pessoa acumula papéis sensíveis",
      "registrar justificativa e revisão retroativa para decisões perigosas",
      "deixar o fluxo andar quando bloquear criaria bypass informal",
    ],
    appWillNot: [
      "chamar acúmulo de papel de independência",
      "travar todo trabalho por falta de estrutura de empresa grande",
    ],
    visibleRisks: [
      "algumas confirmações entram como auto-declaradas até revisão",
      "evidências manuais ficam destacadas até existir fonte de trabalho conectada",
    ],
    ceremony: ["Acúmulos detectados", "Revisão em cadência", "Avisa em vez de travar"],
    enforcement: {
      verb: "Avisa",
      text: "mutações perigosas viram warning visível e entram na revisão retroativa em cadência. Nada some do registro.",
      severity: "warning",
    },
  },
  {
    id: "trio",
    label: "Negócio + Produto/Design + Engenharia",
    shortLabel: "Trio funcional",
    mapsTo: "compact",
    bestWhen:
      "Para organizações em que decisões se dividem por frentes de responsabilidade, não necessariamente por três pessoas.",
    tradeoff: "Independência de negócio existe; a técnica tende a colapsar — e isso fica visível.",
    description:
      "Use quando o trabalho passa por frentes como negócio, produto/design e engenharia, mas os papéis ainda podem acumular dentro de cada frente. É uma variação guiada do perfil enxuto: há mais contexto que no solo, mas menos independência que no full.",
    appWill: [
      "separar decisões de negócio, produto/design e engenharia quando houver autoridade para isso",
      "marcar acúmulos técnicos como auto-declarados ou revisão conjunta",
      "pedir segunda olhada quando uma frente define e confirma a própria meta",
    ],
    appWillNot: [
      "assumir que existem exatamente três pessoas",
      "fingir que revisão conjunta equivale a atestação independente",
    ],
    visibleRisks: [
      "papéis acumulados por frente ficam visíveis",
      "alguns outcomes podem exigir revisão conjunta antes de virar confiança forte",
    ],
    ceremony: ["Acúmulos visíveis", "Auto-declarado + revisão conjunta", "Avisa em vez de travar"],
    enforcement: {
      verb: "Avisa",
      text: "acúmulos são permitidos, ganham o selo Auto-declarado e pedem revisão conjunta. Nada disso some do registro.",
      severity: "warning",
    },
  },
  {
    id: "solo",
    label: "Solo ou micro-time",
    shortLabel: "Solo",
    mapsTo: "solo",
    bestWhen:
      "Para uma pessoa ou micro-time em que todos têm acesso amplo e a separação real de deveres não existe.",
    tradeoff: "Menos cerimônia: tudo é registrado como auto-declarado.",
    description:
      "Use quando uma pessoa, ou um grupo muito pequeno, decide, executa e confirma a maior parte do trabalho. O app reduz bloqueios, mas não finge independência: decisões próprias ficam marcadas como auto-declaradas e continuam auditáveis.",
    appWill: [
      "registrar decisões, evidências e exceções em arquivos seus",
      "mostrar quando uma confirmação é auto-declarada",
      "permitir avançar sem exigir outra pessoa que não existe",
    ],
    appWillNot: [
      "bloquear toda ação por falta de segunda aprovação",
      "mostrar autoaprovação como evidência independente",
    ],
    visibleRisks: [
      "self-governed aparece no placar e na auditoria",
      "sem fonte de trabalho, execução e resultado ficam como evidência manual/declarada",
    ],
    ceremony: ["Self-governed", "Tudo registrado", "Não finge independência"],
    enforcement: {
      verb: "Registra",
      text: "você ocupa todos os papéis. O app não finge independência — cada confirmação própria fica marcada como auto-declarada, visível em auditoria.",
      severity: "info",
    },
  },
];

export function profileOption(id: string): ProfileOption {
  return PROFILE_OPTIONS.find((option) => option.id === id) || PROFILE_OPTIONS[0];
}

export function profileChipLabel(profile: string): string {
  const option = PROFILE_OPTIONS.find((item) => item.id === profile);
  if (!option) return `Governança ${profile}`;
  return option.id === "full" ? "Governança full" : option.label;
}

export type RoleKey = "admin" | "payer" | "sponsor" | "security" | "technical" | "attester";

export const ROLE_CONTRACT: Array<{
  key: RoleKey;
  role: string;
  desc: string;
  sensitive: boolean;
}> = [
  {
    key: "admin",
    role: "Admin",
    desc: "Instala e administra o app. Não decide nada sozinho.",
    sensitive: false,
  },
  {
    key: "payer",
    role: "Payer",
    desc: "Responde pelo custo. Aprova o que gera cobrança.",
    sensitive: true,
  },
  {
    key: "sponsor",
    role: "Sponsor",
    desc: "Autoriza objetivos e dá autoridade às decisões.",
    sensitive: true,
  },
  {
    key: "security",
    role: "Security",
    desc: "Aprova políticas e qualquer saída de dados (egress).",
    sensitive: true,
  },
  {
    key: "technical",
    role: "Owner técnico",
    desc: "Responde pela execução e pelos contratos técnicos.",
    sensitive: false,
  },
  {
    key: "attester",
    role: "Actual-attester",
    desc: "Confirma resultados com evidência. Não é quem define a meta.",
    sensitive: true,
  },
];

export type RoleAssignments = Record<RoleKey, string>;

export const DEFAULT_ASSIGNMENTS: RoleAssignments = {
  admin: "head-platform",
  payer: "finance-owner",
  sponsor: "sponsor-acme",
  security: "lead-sre",
  technical: "head-platform",
  attester: "lead-data",
};

export function roleWarnings(
  assignments: RoleAssignments,
  profile: ProfileId,
  authorityIds: Set<string>
): string[] {
  const warnings: string[] = [];
  if (assignments.admin === assignments.sponsor) {
    warnings.push(
      "Admin e Sponsor colapsaram: no perfil full isso precisa de par ou break-glass — fica registrado."
    );
  }
  if (assignments.admin === assignments.payer) {
    warnings.push(
      "Quem administra também paga a conta: habilitar e pagar integração deixa o risco financeiro sem independência."
    );
  }
  if (assignments.sponsor === assignments.attester) {
    warnings.push(
      "Quem aprova a regra também atesta o actual: o placar pode inflar sem um atestador independente."
    );
  }
  if (assignments.technical === assignments.attester) {
    warnings.push(
      "Owner técnico e actual-attester colapsaram: resultados do próprio time carregam o selo Auto-declarado."
    );
  }
  if (!authorityIds.has(assignments.payer)) {
    warnings.push(
      "O Payer ainda não resolve no registro de autoridades — precisa de authority local (ou identity-provider futuro) antes de aprovar custo."
    );
  }
  if (profile === "solo") {
    warnings.push(
      "Perfil solo aceita colapso, mas não o esconde: o self-log aparece na auditoria e no placar."
    );
  }
  if (!warnings.length) warnings.push("Separação mínima coerente para a escolha atual.");
  return warnings;
}

export const ROLE_ACCEPTANCE_NOTICE =
  "Papéis são um contrato de responsabilidade declarado nos arquivos. Aceite/convite das pessoas ainda não é mecanismo: fica como risco pendente, visível aqui, até existir comando governado para isso.";

export type AssistantChoice = "local" | "cloud" | "none";

export function assistantSystems(snapshot: GovernanceSnapshot): string[] {
  const runtime = snapshot.integrationCatalog.integrations.find(
    (item) => item.id === "assistant-runtime-local-cloud"
  );
  const systems = runtime?.systems || ["ollama"];
  return [...systems].sort((a, b) => {
    if (a === "ollama") return -1;
    if (b === "ollama") return 1;
    return a.localeCompare(b);
  });
}

export function providerIsLocal(provider: string): boolean {
  return ["ollama", "lm-studio", "localai", "llama-cpp-server", "vllm"].includes(provider);
}

export function assistantCloudNote(profile: ProfileId): string {
  if (profile === "full") {
    return "Nuvem exige aprovação do papel Security e política de egress explícita antes de ativar — fica Pendente até lá.";
  }
  if (profile === "solo") {
    return "Você aprova por si: a decisão e o que passa a ser enviado ficam registrados como auto-declarados.";
  }
  return "A aprovação de egress pode acumular papéis — o acúmulo fica registrado e visível na auditoria.";
}

export type SourceKindId = "git" | "local" | "mono" | "svc" | "ext";

export const SOURCE_KINDS: Array<{
  id: SourceKindId;
  name: string;
  desc: string;
  disabled?: boolean;
  tag?: string;
}> = [
  { id: "git", name: "Repositório Git", desc: "GitHub, GitLab ou um clone local." },
  { id: "local", name: "Pasta local", desc: "Uma pasta no seu computador, sem Git." },
  { id: "mono", name: "Monorepo / módulo", desc: "Um módulo dentro de um repositório maior." },
  { id: "svc", name: "Serviço ou pacote", desc: "Algo publicado que você mantém." },
  {
    id: "ext",
    name: "Ferramenta externa",
    desc: "Jira, Linear, Notion… entra pelo catálogo de adapters.",
    disabled: true,
    tag: "Adapter futuro",
  },
];

export const NO_SOURCE_DOWNGRADE =
  "Sem fonte de trabalho: dá para planejar ciclos e registrar intenções (intake), mas execução, contratos e resultados ficam rebaixados a evidência manual/declarada — e isso aparece no placar.";

// ── derivações do snapshot ─────────────────────────────────────────────

export type AttentionItem = {
  id: string;
  state: ConfidenceState;
  title: string;
  hint: string;
  actionLabel: string;
  actionHref: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  detail: string;
  tag?: string;
};

export type WorkSource = {
  id: string;
  kind: string;
  state: ConfidenceState;
  detail: string;
};

export type NextStep = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  meta: string;
};

export type AdoptionSummary = {
  attention: AttentionItem[];
  healthyCount: number;
  checklist: ChecklistItem[];
  doneCount: number;
  totalCount: number;
  setupPct: number;
  sources: WorkSource[];
  sourcesConnected: number;
  nextStep: NextStep;
  periods: string[];
};

export function deriveAdoption(snapshot: GovernanceSnapshot): AdoptionSummary {
  const attention: AttentionItem[] = [];
  const acceptedOutcomes = new Set(snapshot.operations.verdicts.map((verdict) => verdict.outcome));

  for (const outcome of snapshot.outcomes) {
    if (outcome.valid && !acceptedOutcomes.has(outcome.id)) {
      attention.push({
        id: `verdict-pending-${outcome.id}`,
        state: "pending",
        title: `Resultado de ${outcome["emitted-by"]} aguarda aceite de veredito`,
        hint: "A evidência já passou na verificação automática; falta o gate accept-verdict registrar a decisão.",
        actionLabel: "Abrir comandos",
        actionHref: "/console?view=commands",
      });
    }
    if (!outcome.valid) {
      attention.push({
        id: `outcome-invalid-${outcome.id}`,
        state: "no-evidence",
        title: `Resultado ${outcome.id} não soma no placar`,
        hint: outcome.errors[0]?.msg || "A verificação automática recusou a evidência.",
        actionLabel: "Ver detalhes",
        actionHref: "/console?view=audit",
      });
    }
  }

  for (const proposal of snapshot.operations.proposals) {
    if (proposal.status === "proposed") {
      attention.push({
        id: `proposal-${proposal.id}`,
        state: "pending",
        title: `Ideia "${proposal.title}" aguarda triagem e gate`,
        hint: "Registrada no intake; pode virar iniciativa ativada ou ser descartada — a decisão fica registrada.",
        actionLabel: "Abrir comandos",
        actionHref: "/console?view=commands",
      });
    }
  }

  for (const entry of snapshot.operations.breakGlass) {
    attention.push({
      id: `break-glass-${entry.id}`,
      state: "break-glass",
      title: `Exceção ${entry.id} aberta (${entry.mutation})`,
      hint: `Uma regra foi contornada com justificativa. Revisar até ${entry["review-at"]}.`,
      actionLabel: "Revisar",
      actionHref: "/console?view=audit",
    });
  }

  for (const issue of snapshot.issues) {
    if (issue.level === "warn" && issue.rule === "self-attested-target") {
      attention.push({
        id: `self-attested-${issue.node}`,
        state: "self-attested",
        title: `Meta ${issue.node} é atestada pela própria equipe`,
        hint: "Colapso aprovado e registrado; o placar mantém o selo Auto-declarado em vez de fingir independência.",
        actionLabel: "Ver no placar",
        actionHref: "/console?view=company",
      });
    } else if (issue.level === "warn") {
      attention.push({
        id: `warn-${issue.rule}-${issue.node}`,
        state: issue.rule.includes("stale") ? "stale" : "pending",
        title: `${issue.node}: aviso do resolver`,
        hint: issue.msg,
        actionLabel: "Ver auditoria",
        actionHref: "/console?view=audit",
      });
    } else {
      attention.push({
        id: `error-${issue.rule}-${issue.node}`,
        state: "no-evidence",
        title: `${issue.node}: erro bloqueante (${issue.rule})`,
        hint: issue.msg,
        actionLabel: "Ver auditoria",
        actionHref: "/console?view=audit",
      });
    }
  }

  for (const repo of snapshot.repos) {
    if (!repo.context) {
      attention.push({
        id: `source-no-context-${repo.id}`,
        state: "no-evidence",
        title: `Fonte ${repo.id} sem contexto publicado`,
        hint: "Sem context.json publicado, o trabalho desta fonte só entra como evidência manual/declarada.",
        actionLabel: "Ver fontes",
        actionHref: "/configuracoes#fontes",
      });
    }
  }

  const sources: WorkSource[] = snapshot.repos.map((repo) => ({
    id: repo.id,
    kind: `Fonte de trabalho · repositório · owner ${repo.owner}`,
    state: repo.context ? "valid" : "no-evidence",
    detail: repo.context
      ? `contexto publicado · ${repo.works.length} peça(s) reconhecida(s) · ${repo.contracts.length} contrato(s)`
      : "sem contexto publicado — evidência manual/declarada",
  }));
  const sourcesConnected = sources.filter((source) => source.state === "valid").length;

  const validOutcomes = snapshot.outcomes.filter((outcome) => outcome.valid).length;
  const healthyCount =
    validOutcomes +
    sourcesConnected +
    snapshot.targets.filter((target) => !snapshot.issues.some((issue) => issue.node === target.id))
      .length;

  const periods = [...new Set(snapshot.targets.map((target) => target.period))].sort();

  const declaration = snapshot.profileDeclaration;
  const checklist: ChecklistItem[] = [
    {
      id: "profile",
      label: "Perfil da governança",
      done: Boolean(declaration.profile),
      detail: `${profileChipLabel(declaration.profile)} · aprovado por ${declaration["approved-by"] || "não resolvido"} · revisão ${declaration["review-at"] || "sem data"}`,
    },
    {
      id: "roles",
      label: "Papéis e responsáveis",
      done: snapshot.authorities.length > 0,
      tag: "aceite pendente",
      detail: `${snapshot.authorities.length} autoridade(s) declarada(s) como contrato de responsabilidade — aceite/convite ainda não é mecanismo`,
    },
    {
      id: "cycle",
      label: `Ciclo ${periods[0] || "sem período"}`,
      done: snapshot.portfolio.objectives.length > 0,
      detail: `${snapshot.counts.objectives} objetivos · ${snapshot.counts.targets} metas · períodos ${periods.join(", ") || "—"}`,
    },
    {
      id: "sources",
      label: "Fontes de trabalho",
      done: sourcesConnected === sources.length && sources.length > 0,
      tag: "para evidência automática",
      detail:
        sourcesConnected === sources.length
          ? `${sourcesConnected} de ${sources.length} com contexto publicado`
          : `${sourcesConnected} de ${sources.length} com contexto publicado — sem contexto, a evidência é manual/declarada`,
    },
    {
      id: "assistant",
      label: "Assistente",
      done: false,
      tag: "opcional",
      detail: "Local (Ollama) primeiro; nuvem exige aprovação e egress explícito conforme o perfil",
    },
  ];
  const doneCount = checklist.filter((item) => item.done).length;

  const nextStep = deriveNextStep(attention, sourcesConnected, sources.length);

  return {
    attention,
    healthyCount,
    checklist,
    doneCount,
    totalCount: checklist.length,
    setupPct: Math.round((doneCount / checklist.length) * 100),
    sources,
    sourcesConnected,
    nextStep,
    periods,
  };
}

function deriveNextStep(
  attention: AttentionItem[],
  sourcesConnected: number,
  sourcesTotal: number
): NextStep {
  const verdictPending = attention.find((item) => item.id.startsWith("verdict-pending-"));
  if (verdictPending) {
    return {
      title: verdictPending.title,
      body: "A evidência já foi validada pela verificação automática. Aceitar o veredito registra a decisão em trilha append-only — fica registrado e é corrigível por nova decisão.",
      ctaLabel: "Abrir comandos",
      ctaHref: verdictPending.actionHref,
      meta: "~2 min · fica registrado",
    };
  }
  const invalid = attention.find((item) => item.state === "no-evidence");
  if (invalid) {
    return {
      title: invalid.title,
      body: invalid.hint,
      ctaLabel: invalid.actionLabel,
      ctaHref: invalid.actionHref,
      meta: "corrigível por nova decisão",
    };
  }
  if (sourcesConnected < sourcesTotal) {
    return {
      title: "Conectar as fontes de trabalho restantes",
      body: `${sourcesConnected} de ${sourcesTotal} fontes publicam contexto hoje. Sem contexto publicado, execução, contratos e resultados ficam só com evidência manual/declarada.`,
      ctaLabel: "Ver fontes",
      ctaHref: "/configuracoes#fontes",
      meta: "planejamento e intake seguem liberados",
    };
  }
  const first = attention[0];
  if (first) {
    return {
      title: first.title,
      body: first.hint,
      ctaLabel: first.actionLabel,
      ctaHref: first.actionHref,
      meta: "fica registrado",
    };
  }
  return {
    title: "Acompanhar resultados do ciclo",
    body: "Nenhuma pendência aberta neste snapshot. Os placares derivam só de evidência validada.",
    ctaLabel: "Abrir resultados",
    ctaHref: "/console?view=company",
    meta: "leitura, sem mutação",
  };
}

export type PrProfileName = "execution" | "governance" | "integration" | "fast-track";

export type Phase = "draft" | "ready";

export interface PrBodyTemplateToken {
  readonly name: string;
  readonly description: string;
}

export interface PrBodyProfile {
  readonly name: PrProfileName;
  /** Template markdown correspondente em .github/PULL_REQUEST_TEMPLATE/ ou .github/ */
  readonly templatePath: string;
  /** Slots explícitos que o script pode preencher. O template é a fonte editorial. */
  readonly templateTokens: ReadonlyArray<PrBodyTemplateToken>;
  /** Exigidas desde o Draft (intenção declarada na abertura). */
  readonly draftSections: ReadonlyArray<string>;
  /** Exigidas adicionalmente em Ready / fase de decisão (Ready ⊇ Draft). */
  readonly readySections: ReadonlyArray<string>;
  /** Seções que são baselines de intenção/decisão (nunca reescritas automaticamente). */
  readonly preservedBaselines: ReadonlyArray<string>;
  /** Evidência final — só atualizada com instrução explícita (`--update-valor-entregue`). */
  readonly finalSections: ReadonlyArray<string>;
  /** Seções que podem ser reescritas automaticamente (headers de nível 2). */
  readonly mutableSections: ReadonlyArray<string>;
  /** Slots de governança visual (prompt final autorado OU imagem; placeholder não conta). */
  readonly visuals: ReadonlyArray<{
    readonly section: string;
    readonly phase: Phase;
    readonly hint: string;
  }>;
  /** Seções que exigem conteúdo real além do esqueleto do template. */
  readonly realContent: ReadonlyArray<{
    readonly section: string;
    readonly phase: Phase;
    readonly hint: string;
  }>;
}

const COMMON_TAIL = [
  "## Validação, evidências e checklist",
  "### Evidências e gates",
  "### Checklist operacional",
  "## Disclosure de IA",
];

const COMMON_MUTABLE = ["## Validação, evidências e checklist", "## Disclosure de IA"];

export const PR_BODY_PROFILES: Readonly<Record<PrProfileName, PrBodyProfile>> = {
  execution: {
    name: "execution",
    templatePath: ".github/pull_request_template.md",
    templateTokens: [
      {
        name: "AI_GUIDELINES_EXECUTION_VISION_TEXT",
        description: "Texto do prompt final da visão pretendida no Draft.",
      },
      {
        name: "AI_GUIDELINES_EXECUTION_SUMMARY",
        description: "Resumo humano inicial do PR.",
      },
      {
        name: "AI_GUIDELINES_EXECUTION_SCOPE_IN",
        description: "Itens dentro do escopo técnico.",
      },
      {
        name: "AI_GUIDELINES_EXECUTION_SCOPE_OUT",
        description: "Itens fora do escopo técnico.",
      },
      {
        name: "AI_GUIDELINES_CROSSREF_SPEC",
        description: "Spec relacionada ao PR.",
      },
      {
        name: "AI_GUIDELINES_CROSSREF_ADRS",
        description: "ADRs aplicáveis ao PR.",
      },
      {
        name: "AI_GUIDELINES_CROSSREF_DECS",
        description: "DECs aplicáveis ao PR.",
      },
      {
        name: "AI_GUIDELINES_CROSSREF_RELATED",
        description: "Issues, PRs ou nós relacionados.",
      },
    ],
    draftSections: [
      "## Visão pretendida",
      "## Resumo",
      "## Escopo",
      "### Dentro do escopo",
      "### Fora do escopo",
    ],
    readySections: ["## Valor entregue", "## Test plan", ...COMMON_TAIL, "## Cross-refs"],
    preservedBaselines: ["## Visão pretendida"],
    finalSections: ["## Valor entregue"],
    mutableSections: ["## Resumo", "## Escopo", "## Test plan", "## Cross-refs", ...COMMON_MUTABLE],
    visuals: [
      {
        section: "## Visão pretendida",
        phase: "draft",
        hint: "A visão pretendida é a baseline de intenção, preenchida ao abrir o Draft PR.",
      },
      {
        section: "## Valor entregue",
        phase: "ready",
        hint: "Em Ready, o valor entregue deve estar preenchido (em Draft pode ficar como placeholder).",
      },
    ],
    realContent: [
      {
        section: "## Test plan",
        phase: "ready",
        hint: "validação real (comandos/observações), não apenas o esqueleto do template.",
      },
    ],
  },

  governance: {
    name: "governance",
    templatePath: ".github/PULL_REQUEST_TEMPLATE/governance.md",
    templateTokens: [],
    draftSections: [
      "## Visão de valor",
      "## Problema de governança",
      "## Hipóteses e perguntas",
      "## Escopo",
      "### Dentro do escopo",
      "### Fora do escopo",
    ],
    readySections: [
      "## Processo decisório",
      "## Decisões consolidadas",
      "## Arquitetura pretendida",
      "## Evidências e falsificação",
      "## Impactos downstream",
      ...COMMON_TAIL,
      "## Cross-refs",
    ],
    preservedBaselines: ["## Visão de valor", "## Arquitetura pretendida"],
    finalSections: [],
    mutableSections: [
      "## Problema de governança",
      "## Hipóteses e perguntas",
      "## Escopo",
      "## Processo decisório",
      "## Decisões consolidadas",
      "## Evidências e falsificação",
      "## Impactos downstream",
      "## Cross-refs",
      ...COMMON_MUTABLE,
    ],
    visuals: [
      {
        section: "## Visão de valor",
        phase: "draft",
        hint: "Visão de valor = baseline da intenção da spec (dor estrutural + capacidade desejada + mudança de experiência), preenchida ao abrir o Draft — sem antecipar arquitetura não decidida.",
      },
      {
        section: "## Arquitetura pretendida",
        phase: "ready",
        hint: "Arquitetura pretendida = baseline da decisão (topologia aprovada, nós/checkpoints, dependências, sequência), preenchida após o processo decisório e antes do primeiro PR de Execution.",
      },
    ],
    realContent: [],
  },

  integration: {
    name: "integration",
    templatePath: ".github/PULL_REQUEST_TEMPLATE/integration.md",
    templateTokens: [],
    draftSections: [
      "## Resultado integrado",
      "## Componentes e PRs absorvidos",
      "## Convergência",
      "## Rollback",
    ],
    readySections: [
      "## Compatibilidade e conflitos resolvidos",
      "## Evidência de integração",
      "## Validação final da stack",
      ...COMMON_TAIL,
      "## Cross-refs",
    ],
    preservedBaselines: [],
    finalSections: [],
    mutableSections: [
      "## Resultado integrado",
      "## Componentes e PRs absorvidos",
      "## Convergência",
      "## Rollback",
      "## Compatibilidade e conflitos resolvidos",
      "## Evidência de integração",
      "## Validação final da stack",
      "## Cross-refs",
      ...COMMON_MUTABLE,
    ],
    visuals: [
      {
        section: "## Convergência",
        phase: "ready",
        hint: "O Integration PR exige a narrativa visual da convergência da stack (#4).",
      },
    ],
    realContent: [
      {
        section: "## Evidência de integração",
        phase: "ready",
        hint: "link da run de CI / evidência determinística da stack íntegra.",
      },
    ],
  },

  "fast-track": {
    name: "fast-track",
    templatePath: ".github/PULL_REQUEST_TEMPLATE/fast-track.md",
    templateTokens: [],
    draftSections: [
      "## Incidente ou falha",
      "## Correção",
      "## Impacto e risco",
      "## Evidência mínima",
      "## Rollback",
      "## Accountability",
      ...COMMON_TAIL,
      "## Cross-refs",
    ],
    readySections: [],
    preservedBaselines: [],
    finalSections: [],
    mutableSections: [
      "## Incidente ou falha",
      "## Correção",
      "## Impacto e risco",
      "## Evidência mínima",
      "## Rollback",
      "## Accountability",
      "## Cross-refs",
      ...COMMON_MUTABLE,
    ],
    visuals: [],
    realContent: [
      {
        section: "## Accountability",
        phase: "draft",
        hint: "fast-track transfere accountability ao humano (ADR 0021 + DEC-0023-E05): nomeie quem responde pela correção e o motivo do bypass.",
      },
      {
        section: "## Rollback",
        phase: "draft",
        hint: "como desfazer a correção se ela piorar o incidente.",
      },
    ],
  },
};

export const ALL_PRESERVED_SECTIONS = Array.from(
  new Set(Object.values(PR_BODY_PROFILES).flatMap((p) => p.preservedBaselines))
);

export const ALL_MUTABLE_SECTIONS = Array.from(
  new Set(Object.values(PR_BODY_PROFILES).flatMap((p) => p.mutableSections))
);

export const ALL_FINAL_SECTIONS = Array.from(
  new Set(Object.values(PR_BODY_PROFILES).flatMap((p) => p.finalSections))
);

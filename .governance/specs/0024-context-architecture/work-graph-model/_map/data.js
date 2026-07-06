// data.js — GERADO por generate.mjs a partir de ../model.yml — NÃO editar à mão.
// Regenerar: node generate.mjs · Verificar sync: node generate.mjs --check
window.MODEL = {
  layers: [
    {
      id: "intent",
      ax: "objetivo de trabalho duravel, autorizado por negocio ou standalone; tem gate de ativacao",
      vals: [
        {
          t: "validate-first",
          p: "approach",
        },
        {
          t: "direct",
          p: "approach",
        },
        {
          t: "none",
          p: "signal",
        },
        {
          t: "touches-contract",
          p: "signal",
        },
        {
          t: "operational-target",
          p: "signal",
        },
      ],
    },
    {
      id: "execution-unit",
      ax: "unidade coordenada cross-repo ou com lifecycle proprio · colapsa no trivial; reversivel por mutacao governada",
      vals: [
        {
          t: "experiment-run",
        },
        {
          t: "migration-wave",
        },
        {
          t: "delivery-slice",
        },
        {
          t: "incident-response",
        },
        {
          t: "graduation",
        },
        {
          t: "cleanup",
        },
        {
          t: "release-rollout",
        },
        {
          t: "discovery",
        },
      ],
    },
    {
      id: "repo-work",
      ax: "peca executavel em um repo/fonte",
      vals: [
        {
          t: "create",
          p: "create",
        },
        {
          t: "sustain",
          p: "sustain",
        },
        {
          t: "discover",
          p: "discover",
        },
        {
          t: "operate",
          p: "operate",
        },
      ],
    },
  ],
  examples: [
    {
      id: "experiment-cross-repo",
      label: "experimento cross-repo",
      intent: {
        title: "aumentar conversao trial -> paid",
        approach: "validate-first",
        signal: "none",
      },
      unit: {
        kind: "experiment-run",
        title: "CTA contextual v1",
        owns: "hipotese, flag, metricas, guardrails, veredito",
      },
      works: [
        {
          r: "acme-mfe-billing",
          p: "create",
          d: "UI do CTA atras da flag",
        },
        {
          r: "acme-api-billing",
          p: "create",
          d: "elegibilidade + endpoint",
        },
        {
          r: "acme-analytics",
          p: "operate",
          d: "eventos + baseline",
        },
        {
          r: "acme-web-host",
          p: "sustain",
          d: "adaptar contexto/contrato",
        },
      ],
      note: "veredito mora na unit, nao por repo",
      contract: "acme-user-context@v3",
    },
    {
      id: "redesign-misto",
      label: "redesign misto",
      intent: {
        title: "redesign do checkout",
        approach: "direct",
        signal: "touches-contract",
      },
      unit: {
        kind: "migration-wave",
        title: "checkout-ui v2",
        owns: "from legacy-stack -> to new-stack",
      },
      works: [
        {
          r: "acme-checkout",
          p: "sustain",
          d: "portar fluxo existente",
        },
        {
          r: "acme-design-system",
          p: "create",
          d: "novos componentes",
        },
        {
          r: "(spike)",
          p: "discover",
          d: "viabilidade da migracao",
        },
        {
          r: "acme-platform",
          p: "sustain",
          d: "adapta contrato compartilhado",
        },
      ],
      note: "pecas mistas sob a mesma wave",
      contract: "acme-user-context@v3",
    },
    {
      id: "contrato-compartilhado",
      label: "contrato compartilhado",
      contractCard: {
        id: "acme-user-context@v3",
        sub: "owner: acme-platform · consumers: acme-mfe-billing, acme-mfe-support · compatibility-window: v2, v3 ate 2026-08-15",
        unit: {
          kind: "migrations",
          title: "as iniciativas que dependem dele",
        },
        works: [
          {
            r: "intent · redesign-checkout",
            p: "direct + touches-contract",
            d: "adapta contrato",
          },
          {
            r: "intent · growth-upgrade",
            p: "validate-first + none",
            d: "consome contrato",
          },
        ],
        note: "coordenacao entre iniciativas via contrato compartilhado",
      },
    },
    {
      id: "bug",
      label: "bug simples",
      intent: null,
      unit: null,
      works: [
        {
          r: "acme-checkout",
          p: "sustain",
          d: "corrige calculo do total",
        },
      ],
      note: "standalone sustain; camadas colapsam",
    },
    {
      id: "exploration-sem-intent",
      label: "discovery sem intent",
      intent: null,
      unit: null,
      works: [
        {
          r: "acme-platform",
          p: "discover",
          d: "spike timebox com pergunta falsificavel",
        },
      ],
      note: "discover standalone; nao shippa",
    },
    {
      id: "delivery-tradicional",
      label: "delivery tradicional",
      intent: {
        title: "exportar relatorio em PDF",
        approach: "direct",
        signal: "none",
      },
      unit: null,
      works: [
        {
          r: "acme-reports",
          p: "create",
          d: "botao + geracao do PDF",
        },
      ],
      note: "feature comum; unit colapsa",
    },
  ],
  sim: [
    {
      label: "empresa com time completo",
      sod: "HOLDS",
      participation: [
        {
          phase: "define-objective",
          who: "sponsor/lideranca",
        },
        {
          phase: "define-target",
          who: "PM + dados",
        },
        {
          phase: "authorize-intake",
          who: "PM owner do objective",
        },
        {
          phase: "registro",
          who: "PM/negocio",
        },
        {
          phase: "triagem",
          who: "Tech Lead + Principal",
        },
        {
          phase: "investigação",
          who: "devs Sr/Tech Lead",
        },
        {
          phase: "gate",
          who: "PM owner decide",
        },
        {
          phase: "ativação",
          who: "Team Lead + PM",
        },
        {
          phase: "breakdown",
          who: "Tech Lead + Principal",
        },
        {
          phase: "execução",
          who: "devs",
        },
        {
          phase: "coordenação",
          who: "Principal / contract-owners",
        },
        {
          phase: "veredito",
          who: "PM + dados",
        },
      ],
      gaps: ["sobrecarga de Tech Lead", "owner de operate precisa ser explicito"],
    },
    {
      label: "time pequeno",
      sod: "PARCIAL",
      participation: [
        {
          phase: "define-objective",
          who: "Negocio",
        },
        {
          phase: "define-target",
          who: "Negocio + fonte",
        },
        {
          phase: "authorize-intake → registro",
          who: "Negocio",
        },
        {
          phase: "triagem → investigação",
          who: "Engenharia",
        },
        {
          phase: "gate",
          who: "Negocio",
        },
        {
          phase: "ativação",
          who: "Negocio + Engenharia",
        },
        {
          phase: "breakdown → coordenação",
          who: "Engenharia",
        },
        {
          phase: "veredito",
          who: "Negocio + Engenharia",
        },
      ],
      gaps: ["autocertificacao tecnica", "contrato sem revisao independente"],
    },
    {
      label: "dev solo",
      sod: "IMPOSSIVEL",
      participation: [
        {
          phase: "define-objective → veredito",
          who: "self",
        },
      ],
      gaps: ["independencia colapsada; dashboard deve mostrar self-attested"],
      degenerate: "self-governed + trade-off logado",
    },
  ],
  finding:
    "governanca escala para baixo por role-collapse; nao deve virar teatro Mecanizada por: governance-profiles.",
  graph: {
    objective: {
      id: "obj-revenue",
      label: "crescer receita recorrente",
      level: "company-strategy",
      period: "2027H1",
    },
    thesis: {
      id: "thesis-upgrade",
      label: "experiencias contextuais aumentam upgrade",
    },
    opportunities: [
      {
        id: "opp-checkout",
        label: "checkout e billing",
      },
      {
        id: "opp-onboarding",
        label: "onboarding inicial",
      },
    ],
    intent: {
      id: "intent-cta-upgrade",
      approach: "validate-first",
      "primary-target": "tgt-billing-conv",
    },
    unit: {
      id: "unit-cta-upgrade-v1",
      kind: "experiment-run",
      verdict: "won",
    },
    works: [
      {
        r: "acme-mfe-billing",
        p: "create",
        d: "UI do CTA atras da flag",
      },
      {
        r: "acme-api-billing",
        p: "create",
        d: "elegibilidade + endpoint",
      },
      {
        r: "acme-analytics",
        p: "operate",
        d: "eventos + baseline",
      },
    ],
    outcome: {
      id: "out-cta-upgrade-2027q1",
      metric: "billing-conversion",
      value: "+2.4pp",
      valid: true,
    },
    measurement: {
      definer: "growth-owner",
      attester: "acme-analytics",
      unit: "percentage-point",
    },
    rollup: "outcome valido contribui para tgt-billing-conv; aligns-with nao soma",
  },
  scalingLaw:
    "crie no separado so quando mudar owner, cadencia, target, allocation, lifecycle ou audiencia (aplica-se a: business-tier · execution-unit · deliberation · governance-profile · role — executada por governance-profiles)",
  profiles: {
    law: "cerimonia proporcional ao tamanho do trabalho e da organizacao",
    items: [
      {
        id: "full",
        for: "empresa/time completo",
        nodes: "business-tier completo e SoD explicito",
        gates: "approve-objective · activate-intent · release-rollout · accept-verdict",
        sod: "requester != approver != owner-attester quando aplicavel",
        required: ["sponsor", "approver", "attester", "sourceRevision"],
        enforcement: "ruler-authority exige par ou break-glass logado",
      },
      {
        id: "compact",
        for: "time pequeno com papeis acumulados",
        nodes: "business-tier colapsavel",
        gates: "detectar + revisar em cadencia; nao travar por falta de estrutura",
        sod: "acumulos ficam visiveis",
        required: ["owner", "sourceRevision"],
        enforcement: "warning + revisao retroativa",
      },
      {
        id: "solo",
        for: "uma pessoa ou projeto individual",
        nodes: "minimo necessario",
        gates: "self-log",
        sod: "impossivel; dispensa explicita e visivel",
        required: ["actor"],
        enforcement: "registro honesto, nao teatro",
      },
    ],
  },
  decisionPoints: "approve-objective · activate-intent · release-rollout · accept-verdict",
  flowExplorer: {
    status: "applied",
    approach: {
      "validate-first": "a mudanca permanente depende da evidencia",
      direct: "a mudanca ja esta decidida",
    },
    signals: {
      none: "sem mecanismo extra",
      "touches-contract": "review do owner do contrato",
      "operational-target": "placar operacional + guardrails",
    },
    reviewRule: "approach e declarado pelo humano; signal e derivado/confirmado; drift vira alerta",
    depsRule:
      "blocked-by impede inicio; delivery-after permite paralelizar mas bloqueia entrega/ativacao",
    exampleOrg: {
      areas: [
        {
          id: "area-growth",
          objectives: ["obj-revenue", "obj-activation"],
        },
        {
          id: "area-platform",
          objectives: ["obj-reliability", "obj-cost"],
        },
      ],
    },
    derivation: {
      "execution-unit": "kind deriva de approach + signal + collapse-rule + lifecycle",
    },
    consequences: {
      "validate-first": ["experiment-run", "verdict", "graduation", "cleanup"],
      direct: ["delivery-slice", "migration-wave", "release-rollout"],
    },
    noApproach: ["incident-response", "standalone-fix", "dep-bump"],
    renames: {
      strategy: "approach",
      "commit-direct": "direct",
      "feature-slice": "delivery-slice",
      "rollout-slice": "release-rollout",
    },
  },
};

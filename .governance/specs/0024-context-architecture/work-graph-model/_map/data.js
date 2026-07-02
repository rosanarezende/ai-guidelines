// data.js — GERADO por generate.mjs a partir de ../model.yml — NÃO editar à mão.
// Regenerar: node generate.mjs · Verificar sync: node generate.mjs --check
window.MODEL = {
  layers: [
    {
      id: "intent",
      ax: "o objetivo de negócio durável (uma por objetivo); NÃO delibera — tem gate de ativação",
      vals: [
        {
          t: "experiment-led",
        },
        {
          t: "direct-delivery",
        },
        {
          t: "migration-led",
        },
        {
          t: "reliability-led",
        },
      ],
    },
    {
      id: "execution-unit",
      ax: "unidade CROSS-REPO com lifecycle próprio + unidade semântica (a coisa é UMA) · COLAPSA no trivial (1 repo, sem lifecycle próprio) — aí intent liga direto no repo-work",
      vals: [
        {
          t: "experiment-run",
        },
        {
          t: "migration-wave",
        },
        {
          t: "feature-slice",
        },
        {
          t: "incident-response",
        },
        {
          t: "shape-up",
        },
        {
          t: "cleanup",
        },
        {
          t: "rollout-slice",
        },
      ],
    },
    {
      id: "repo-work",
      ax: "a peça executável num repo",
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
      label: "experimento cross-repo (growth)",
      intent: {
        title: "aumentar conversão trial → paid",
        strategy: "experiment-led",
      },
      unit: {
        kind: "experiment-run",
        title: "CTA contextual v1",
        owns: "hipótese (CTA ↑ 5%) · flag · métricas (conversion, activation) · guardrails (churn) · veredito: pending",
      },
      works: [
        {
          r: "acme-mfe-billing",
          p: "create",
          d: "UI do CTA atrás da flag",
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
        {
          r: "acme-growth-ops",
          p: "operate",
          d: "monitoramento pós-release",
        },
      ],
      note: "veredito na unit (não por repo); won→shape-up · lost→cleanup · inconclusive→novo",
      contract: "acme-user-context@v3",
    },
    {
      id: "redesign-misto",
      label: "redesign misto (migração)",
      intent: {
        title: "redesign do checkout",
        strategy: "migration-led",
      },
      unit: {
        kind: "migration-wave",
        title: "checkout-ui v2",
        owns: "from legacy-stack → to new-stack · janela de compat: v1 + v2",
      },
      works: [
        {
          r: "acme-checkout",
          p: "sustain",
          d: "portar fluxo existente (from→to)",
        },
        {
          r: "acme-design-system",
          p: "create",
          d: "novos componentes",
        },
        {
          r: "(spike)",
          p: "discover",
          d: "viabilidade da migração",
        },
        {
          r: "acme-platform",
          p: "sustain",
          d: "adapta contrato compartilhado",
        },
        {
          r: "acme-checkout",
          p: "operate",
          d: "rollout + monitor",
        },
      ],
      note: "peças MISTAS sob a mesma wave — a família é da PEÇA, não da iniciativa",
      contract: "acme-user-context@v3",
    },
    {
      id: "contrato-compartilhado",
      label: "contrato compartilhado (entre iniciativas)",
      contractCard: {
        id: "acme-user-context@v3",
        sub: "owner: acme-platform · consumers: acme-mfe-billing, acme-mfe-support · compatibility-window: v2, v3 até 2026-08-15",
        unit: {
          kind: "migrations",
          title: "as iniciativas que dependem dele",
        },
        works: [
          {
            r: "intent · redesign-checkout",
            p: "migration-led",
            d: "migration-led — adapta o contrato",
          },
          {
            r: "intent · growth-upgrade",
            p: "experiment-led",
            d: "experiment-led — consome o contrato",
          },
        ],
        note: "coordenação entre iniciativas = via o contrato (derivada); a janela mora nele (não é derivável)",
      },
    },
    {
      id: "bug",
      label: "um bug",
      intent: null,
      unit: null,
      works: [
        {
          r: "acme-checkout",
          p: "sustain",
          d: "corrige cálculo do total · preset fix (corrective + user-visible)",
        },
      ],
      note: "bug simples = 1 repo-work sustain, SEM intent nem execution-unit (as camadas colapsam)",
    },
    {
      id: "dep-bump",
      label: "atualização de biblioteca",
      intent: null,
      unit: null,
      works: [
        {
          r: "acme-web-host",
          p: "sustain",
          d: "atualiza lib X 3.x → 4.x · preset dep-bump (adaptive + internal)",
        },
      ],
      note: "era a P2: NÃO 'entrega valor de produto' — preserva/adapta. sustain standalone.",
    },
    {
      id: "exploration-sem-intent",
      label: "exploration sem intent",
      intent: null,
      unit: null,
      works: [
        {
          r: "acme-platform",
          p: "discover",
          d: "spike: viável trocar o motor de busca? · timebox + pergunta falsificável → answer + fate",
        },
      ],
      note: "discover standalone, sem intent; não shippa; fate = throwaway/promoted/parked",
    },
    {
      id: "experiment-lost",
      label: "experimento que termina em lost",
      intent: {
        title: "aumentar ativação via onboarding",
        strategy: "experiment-led",
      },
      unit: {
        kind: "experiment-run",
        title: "onboarding guiado v1",
        owns: "veredito: LOST (não bateu a métrica)",
      },
      works: [
        {
          r: "acme-mfe-onboarding",
          p: "create",
          d: "fluxo guiado atrás da flag",
        },
        {
          r: "acme-analytics",
          p: "operate",
          d: "eventos + baseline",
        },
      ],
      note: "lost → gera uma execution-unit CLEANUP; o valor durável foi só APRENDIZADO (nenhuma capacidade permanente)",
      fork: "cleanup — execution-unit cleanup → repo-works sustain removem flag/variante",
    },
    {
      id: "delivery-tradicional",
      label: "delivery tradicional",
      intent: {
        title: "exportar relatório em PDF",
        strategy: "direct-delivery",
      },
      unit: null,
      works: [
        {
          r: "acme-reports",
          p: "create",
          d: "botão + geração do PDF",
        },
      ],
      note: "feature comum = intent direct-delivery → repo-work create (execution-unit colapsa)",
    },
  ],
  sim: [
    {
      label: "empresa com time completo",
      sod: "HOLDS — requester (PM/dev) ≠ approver (TL/Principal) ≠ owner-attester (dono do domínio)",
      participation: [
        {
          phase: "registro",
          who: "PM (registered-by + owner accountable); Design + Team Lead como stakeholders",
        },
        {
          phase: "triagem",
          who: "Tech Lead (dispositions · matcher · valida contratos) + Principal (arquitetura/cross-repo)",
        },
        {
          phase: "investigação",
          who: "devs Sr / Tech Lead rodam discover (spikes); Principal avalia viabilidade",
        },
        {
          phase: "gate",
          who: "PM (owner) decide promover×descartar; append-only",
        },
        {
          phase: "ativação",
          who: "Team Lead / PM consolidam + movem p/ intents/",
        },
        {
          phase: "breakdown",
          who: "Tech Lead materializa execution-units + repo-works; Principal p/ contratos cross-repo",
        },
        {
          phase: "execução",
          who: "devs Sr/Pl (create/sustain/discover); Jr (peças menores + pair)",
        },
        {
          phase: "coordenação",
          who: "Principal / contract-owners; devs = consumers",
        },
        {
          phase: "veredito",
          who: "PM + dados (experiment-run); Tech Lead conduz shape-up/cleanup",
        },
      ],
      gaps: [
        "quem é dono do `operate`/monitoramento (risco de SRE-gap — cai no Principal/dev por omissão)",
        "sobrecarga do Tech Lead (triagem + breakdown + coordenação num papel só)",
        "dono da matcher-accountability (quem assina seguir/contrariar a sugestão)",
        "Design como owner de contrato de design-system (fica implícito)",
      ],
    },
    {
      label: "trio: negócio · design · engenharia",
      sod: "PARCIAL — Negócio dá independência no gate; mas o lado TÉCNICO é auto-certificado (Eng = requester + approver + owner-attester)",
      participation: [
        {
          phase: "registro",
          who: "Negócio (registered-by + owner); Design stakeholder",
        },
        {
          phase: "triagem",
          who: "Engenharia (tudo: dispositions · matcher · contratos)",
        },
        {
          phase: "investigação",
          who: "Engenharia (discover)",
        },
        {
          phase: "gate",
          who: "Negócio (owner) decide — dá a independência do lado de NEGÓCIO",
        },
        {
          phase: "ativação",
          who: "Negócio + Engenharia",
        },
        {
          phase: "breakdown",
          who: "Engenharia",
        },
        {
          phase: "execução",
          who: "Engenharia (todas as peças: create/sustain/discover/operate)",
        },
        {
          phase: "coordenação",
          who: "Engenharia é owner E consumer do contrato (auto-coordenação)",
        },
        {
          phase: "veredito",
          who: "Negócio + Engenharia",
        },
      ],
      gaps: [
        "autocertificação técnica: owner-attested-by sem verificador independente (o risco central da L9, agora ESTRUTURAL por falta de gente)",
        "contrato sem revisão independente (mesma pessoa provê e consome)",
        "q/r/d sem par que conteste",
        "`operate`/monitoramento recai sobre a única pessoa de Eng",
      ],
    },
    {
      label: "dev solo",
      sod: "IMPOSSÍVEL — todas as arestas de independência (X) e o oráculo (O1) colapsam no self",
      participation: [
        {
          phase: "registro",
          who: "self",
        },
        {
          phase: "triagem",
          who: "self (quase sempre implícito)",
        },
        {
          phase: "investigação",
          who: "self",
        },
        {
          phase: "gate",
          who: "self — 'o humano confirma' é o mesmo humano que propôs",
        },
        {
          phase: "ativação → execução",
          who: "self",
        },
        {
          phase: "coordenação",
          who: "self (contratos internos)",
        },
        {
          phase: "veredito",
          who: "self",
        },
      ],
      gaps: [
        "colapso TOTAL de independência: não há requester≠approver≠owner-attester",
        "gate/oráculo = self → nenhuma verificação externa possível",
      ],
      degenerate:
        "a cerimônia COLAPSA (como a execution-unit no trivial); o grafo ainda registra append-only (self-log), e a independência é EXPLICITAMENTE dispensada com trade-off LOGADO (break-glass) — não se bloqueia o solo",
    },
  ],
  finding:
    "o fluxo e a Lei da Independência (X/O1) assumem TIME COMPLETO. Precisam ESCALAR PARA BAIXO por role-collapse — espelho do execution-unit-collapse (cerimônia proporcional ao tamanho da org E do trabalho). full-team: SoD holds. trio: independência TÉCNICA fica com gaps de autocertificação (mitigar com revisão cruzada / trusted-source externo). solo: SoD impossível → self-governed + trade-off logado (break-glass). Conecta as leis fallback/break-glass + independência. Mecanizada por: governance-profiles (G6 · bloco C).",
  graph: {
    objective: [
      {
        level: "company-strategy",
        title: "crescer receita via plataforma",
        period: "2027",
      },
      {
        level: "area-driver",
        title: "cross-sell entre produtos",
        period: "2027-H1",
      },
      {
        level: "team-priority",
        title: "P1 · +X% de conversão de cross-sell",
        period: "2027-H1",
        meta: "target: conversion-rate · budget: orçamento H1",
      },
    ],
    thesis:
      "ofertar o produto B à base do produto A, evidenciando o uso conjunto, move a conversão",
    opportunities: ["jornada de cross-sell unificada", "personalização da oferta"],
    intent: {
      title: "testar CTA contextual de upgrade",
      strategy: "experiment-led",
    },
    unit: {
      kind: "experiment-run",
      title: "CTA contextual v1",
      verdict: "won",
    },
    works: [
      {
        r: "acme-mfe-billing",
        p: "create",
        d: "UI do CTA atrás da flag",
      },
      {
        r: "acme-analytics",
        p: "operate",
        d: "eventos + baseline (mede a métrica)",
      },
      {
        r: "acme-web-host",
        p: "sustain",
        d: "adapta o contrato compartilhado",
      },
    ],
    outcome: {
      title: "resultado do experimento (won)",
      fields:
        "source: acme-analytics · janela: H1 · valor: +X% · attested-by: acme-data (≠ quem definiu o target) · revision: dados@rev",
      note: "único insumo do target.actual — sem attester independente ou com revision stale, o dashboard marca unverified/stale (falha visível, não silenciosa)",
    },
    measurement: {
      metric: "conversion-rate · source: acme-analytics · owner: acme-data",
      target: "H1: +X% · actual = DERIVADO dos outcomes (não à mão)",
      roles:
        "papéis: target-definer · metric-owner · actual-attester · dashboard-consumer — quem define o target NÃO é o único a atestar o actual",
    },
    rollup: {
      contributes:
        "o outcome CONTRIBUI (mensurável) p/ a priority P1 → entra no dashboard (rollup primário)",
      aligns: "e ALINHA (narrativo) com a company-strategy → contexto, NÃO soma no dashboard",
      lint: "lint: exatamente 1 rollup primário por outcome/intent · aggregation obrigatória · aligns-with nunca soma",
    },
  },
  scalingLaw:
    "crie um NÓ separado só quando muda pelo menos um: owner · cadência · target próprio · allocation própria · lifecycle próprio · audiência de dashboard. Se nada muda, COLAPSE. (aplica-se a: business-tier · execution-unit · roles/SoD — executada por governance-profiles)",
  profiles: {
    law: "a org declara UM perfil + desvios EXPLÍCITOS; mudar de perfil = mutação com envelope L8. Perfis derivam por role-collapse parametrizado (G13) — o compact cobre o small-team (PM+TL+eng) sem um 4º arquétipo fixo",
    items: [
      {
        id: "full",
        for: "org com papéis separados (a full-team da simulação)",
        nodes: "business-tier completo + 3 camadas + contract + intake + outcome",
        gates: "approve-objective · activate-intent · release-rollout · accept-verdict",
        sod: "completo — requester ≠ approver ≠ owner-attester · target-definer ≠ actual-attester",
        required: "envelope L8 inteiro · outcome com attester independente · aggregation declarada",
      },
      {
        id: "compact",
        for: "time pequeno (o trio da simulação; o small-team deriva daqui por role-collapse)",
        nodes:
          "business-objective (1-2 níveis) + intent + execution-unit (colapsa no trivial) + repo-work + outcome",
        gates:
          "activate-intent + accept-verdict; os demais colapsam no MESMO humano, com colapso LOGADO",
        sod: "independência de negócio no gate; autocertificação técnica DECLARADA como gap + mitigação (revisão cruzada / trusted-source externo)",
        required:
          "outcome ainda exige attester (pode ser a FONTE de dados, não uma pessoa) · aggregation declarada",
      },
      {
        id: "solo",
        for: "dev solo",
        nodes: "repo-work + outcome self-attested; intent/objective opcionais (colapsam)",
        gates: "nenhum — self-log append-only substitui (break-glass permanente, logado)",
        sod: "dispensado EXPLICITAMENTE com trade-off logado; dashboard marca self-attested",
        required: "registro append-only (o grafo continua contando a história)",
      },
    ],
  },
  decisionPoints: "approve-objective · activate-intent · release-rollout · accept-verdict",
};

// data.js — dados do mapa (espelham ../model.yml). Editar aqui ou no model.yml; gerador auto = a fazer.
window.MODEL = {
  layers: [
    {
      id: "intent",
      ax: "estratégia · dona do gate de negócio · uma por objetivo",
      vals: [
        { t: "experiment-led" },
        { t: "direct-delivery" },
        { t: "migration-led" },
        { t: "reliability-led" },
      ],
    },
    {
      id: "execution-unit",
      ax: 'tipo · cross-repo, "a coisa é UMA" · lifecycle próprio · colapsa no trivial',
      vals: [
        { t: "experiment-run" },
        { t: "migration-wave" },
        { t: "feature-slice" },
        { t: "incident-response" },
        { t: "shape-up" },
        { t: "cleanup" },
        { t: "rollout-slice" },
      ],
    },
    {
      id: "repo-work",
      ax: "propósito · a peça por repo · dona da execução",
      vals: [
        { t: "create", p: "create" },
        { t: "sustain", p: "sustain" },
        { t: "discover", p: "discover" },
        { t: "operate", p: "operate" },
      ],
    },
  ],

  examples: [
    {
      id: "experiment-cross-repo",
      label: "experimento cross-repo",
      intent: { title: "aumentar conversão trial → paid", strategy: "experiment-led" },
      unit: {
        kind: "experiment-run",
        title: "CTA contextual v1",
        owns: "hipótese (CTA ↑ 5%) · flag · métricas (conversion, activation) · guardrails (churn) · veredito: pending",
      },
      works: [
        { r: "acme-mfe-billing", p: "create", d: "UI do CTA atrás da flag" },
        { r: "acme-api-billing", p: "create", d: "elegibilidade + endpoint" },
        { r: "acme-analytics", p: "operate", d: "eventos + baseline" },
        { r: "acme-web-host", p: "sustain", d: "adaptar contexto/contrato" },
        { r: "acme-growth-ops", p: "operate", d: "monitoramento pós-release" },
      ],
      contract: "acme-user-context@v3",
      note: "o veredito vive na unit (não por repo): won → shape-up/feature-slice · lost → cleanup · inconclusive → novo",
    },
    {
      id: "redesign-misto",
      label: "redesign misto",
      intent: { title: "redesign do checkout", strategy: "migration-led" },
      unit: {
        kind: "migration-wave",
        title: "checkout-ui v2",
        owns: "from legacy-stack → to new-stack · janela de compatibilidade: v1 + v2",
      },
      works: [
        { r: "acme-checkout", p: "sustain", d: "portar fluxo existente (from→to)" },
        { r: "acme-design-system", p: "create", d: "novos componentes" },
        { r: "(spike)", p: "discover", d: "viabilidade da migração" },
        { r: "acme-platform", p: "sustain", d: "adapta contrato compartilhado" },
        { r: "acme-checkout", p: "operate", d: "rollout + monitor" },
      ],
      contract: "acme-user-context@v3",
      note: "peças MISTAS sob a mesma wave — a família é da PEÇA, não da iniciativa",
    },
    {
      id: "contrato-compartilhado",
      label: "contrato compartilhado",
      contractCard: {
        id: "acme-user-context@v3",
        sub: "owner: acme-platform · consumers: acme-mfe-billing, acme-mfe-support · compatibility-window: v2, v3 até 2026-08-15",
        unit: { kind: "migrations", title: "as iniciativas que dependem dele" },
        works: [
          { r: "intent · redesign-checkout", p: "sustain", d: "migration-led — adapta o contrato" },
          { r: "intent · growth-upgrade", p: "create", d: "experiment-led — consome o contrato" },
        ],
        note: "coordenação entre iniciativas = via o contrato (derivada); a janela de compatibilidade NÃO é derivável → mora aqui",
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
      note: "bug simples = 1 repo-work sustain, SEM intent nem execution-unit — as duas camadas de cima colapsam",
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
      note: "discover standalone, sem intent vinculada; não shippa; fate = throwaway/promoted/parked",
    },
    {
      id: "experiment-lost",
      label: "experimento → lost",
      intent: { title: "aumentar ativação via onboarding", strategy: "experiment-led" },
      unit: {
        kind: "experiment-run",
        title: "onboarding guiado v1",
        owns: "veredito: LOST (não bateu a métrica)",
      },
      works: [
        { r: "acme-mfe-onboarding", p: "create", d: "fluxo guiado atrás da flag" },
        { r: "acme-analytics", p: "operate", d: "eventos + baseline" },
      ],
      fork: "lost → gera uma execution-unit cleanup (repo-works sustain removem a flag/variante)",
      note: "o valor durável foi só APRENDIZADO — nenhuma capacidade permanente ficou",
    },
    {
      id: "delivery-tradicional",
      label: "delivery tradicional",
      intent: { title: "exportar relatório em PDF", strategy: "direct-delivery" },
      unit: null,
      works: [{ r: "acme-reports", p: "create", d: "botão + geração do PDF" }],
      note: "feature comum = intent direct-delivery → repo-work create (execution-unit colapsa; seria feature-slice se cross-repo)",
    },
  ],

  sim: [
    {
      label: "empresa com time completo",
      sod: "HOLDS — requester (PM/dev) ≠ approver (TL/Principal) ≠ owner-attester (dono do domínio)",
      participation: [
        { phase: "registro", who: "PM (registered-by + owner); Design + Team Lead stakeholders" },
        {
          phase: "triagem",
          who: "Tech Lead (dispositions · matcher · contratos) + Principal (arquitetura)",
        },
        {
          phase: "investigação",
          who: "devs Sr / Tech Lead rodam discover; Principal avalia viabilidade",
        },
        { phase: "gate", who: "PM (owner) decide promover × descartar (append-only)" },
        { phase: "ativação", who: "Team Lead / PM consolidam" },
        {
          phase: "breakdown",
          who: "Tech Lead materializa execution-units + repo-works; Principal p/ contratos",
        },
        {
          phase: "execução",
          who: "devs Sr/Pl (create/sustain/discover); Jr (peças menores + pair)",
        },
        { phase: "coordenação", who: "Principal / contract-owners; devs = consumers" },
        { phase: "veredito", who: "PM + dados (experiment); Tech Lead conduz shape-up/cleanup" },
      ],
      gaps: [
        "quem é dono do operate/monitoramento (risco de SRE-gap)",
        "sobrecarga do Tech Lead (triagem + breakdown + coordenação)",
        "dono da matcher-accountability (assina seguir/contrariar a sugestão)",
        "Design como owner de contrato de design-system (fica implícito)",
      ],
    },
    {
      label: "trio: negócio · design · engenharia",
      sod: "PARCIAL — Negócio dá independência no gate; o lado TÉCNICO é auto-certificado (Eng = requester + approver + owner-attester)",
      participation: [
        { phase: "registro", who: "Negócio (registered-by + owner); Design stakeholder" },
        { phase: "triagem", who: "Engenharia (tudo: dispositions · matcher · contratos)" },
        { phase: "investigação", who: "Engenharia (discover)" },
        { phase: "gate", who: "Negócio (owner) decide — independência do lado de negócio" },
        { phase: "ativação", who: "Negócio + Engenharia" },
        { phase: "breakdown", who: "Engenharia" },
        { phase: "execução", who: "Engenharia (create/sustain/discover/operate)" },
        { phase: "coordenação", who: "Engenharia é owner E consumer do contrato (auto)" },
        { phase: "veredito", who: "Negócio + Engenharia" },
      ],
      gaps: [
        "autocertificação técnica: owner-attested-by sem verificador independente (o risco central da L9, agora ESTRUTURAL)",
        "contrato sem revisão independente (mesma pessoa provê e consome)",
        "q/r/d sem par que conteste",
        "operate/monitoramento recai sobre a única pessoa de Eng",
      ],
    },
    {
      label: "dev solo",
      sod: "IMPOSSÍVEL — toda a independência (X) e o oráculo (O1) colapsam no self",
      participation: [
        {
          phase: "registro → veredito",
          who: "a MESMA pessoa em todas as fases (o 'humano confirma' é quem propôs)",
        },
      ],
      gaps: [
        "colapso TOTAL de independência: não há requester ≠ approver ≠ owner-attester",
        "gate/oráculo = self → nenhuma verificação externa possível",
      ],
      degenerate:
        "a cerimônia COLAPSA (como a execution-unit no trivial); o grafo ainda registra append-only (self-log) e a independência é EXPLICITAMENTE dispensada com trade-off LOGADO (break-glass) — não se bloqueia o solo",
    },
  ],

  finding:
    "o fluxo e a Lei da Independência (X/O1) assumem TIME COMPLETO — precisam escalar PARA BAIXO por role-collapse (espelho do execution-unit-collapse; cerimônia proporcional ao tamanho da org E do trabalho). full-team: SoD holds. trio: independência técnica com gaps de autocertificação. solo: SoD impossível → self-governed + trade-off logado.",

  graph: {
    objective: [
      { level: "company-strategy", title: "crescer receita via plataforma", period: "2027" },
      { level: "area-driver", title: "cross-sell entre produtos", period: "2027-H1" },
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
    intent: { title: "testar CTA contextual de upgrade", strategy: "experiment-led" },
    unit: { kind: "experiment-run", title: "CTA contextual v1", verdict: "won" },
    works: [
      { r: "acme-mfe-billing", p: "create", d: "UI do CTA atrás da flag" },
      { r: "acme-analytics", p: "operate", d: "eventos + baseline (mede a métrica)" },
      { r: "acme-web-host", p: "sustain", d: "adapta o contrato compartilhado" },
    ],
    measurement: {
      metric: "conversion-rate · source: acme-analytics · owner: acme-data",
      target: "H1: +X% · actual = DERIVADO dos outcomes (não à mão)",
    },
    rollup: {
      contributes:
        "o outcome CONTRIBUI (mensurável) p/ a priority P1 → entra no dashboard (rollup primário)",
      aligns: "e ALINHA (narrativo) com a company-strategy → contexto, NÃO soma no dashboard",
    },
  },

  scalingLaw:
    "crie um nó separado só quando muda pelo menos um: owner · cadência · target próprio · allocation própria · lifecycle próprio · audiência de dashboard. Senão, COLAPSE. (vale p/ business-tier, execution-unit e papéis)",
};

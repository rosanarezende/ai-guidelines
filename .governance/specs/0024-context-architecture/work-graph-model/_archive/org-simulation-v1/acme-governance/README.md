# acme-governance — a camada de governança global (meta-repo)

> **Não-autoridade · anonimizada.** As **intents** (objetivos duráveis) vivem aqui, **não** nos repos de código. Os **trabalhos** seguem SSOT nos seus repos (com back-ref `intent: <id>`); o **banco** (`active-work.aggregate.yml`) é o agregado **derivado** de todos.

## Estrutura de pastas — a BU/time é a LOCALIZAÇÃO (não um campo na intent)

A partição por **organização → unidade de negócio (BU) → time** é **estrutural** (a pasta), não um campo repetido em cada arquivo. É isso que habilita cross-referência, padrões e SDD/DDD consistentes por escopo — sem `scope` na intent.

```
acme-governance/
  active-work.aggregate.yml          # o banco (derivado) — todos os trabalhos, namespaceados
  intents/                           # intents ORG-WIDE (atravessam times/BUs)
    intent-001-onboarding.yml
    intent-003-design-tokens-v2.yml
    intent-004-login-system.yml
  business-units/
    monetizacao/                     # uma BU
      intents/                       # intents da BU
        intent-002-billing-test.yml
      teams/
        <time>/
          intents/                   # intents de um time específico
```

## Os casos

- **Solo / single-team** (ex.: um dev tocando 1–2 projetos): **pasta única `intents/`**, sem partição.
- **Org com múltiplos times/BUs:** particiona por `business-units/<bu>/` e, dentro, `teams/<time>/`. A **localização** do arquivo **é** o escopo (ex.: `business-units/<bu>/teams/<time>/intents/…`).
- **Org-wide:** intents que cruzam BUs ficam na raiz `intents/`.

> **Por que pasta, não campo?** Evita repetir `scope` em cada intent; a verdade do escopo é onde o arquivo mora — dashboards e cross-ref leem o caminho. _(Decisão no tracker `../../research/2026-06-25-work-graph-model.md`.)_

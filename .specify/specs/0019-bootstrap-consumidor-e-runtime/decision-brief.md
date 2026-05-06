# Decision Brief — Spec 0019 Bootstrap Consumidor e Runtime

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Pendente**
> Última atualização: 2026-05-06 — Instanciação inicial

---

## Blocos da brief

## Bloco B — Runtime Architecture & Trampolines

### [DEC-0019-B01] Estratégia de Trampolins e Provider Guardrails

**Pergunta:** Como o consumidor inicializa um projeto para evitar acúmulo e descompasso (Context Rot) com a fonte canônica `AGENTS.md` em multiplos providers (`CLAUDE.md`, `.codex/` etc)?

**Contexto (research):**

- [`research/2026-05-06-trampolins-e-guardrails.md`](./research/2026-05-06-trampolins-e-guardrails.md) aponta que paths de regras (`CORE-02`, etc) estarão quebrados no consumidor se fixarmos `.specify/` e copiarmos para `.ai-guidelines/`. A CLI precisa tratar paths dinamicamente (templating) no compilador e criar guardrails (`CLAUDE.md`) fixos que redirecionem a atenção do LLM para a fonte canônica.

**Opções:**

| Opção | Descrição                                                                                                                                                                                              | Pró                                                                                        | Contra                                                                                                            |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| A     | **Scaffolding e Diretório Fixo:** A CLI força a cópia para `.ai-guidelines/` e as regras no catálogo são reescritas com o path estático da nova pasta. Gera `CLAUDE.md` de redirecionamento.           | Mais simples de compilar, não requer parser com interpolação de strings no `compiler.mjs`. | Consumidor perde a flexibilidade de nomear sua pasta de SDD caso conflite com algo.                               |
| B     | **Diretório Dinâmico + Tokens:** A CLI pergunta o diretório (default `.ai-guidelines/`), salva config local e o `compiler.mjs` usa `{{SDD_DIR}}` para interpolar dinamicamente os caminhos nas regras. | Extremamente flexível; regras do framework mantêm agnósticas quanto ao diretório final.    | Requer atualização no catálogo de regras (`rules.json`) para usar `{{SDD_DIR}}` e mudança no motor do compilador. |

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
- **Justificativa / Ressalvas:** >
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

### [DEC-0019-B02] Topologia e ordem do compilado AGENTS.md

**Pergunta:** O compilado `AGENTS.md` possui estrutura topológica com regras muitas vezes redundantes ou fora de sequência semântica. Como as zonas devem ser reestruturadas de forma a evitar um arquivo monolítico-plano?

**Contexto (research):**

- [`research/2026-05-06-topologia-runtime.md`](./research/2026-05-06-topologia-runtime.md) documenta que regras de Git (`CORE-04`, `06`, `08`, `07`, `09`, `10`, `14`, `GR-0203`) e do Sistema de Templates (`CORE-02`, `11`, `13`, `GR-0101`, `0202`) estão espalhadas no compilado final, causando esquecimento de ciclo pelo modelo.

**Opções:**

| Opção | Descrição                                                                                                                                                                                              | Pró                                                                                                                                                          | Contra                                                                                                               |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| A     | **Zonas por Clusters Temáticos:** O compilador agrupa as regras sob grandes H2/H3 como "Git & PR Workflow", "Lifecycle & Templates", "Core Principles". O id original (`CORE-XX`) é mantido no título. | Maior aderência para modelos grandes; agrupamento lógico facilita a revisão de ciclo. O agente não perde a regra de aprovação se estiver no contexto do git. | Exige mapear `zone` ou iterar nas `tags` de cada regra em `rules.json` para criar os grupos no código da compilação. |
| B     | **Plano + Índice Remissivo:** Mantém a compilação sequencial mas injeta uma tabela de conteúdos/temas no topo do arquivo ligada a âncoras.                                                             | Menos refatoração na lógica central do builder.                                                                                                              | Não resolve a dispersão espacial do contexto; LLM prefere contiguidade semântica para seguir ciclos fechados.        |

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
- **Justificativa / Ressalvas:** >
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

---

## Resumo de status

| ID               | Bloco | Status   |
| :--------------- | :---- | :------- |
| `[DEC-0019-B01]` | B     | Pendente |
| `[DEC-0019-B02]` | B     | Pendente |

**Status agregado:** Pendente

---

## ✅ Gate fechado

- **Data:** [YYYY-MM-DD]
- **Owner:** [@owner]
- **Pontos resolvidos:**
  - [ ] `[DEC-0019-B01]`
  - [ ] `[DEC-0019-B02]`

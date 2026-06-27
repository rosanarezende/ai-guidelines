# Benchmark — spikes / POCs / discovery: trabalho ou modalidade?

- Data: 2026-06-27 · Spec 0024 · Natureza: **research, não-autoridade** (em divergência vencem `state.yml`, `tasks.md`, `decision-brief.md`, Git/GitHub).
- Responde 2 perguntas do modelo do work-graph:
  - **Q1** — um spike percebido **no meio de uma tarefa** (delivery/experiment/…) mora na **intent**?
  - **Q2** — spike é um **trabalho como os outros** ou uma **MODALIDADE** diferente?
- Método: survey de 6 frameworks + a distinção POC/protótipo. Fontes no fim.

## O que cada framework faz

### XP (origem do termo) — spike = experimento descartável

"A coisa mais simples que conseguimos programar pra nos convencer de que estamos no caminho certo" (Beck, via Cunningham). Saída = **conhecimento**, não código de produção; o código é **jogado fora / recriado**. → funda nosso `fate: throwaway` + "a entrega é a **resposta**".

### Scrum / Jira (ferramenta) — spike = issue-type especial que vira story

Investigação **time-boxed** pra responder **uma** pergunta. Jira **não tem spike nativo** (o time cria o tipo). Qualquer um abre um spike quando não consegue começar uma story. Resolvido → frequentemente **converte** o spike em story. Mora **sob o épico** ou **standalone**. → spike é peer de story, mas com propósito distinto; "converter em story" ecoa nosso `fate: promoted`.

### SAFe (o mais formal) — spike = ENABLER story (eixo business × enabler)

Spike é um tipo de **enabler story**. Enablers (exploration / architecture / infrastructure / compliance) existem em **todos os níveis** (enabler epic → capability → feature → story), em paralelo aos _business_. São "atividades **visíveis** de valor agregado": estimados, demoados, com WIP-limit — **iguais** às stories de negócio, mas numa **categoria própria** (enabler ≠ business). → a separação explícita **business × enabler** é, literalmente, um eixo de "modalidade". Spike = work item **e** modalidade (enabler-exploration).

### Dual-track agile (Cagan / Patton) — DISCOVERY ≠ DELIVERY (duas trilhas)

Trilha de **discovery** ("o que construir": validar ideias rápido/barato) separada da de **delivery** ("como construir": software entregável). **As saídas da discovery = entradas da delivery.** → o sinal mais forte de **MODALIDADE**: investigação (spikes/experiments) vive numa **trilha própria, paralela**, que **alimenta** a entrega — não é um item-irmão no mesmo backlog.

### Shape Up (Basecamp) — de-risking no SHAPING, não como ticket

Não usa spike-como-ticket. A incerteza é removida no **shaping** (antes da aposta): cortam-se os **rabbit holes** (partes incertas demais pra apostar) e fixa-se o **appetite**. → contraste útil: a incerteza pode ser tratada no nível do **enquadramento** (a intent), não como trabalho rastreado.

### Continuous Discovery (Teresa Torres) — Opportunity Solution Tree

`outcome → opportunities → solutions → assumption tests`. Os testes são **folhas** de uma árvore que pende do **outcome**; discovery é hábito **contínuo** (semanal). → a investigação se ancora **estruturalmente sob o objetivo** (a intent), como folha da árvore de discovery.

### POC × spike × protótipo

Spike = investigação técnica **curta**, saída = conhecimento, descartável. POC = demo de viabilidade **mais ampla** (versão parcial/simplificada); throwaway, mas **pode "graduar"** pra protótipo/integração. Aviso recorrente: **não** construir produto iterando sobre o código-atalho da POC. → funda `fate: throwaway | promoted | parked` + a regra "POC promovida **persiste**; a produtização declara `derives-from`" (com o cuidado anti-código-atalho).

## Síntese — dois eixos

1. **Modalidade de valor:** entrega valor direto (delivery) **×** **reduz risco / produz conhecimento** (spike, enabler-exploration, experiment-discovery). SAFe (business × enabler) e dual-track (delivery × discovery) tornam isso um eixo de **1ª classe**.
2. **Onde ancora:** sob o **objetivo** que serve (épico / feature / outcome / intent), como item de discovery — **não** "dentro" da tarefa que o percebeu. (OST = folha do outcome; SAFe = enabler sob a mesma feature; Jira = sob o épico ou standalone.)

## Respostas

**Q1 — spike nascido no meio de uma tarefa mora na intent?**
**Sim — na intent (o objetivo) que ele de-risca**, não aninhado dentro da delivery que o percebeu. A tarefa apenas **notou**; o dono é o **objetivo**. Consistente com `intent breaks-into <spike>` + o work declarar de onde veio. O caso **standalone** (sem intent) segue válido pra pesquisa técnica pura/rotina.

**Q2 — spike é trabalho ou modalidade?**
**Os dois — e é aí que está o ponto.** Spike é um **work item** (rastreado, time-boxed, com ciclo de vida), **mas de uma modalidade distinta** (discovery / redução-de-risco / conhecimento), **não** da modalidade de entrega-de-valor. **Nenhum framework sério trata "investigar" e "entregar" como a mesma coisa:** SAFe separa em business × enabler; dual-track em delivery × discovery; Shape Up resolve no shaping. A intuição "spike é uma modalidade diferente" tem **suporte forte**.

## Implicação pro nosso modelo (a DECIDIR — não decidido aqui)

Pode estar faltando um **eixo de modalidade** sobre os 6 kinds:

| Modalidade               | Kinds                                              |
| ------------------------ | -------------------------------------------------- |
| **entrega de valor**     | `delivery`                                         |
| **discovery / aprender** | `spike`, `experiment` (testar hipótese = aprender) |
| **reativo / manutenção** | `incident`, `fix`, `patch`                         |

Se adotarmos, "spike é uma modalidade diferente" deixa de ser intuição e vira **estrutura** — e explica por que spike/experiment têm necessidades próprias (timebox, resposta-não-entregável, `fate`, formato distinto). Opções de como aterrissar:

- **(a)** campo `modality` no nó (delivery × discovery × reactive) — um atributo do work.
- **(b)** manter os 6 _flat_ e só **documentar** o agrupamento (sem campo novo).
- **(c)** **trilha de discovery** separada no banco (estilo dual-track) — discovery alimenta delivery via `derives-from`/`promoted`.

> Conexão: isso toca a **rodada de system design dos bancos** (discovery como trilha/projeção) e a modelagem de **ids/refs** que estávamos abrindo.

## Fontes

- XP — [Spike Solution (c2 wiki)](http://xp.c2.com/SpikeSolution.html) · [Technical Spike (Learning Loop)](https://learningloop.io/plays/technical-spike)
- SAFe — [Spikes](https://scaledagileframework.com/spikes/) · [Enablers](https://scaledagileframework.com/enablers/)
- Dual-track — [Dual-Track Agile (SVPG/Cagan)](https://www.svpg.com/dual-track-agile/) · [Dual Track Development (Jeff Patton)](https://jpattonassociates.com/dual-track-development/)
- Scrum/Jira — [Agile 101: What is a Spike? (Praecipio)](https://www.praecipio.com/resources/articles/agile-101-what-is-a-spike) · [Story vs Task vs Spike (ONES)](https://ones.com/blog/jira-story-vs-task-vs-spike-differences/)
- Shape Up — [Risks and Rabbit Holes (Basecamp)](https://basecamp.com/shapeup/1.4-chapter-05)
- POC × spike — [Spike vs PoC (SSW Rules)](https://www.ssw.com.au/rules/spike-vs-poc) · [Spikes, POCs, Prototypes & the MVP (Studio Zero)](https://medium.com/studio-zero/spikes-pocs-prototypes-and-the-mvp-5cdffa1b7367)
- Continuous Discovery — [Opportunity Solution Trees (Teresa Torres)](https://www.producttalk.org/opportunity-solution-trees/)

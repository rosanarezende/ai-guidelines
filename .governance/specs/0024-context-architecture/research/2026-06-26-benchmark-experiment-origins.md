---
artifact-kind: research
subject: "Benchmark — de onde nascem os experimentos (origem/intake) e o caminho no nosso modelo de intent/experiment"
date: 2026-06-26
reviewer: internal
method: benchmark
---

# Benchmark — origem dos experimentos (e o caminho no nosso framework)

> Não-autoridade. Em divergência vencem `state.yml`, `tasks.md`, gates, Git/GitHub.
> **Pergunta:** o experiment **só** nasce de modelagem-de-produto (jeito que eu via na ex-empresa), ou pode ser
> **decidido durante o trabalho**? E o framework deve permitir isso sem virar rígido?

## O que a indústria faz

### 1. Ideias de experimento vêm de TODA parte (não só de produto)

Fontes citadas: analytics/comportamento (heatmaps, session replay), feedback de cliente (vendas/CS), pesquisa
qualitativa, input cross-funcional e **observação durante o trabalho** (ex.: Booking — designers notaram um dropdown
ambíguo no checkout → testaram ali mesmo). A modelagem-por-produto é **uma** fonte, não a única.

### 2. Cultura bottom-up / descentralizada (Spotify, Netflix)

Times donos da feature experimentam **sem aprovação top-down**; PMs, engenheiros e growth propõem. Descentralizar =
testar rápido sem burocracia. Logo, um experimento **pode nascer bottom-up** — inclusive de um dev durante o trabalho.

### 3. "Salvar a ideia" = experiment backlog (ICE/RICE/PIE)

A ideia entra num **backlog de experimentos** (com campo de hipótese obrigatório), é **priorizada** (Impact ·
Confidence · Ease) e só então vira sprint-ready. É **exatamente** o caminho `proposal` → backlog → priorizar → abrir
intent.

### 4. Experiment é DECISÃO deliberada, não default

Critérios pra experimentar (vs só shippar): hipótese + métrica de sucesso pré-definidas · tráfego suficiente ·
decisão reversível · mudança isolada/atribuível. Bug ou falha óbvia de usabilidade → **só conserta** (não testa).
"Nem toda mudança precisa de experimento."

### 5. Spike DESCOBRE oportunidade de experimento

"Spikes servem de feedback pra descoberta de oportunidade… revelam novas oportunidades de experimentação." Então um
`spike` (ou `delivery`) pode **surfar** uma oportunidade — a **decisão** de testar é um passo à parte.

### 6. Rigor independe da origem

Pré-registro de hipótese + definição de métrica + review (evita "fishing expedition"). Onde quer que a ideia nasça,
o experimento exige rigor — casa com o nosso `experiment-brief` `sealed` (pré-registro de hipótese + métricas).

## Paralelo com o nosso modelo

| Indústria                               | Nosso modelo                                               |
| --------------------------------------- | ---------------------------------------------------------- |
| ideia vem de qualquer lugar / bottom-up | experiment pode ser **decidido em qualquer trabalho**      |
| experiment backlog (ICE/RICE)           | **`proposal`** → backlog → abrir intent                    |
| experiment = decisão com critérios      | decisão deliberada (não auto-emerge; não é todo trabalho)  |
| pré-registro hipótese + métrica         | `experiment-brief` `sealed` (hipótese + métricas exigidas) |

## Recomendação

**Relaxar a regra rígida.** O experiment é uma **decisão deliberada** que pode ser tomada **durante qualquer
trabalho** (delivery/spike surfam oportunidades — §5). Dois caminhos:

1. **Diferido (RECOMENDADO):** salva a ideia num **`proposal`** → backlog → priorização → abre uma **intent própria**
   (às vezes paralela) pro experiment. = o _experiment backlog_ da indústria (§3). É o caminho do "experimento de
   verdade".
2. **Inline (permitido, raro):** adiciona o experiment à **intent atual** (mesmo nascida pra delivery). É o
   descentralizado/bottom-up de Spotify/Netflix (§2) — permitido, não default, não recomendado.

Em **ambos**, o experiment exige o **rigor** (hipótese + métricas `sealed`, §6) e é uma **escolha** (§4) — não
auto-promoção de um spike. O `spike` **não vira** experiment sozinho: ele pode **surfar** a oportunidade; quem decide
é o time.

## Fontes

- [Mixpanel — What is product experimentation (2026 guide)](https://mixpanel.com/blog/product-experimentation/)
- [CXL — Growth experiments vs optimization vs A/B testing](https://cxl.com/blog/growth-experiments-vs-optimization/)
- [Spotify Engineering — Experiments with Learning framework](https://engineering.atspotify.com/2025/9/spotifys-experiments-with-learning-framework)
- [Optimizely — Building a culture of experimentation](https://www.optimizely.com/insights/blog/measuring-pillars-for-building-a-culture-of-experimentation/)
- [Reforge — Growth Experiment Management System](https://www.reforge.com/blog/growth-experiment-management-system)
- [HubSpot growth experimentation process (ex-employee)](https://davidlykhim.com/hubspot-growth-experiment-process/)
- [Growth-experiments.com — ICE/RICE/PIE prioritization](https://growth-experiments.com/guides/experiment-prioritization)
- [Johanna Rothman — Ship decisions: when to experiment vs finalize](https://www.jrothman.com/mpd/2024/02/ship-decisions-use-value-to-decide-when-to-experiment-and-when-to-finalize/)
- [Scaling A/B testing — Booking.com, Netflix & Microsoft](https://venue.cloud/news/insights/scaling-a-b-testing-inside-booking-com-netflix-microsoft-s-experimentation)
- [LearningLoop — Technical spike (opportunity discovery)](https://learningloop.io/plays/technical-spike)

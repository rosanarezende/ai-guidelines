---
node: learning-record
kind: experiment
brief: _examples-by-kind/experiment_lista-priorizada.md
outcome: won
sealed: true
---

# Learning record — lista priorizada no onboarding (experiment)

> Data: 2026-06-24 · fecha o intent `experiment_lista-priorizada`.

## Veredito (3 linhas)

- **Resultado:** **won** — a variante bateu o alvo de ativação-7d com significância.
- **O que aprendemos:** priorização por valor percebido é entendida sem explicação; o clique na lista confirma.
- **Próximo passo:** **promove a `delivery`** (rola a lista priorizada para 100%, herda hipótese/métricas).

## Métricas vs alvo

| Métrica                  | Alvo (pré-registrado) | Observado | Bate? |
| ------------------------ | --------------------- | --------- | ----- |
| ativação-7d (principal)  | +5 p.p.               | +6,2 p.p. | ✓     |
| cliques na lista (aux)   | sinal de uso          | alto      | ✓     |
| churn de atenção (trade) | sem piora             | estável   | ✓     |

## Aprendizados

- O ganho concentra-se em contas D0 sem onboarding prévio.
- A heurística simples já entrega; ranking aprendido fica para uma próxima iteração (não bloqueia o `won`).

## Destino

- **won → `promotes-to` `delivery`** (herda `hypothesis`/`successMetrics`, ADR 0010). O `gate` do delivery
  **referencia** este learning-record como evidência (eixo Resultado × eixo Autoridade — q-006/§D6).

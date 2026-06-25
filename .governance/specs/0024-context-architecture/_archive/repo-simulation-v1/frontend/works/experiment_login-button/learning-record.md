---
node: learning-record
kind: experiment
brief: works/experiment_login-button/intent-brief.md
outcome: won
sealed: true
---

# Learning record — posição do botão de login social (experiment)

> Data: 2026-06-24 · fecha `exp-001`.

## Veredito (3 linhas)

- **Resultado:** **won** — botão acima converteu +4,1 p.p.
- **O que aprendemos:** à primeira vista, social ganha do e-mail; o topo importa.
- **Próximo passo:** adotar a posição em `frontend/deliv-001` (informa a UI).

## Métricas vs alvo (anti-mover-trave)

| Métrica                        | Alvo (pré-registrado) | Observado | Bate? |
| ------------------------------ | --------------------- | --------- | ----- |
| cadastro-concluído (principal) | +3 p.p.               | +4,1 p.p. | ✓     |
| cliques OAuth (auxiliar)       | sinal de uso          | alto      | ✓     |
| erros de form (tradeoff)       | sem piora             | estável   | ✓     |

## Destino

- **won** → **informa** `frontend/deliv-001` (a UI adota a posição). Promove a `deliv-002` (UI dedicada), fora
  desta rodada.

---
node: experiment-outcome # fecho do experiment (Estágio 6, PÓS-merge) — split do antigo learning-record
brief: <ref ao intent-brief do experiment>
outcome: won | lost | inconclusive
sealed: true # SELADO — anti-mover-trave (a hipótese/métricas foram registradas ANTES)
# data no corpo
---

# Resultado do experiment — <título>

> Chega **depois do merge** (o experiment roda um período). Vereditado contra o **alvo pré-registrado**, sem
> mover a trave. _(Em growth, **lost > won é saudável**.)_

## Veredito (3 linhas)

- **Resultado:** won | lost | inconclusive
- **O que aprendemos:** <a lição>
- **Próximo passo:** promove a `delivery` | clean-up | itera

## Métricas vs alvo (anti-mover-trave)

| Métrica | Alvo (pré-registrado no intent) | Observado | Bate? |
| ------- | ------------------------------- | --------- | ----- |
| <…>     | <…>                             | <…>       | ✓ / ✗ |

## Destino

- **won** → `promotes-to` `delivery` — **reaproveita o código testado** com flexibilidade (hoje, com IA, mais que antes).
- **lost** → clean-up (remove o código). · **inconclusive** → itera / novo experimento.

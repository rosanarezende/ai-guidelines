---
node: experiment-outcome
brief: <ref ao intent-brief do experiment>
outcome: <won | lost | inconclusive>
sealed: true
---

# Resultado do experiment — <título>

> Chega **depois do merge** (o experiment roda um período); vereditado contra o **alvo pré-registrado**.

## Veredito (3 linhas)

- **Resultado:** <won | lost | inconclusive>
- **O que aprendemos:** <a lição>
- **Próximo passo:** <promove a `delivery` | clean-up | itera>

## Métricas vs alvo

| Métrica | Alvo (pré-registrado) | Observado | Bate? |
| ------- | --------------------- | --------- | ----- |
| <…>     | <…>                   | <…>       | ✓ / ✗ |

## Destino

- **won** → `promotes-to` `delivery` (reaproveita o código testado com flexibilidade).
- **lost** → clean-up. · **inconclusive** → itera.

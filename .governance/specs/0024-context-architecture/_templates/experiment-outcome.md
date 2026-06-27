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
- **Próximo passo:** <won → `delivery` | lost → `patch` (clean-up) | inconclusive → `spike` / novo `experiment` / `patch`>

## Métricas vs alvo

| Métrica | Alvo (pré-registrado) | Observado | Bate? |
| ------- | --------------------- | --------- | ----- |
| <…>     | <…>                   | <…>       | ✓ / ✗ |

## Destino (polimórfico)

- **won** → `results-in` `delivery` (sistematiza; reaproveita o código testado com flexibilidade).
- **lost** → **clean-up = um `patch`** (remove o código/flag testado — invisível ao usuário).
- **inconclusive** → **depende do sinal**: `patch` (clean-up) · `spike` (investigar o porquê) · novo `experiment` (iterar) · etc.

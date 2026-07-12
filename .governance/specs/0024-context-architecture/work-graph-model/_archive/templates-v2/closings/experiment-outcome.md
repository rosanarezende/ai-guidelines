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
- **Próximo passo:** <won → `delivery` | lost → `maintenance` (clean-up) | inconclusive → `exploration` / novo `experiment` / `maintenance`>

## Métricas vs alvo

| Métrica | Alvo (pré-registrado) | Observado | Bate? |
| ------- | --------------------- | --------- | ----- |
| <…>     | <…>                   | <…>       | ✓ / ✗ |

## Destino (polimórfico)

- **won** → `results-in` `delivery` (sistematiza; reaproveita o código testado com flexibilidade).
- **lost** → **clean-up = um `maintenance`** (`maintenance-mode: perfective`, invisível ao usuário — remove o código/flag testado).
- **inconclusive** → **depende do sinal**: `maintenance` (clean-up) · `exploration` (investigar o porquê) · novo `experiment` (iterar) · etc.

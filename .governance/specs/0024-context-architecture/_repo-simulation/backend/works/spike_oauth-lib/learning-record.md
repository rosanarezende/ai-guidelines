---
node: learning-record
kind: spike
brief: works/spike_oauth-lib/intent-brief.md
outcome: answered # spike: answered | inconclusive
sealed: true
---

# Learning record — lib OAuth (spike)

> Data: 2026-06-24 · fecha `spike-001`.

## Veredito (3 linhas)

- **Resultado:** **answered** — `authlib-x` recomendada.
- **O que aprendemos:** cobre refresh nativo e tem tipos; a alternativa exigia wrapper manual.
- **Próximo passo:** adotar em `deliv-001`.

## Critérios vs candidatas

| Critério                  | `authlib-x` | `alt-y`  |
| ------------------------- | ----------- | -------- |
| manutenção (releases/ano) | alta        | baixa    |
| tipos                     | nativos     | parciais |
| refresh                   | nativo      | manual   |

## Destino

- **Resolve** a decisão de `deliv-001` (`dec-001 §D1`). Aresta: `spike --resolves--> finding/decisão do delivery`.

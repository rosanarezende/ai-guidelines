---
node: learning-record
kind: experiment | spike # quem fecha AQUI; `delivery` fecha no `gate`, `incident` é doc vivo
brief: <ref ao intent-brief que isto fecha>
outcome: won | lost | inconclusive # spike: answered | inconclusive
sealed: true # SELADO ao registrar — anti-mover-trave (a afirmação-para-frente não se reescreve)
# data: no corpo, não no nome
---

# Learning record — <título>

> Par de fechamento do `intent-brief` (molde do `gate` + Learning Card). **Selado**: a hipótese/pergunta foi
> registrada ANTES; aqui se vereditam contra o **alvo pré-registrado**, sem mover a trave.

## Veredito (3 linhas)

- **Resultado:** <won | lost | inconclusive | resposta do spike>
- **O que aprendemos:** <a lição irredutível>
- **Próximo passo:** <promove a `delivery` | clean-up | itera | …>

## Métricas vs alvo (o mecanismo anti-mover-trave)

| Métrica | Alvo (pré-registrado no intent) | Observado | Bate? |
| ------- | ------------------------------- | --------- | ----- |
| <…>     | <…>                             | <…>       | ✓ / ✗ |

## Aprendizados

- <…>

## Destino (aresta `promotes-to` / `resolution`)

- `experiment` **won** → `promotes-to` `delivery` (herda `hypothesis`/`successMetrics`, ADR 0010).
- `lost` → `resolution: cleaned-up` | `kept`. · `inconclusive` → itera / novo experimento.
- `spike` → `resolves` o `finding` que o abriu (limitado pelo time-box).

<!-- learning-record fecha experiment/spike (há afirmação-para-frente a vereditar). delivery fecha no `gate`
     (sem verdict); incident é doc vivo (postmortem). O `gate` REFERENCIA o learning-record, não o substitui. -->

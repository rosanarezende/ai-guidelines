---
node: intent-brief
kind: delivery # meta: o próprio redesenho é uma "delivery" do framework
date: 2026-06-24
sealed: true # abertura selada — não cresce com as questions; elas apontam de volta (raised-by)
---

# Intent — redesenhar o artefato de início + o modelo de fluxo (G25)

**Kernel:** Pretendemos um modelo de início+fluxo que **não perca contexto**
· fazendo **modelagem como grafo, não prosa**
· saberemos por **consulta determinística por intenção**
· pronto quando a cadeia `intent → research → decision → tasks` estiver cravada.

## Requisitos (corpo — o que já se sabe/pretende)

- O fluxo é um **grafo tipado** (nós + arestas como dado), **derived-only**, sem 2ª SSOT.
- Cobre os **7 tipos** sem reescrever a árvore (_modelar = adicionar projeção + contrato_).

> **As `questions` emergem durante o trabalho** e ligam de volta via `raised-by: intent-brief`. Este
> doc fica **selado e enxuto** — "questions levantadas por este intent" é **view derivada** (query
> `questions where raised-by = intent-brief`), **não** uma lista mantida à mão aqui.

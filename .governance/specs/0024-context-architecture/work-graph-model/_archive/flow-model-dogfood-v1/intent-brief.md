---
node: intent-brief
kind: delivery # meta: o próprio redesenho é uma "delivery" do framework
sealed: true # abertura selada — não cresce com as questions; elas apontam de volta (raised-by)
# data: 2026-06-24 (no corpo)
---

# Intent — redesenhar o artefato de início + o modelo de fluxo (G25)

## Kernel

- **Pretendemos:** um modelo de início+fluxo que **não perca contexto**
- **Fazendo:** **modelagem como grafo, não prosa**
- **Saberemos por:** **consulta determinística por intenção**
- **Pronto quando:** a cadeia `intent → research → decision → tasks` estiver cravada

## Espinha

- **Problema:** mesmo com regras/ADRs/DECs/catálogo, agentes precisam de lembrete manual → drift.
- **Resultado desejado:** contexto recuperável por intenção, sem prosa espalhada.
- **Fora-de-escopo:** banco/embeddings/runtime-LLM (cross-repo é frente própria).
- **Sinal de sucesso:** lendo o frontmatter, deriva-se o grafo sem ler prosa.

## Corpo (`kind: delivery`)

- **Requisitos:** o fluxo é um **grafo tipado** (nós + arestas como dado), **derived-only**, sem 2ª SSOT.
- **Critério de aceite:** cobre os **7 tipos** sem reescrever a árvore (_modelar = adicionar projeção + contrato_).
- **Não-objetivos:** implementar motor de grafo / banco agora.

> As `questions` emergem durante o trabalho e ligam via `raised-by: intent-brief` (view derivada); este
> doc fica **selado e enxuto**.

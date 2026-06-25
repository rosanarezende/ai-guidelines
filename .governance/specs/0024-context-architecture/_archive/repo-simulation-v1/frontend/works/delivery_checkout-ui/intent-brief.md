---
node: intent-brief
kind: delivery
sealed: true
---

# Intent — UI de checkout 1-clique

## Kernel

- **Pretendemos:** comprar em 1 clique na web
- **Fazendo:** botão 1-clique + integração com a API de checkout
- **Saberemos por:** compra concluída em staging
- **Pronto quando:** integra com `backend/deliv-002`

## Espinha

- **Problema:** checkout longo; abandono.
- **Resultado desejado:** 1 clique.
- **Fora-de-escopo:** redesign do carrinho.
- **Sinal de sucesso:** conclusão de compra em staging.

## Corpo (`kind: delivery`)

- **Requisitos:** botão 1-clique; estados de erro/confirmação; integração.
- **Critério de aceite:** compra 1-clique completa contra a api.
- **Não-objetivos:** gestão de meios de pagamento.
- **Restrições:** a integração depende de `backend/deliv-002#cp-payment` (cross-repo).

> Coordena com `backend/deliv-002`. `@dev-b`: o **shell** roda em PARALELO; a **integração** fica
> **BLOQUEADA (derivado)** até a API ficar pronta — ver `state.yml § topology`.

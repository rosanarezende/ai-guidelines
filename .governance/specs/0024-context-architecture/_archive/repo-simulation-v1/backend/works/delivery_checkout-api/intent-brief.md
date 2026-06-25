---
node: intent-brief
kind: delivery
sealed: true
---

# Intent — API de checkout 1-clique

## Kernel

- **Pretendemos:** comprar em 1 clique pela API
- **Fazendo:** payment-intent + order service
- **Saberemos por:** pedido criado e pago ponta-a-ponta em staging
- **Pronto quando:** a web (`frontend/deliv-003`) conclui a compra

## Espinha

- **Problema:** checkout multi-etapa tem abandono alto.
- **Resultado desejado:** 1 clique fecha a compra.
- **Fora-de-escopo:** novos meios de pagamento.
- **Sinal de sucesso:** conclusão de compra em staging.

## Corpo (`kind: delivery`)

- **Requisitos:** endpoint payment-intent; endpoint order; idempotência.
- **Critério de aceite:** a web fecha compra 1-clique em staging.
- **Não-objetivos:** assinatura/recorrência.
- **Restrições:** coordena com `frontend/deliv-003`.

> Nasceu de `prop-002`. **Coordena com `frontend/deliv-003`** (cross-repo). Internamente, **2 frentes em
> PARALELO**: `@dev-a` (cp-payment) e `@dev-c` (cp-orders) — ver `state.yml § topology`.

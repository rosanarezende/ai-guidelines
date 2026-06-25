---
node: intent-brief
kind: experiment
sealed: true
---

# Intent — lista priorizada no onboarding aumenta ativação

## Kernel

- **Pretendemos:** +ativação na 1ª semana
- **Fazendo:** uma lista priorizada no onboarding
- **Saberemos por:** taxa de 1ª-ação-em-7d
- **Pronto quando:** o teste atingir significância

## Espinha

- **Problema:** leads novos não sabem por onde começar
- **Resultado desejado:** +ativação
- **Fora-de-escopo:** redesenho do dashboard
- **Sinal de sucesso:** 1ª-ação-em-7d

## Corpo (`kind: experiment`)

- ⊛ **Hipótese:** se priorizarmos itens de maior valor percebido, a ativação sobe
- ⊛ **Métricas:** principal=ativação-7d · auxiliar=cliques na lista · tradeoff=churn de atenção
- **Objetivos de aprendizado:** qual sinal de priorização o usuário entende sem explicação
- **Solution design (MVT):** lista estática priorizada por heurística simples
- **Instrumentação:** `list_shown` · `list_item_click` · `first_action`
- **Segmentação:** contas D0; controle × variante 50/50

> Fecha com `learning-record` (won → promove a `delivery`, herda hipótese/métricas).

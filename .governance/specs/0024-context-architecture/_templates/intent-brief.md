---
node: intent-brief
kind: <delivery | experiment | spike> # incident → incident.md · fix/patch → registry-entry leve
sealed: <true | leve> # ⚠️ delivery/experiment selam; spike é "leve" — o que "leve" significa aqui ainda não está fechado (iterar)
# ⚠️ densidade por instância: o limiar de "quando um trabalho merece intent-brief vs só registry-entry" ainda não foi definido (iterar)
---

# Intent — <título>

## Kernel (único obrigatório)

- **Pretendemos:** <resultado / intenção>
- **Fazendo:** <abordagem>
- **Saberemos por:** <sinal / evidência>
- **Pronto quando:** <critério de _done_>

## Espinha (recomendada)

- **Problema / contexto:**
- **Resultado desejado:**
- **Limite / fora-de-escopo:**
- **Sinal de sucesso:**

## Corpo — só a seção do `kind` (`⊛` = campo exigido; `N/A` vale)

### `delivery`

- Requisitos / comportamento esperado:
- Critério de aceite:
- Não-objetivos · Restrições de design:

### `experiment`

- ⊛ Hipótese ("acreditamos que…"):
- ⊛ Métricas: principal · auxiliar · tradeoff-guardrail:
- Método: <A/B | rollout medido> · ideal: atrás de feature flag:
- Objetivos de aprendizado · Segmentação:

### `spike`

- Pergunta a responder:
- ⊛ Timebox:
- Decisão que isto destrava:
- Saída esperada: **a resposta** (não o código):

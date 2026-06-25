---
node: intent-brief
kind: delivery | experiment | spike # incident usa template próprio (incident.md); fix/patch abrem como registry-entry leve
sealed: true # delivery/experiment selam; spike é leve. (incident NÃO sela — por isso template próprio.)
# densidade é POR INSTÂNCIA: este arquivo só quando o trabalho pede; senão, registry-entry. Data no corpo.
---

# Intent — <título>

## Kernel (único obrigatório)

- **Pretendemos:** <resultado / intenção>
- **Fazendo:** <abordagem>
- **Saberemos por:** <sinal / evidência>
- **Pronto quando:** <critério de _done_>

## Espinha (recomendada)

- **Problema / contexto** (por que agora):
- **Resultado desejado:**
- **Limite / fora-de-escopo:**
- **Sinal de sucesso:**

## Corpo — preencher SÓ a seção do `kind` (`⊛` = campo exigido; `N/A` vale)

### `delivery` — _construir uma capacidade já decidida_

- Requisitos / comportamento esperado:
- Critério de aceite:
- Não-objetivos · Restrições de design:

### `experiment` — _intervir pra APRENDER (A/B ou rollout medido)_

- ⊛ Hipótese ("acreditamos que…"):
- ⊛ Métricas: principal · auxiliar · tradeoff-guardrail:
- Método: A/B | rollout medido · **ideal:** atrás de feature flag (pra desligar/remover):
- Objetivos de aprendizado · Segmentação:

### `spike` — _provar um ponto (time-boxed)_

- Pergunta a responder:
- ⊛ Timebox:
- Decisão que isto destrava:
- Saída esperada: **a resposta** (não o código — POC não dá merge; ver `spike-answer.md`):

<!-- incident NÃO usa este template (ver incident.md). fix/patch normalmente abrem como `registry-entry` leve e só
     ganham um intent-brief se a densidade pedir. `sealed` varia por kind; a densidade é por instância. -->

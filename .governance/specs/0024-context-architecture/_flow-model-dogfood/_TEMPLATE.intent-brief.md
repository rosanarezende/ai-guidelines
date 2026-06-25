---
node: intent-brief
kind: delivery | experiment | spike | incident # Virtual (proposal/patch/fix) → inline, sem arquivo
sealed: true # selado ao iniciar; não cresce com questions (elas ligam via raised-by)
# data: no corpo, não no nome
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
- **Limite / fora-de-escopo** (appetite):
- **Sinal de sucesso:**

## Corpo — preencher SÓ a seção do `kind` (`⊛` = já exigido no `WorkItem.ts`; `N/A` é resposta válida)

### `delivery`

- Requisitos / comportamento esperado:
- Critério de aceite:
- Não-objetivos:
- Restrições de design:
- Casos de uso / job stories:

### `experiment`

- ⊛ Hipótese ("acreditamos que…"):
- ⊛ Métricas: principal · auxiliar · tradeoff-guardrail:
- Objetivos de aprendizado:
- Solution design (MVT — menor teste viável):
- Instrumentação (eventos/trackings):
- Segmentação / população:

### `spike`

- Pergunta a responder:
- Timebox / appetite:
- Decisão que isto destrava:
- Critério de "sabemos o suficiente":
- Saída esperada (PoC / recomendação / descarte):

### `incident`

- ⊛ Severidade:
- O que quebrou + impacto (quem, quanto):
- Linha do tempo:
- Mitigação / recuperação:
- Causa raiz:
- Prevenção / follow-ups:

<!-- Virtual (proposal/patch/fix) NÃO usa este template — intent inline no PR/registro. As `questions`
     emergem depois e ligam via `raised-by`; este doc fica SELADO e enxuto. -->

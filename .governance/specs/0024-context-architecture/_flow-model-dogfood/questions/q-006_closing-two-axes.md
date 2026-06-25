---
node: question
id: q-006
raised-by: intent-brief
status: resolvida
# ↓ GERADO dos back-pointers — não editar à mão:
investigated-by: [res-002]
resolved-by: dec-001 §D6
---

# q-006 — O fechamento é um eixo (`gate`) ou dois?

**Pergunta:** `gate` e `learning-record` são a mesma coisa? O fecho do trabalho é único?

**Resposta convergida:** **dois eixos** — **Resultado** (o que aconteceu; **polimórfico por tipo**:
`delivery`→capacidade entregue · `experiment`/`spike`→`learning-record` · `incident`→postmortem ·
`patch`/`fix`→commit+verificação) × **Autoridade** (`gate`, Human Gate, de quem tem autoridade sobre o
checkpoint). `gate ≠ learning-record`; `gate --references--> learning-record`. Experiment tem os dois;
delivery só o gate. Simetria: o fechamento polimórfico espelha a abertura polimórfica.

**Alternativas que competiam:** colapsar resultado+autoridade num `gate` único (descartado — perde a evidência).
